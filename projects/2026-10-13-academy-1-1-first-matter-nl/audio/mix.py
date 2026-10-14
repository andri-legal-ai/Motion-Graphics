# Dutch mix: narration (audio/nl/*.wav), clicks and whooshes at the times app.js exports (events.json, from events.mjs),
# loudness-normalised to -14 LUFS. Run: node audio/events.mjs && cd audio && python3 -I mix.py
import json, subprocess
ev = json.load(open('events.json'))
END = ev['duration']
parts, ins = [], []
def add(f, t, v):
    ins.extend(['-i', f]); parts.append((len(ins) // 2 - 1, t, v))
add('nl/intro.wav', ev['intro'], 1.0)
for n, t in ev['vo'].items(): add(f'nl/{n}.wav', t, 1.0)
for t in ev['clicks']: add('click.wav', t - 0.02, 1.0)
for t in ev['whoosh']: add('whoosh.wav', t - 0.05, 0.8)
f = ''.join(f'[{i}]aresample=48000,aformat=channel_layouts=stereo,volume={v},adelay={int(d*1000)}|{int(d*1000)}[a{i}];' for i, d, v in parts)
f += ''.join(f'[a{i}]' for i, _, _ in parts) + f'amix=inputs={len(parts)}:normalize=0:duration=longest,apad=whole_dur={END},atrim=0:{END}[m];[m]loudnorm=I=-14:TP=-1.5:LRA=11[out]'
subprocess.run(['ffmpeg', '-y', '-v', 'error', *ins, '-filter_complex', f, '-map', '[out]', '-ar', '48000', 'mix-nl.wav'], check=True)
print('mix-nl.wav', END)
