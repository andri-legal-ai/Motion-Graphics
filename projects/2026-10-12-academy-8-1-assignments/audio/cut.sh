#!/bin/zsh
# cuts the one ElevenLabs take into line WAVs at its pauses (-ss/-t before -i, asetpts before afade: check-narration-gaps)
cd "${0:A:h}"; mkdir -p uk
ffmpeg -loglevel error -y -i narration-uk-8.1.mp3 -ar 48000 -ac 1 narration-uk-8.1.wav
for L in N1:0:5.02 N2:5.59:17.57 N3:18.11:21.27 N4:21.81:27.44 N5:27.95:30.66 N6a:31.22:35.16 N6b:35.72:39.37 N6c:39.89:43.52 N7:44.04:49.04 N8:49.56:53.65 N9:54.20:61.09 N10:61.58:67.02 N11:67.49:72.08 N12a:72.69:75.25 N12b:75.71:78.69 N13:79.24:81.58 N14:82.18:86.98 N15a:90.11:92.11 N15b:92.60:98.89 N16:99.48:104.28; do
  n=${L%%:*}; r=${L#*:}; a=${r%%:*}; b=${r#*:}; s=$(( a > 0.07 ? a - 0.07 : 0 )); d=$(( b - s + 0.12 ))
  ffmpeg -loglevel error -y -ss $s -t $d -i narration-uk-8.1.wav -af "asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st=$(( d - 0.05 )):d=0.05" uk/$n.wav
  printf "%s %.2f %s\n" $n $d "$(ffmpeg -i uk/$n.wav -af volumedetect -f null - 2>&1 | grep mean_volume | awk '{print $5}')"
done
