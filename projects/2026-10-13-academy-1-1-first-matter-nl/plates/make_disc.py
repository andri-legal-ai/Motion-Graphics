# Keys the background out of disc.png (capture.mjs): alpha from how much darker than the page each pixel is, colour kept.
import pathlib
from PIL import Image
H = pathlib.Path(__file__).resolve().parent
im = Image.open(H / 'disc.png').convert('RGB'); W, Hh = im.size
bg = max((im.getpixel((x, y)) for x in range(W) for y in (0, Hh - 1)), key=sum)
out = Image.new('RGBA', im.size)
ink = (36, 30, 25)
for y in range(Hh):
    for x in range(W):
        r, g, b = im.getpixel((x, y)); d = max(0, sum(bg) - (r + g + b)) / max(1, sum(bg) - sum(ink))
        out.putpixel((x, y), ink + (int(min(1, d) * 255),))
out.save(H / 'disc.png'); print('disc keyed, bg', bg)
