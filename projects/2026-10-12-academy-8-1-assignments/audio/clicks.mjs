// prints the click times from app.js so the mix and the picture share one timeline
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const CUTS = eval(src.match(/const CUTS = (\[.*?\]);/)[1]);
const videoT = eval(src.match(/const videoT = (L => .*?);\n/)[1]);
const T = eval('(' + src.match(/const T = (\{[\s\S]*?\n\});/)[1] + ')');
const VO = eval('(' + src.match(/const VO = (\{.*?\});/)[1] + ')');
const CL = eval(src.match(/const CLICKS = (\[[\s\S]*?\]);/)[1]);
const V = Object.fromEntries(Object.entries(VO).map(([k, x]) => [k, +videoT(x).toFixed(2)]));
const LD = +src.match(/LDUR = ([\d.]+)/)[1];
console.log(JSON.stringify({ VO: V, CLICKS: CL.map(x => +videoT(x).toFixed(2)), WH: [T.push, T.inbox, T.firm, T.assign].map(x => +videoT(x).toFixed(2)), DUR: +videoT(LD).toFixed(2) }));
