#!/bin/zsh
# Mixes the 3.2 narration lines (uk/L*.wav) with clicks and whooshes on the video timeline, then loudnorm to -14 LUFS.
# Times match VO / CLICK_* in app.js. Usage: ./mix.sh <out.wav>
set -e
cd "${0:A:h}"
out="${1:-mix-uk.wav}"; DUR=60.6
typeset -A VO; VO=(L0 0.6 L1 5.6 L2 9.4 L3 14.0 L4 22.0 L5 31.9 L6 41.8 L7 49.7 L8 54.75)
SFX=("click.wav 7.9" "click.wav 11.0" "click.wav 17.9" "whoosh.wav 4.65" "whoosh.wav 22.45" "whoosh.wav 42.35")
args=(); f=""; n=0
for k in L0 L1 L2 L3 L4 L5 L6 L7 L8; do args+=(-i uk/$k.wav); f+="[$n]adelay=$(printf %.0f $(( ${VO[$k]} * 1000 )))|$(printf %.0f $(( ${VO[$k]} * 1000 )))[a$n];"; n=$((n+1)); done
for s in $SFX; do set -- ${=s}; args+=(-i $1); f+="[$n]aformat=sample_rates=48000:channel_layouts=stereo,adelay=$(printf %.0f $(( $2 * 1000 )))|$(printf %.0f $(( $2 * 1000 )))[a$n];"; n=$((n+1)); done
for i in $(seq 0 $((n-1))); do f+="[a$i]"; done
f+="amix=inputs=$n:normalize=0,apad,atrim=0:$DUR,loudnorm=I=-14:TP=-1.5:LRA=11[o]"
ffmpeg -v error -y $args -filter_complex "$f" -map "[o]" -ar 48000 "$out"
ffmpeg -i "$out" -af loudnorm=print_format=summary -f null - 2>&1 | grep -E "Input Integrated|Input True Peak"
