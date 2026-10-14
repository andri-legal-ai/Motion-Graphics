// Builds audio/mix-uk.wav on the video's own timeline: narration lines at VO times, a click on every cursor press,
// a soft whoosh on every screen change, then loudness-normalised to -14 LUFS (as 1.1 and 1.2).
import { chromium } from './plates/pw.mjs';
import { execFileSync } from 'node:child_process';
import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const pg = await b.newPage();
await pg.goto(pathToFileURL(path.join(HERE, 'build/index.html')).href); await pg.waitForFunction(() => window.MG);
const T = await pg.evaluate(() => ({ VO, CLK, A, B, Hd, J, K, DUR: DURATION }));
await b.close();
const ins = [], fl = [];
const add = (file, at, vol) => { const i = ins.length; ins.push('-i', file); fl.push(`[${i / 2}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${vol},adelay=${Math.round(at * 1000)}|${Math.round(at * 1000)}[a${i / 2}]`); };
for (const k of ['L1', 'L2', 'L3', 'L4', 'L5', 'L5b', 'L6', 'L7', 'L8', 'L9', 'L10']) add(`audio/uk/${k}.wav`, T.VO[k], 1.0);
for (const c of Object.values(T.CLK)) add('audio/click.wav', c - 0.01, 0.55);
for (const w of [6.3, T.B - 0.55, T.Hd + 0.75, T.CLK.jobs + 0.1, T.K - 0.9]) add('audio/whoosh.wav', w, 0.35);
const n = ins.length / 2;
const filter = fl.join(';') + ';' + Array.from({ length: n }, (_, i) => `[a${i}]`).join('') + `amix=inputs=${n}:normalize=0,apad=whole_dur=${T.DUR.toFixed(2)},atrim=0:${T.DUR.toFixed(2)},loudnorm=I=-14:TP=-1.5:LRA=11[out]`;
execFileSync('ffmpeg', ['-y', '-v', 'error', ...ins, '-filter_complex', filter, '-map', '[out]', '-ar', '48000', 'audio/mix-uk.wav'], { cwd: HERE, stdio: 'inherit' });
console.log('mix', T.DUR.toFixed(2), 's, clicks', Object.keys(T.CLK).length);
