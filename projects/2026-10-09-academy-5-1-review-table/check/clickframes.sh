#!/bin/zsh
# check/clickframes.sh <video> : one frame at every click (from app.js), tiled with the time on each
cd "${0:A:h}/.."
V=$1; OUT=check/clicks-$(basename $V .mp4); rm -rf $OUT; mkdir -p $OUT
for c in $(node audio/clicks.mjs | python3 -c "import json,sys;print(' '.join(map(str,json.load(sys.stdin)['CLICKS'])))"); do
  ffmpeg -v error -y -ss $c -i $V -frames:v 1 -vf "scale=640:-1,drawtext=fontfile=/System/Library/Fonts/Helvetica.ttc:text='$c':x=8:y=8:fontsize=26:fontcolor=red:box=1:boxcolor=white" $OUT/$(printf %06.2f $c).png 2>/dev/null
done
ffmpeg -v error -y -pattern_type glob -i "$OUT/*.png" -vf "tile=6x6:padding=4" -frames:v 1 $OUT.png 2>/dev/null; echo $OUT.png
