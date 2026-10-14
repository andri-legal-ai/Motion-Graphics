#!/bin/zsh
# Stitches the four 2x zoom tiles of one Word screen (viewport 1518 x 784 CSS px, DPR 2) into one 3036 x 1568 PNG.
# Tiles: (0,0)-(759,392), (759,0)-(1518,392), (0,392)-(759,784), (759,392)-(1518,784), each 1518 x 784 px.
# Usage: stitch.sh <name>   (takes the four newest screenshots from the Chrome screenshot folder, oldest first)
S=/var/folders/0k/mgcp_wgs33g0tcjpwrlm0sn80000gn/T/claude-chrome-screenshots-8iNOWp
D=${0:A:h}/caps2x
mkdir -p $D
f=($(ls -t $S/*.png | head -4 | tail -r))
for x in $f; do s=$(ffprobe -v error -show_entries stream=width,height -of csv=p=0 $x); [[ $s == 1518,784 ]] || { echo "bad tile $x $s"; exit 1; }; done
ffmpeg -v error -y -i $f[1] -i $f[2] -i $f[3] -i $f[4] -filter_complex \
 "color=c=white:s=3036x1568[b];[b][0]overlay=0:0[a];[a][1]overlay=1518:0[c];[c][2]overlay=0:784[d];[d][3]overlay=1518:784" \
 -frames:v 1 $D/$1.png && echo "$1 ok"
