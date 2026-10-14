#!/bin/zsh
# cuts the one ElevenLabs take (14 Oct 2026, UK voice, v4 s50 sb75 sp100) into line WAVs at its pauses (-ss/-t before -i, asetpts before afade)
cd "${0:A:h}"; mkdir -p uk
ffmpeg -loglevel error -y -i narration-uk-11.2.mp3 -ar 48000 -ac 1 narration-uk-11.2.wav
for L in N1:0:3.89 N2:4.45:8.59 N3:9.17:12.37 N4:12.84:17.92 N5:18.40:20.90 N6:21.44:26.98 N7:27.50:31.01 N8:31.56:35.42 N9:35.97:43.01 N10:43.58:52.02 N11:52.60:61.28 N12:61.75:66.46 N13:66.96:72.87 N14:73.39:82.53 N15:82.98:85.75 N16:86.24:93.40; do
  n=${L%%:*}; r=${L#*:}; a=${r%%:*}; b=${r#*:}; s=$(( a > 0.07 ? a - 0.07 : 0 )); d=$(( b - s + 0.12 ))
  ffmpeg -loglevel error -y -ss $s -t $d -i narration-uk-11.2.wav -af "asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st=$(( d - 0.05 )):d=0.05" uk/$n.wav
  printf "%s %.2f %s\n" $n $d "$(ffmpeg -i uk/$n.wav -af volumedetect -f null - 2>&1 | grep mean_volume | awk '{print $5}')"
done
