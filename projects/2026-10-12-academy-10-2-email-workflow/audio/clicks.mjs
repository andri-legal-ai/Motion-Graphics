// prints the cue times from app.js so the mix and the picture share one timeline (10.2: no time warp, video seconds)
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const T = eval('(' + src.match(/const T = (\{[\s\S]*?\n\});/)[1] + ')');
const VO = eval('(' + src.match(/const VO = (\{[\s\S]*?\});/)[1] + ')');
const CL = eval(src.match(/const CLICKS = (\[[\s\S]*?\]);/)[1]);
const DR = [T.pan1, T.raDrag, T.raJoin, T.cdDrag, T.cdJoin, T.pan2, T.paDrag, T.paJoin, T.seDrag, T.seJoin].map(d => d[0] - .06);
const DUR = +src.match(/DURATION = ([\d.]+)/)[1];
console.log(JSON.stringify({ VO, CLICKS: [...CL, ...DR].map(x => +x.toFixed(2)), WH: [T.push, T.wfItem, T.newWf, T.matters, T.wfIcon], DUR }));
