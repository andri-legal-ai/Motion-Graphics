# Mix: narration lines (nl/L*.wav) at their start times, a click on every cursor press, soft whooshes on the pushes, morphs and
# text moments; two-pass loudnorm to -14 LUFS. Run: node cues.mjs && python3 -I mix.py
import json, subprocess
ev = json.load(open('cues.json')); END = ev['DUR']
ins, parts = [], []
def add(f, t, v):
    ins.extend(['-i', f]); parts.append((len(ins) // 2 - 1, max(0, t), v))
for n, t in ev['VO'].items(): add(f'nl/{n}.wav', t, 1.0)
for t in ev['CLICKS']: add('click.wav', t - 0.02, 0.55)
for t in ev['WH']: add('whoosh.wav', t - 0.15, 0.45)
f = ''.join(f'[{i}]aresample=48000,aformat=channel_layouts=stereo,volume={v},adelay={int(d*1000)}|{int(d*1000)}[a{i}];' for i, d, v in parts)
f += ''.join(f'[a{i}]' for i, _, _ in parts) + f'amix=inputs={len(parts)}:normalize=0:duration=longest,apad=whole_dur={END},atrim=0:{END}[m]'
subprocess.run(['ffmpeg', '-y', '-v', 'error', *ins, '-filter_complex', f, '-map', '[m]', '-ar', '48000', 'mix-raw.wav'], check=True)
m = subprocess.run(['ffmpeg', '-i', 'mix-raw.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', 'mix-raw.wav', '-af', f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true", '-ar', '48000', 'mix-nl.wav'], check=True)
s = subprocess.run(['ffmpeg', '-i', 'mix-nl.wav', '-af', 'loudnorm=print_format=summary', '-f', 'null', '-'], capture_output=True, text=True).stderr
print('\n'.join(l for l in s.splitlines() if 'Input Integrated' in l or 'Input True Peak' in l), END)
