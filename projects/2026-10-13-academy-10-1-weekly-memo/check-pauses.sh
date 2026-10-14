#!/bin/zsh
# check-pauses.sh video.mp4 : silences (voice) and still stretches (picture) that overlap = sudden pauses (8.1 lesson)
V=$1
ffmpeg -i $V -vn -af silencedetect=n=-35dB:d=1.0 -f null - 2>&1 | grep -o "silence_\(start\|end\): [0-9.]*" | awk '{print $2}' | paste - - > /tmp/claude-501/sil.txt
ffmpeg -i $V -an -vf "fps=10,scale=480:-1,mpdecimate=hi=200:lo=100:frac=0.2,showinfo" -f null - 2>&1 | grep -o "pts_time:[0-9.]*" | cut -d: -f2 > /tmp/claude-501/keep.txt
python3 - <<'PY'
sil=[tuple(map(float,l.split())) for l in open('/tmp/claude-501/sil.txt') if len(l.split())==2]
keep=[float(x) for x in open('/tmp/claude-501/keep.txt')]
still=[(a,b) for a,b in zip(keep,keep[1:]) if b-a>1.2]
print('silences >1s:', [(round(a,1),round(b,1)) for a,b in sil])
print('still >1.2s:', [(round(a,1),round(b,1)) for a,b in still])
for a,b in sil:
    for c,d in still:
        o0,o1=max(a,c),min(b,d)
        if o1-o0>0.6: print(f'PAUSE {o0:.1f}-{o1:.1f} ({o1-o0:.1f}s)')
PY
