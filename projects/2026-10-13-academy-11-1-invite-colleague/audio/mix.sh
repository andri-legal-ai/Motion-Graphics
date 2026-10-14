#!/bin/zsh
# Mix for 8.1: narration lines at their start times (VO in app.js), a click on every cursor press, soft whooshes on the
# title push, the page pushes (Inbox, Company, Assignments). Cue times come from app.js (clicks.mjs), so picture and sound share one timeline.
cd "${0:A:h}"
CUES=$(node clicks.mjs)
DUR=$(echo $CUES | python3 -c "import json,sys;print(json.load(sys.stdin)['DUR'])")
VO=($(echo $CUES | python3 -c "import json,sys;d=json.load(sys.stdin);print(' '.join(f'{k} {v}' for k,v in d['VO'].items()))"))
CLICKS=($(echo $CUES | python3 -c "import json,sys;print(' '.join(map(str,json.load(sys.stdin)['CLICKS'])))"))
WH=($(echo $CUES | python3 -c "import json,sys;print(' '.join(map(str,json.load(sys.stdin)['WH'])))"))
args=(); f=(); n=0
for ((i=1;i<=${#VO};i+=2)); do args+=(-i uk/${VO[i]}.wav); ms=$(python3 -c "print(int(${VO[i+1]}*1000))"); f+=("[$n]adelay=${ms}|${ms}[a$n]"); n=$((n+1)); done
for c in $CLICKS; do args+=(-i click.wav); ms=$(python3 -c "print(max(0,int($c*1000-20)))"); f+=("[$n]volume=0.55,adelay=${ms}|${ms}[a$n]"); n=$((n+1)); done
for w in $WH; do args+=(-i whoosh.wav); ms=$(python3 -c "print(max(0,int($w*1000-150)))"); f+=("[$n]volume=0.45,adelay=${ms}|${ms}[a$n]"); n=$((n+1)); done
ins=""; for ((k=0;k<n;k++)); do ins+="[a$k]"; done
ffmpeg -v error -y $args -filter_complex "${(j:;:)f};${ins}amix=inputs=$n:normalize=0,apad=whole_dur=$DUR,atrim=0:$DUR,loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 mix-uk.wav
ffmpeg -i mix-uk.wav -af loudnorm=print_format=summary -f null - 2>&1 | grep -E "Input Integrated|Input True Peak"
# second pass: measured, linear, so the whole mix lands at -14 LUFS
M=$(ffmpeg -i mix-uk.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
J() { echo $M | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i mix-uk.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(J input_i):measured_TP=$(J input_tp):measured_LRA=$(J input_lra):measured_thresh=$(J input_thresh):offset=$(J target_offset):linear=true" -ar 48000 mix-uk-14.wav
ffmpeg -i mix-uk-14.wav -af loudnorm=print_format=summary -f null - 2>&1 | grep -E "Input Integrated|Input True Peak"
