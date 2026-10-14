// Renders frame pairs 0.01 s either side of each handover time (video seconds) and reports the changed pixels and their bounding box.
import { createRequire } from 'node:module'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/Users/bennettnittke/.local/node/lib/node_modules/@playwright/cli/node_modules/playwright')); }
const ts = process.argv.slice(2).map(Number);
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const p = await b.newPage();
await p.goto(pathToFileURL(path.resolve('build/index.html')).href); await p.waitForFunction(() => window.MG);
for (const t of ts) {
  const r = await p.evaluate(async t => {
    const c = document.querySelector('canvas'), g = c.getContext('2d');
    await MG.renderFrame(t - .01); const a = g.getImageData(0, 0, c.width, c.height).data;
    await MG.renderFrame(t + .01); const d = g.getImageData(0, 0, c.width, c.height).data;
    let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let i = 0; i < a.length; i += 4) { const v = Math.abs(a[i] - d[i]) + Math.abs(a[i + 1] - d[i + 1]) + Math.abs(a[i + 2] - d[i + 2]); if (v > 30) { n++; const px = (i / 4) % c.width, py = Math.floor(i / 4 / c.width); if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; } }
    return `${t}: ${n} px` + (n ? ` in [${x0},${y0} – ${x1},${y1}]` : '');
  }, t);
  console.log(r);
}
await b.close();
