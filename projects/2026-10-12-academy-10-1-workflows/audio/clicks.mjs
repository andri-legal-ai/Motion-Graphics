// prints the narration, click and whoosh times from app.js so the mix and the picture share one timeline
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const T = eval('(' + src.match(/const T = (\{[\s\S]*?\n\});/)[1] + ')');
const VO = eval('(' + src.match(/const VO = (\{.*?\});/)[1] + ')');
const CLICKS = eval(src.match(/const CLICKS = (\[[\s\S]*?\]);/)[1]);
const DUR = +src.match(/const DURATION = ([\d.]+)/)[1];
console.log(JSON.stringify({ VO, CLICKS, WH: [T.push, T.emailClick + .05, T.kbClick + .05, T.inbox + .05], DUR }));
