# check/ssheet.py <dir> <out.png> : tiles every t*.png in dir (sorted by time) 4 across, labelled
import sys, glob, os, re
from PIL import Image, ImageDraw
fs = sorted(glob.glob(os.path.join(sys.argv[1], 't*.png')), key=lambda f: float(re.findall(r't([\d.]+)\.png', f)[0]))
W, Hh, C = 480, 270, 4
sheet = Image.new('RGB', (W * C, Hh * ((len(fs) + C - 1) // C)), 'white')
for i, f in enumerate(fs):
    im = Image.open(f).convert('RGB').resize((W, Hh)); ImageDraw.Draw(im).text((5, 5), os.path.basename(f)[:-4], fill=(255, 0, 0)); sheet.paste(im, ((i % C) * W, (i // C) * Hh))
sheet.save(sys.argv[2]); print(len(fs))
