# The cited passage box (src.para) from the pixels: where src1 (staging's highlight) differs from src0 (highlight off).
# The text layer's mark rects came out narrower than the drawn highlight, so the sweep stopped mid-line.
import json
from PIL import Image, ImageChops
a = Image.open('src0.png').convert('RGB'); b = Image.open('src1.png').convert('RGB')
bb = ImageChops.difference(a, b).convert('L').point(lambda v: 255 if v > 24 else 0).getbbox()
d = json.load(open('rects.json')); para = [bb[0] / 2 - 2, bb[1] / 2 - 1, (bb[2] - bb[0]) / 2 + 4, (bb[3] - bb[1]) / 2 + 2]
print('old', d['src']['para'], 'new', para)
for k in ('src', 'src0', 'src1'):
    if k == 'src': d[k]['para'] = para
    elif k in d and 'src' in d[k]: d[k]['src']['para'] = para
json.dump(d, open('rects.json', 'w'), indent=1); open('rects.js', 'w').write('window.RECTS_DATA=' + json.dumps(d) + ';\n')
