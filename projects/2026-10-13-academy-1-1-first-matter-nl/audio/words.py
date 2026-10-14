import sys, subprocess, numpy as np, json
from faster_whisper import WhisperModel
raw = subprocess.run(['ffmpeg','-v','error','-i',sys.argv[1],'-ac','1','-ar','16000','-f','f32le','-'],check=True,capture_output=True).stdout
wav = np.frombuffer(raw, dtype=np.float32)
m = WhisperModel('small', device='cpu', compute_type='int8')
segs,_ = m.transcribe(wav, language='nl', beam_size=5, word_timestamps=True)
W=[(w.start,w.end,w.word.strip()) for s in segs for w in s.words]
json.dump(W, open('words.json','w')); print(' '.join(f'{w}@{a:.2f}' for a,b,w in W))
