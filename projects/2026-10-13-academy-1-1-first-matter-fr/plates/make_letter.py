# The letter scene: page 1 of Andri's real French letter (staging, 13 Oct 2026, matter "Academy 1.1 FR v2",
# Lettre_Nair_etat_de_la_procedure.docx), taken from the viewer's canvas at 170 % zoom (1944 x 2516). Shown at 684 px wide.
# Marks: the letterhead (measured from its navy pixels), "(cause n° C/18542/2025-" and "décision incidente notifiée le 19 mars 2026"
# (positions from the viewer's text layer in the doc-jobs snapshot, canvas 514 css px wide at 90 %, scaled to 684).
import json, pathlib
from PIL import Image
H = pathlib.Path(__file__).resolve().parent
im = Image.open(H / 'letterpage1.png').convert('RGB'); W, Hh = im.size; k = W / 684
f = 684 / 514
xs, ys = [], []
for y in range(0, int(Hh * .06)):
    for x in range(W):
        r, g, b = im.getpixel((x, y))
        if b > r + 25 and r < 90: xs.append(x); ys.append(y)
rows = sorted(set(ys)); top = [y for y in rows if y < rows[0] + 40]
lx = [x for x, y in zip(xs, ys) if y in top]
lm1 = [min(lx) / k - 2, min(top) / k - 1.5, (max(lx) - min(lx)) / k + 4, (max(top) - min(top)) / k + 3]
sc = lambda r: [r[0] * f - 2, r[1] * f - 1, r[2] * f + 4, r[3] * f + 2]
lm2 = sc([334, 248.1, 117.1, 10])
lm3 = sc([79.2, 304.2, 201.6, 10])
Hp = round(684 * Hh / W)
im.save(H / 'letter0.png')
out = im.copy(); px = out.load(); Y = (248, 227, 124)
for r in (lm1, lm2, lm3):
    for y in range(int(r[1] * k), int((r[1] + r[3]) * k)):
        for x in range(int(r[0] * k), int((r[0] + r[2]) * k)):
            p = px[x, y]; px[x, y] = tuple(p[i] * Y[i] // 255 for i in range(3))   # multiply, like the 1.1 marks
out.save(H / 'letter1.png')
d = json.loads((H / 'rects.json').read_text())
d['letter'] = {'box': [0, 0, 684, Hp], 'lm1': lm1, 'lm2': lm2, 'lm3': lm3}
(H / 'rects.json').write_text(json.dumps(d, indent=1)); (H / 'rects.js').write_text('window.RECTS_DATA=' + json.dumps(d) + ';\n')
print('letter', d['letter'])
