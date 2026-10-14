// Builds chapters.ffmeta and timestamps.txt from the caption steps in app.js
import fs from 'node:fs';
const src = fs.readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const VO = eval('(' + src.match(/const VO = (\{[\s\S]*?\});/)[1] + ')');
const CUTS = eval(src.match(/const CUTS = (\[.*?\]);/)[1]);
const videoT = eval(src.match(/const videoT = (L => .*?);\n/)[1]);
const T = eval('(' + src.match(/const T = (\{[\s\S]*?\n\});/)[1] + ')');
const END = videoT(+src.match(/const END = ([\d.]+);/)[1]), DUR = videoT(+src.match(/LDUR = ([\d.]+)/)[1]);
const CAP = eval(src.match(/const CAP = (\[[\s\S]*?\]);/)[1]);
const ch = [[0, 'Introduction'], ...CAP.map(([t, n, s], i) => [videoT(i === 0 ? T.push + .75 : t), `${n}. ${s}`]), [END, 'Up next']];
let meta = ';FFMETADATA1\ntitle=Andri Academy 6.1 · Your draft and their contract, finished in Word\n';
ch.forEach(([t, s], i) => { const e = i < ch.length - 1 ? ch[i + 1][0] : DUR; meta += `\n[CHAPTER]\nTIMEBASE=1/1000\nSTART=${Math.round(t * 1000)}\nEND=${Math.round(e * 1000)}\ntitle=${s}\n`; });
fs.writeFileSync(new URL('./chapters.ffmeta', import.meta.url), meta);
const mmss = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
fs.writeFileSync(new URL('./timestamps.txt', import.meta.url), ch.map(([t, s]) => `${mmss(t)} ${s}`).join('\n') + '\n');
console.log(fs.readFileSync(new URL('./timestamps.txt', import.meta.url), 'utf8'));
