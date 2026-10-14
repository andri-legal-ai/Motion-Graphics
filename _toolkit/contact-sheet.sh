#!/bin/zsh
# Pulls a contact sheet (grid of frames) from a rendered video so it can be reviewed in one image.
# Usage: contact-sheet.sh <video.mp4> [frames-per-second-to-sample=2] [columns=6]
set -e
v="$1"; rate="${2:-2}"; cols="${3:-6}"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$v")
n=$(printf "%.0f" $(( dur * rate )))
rows=$(( (n + cols - 1) / cols ))
out="${v%.*}-contact.png"
ffmpeg -y -v error -i "$v" -vf "fps=${rate},scale=480:-1,drawtext=fontfile=/System/Library/Fonts/Helvetica.ttc:text='%{pts\:hms}':x=8:y=8:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.5,tile=${cols}x${rows}:padding=6:margin=6" -frames:v 1 "$out"
echo "$out"
