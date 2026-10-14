# Transcribes a finished video's narration (local faster-whisper, nothing leaves the Mac) and compares it with the script,
# so every Academy video is "re-listened" before delivery: missing or changed words, odd pronunciations ("Andri" heard
# as something else), lines in the wrong place.
# Usage:
#   ~/.local/share/academy-stt/.venv/bin/python "$HOME/Desktop/andri code /Motion Graphics/_toolkit/transcribe.py" <video.mp4> [script.txt] [--lang en|de|nl] [--model small]
# Prints the timed transcript, then a word diff against the script (- only in the script, + only heard), and writes
# <video>.transcript.txt next to the video.
import sys, re, difflib, subprocess, os
import numpy as np
from faster_whisper import WhisperModel

args = [a for a in sys.argv[1:] if not a.startswith('--')]
opt = lambda k, d: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
video, script = args[0], (args[1] if len(args) > 1 else None)
lang, size = opt('--lang', 'en'), opt('--model', 'small')

# 16 kHz mono float samples straight from ffmpeg (avoids PyAV version clashes)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', video, '-vn', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], check=True, capture_output=True).stdout
wav = np.frombuffer(raw, dtype=np.float32)
model = WhisperModel(size, device='cpu', compute_type='int8')
# --raw: no name hints, so a mispronounced name shows up as heard (use it for the pronunciation check)
segs, _ = model.transcribe(wav, language=lang, beam_size=5, vad_filter=True,
                           initial_prompt=None if '--raw' in sys.argv else 'Andri, Andri Academy, Traitements, arobase')
lines, heard = [], []
for s in segs:
    m, sec = divmod(s.start, 60)
    lines.append(f'{int(m)}:{sec:05.2f}  {s.text.strip()}'); heard.append(s.text.strip())
out = '\n'.join(lines)
print(out)
open(os.path.splitext(video)[0] + '.transcript.txt', 'w').write(out + '\n')

if script:
    norm = lambda t: re.findall(r"\w+", t.lower().replace('’', "'").replace('-', ' '))
    a, b = norm(open(script).read()), norm(' '.join(heard))
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    print(f'\n--- script vs heard: {sum(x.size for x in sm.get_matching_blocks())}/{len(a)} script words matched')
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op != 'equal':
            ctx = ' '.join(a[max(0, i1 - 4):i1])
            print(f'  …{ctx}  - {" ".join(a[i1:i2]) or "∅"}  + {" ".join(b[j1:j2]) or "∅"}')
