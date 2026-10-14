#!/bin/zsh
# Mixes the 4.2 narration lines (uk/L*.wav) with clicks and whooshes on the video timeline, then loudnorm to -14 LUFS.
# Times match VO / T / CLICKS in app.js. Usage: ./mix.sh <out.wav>
set -e
cd "${0:A:h}"
out="${1:-mix-uk.wav}"; DUR=105.6
VO=(0.6 9.0 13.6 22.2 28.0 34.6 43.2 47.2 57.4 66.0 69.8 78.2 87.2 94.2 99.6)
CLK=(12.25 25.0 28.6 30.05 36.6 37.9 39.6 40.3 42.6 46.0 59.3 63.0 64.6 71.6 79.3 88.5 95.6 96.8)
WH=(7.9 71.65)
args=(); f=""; n=0
for i in $(seq 0 14); do ms=$(printf %.0f $(( ${VO[$((i+1))]} * 1000 ))); args+=(-i uk/L$i.wav); f+="[$n]adelay=${ms}|${ms}[a$n];"; n=$((n+1)); done
for t in $CLK; do ms=$(printf %.0f $(( t * 1000 ))); args+=(-i click.wav); f+="[$n]aformat=sample_rates=48000:channel_layouts=stereo,adelay=${ms}|${ms}[a$n];"; n=$((n+1)); done
for t in $WH; do ms=$(printf %.0f $(( t * 1000 ))); args+=(-i whoosh.wav); f+="[$n]aformat=sample_rates=48000:channel_layouts=stereo,adelay=${ms}|${ms}[a$n];"; n=$((n+1)); done
for i in $(seq 0 $((n-1))); do f+="[a$i]"; done
f+="amix=inputs=$n:normalize=0,apad,atrim=0:$DUR,loudnorm=I=-14:TP=-1.5:LRA=11[o]"
ffmpeg -v error -y $args -filter_complex "$f" -map "[o]" -ar 48000 "$out"
ffmpeg -i "$out" -af loudnorm=print_format=summary -f null - 2>&1 | grep -E "Input Integrated|Input True Peak"
