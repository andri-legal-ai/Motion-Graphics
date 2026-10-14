import sys, pathlib
from PIL import Image, ImageDraw
d=pathlib.Path(sys.argv[1]); cols=int(sys.argv[3]) if len(sys.argv)>3 else 4
fs=sorted(d.glob('*.png'), key=lambda f: float(f.stem[1:])); S=(720,405); rows=(len(fs)+cols-1)//cols
sh=Image.new('RGB',(cols*S[0],rows*(S[1]+18)),(40,40,40)); dr=ImageDraw.Draw(sh)
for i,f in enumerate(fs):
    im=Image.open(f).convert('RGB').resize(S); x,y=(i%cols)*S[0],(i//cols)*(S[1]+18); sh.paste(im,(x,y+18)); dr.text((x+4,y+3),f.stem,fill=(255,255,0))
sh.save(sys.argv[2])
