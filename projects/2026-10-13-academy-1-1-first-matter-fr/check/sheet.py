# Tiles plates into a check sheet: sheet.py out.png name1 name2 ... (crop to the first 860 px of each, 720 wide)
import sys
from PIL import Image, ImageDraw
out, names = sys.argv[1], sys.argv[2:]
W = 720; th = 430; tiles = []
for n in names:
    im = Image.open(n + '.png').convert('RGB'); im = im.resize((W, int(im.height * W / im.width)))
    d = ImageDraw.Draw(im); d.rectangle([0, 0, 130, 22], fill=(255, 255, 0)); d.text((4, 4), n, fill=(0, 0, 0)); tiles.append(im)
cols = 3; rows = (len(tiles) + cols - 1) // cols
sheet = Image.new('RGB', (cols * W, rows * th), 'white')
for i, t in enumerate(tiles): sheet.paste(t.crop((0, 0, W, th)), ((i % cols) * W, (i // cols) * th))
sheet.save(out); print(sheet.size)
