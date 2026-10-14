# tiles stills: python3 tile.py <dir> <out.png> t1 t2 ... (4 per row, 640 wide each)
import sys, subprocess
d, out, *ts = sys.argv[1:]
ins, f, lay = [], '', []
for i, t in enumerate(ts):
    ins += ['-i', f'{d}/t{t}.png']; f += f'[{i}]scale=640:-1[v{i}];'; lay.append(f'{(i % 4) * 640}_{(i // 4) * 360}')
f += ''.join(f'[v{i}]' for i in range(len(ts))) + f'xstack=inputs={len(ts)}:layout=' + '|'.join(lay)
subprocess.run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', f, out], check=True)
