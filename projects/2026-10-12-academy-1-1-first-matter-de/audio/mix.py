# v6 mix: German narration (audio/de3/*.wav), clicks and whooshes on the video timeline (video time = app time + 3.0 s intro),
# loudness-normalised to -14 LUFS. Times mirror app.js: old times are shifted by the language step (sh), then mapped with SEGS (NEW).
import subprocess
INTRO, S0, LANG = 3.0, 8.6, 10.0
sh = lambda x: x + LANG if x >= S0 else x
SEGS = [[0, 7.45, 1.0], [7.45, S0, 1.2], [S0, S0 + LANG, 1.0], [sh(S0), sh(33.5), 1.2], [sh(33.5), sh(38.6), 0.8], [sh(38.6), sh(53.6), 1.2], [sh(53.6), sh(55.6), 0.8], [sh(55.6), sh(57.6), 0.6], [sh(57.6), 999, 1.2]]
def NEW(o):
    n = 0
    for a, b, r in SEGS:
        if o <= a: break
        n += (min(o, b) - a) * r
    return n
VO_OLD = {'L0': 0.6, 'L1': 4.6, 'L2': 8.94, 'L3': 15.89, 'L4': 25.3, 'L5': 38.85, 'L6': 47.4, 'L7': 57.96, 'L7b': 67.4, 'L8': 73.5}   # = app.js
VO = {'intro': -2.55, 'Lsw': NEW(S0 + 0.3), **{k: NEW(sh(v)) for k, v in VO_OLD.items()}}
CLICKS = [9.9, 13.5, 15.9, 17.7, 18.8, 19.8, 25.0, 29.4, 30.95, 33.2, 40.2, 46.5, 50.6, 53.1, 60.4, 61.1, 64.3, 65.9]
WHOOSH = [7.45, 13.9, 16.0, 25.1, 33.3, 40.3, 46.6, 64.4, 67.1, 73.3]
LANG_CLICKS = [3.5, 5.1, 6.3, 7.6, 9.0]; LANG_WHOOSH = [3.6, 9.1]          # = app.js LP
END = 90.0 + LANG + INTRO
ins, parts = [], []
for n, t in VO.items():
    ins += ['-i', f'de3/{n}.wav']; parts.append((len(ins) // 2 - 1, t + INTRO, 1.0))
for t in [NEW(sh(c)) for c in CLICKS] + [NEW(S0 + c) for c in LANG_CLICKS]:
    ins += ['-i', 'click.wav']; parts.append((len(ins) // 2 - 1, t + INTRO - 0.02, 1.0))
for t in [NEW(sh(w)) for w in WHOOSH] + [NEW(S0 + w) for w in LANG_WHOOSH]:
    ins += ['-i', 'whoosh.wav']; parts.append((len(ins) // 2 - 1, t + INTRO - 0.05, 0.8))
f = ''.join(f'[{i}]aresample=48000,aformat=channel_layouts=stereo,volume={v},adelay={int(d*1000)}|{int(d*1000)}[a{i}];' for i, d, v in parts)
f += ''.join(f'[a{i}]' for i, _, _ in parts) + f'amix=inputs={len(parts)}:normalize=0:duration=longest,apad=whole_dur={END},atrim=0:{END}[m];[m]loudnorm=I=-14:TP=-1.5:LRA=11[out]'
subprocess.run(['ffmpeg', '-y', '-v', 'error', *ins, '-filter_complex', f, '-map', '[out]', '-ar', '48000', 'mix-de-v6.wav'], check=True)
print('mix-de-v6.wav', END)
