// node tools-r.mjs plate regex : print matching rect keys
import fs from 'node:fs'; const R = JSON.parse(fs.readFileSync('plates/rects.json'));
const [pl, re] = process.argv.slice(2); const o = R[pl]; const rx = new RegExp(re, 'i');
for (const [k, v] of Object.entries(o)) if (rx.test(k)) console.log(pl, JSON.stringify(k), JSON.stringify(v));
