#!/bin/zsh
# cuts the one ElevenLabs take (13 Oct 2026, UK voice, v4 s50 sb75 sp100) into line WAVs at its pauses (-ss/-t before -i, asetpts before afade)
cd "${0:A:h}"; mkdir -p uk
ffmpeg -loglevel error -y -i narration-uk-11.1.mp3 -ar 48000 -ac 1 narration-uk-11.1.wav
for L in N1:0:5.71 N2:6.40:11.50 N3:12.14:15.26 N4:15.88:16.76 N5:17.37:21.93 N6:22.54:26.14 N7:26.74:31.74 N8:32.42:38.33 N9:38.96:41.99 N10:42.61:45.49 N11:46.12:51.27 N12:51.82:54.76 N13:55.35:62.34 N14:62.81:65.61 N15:66.25:69.32 N16:69.89:75.83 N17:76.38:78.50 N18:79.14:83.30 N19:83.88:88.76; do
  n=${L%%:*}; r=${L#*:}; a=${r%%:*}; b=${r#*:}; s=$(( a > 0.07 ? a - 0.07 : 0 )); d=$(( b - s + 0.12 ))
  ffmpeg -loglevel error -y -ss $s -t $d -i narration-uk-11.1.wav -af "asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st=$(( d - 0.05 )):d=0.05" uk/$n.wav
  printf "%s %.2f %s\n" $n $d "$(ffmpeg -i uk/$n.wav -af volumedetect -f null - 2>&1 | grep mean_volume | awk '{print $5}')"
done
