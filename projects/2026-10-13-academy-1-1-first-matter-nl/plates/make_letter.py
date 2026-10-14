# The letter scene: page 1 of Andri's real Dutch letter (staging, 13 Oct 2026, my matter "Academy 1.1 NL"), letter0.png from
# the viewer's canvas (capture.mjs). Marks, in page css px (676 wide): the letterhead (navy pixels in the top 8 %), and two
# phrases found word by word along their text-layer lines: "zaaknr. 1803442/2025" (subject line, top 33.59 %, last 2 words)
# and "19 maart 2026" (top 38.56 %, words 5 to 7). letter1.png = letter0 with the yellow marks multiplied in.
import json, pathlib
from PIL import Image
H = pathlib.Path(__file__).resolve().parent
im = Image.open(H / 'letter0.png').convert('RGB'); W, Hh = im.size; k = W / 676; PH = 875
def words(top_pct, font=11):
    y0, y1 = int(top_pct / 100 * PH * k), int((top_pct / 100 * PH + font * 1.25) * k)
    cols = [any(sum(im.getpixel((x, y))) < 450 for y in range(y0, y1)) for x in range(W)]
    segs, x, gap = [], 0, int(3.2 * k)
    while x < W:
        if cols[x]:
            s = x
            while x < W and (cols[x] or any(cols[x:x + gap])): x += 1
            segs.append((s, x))
        x += 1
    return segs, y0, y1
def box(segs, y0, y1):
    return [segs[0][0] / k - 2, y0 / k - 1, (segs[-1][1] - segs[0][0]) / k + 4, (y1 - y0) / k + 2]
xs, ys = [], []
for y in range(0, int(Hh * .08)):
    for x in range(W):
        r, g, b = im.getpixel((x, y))
        if b > r + 25 and r < 90: xs.append(x); ys.append(y)
rows = sorted(set(ys)); top = [y for y in rows if y < rows[0] + 40]
lx = [x for x, y in zip(xs, ys) if y in top]
lm1 = [min(lx) / k - 2, min(top) / k - 1.5, (max(lx) - min(lx)) / k + 4, (max(top) - min(top)) / k + 3]
s2, a2, b2 = words(33.59); s3, a3, b3 = words(38.56)
print('subject words', len(s2), 'line words', len(s3))
lm2 = box(s2[-2:], a2, b2); lm3 = box(s3[4:7], a3, b3)
out = im.copy(); px = out.load(); Y = (248, 227, 124)
for r in (lm1, lm2, lm3):
    for y in range(int(r[1] * k), int((r[1] + r[3]) * k)):
        for x in range(int(r[0] * k), int((r[0] + r[2]) * k)):
            p = px[x, y]; px[x, y] = tuple(p[i] * Y[i] // 255 for i in range(3))
out.save(H / 'letter1.png')
d = json.loads((H / 'rects.json').read_text())
d['letter'] = {'box': [0, 0, 676, 875], 'lm1': lm1, 'lm2': lm2, 'lm3': lm3}
(H / 'rects.json').write_text(json.dumps(d, indent=1)); (H / 'rects.js').write_text('window.RECTS_DATA=' + json.dumps(d) + ';\n')
print('letter', d['letter'])
