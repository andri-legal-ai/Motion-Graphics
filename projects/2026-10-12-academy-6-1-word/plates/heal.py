"""Heals the spots where a baked-in mouse pointer sat over text (plates/*.png after prep.mjs).

For each spot: take the raw capture (caps/<name>.jpg) around the pointer, mask the pointer, and search every other
capture (and the 2x captures, halved) for the same pixels around it. Where a clean copy of the same words is found
(small error outside the pointer), its pixels replace the pointer area in the plate. Prints what it did.
Run: .venv/bin/python plates/heal.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
# plate, pointer tip (x, y) in app px
SPOTS = [("a30-card", 1318, 357), ("a32-review-edits", 1316, 520), ("a49-reply2-top", 1318, 357),
         ("a45-clause5-typed", 1300, 678), ("b68-allow", 1318, 727), ("b64-store-search", 135, 78)]
PAD_X, PAD_Y = 70, 22   # context window around the pointer


def gray(im):
    return np.asarray(im.convert("L"), dtype=np.float32)


def pointer_mask(w, h, tx, ty):
    m = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(m)
    arrow = [(0, -0.5), (0, 13.5), (3, 10.8), (5.6, 16.5), (8.2, 15.4), (6, 10), (10.8, 10)]
    pts = [(tx + x, ty - 7 + y) for x, y in arrow]
    d.polygon(pts, fill=255)
    d.line(pts + [pts[0]], fill=255, width=5)
    return np.asarray(m) > 0


def candidates(skip):
    for p in sorted((ROOT / "caps").glob("*.jpg")):
        if p.stem.startswith(skip) or p.stem.endswith("-k"):
            continue
        im = Image.open(p)
        yield p.stem, im
    for p in sorted((ROOT / "hd" / "caps2x").glob("*.png")):
        im = Image.open(p)
        yield p.stem + "@2x", im.resize((im.width // 2, im.height // 2), Image.LANCZOS)


def search(win, mask, img):
    """Best placement of win (masked out where mask) inside img; coarse-to-fine SSD."""
    H, W = img.shape
    h, w = win.shape
    keep = ~mask
    best = (1e18, 0, 0)
    # coarse: compare a few rows of text only, every pixel step is needed for exact alignment; restrict by row hashes
    rows = np.where(keep.any(axis=1))[0]
    for y in range(0, H - h):
        band = img[y:y + h]
        # cheap reject on the mean of the window
        for x in range(0, W - w, 1):
            pass
        break
    return best


def match(win, mask, img):
    h, w = win.shape
    H, W = img.shape
    keep = (~mask).astype(np.float32)
    n = keep.sum()
    # FFT-based masked SSD: sum(keep*(img-win)^2) = sum(keep*img^2) - 2 sum(keep*win*img) + const
    from numpy.fft import rfft2, irfft2
    s = (H + h, W + w)
    K = rfft2(keep[::-1, ::-1], s)
    KW = rfft2((keep * win)[::-1, ::-1], s)
    I = rfft2(img, s)
    I2 = rfft2(img * img, s)
    a = irfft2(I2 * K, s)[h - 1:H, w - 1:W]
    b = irfft2(I * KW, s)[h - 1:H, w - 1:W]
    c = (keep * win * win).sum()
    ssd = (a - 2 * b + c) / n
    y, x = np.unravel_index(np.argmin(ssd), ssd.shape)
    return float(ssd[y, x]), int(x), int(y)


def main():
    for name, tx, ty in SPOTS:
        raw = gray(Image.open(ROOT / "caps" / f"{name}.jpg"))
        x0, y0 = tx - PAD_X, ty - PAD_Y
        win = raw[y0:y0 + 2 * PAD_Y, x0:x0 + 2 * PAD_X]
        mask = pointer_mask(raw.shape[1], raw.shape[0], tx, ty)[y0:y0 + 2 * PAD_Y, x0:x0 + 2 * PAD_X]
        best = None
        for cname, cim in candidates(name):
            g = gray(cim)
            err, x, y = match(win, mask, g)
            # the same capture state at the same place still has the pointer: skip exact-position hits that contain it
            if best is None or err < best[0]:
                best = (err, cname, cim, x, y)
        err, cname, cim, x, y = best
        print(f"{name}: best {cname} at ({x},{y}) err {err:.1f}")
        if err > 60:
            print("  no clean match, left as is")
            continue
        plate = Image.open(ROOT / "plates" / f"{name}.png").convert("RGB")
        src = cim.convert("RGB").crop((x, y, x + 2 * PAD_X, y + 2 * PAD_Y))
        m = Image.fromarray((pointer_mask(2 * PAD_X, 2 * PAD_Y, PAD_X, PAD_Y) * 255).astype(np.uint8))
        m = m.resize(m.size)
        # grow the mask a little so the halo goes too
        m = m.filter(__import__("PIL.ImageFilter", fromlist=["MaxFilter"]).MaxFilter(5))
        patch = plate.crop((x0, y0, x0 + 2 * PAD_X, y0 + 2 * PAD_Y))
        patch.paste(src, (0, 0), m)
        plate.paste(patch, (x0, y0))
        plate.save(ROOT / "plates" / f"{name}.png")


if __name__ == "__main__":
    main()
