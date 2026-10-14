#!/bin/zsh
# sheet.sh <dir> <out.png> [cols]: tiles the t*.png stills in time order, each labelled with its time
d=$1; out=$2; cols=${3:-5}; tmp=$(mktemp -d)
i=0; for f in $(ls $d/t*.png | sed 's#.*/t##; s#\.png##' | sort -g); do
  ffmpeg -v error -y -i $d/t$f.png -vf "scale=640:-1,drawtext=fontfile=/System/Library/Fonts/Helvetica.ttc:text='$f s':x=10:y=10:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6" $tmp/$(printf %03d $i).png; i=$((i+1)); done
rows=$(( (i + cols - 1) / cols ))
ffmpeg -v error -y -framerate 1 -i $tmp/%03d.png -vf "tile=${cols}x${rows}:padding=4:color=#333333" -frames:v 1 -update 1 $out
rm -rf $tmp; echo "$out ($i stills)"
