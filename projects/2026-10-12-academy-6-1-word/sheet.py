#!/usr/bin/env python3
"""Tiles the stills in a folder (t<sec>.png) into one labelled review sheet: python3 sheet.py <dir> <out.png> [cols] [w]"""
import subprocess, sys, os, re
d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 5
w = int(sys.argv[4]) if len(sys.argv) > 4 else 480
h = w * 9 // 16
files = sorted([f for f in os.listdir(d) if re.match(r't[\d.]+\.png$', f)], key=lambda f: float(f[1:-4]))
args, f = [], []
for i, n in enumerate(files):
    args += ['-i', os.path.join(d, n)]
    f.append(f"[{i}]scale={w}:{h},drawtext=fontfile=/System/Library/Fonts/Supplemental/Arial.ttf:text='{n[1:-4]}':fontsize=18:fontcolor=red:x=6:y=6[v{i}]")
lay = '|'.join(f'{(i % cols) * w}_{(i // cols) * h}' for i in range(len(files)))
fc = ';'.join(f) + ';' + ''.join(f'[v{i}]' for i in range(len(files))) + f'xstack=inputs={len(files)}:layout={lay}:fill=black'
subprocess.run(['ffmpeg', '-v', 'error', '-y', *args, '-filter_complex', fc, out], check=True, stderr=subprocess.DEVNULL)
print(out, len(files))
