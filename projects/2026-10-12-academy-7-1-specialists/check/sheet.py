# sheet.py out.png cols width img1 [img2 ...]: labelled contact sheet of still images (label = file name)
import subprocess, sys, os
out, cols, w, fs = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4:]
FONT = '/System/Library/Fonts/Supplemental/Arial.ttf'
h = None; args = []; flt = ''
for i, f in enumerate(fs):
    args += ['-i', f]; lab = os.path.basename(f).rsplit('.', 1)[0].replace(':', '-')
    flt += f"[{i}]scale={w}:-2,pad={w}:ceil(ih/2)*2,drawtext=fontfile={FONT}:text='{lab}':x=6:y=4:fontsize=16:fontcolor=red:box=1:boxcolor=white@0.7[v{i}];"
import json
dims = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height', '-of', 'json', fs[0]], capture_output=True, text=True).stdout)['streams'][0]
h = int(round(w * dims['height'] / dims['width'] / 2) * 2)
n = len(fs); pad = (cols - n % cols) % cols
for j in range(pad): flt += f"color=white:s={w}x{h}:d=1[p{j}];"
flt += ''.join(f"[v{i}]" for i in range(n)) + ''.join(f"[p{j}]" for j in range(pad))
flt += f"xstack=inputs={n+pad}:fill=white:layout=" + '|'.join(f"{(i % cols) * w}_{(i // cols) * h}" for i in range(n + pad))
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', *args, '-filter_complex', flt, '-frames:v', '1', out], check=True)
