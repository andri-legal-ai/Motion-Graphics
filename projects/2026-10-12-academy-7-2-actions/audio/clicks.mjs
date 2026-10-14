// prints the narration starts, clicks and whooshes from app.js, so the mix and the picture share one timeline
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const VO = eval('(' + src.match(/const VO = (\{.*?\});/)[1] + ')');
const T = eval('(' + src.match(/const T = (\{[\s\S]*?\n\});/)[1] + ')');
const CL = eval(src.match(/const CLICKS = (\[[\s\S]*?\]);/)[1]);
const DUR = +src.match(/DURATION = ([\d.]+)/)[1];
console.log(JSON.stringify({ VO, CLICKS: CL, WH: [T.push, T.toActions, T.toKB, T.toChat, T.toWF], DUR }));
