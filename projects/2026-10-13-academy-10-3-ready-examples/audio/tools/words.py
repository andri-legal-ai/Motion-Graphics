# Word timestamps for the narration take (local faster-whisper), to cut it into script lines.
import sys, subprocess, numpy as np, json
from faster_whisper import WhisperModel
raw = subprocess.run(['ffmpeg','-v','error','-i',sys.argv[1],'-ac','1','-ar','16000','-f','f32le','-'],check=True,capture_output=True).stdout
wav = np.frombuffer(raw, dtype=np.float32)
m = WhisperModel('small', device='cpu', compute_type='int8')
segs,_ = m.transcribe(wav, language='en', beam_size=5, word_timestamps=True, initial_prompt='Andri, Aldridge Vine, Ms Nair, Remedy check')
out = [[w.word.strip(), round(w.start,2), round(w.end,2)] for s in segs for w in s.words]
json.dump(out, open(sys.argv[2],'w'))
print(len(out))
