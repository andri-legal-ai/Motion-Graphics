"""2x install plates for 6.1 (hd/caps2x -> plates/H*.png): "Document 3" reads "Document 1", the account avatar BN reads AF.
The "1" is the real Word UI glyph from the status bar ("Page 1 of 1"), scaled to the title size.
Run: .venv/bin/python hd/prep2x.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "hd" / "caps2x"


def dark_box(a, thr=140):
    ys, xs = np.where(a < thr)
    return xs.min(), ys.min(), xs.max(), ys.max()


def fix(name):
    im = Image.open(SRC / f"{name}.png").convert("RGB")
    g = np.asarray(im.convert("L")).astype(int)
    bg = tuple(int(v) for v in np.asarray(im)[50, 600])
    # title "3": the last glyph of "Document 3" (x 330..380, y 30..80 at 2x)
    x0, y0, x1, y1 = dark_box(g[30:80, 348:380])
    tx0, ty0, tx1, ty1 = x0 + 348, y0 + 30, x1 + 348, y1 + 30
    # the status bar "1" (2x x 93..102, y 1540..1560)
    sx0, sy0, sx1, sy1 = dark_box(g[1536:1564, 90:106])
    one = im.crop((sx0 + 90 - 1, sy0 + 1536 - 1, sx1 + 90 + 2, sy1 + 1536 + 2))
    k = (ty1 - ty0 + 1) / (sy1 - sy0 + 1)
    one = one.resize((max(1, round(one.width * k)), max(1, round(one.height * k))), Image.LANCZOS)
    # the status bar ink is lighter than the title ink: darken by the ratio of their contrasts with the background
    tink = g[30:80, 300:345].min(); sink = g[1536:1564, 30:110].min(); b = float(bg[0])
    f = (b - tink) / max(1.0, b - sink)
    a = np.asarray(one).astype(float); a = np.clip(b - (b - a) * f, 0, 255).astype(np.uint8); one = Image.fromarray(a)
    d = ImageDraw.Draw(im)
    d.rectangle((tx0 - 2, ty0 - 2, tx1 + 2, ty1 + 2), fill=bg)
    im.paste(one, (tx0, ty0 - 1))
    # avatar: clear the initials inside the circle and write AF
    cx, cy, r = 2988, 48, 25
    inside = tuple(int(v) for v in np.asarray(im)[cy, cx - r + 4])
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=inside)
    f = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 25)
    d.text((cx, cy + 1), "AF", font=f, fill=(36, 36, 36), anchor="mm")
    im.save(ROOT / "plates" / f"{name}.png")
    print(name, "title 3 at", (tx0, ty0, tx1, ty1), "scale", round(k, 2))


for n in ["H01-blank", "H02-overflow", "H03-addins-panel", "H04-welcome", "H05-allow"]:
    fix(n)
