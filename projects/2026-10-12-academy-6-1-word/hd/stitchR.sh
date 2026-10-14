#!/bin/zsh
# Like stitch.sh, for steps where only the right half (the Andri pane) changed: the two newest tiles are the right
# quadrants (759,0)-(1518,392) then (759,392)-(1518,784); the left half is taken from caps2x/<base>.png.
# Usage: stitchR.sh <name> <base>
S=/var/folders/0k/mgcp_wgs33g0tcjpwrlm0sn80000gn/T/claude-chrome-screenshots-8iNOWp
D=${0:A:h}/caps2x
f=($(ls -t $S/*.png | head -2 | tail -r))
for x in $f; do s=$(ffprobe -v error -show_entries stream=width,height -of csv=p=0 $x); [[ $s == 1518,784 ]] || { echo "bad tile $x $s"; exit 1; }; done
ffmpeg -v error -y -i $D/$2.png -i $f[1] -i $f[2] -filter_complex "[0][1]overlay=1518:0[a];[a][2]overlay=1518:784" -frames:v 1 $D/$1.png && echo "$1 ok (left from $2)"
