// Builds chapters.ffmeta and timestamps.txt from the caption steps the page computes (window.CUES; 10.3: video seconds)
import { chromium } from './plates/pw.mjs'; import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const p = await b.newPage();
await p.goto(pathToFileURL(path.resolve('build/index.html')).href); await p.waitForFunction(() => window.CUES);
const { CAP, T, END, DUR } = await p.evaluate(() => window.CUES); await b.close();
const ch = [[0, 'Introduction'], ...CAP.map(([t, n, s], i) => [i === 0 ? T.push + .75 : t, `${n}. ${s}`]), [END, 'Up next']];
let meta = ';FFMETADATA1\ntitle=Andri Academy 10.3 · Start from a ready example: overnight redline, new client intake\n';
ch.forEach(([t, s], i) => { const e = i < ch.length - 1 ? ch[i + 1][0] : DUR; meta += `\n[CHAPTER]\nTIMEBASE=1/1000\nSTART=${Math.round(t * 1000)}\nEND=${Math.round(e * 1000)}\ntitle=${s}\n`; });
fs.writeFileSync('chapters.ffmeta', meta);
const mmss = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
fs.writeFileSync('timestamps.txt', ch.map(([t, s]) => `${mmss(t)} ${s}`).join('\n') + '\n');
console.log(fs.readFileSync('timestamps.txt', 'utf8'));
