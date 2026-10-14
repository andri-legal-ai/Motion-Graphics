import subprocess, sys
INTRO, S0, LANG = 3.0, 8.6, 10.0
sh = lambda x: x + LANG if x >= S0 else x
def mk(SEGS):
    def NEW(o):
        n = 0
        for a, b, r in SEGS:
            if o <= a: break
            n += (min(o, b) - a) * r
        return n
    return NEW
ORIG = [[0, 7.45, 1.0], [7.45, S0, 1.2], [S0, S0 + LANG, 1.0], [sh(S0), sh(33.5), 1.2], [sh(33.5), sh(38.6), 0.8], [sh(38.6), sh(53.6), 1.2], [sh(53.6), sh(55.6), 0.8], [sh(55.6), sh(57.6), 0.6], [sh(57.6), 999, 1.2]]
NEWS = [[0, 7.45, 1.0], [7.45, S0, 1.2], [S0, S0 + LANG, 1.0],
  [sh(S0), sh(13.6), 1.2], [sh(13.6), sh(15.0), 0.75], [sh(15.0), sh(17.0), 1.0], [sh(17.0), sh(20.8), 1.2], [sh(20.8), sh(24.2), 0.85], [sh(24.2), sh(33.5), 1.2], [sh(33.5), sh(38.6), 0.6],
  [sh(38.6), sh(43.4), 1.2], [sh(43.4), sh(46.3), 0.8], [sh(46.3), sh(51.1), 1.2], [sh(51.1), sh(53.6), 0.85],
  [sh(53.6), sh(55.6), 0.55], [sh(55.6), sh(57.6), 0.45], [sh(57.6), sh(62.0), 1.2], [sh(62.0), sh(63.3), 0.7],
  [sh(63.3), sh(66.0), 1.2], [sh(66.0), sh(67.0), 0.8], [sh(67.0), 999, 1.2]]
VO_OLD = {'L0': 0.6, 'L1': 4.6, 'L2': 9.5, 'L3': 17.7, 'L4': 25.9, 'L5': 38.4, 'L6': 47.4, 'L7': 57.96, 'L7b': 67.2, 'L8': 73.5}
o, n = mk(ORIG), mk(NEWS)
# old timeline end of the original 103 s video
lo, hi = 0, 200
for _ in range(60):
    m = (lo + hi) / 2; lo, hi = (m, hi) if o(m) < 100 else (lo, m)
print('old end tl', round(lo, 3), 'new duration', round(n(lo) + INTRO, 2))
VO = {'intro': -2.55, 'Lsw': n(S0 + 0.3), **{k: n(sh(v)) for k, v in VO_OLD.items()}}
dur = {k: float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f'fr/{k}.wav'], capture_output=True, text=True).stdout) for k in VO}
prev = None
for k in sorted(VO, key=VO.get):
    s = VO[k] + INTRO
    if prev: print(f'  gap {s - prev:4.1f}')
    print(f'{k:5} {s:6.2f}-{s + dur[k]:6.2f}'); prev = s + dur[k]
