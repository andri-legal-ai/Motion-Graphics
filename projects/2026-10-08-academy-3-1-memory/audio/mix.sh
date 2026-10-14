#!/bin/zsh
# Mix: narration lines at their start times (app.js VO), clicks on every cursor press, soft whooshes on the title push and the panel opening.
cd "${0:A:h}"
VO=(N1 0.6 N2 7.6 N3 13.95 N4 18.7 N5 24.4 N6 29.75 N7 37.2 N8 45.9 N9 53.2 N10 56.5 N11 65.2)
CLICKS=(9.0 13.0 19.1 21.35 25.4 27.45 33.0 35.95 55.1 58.4)
WH=(7.25 33.05)
args=(); f=(); n=0
for ((i=1;i<=${#VO};i+=2)); do args+=(-i uk2/${VO[i]}.wav); ms=$(( ${VO[i+1]} * 1000 )); f+=("[$n]adelay=${ms%.*}|${ms%.*}[a$n]"); n=$((n+1)); done
for c in $CLICKS; do args+=(-i click.wav); ms=$(( c * 1000 - 20 )); f+=("[$n]volume=0.55,adelay=${ms%.*}|${ms%.*}[a$n]"); n=$((n+1)); done
for w in $WH; do args+=(-i whoosh.wav); ms=$(( w * 1000 - 150 )); f+=("[$n]volume=0.45,adelay=${ms%.*}|${ms%.*}[a$n]"); n=$((n+1)); done
ins=""; for ((k=0;k<n;k++)); do ins+="[a$k]"; done
ffmpeg -v error -y $args -filter_complex "${(j:;:)f};${ins}amix=inputs=$n:normalize=0,apad=whole_dur=72,atrim=0:72,loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 mix-uk2.wav
ffmpeg -i mix-uk2.wav -af loudnorm=print_format=summary -f null - 2>&1 | grep -E "Input Integrated|Input True Peak"
