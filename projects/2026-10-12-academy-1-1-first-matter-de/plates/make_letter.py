# The letter scene for v2: page 1 of Andri's real letter (staging, 12 Oct 2026, conversation "Academy 1.1 DE v2"),
# taken from the viewer's canvas at 190 % zoom (1368 x 1770). Marks: letterhead (measured from its navy pixels),
# "Az. 1803442/2025" and "Employment Judge Hartley" (positions from the viewer's text layer, page css width 684).
import json, pathlib
from PIL import Image
H = pathlib.Path(__file__).resolve().parent
im = Image.open(H / 'letterpage1.png').convert('RGB'); W, Hh = im.size; k = W / 684
# letterhead: navy pixels in the top 8 %
xs, ys = [], []
for y in range(0, int(Hh * .08)):
    for x in range(W):
        r, g, b = im.getpixel((x, y))
        if b > r + 25 and r < 90: xs.append(x); ys.append(y)
rows = sorted(set(ys)); top = [y for y in rows if y < rows[0] + 40]
lx = [x for x, y in zip(xs, ys) if y in top]
lm1 = [min(lx) / k - 2, min(top) / k - 1.5, (max(lx) - min(lx)) / k + 4, (max(top) - min(top)) / k + 3]
lm2 = [342 - 2, 296 - 1, 117 + 2, 14 + 2]   # "Az. 1803442/2025"
lm3 = [372 - 2, 338 - 1, 171 + 4, 14 + 2]
im.save(H / 'letter0.png')
out = im.copy(); px = out.load(); Y = (248, 227, 124)
for r in (lm1, lm2, lm3):
    for y in range(int(r[1] * k), int((r[1] + r[3]) * k)):
        for x in range(int(r[0] * k), int((r[0] + r[2]) * k)):
            p = px[x, y]; px[x, y] = tuple(p[i] * Y[i] // 255 for i in range(3))   # multiply, like the 1.1 marks
out.save(H / 'letter1.png')
d = json.loads((H / 'rects.json').read_text())
d['letter'] = {'box': [0, 0, 684, 885], 'lm1': lm1, 'lm2': lm2, 'lm3': lm3}
(H / 'rects.json').write_text(json.dumps(d, indent=1)); (H / 'rects.js').write_text('window.RECTS_DATA=' + json.dumps(d) + ';\n')
print('letter', d['letter'])
