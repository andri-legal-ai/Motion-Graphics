"""2x plates for 6.1: hd/caps2x/*.png -> plates/<name>.png (3036 x 1568, one plate px = half an app px).

Demo-firm swaps, drawn in the pane's own font (Rethink Sans, from word-staging.andri.ai):
- pane header in the matter view: "Academy 6.1 HD [UK]" -> "Nair v Calderdale Logistics [UK]"
- breadcrumb in the document view: "Ac…" / "A…" (the matter, truncated) -> "Na…" / "N…"
- Word title "Document 3" -> "Document 1" (the "1" glyph from Word's own status bar)
- account avatar "BN" -> "AF"
Run: .venv/bin/python hd/prepN.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "hd" / "caps2x"
FONT = str(ROOT / "pane" / "RethinkSans.ttf")
NAIR = "Nair v Calderdale Logistics"


def font(size, weight):
    f = ImageFont.truetype(FONT, size)
    f.set_variation_by_axes([weight])
    return f


def runs(cols, gap):
    out, s, p = [], None, None
    for c in cols:
        if s is None:
            s = p = c
            continue
        if c > p + gap:
            out.append((s, p))
            s = c
        p = c
    if s is not None:
        out.append((s, p))
    return out


def fit(text, width, weight):
    """font size (2x px) whose rendering of text is `width` wide"""
    best = None
    for s10 in range(200, 400):
        f = font(s10 / 10, weight)
        w = f.getlength(text)
        if best is None or abs(w - width) < best[0]:
            best = (abs(w - width), s10 / 10)
    return best[1]


def ink(im, box):
    """darkest colour in a box (the text colour, dimmed or not)"""
    a = np.asarray(im.crop(box).convert("RGB")).reshape(-1, 3)
    return tuple(int(v) for v in a[a.sum(axis=1).argmin()])


def fix(name):
    im = Image.open(SRC / f"{name}.png").convert("RGB")
    g = np.asarray(im.convert("L")).astype(int)
    d = ImageDraw.Draw(im)
    notes = []

    # avatar: the dark ring at the top right
    reg = g[5:75, 2950:3030]
    ys, xs = np.where(reg < 120)
    if len(xs):
        cx, cy = (xs.min() + xs.max()) / 2 + 2950, (ys.min() + ys.max()) / 2 + 5
        r = (xs.max() - xs.min()) / 2 - 4
        inside = tuple(int(v) for v in np.asarray(im)[int(cy), int(cx - r + 4)])
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=inside)
        d.text((cx, cy + 1), "AF", font=font(24, 600), fill=(36, 36, 36), anchor="mm")

    # title: the last glyph before the save icon
    band = g[22:58, 150:430]
    rr = runs(list(np.where((band < 140).any(axis=0))[0] + 150), 6)
    three = next(((a, b) for i, (a, b) in enumerate(rr) if i + 1 < len(rr) and rr[i + 1][0] > b + 20), None)
    sb = g[1532:1566, 15:140]
    sr = runs(list(np.where((sb < 140).any(axis=0))[0] + 15), 5)
    if three and len(sr) >= 2:
        tx0, tx1 = three
        ty = np.where((g[22:58, tx0:tx1 + 1] < 140).any(axis=1))[0] + 22
        ty0, ty1 = ty.min(), ty.max()
        sx0, sx1 = sr[1]
        sy = np.where((g[1532:1566, sx0:sx1 + 1] < 140).any(axis=1))[0] + 1532
        sy0, sy1 = sy.min(), sy.max()
        one = im.crop((sx0 - 1, sy0 - 1, sx1 + 2, sy1 + 2))
        k = (ty1 - ty0 + 1) / (sy1 - sy0 + 1)
        one = one.resize((max(1, round(one.width * k)), max(1, round(one.height * k))), Image.LANCZOS)
        bgc = tuple(int(v) for v in np.asarray(im)[ty0 - 4, tx1 + 8])
        tink, sink, b = g[22:58, 150:tx0].min(), g[1532:1566, 15:140].min(), float(bgc[0])
        a = np.asarray(one).astype(float)
        a = np.clip(b - (b - a) * (b - tink) / max(1.0, b - sink), 0, 255).astype(np.uint8)
        d.rectangle((tx0 - 2, ty0 - 2, tx1 + 2, ty1 + 2), fill=bgc)
        im.paste(Image.fromarray(a), (tx0, ty0 - 1))

    # pane header (only where the Andri pane is open)
    if g[330, 2330:2380].min() < 150:
        band = g[316:358, 2290:2960]
        rr = runs(list(np.where((band < 150).any(axis=0))[0] + 2290), 7)
        word = next(((a, b) for a, b in rr if 2400 <= a <= 2425), None)
        bg = tuple(int(v) for v in np.asarray(im)[312, 2750])
        cases = next(((a, b) for a, b in rr if 2320 <= a <= 2335), None)
        rows = np.where((g[316:358, cases[0]:cases[1] + 1] < 150).any(axis=1))[0] + 316
        base = rows.max()
        hdr = np.asarray(im)[322:352, 2600:2900].astype(int).reshape(-1, 3)
        yellow = ((hdr[:, 0] - hdr[:, 2]) > 60).sum() > 200   # the Save to Andri button: only in the document view
        uk = next(((a, b) for a, b in rr if 2575 <= a <= 2600), None)
        if uk and not yellow:   # matter view: bold matter name + UK badge
            col = ink(im, (2411, 318, 2532, 356))
            size = fit("Academy 6.1", 2532 - 2411 + 1, 600)
            badge = im.crop((2572, 312, 2626, 362))
            d.rectangle((2405, 314, 2632, 360), fill=bg)
            f = font(size, 600)
            d.text((2411, base + 1), NAIR, font=f, fill=col, anchor="ls")
            bx = int(2411 + f.getlength(NAIR) + 12)
            im.paste(badge, (bx, 312))
            notes.append(f"header {size}px")
        elif word:   # document view: the truncated matter in the breadcrumb
            col = ink(im, (word[0], 318, word[1], 356))
            wc = cases[1] - cases[0] + 1
            size = fit("Cases", wc, 500)
            f = font(size, 500)
            text = "Na…" if (word[1] - word[0] + 1) > f.getlength("A…") + 6 else "N…"
            strip = im.crop((word[0] - 5, 318, word[0] - 4, 357)).resize((word[1] - word[0] + 5, 39))
            im.paste(strip, (word[0] - 2, 318))
            d.text((word[0], base + 1), text, font=f, fill=col, anchor="ls")
            notes.append(f"crumb {text} {size}px")
    im.save(ROOT / "plates" / f"{name}.png")
    print(name, *notes)


for p in sorted(SRC.glob("N*.png")):   # H* (install screens) are prepared by hd/prep2x.py
    fix(p.stem)
