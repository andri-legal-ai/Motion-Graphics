# Cuts narration-nl.mp3 (one ElevenLabs take) into one WAV per script line, at the pauses between lines
# (silencedetect -40 dB, 0.28 s), keeping 0.12 s of room tone on each side. -ss/-t go before -i and asetpts
# comes before the fades (check-narration-gaps: 3.2 shipped with muted lines). Run: python3 -I split.py
import json, subprocess, pathlib
GAPS = [(4.22, 4.67), (12.94, 13.55), (17.77, 18.25), (24.65, 25.12), (28.92, 29.30), (38.18, 38.71), (45.45, 45.97),
        (50.16, 50.67), (55.69, 56.33), (59.46, 60.03), (65.09, 65.72), (69.05, 69.64), (75.67, 76.10), (85.30, 85.84),
        (92.40, 92.96), (96.90, 97.47), (103.91, 104.48), (115.99, 116.52), (122.17, 122.70)]
END = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', 'narration-nl.mp3'], capture_output=True, text=True).stdout)
starts = [0.0] + [b - 0.12 for a, b in GAPS]
ends = [a + 0.12 for a, b in GAPS] + [END]
out = pathlib.Path('nl'); out.mkdir(exist_ok=True)
dur = {}
for i, (s, e) in enumerate(zip(starts, ends), 1):
    n = f'L{i:02d}'; d = e - s
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', f'{s:.3f}', '-t', f'{d:.3f}', '-i', 'narration-nl.mp3',
                    '-af', f'asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st={d - 0.03:.3f}:d=0.03', '-ar', '48000', '-ac', '2', f'nl/{n}.wav'], check=True)
    vol = subprocess.run(['ffmpeg', '-v', 'info', '-i', f'nl/{n}.wav', '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    mean = [l.split(':')[1].strip() for l in vol.splitlines() if 'mean_volume' in l][0]
    dur[n] = round(d, 3); print(n, f'{s:7.2f} {d:5.2f}s', mean)
json.dump(dur, open('nl/durations.json', 'w'), indent=1)
