#!/bin/zsh
# Mix: narration lines at their start times (app.js VO), clicks on every cursor press, soft whooshes on the title push, screen pushes and the BAILII tab.
cd "${0:A:h}"
VO=(L1 0.6 L2 7.6 L3 15.8 L4 21.9 L5 31.6 L6 38.2 L7 43.5 L8 50.4 L9a 59.3 L9b 62.55 L10 69.95)
CLICKS=(8.6 9.85 11.75 14.8 20.3 31.95 38.95 44.6 45.3 46.9 48.4 49.5 51.4 51.95 54.6 55.45 59.85 60.85 62.55)
WH=(6.5 9.95 39.0 49.75 60.0)
DUR=77.8
args=(); f=(); n=0
for ((i=1;i<=${#VO};i+=2)); do args+=(-i uk/${VO[i]}.wav); ms=$(( ${VO[i+1]} * 1000 )); f+=("[$n]adelay=${ms%.*}|${ms%.*}[a$n]"); n=$((n+1)); done
for c in $CLICKS; do args+=(-i click.wav); ms=$(( c * 1000 - 20 )); f+=("[$n]volume=0.55,adelay=${ms%.*}|${ms%.*}[a$n]"); n=$((n+1)); done
for w in $WH; do args+=(-i whoosh.wav); ms=$(( w * 1000 - 150 )); f+=("[$n]volume=0.45,adelay=${ms%.*}|${ms%.*}[a$n]"); n=$((n+1)); done
ins=""; for ((k=0;k<n;k++)); do ins+="[a$k]"; done
ffmpeg -v error -y $args -filter_complex "${(j:;:)f};${ins}amix=inputs=$n:normalize=0,apad=whole_dur=$DUR,atrim=0:$DUR,loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 mix-uk.wav
ffmpeg -i mix-uk.wav -af loudnorm=print_format=summary -f null - 2>&1 | grep -E "Input Integrated|Input True Peak"
