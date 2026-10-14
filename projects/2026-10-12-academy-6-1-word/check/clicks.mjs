// one close-up per click: renders the frame at each click time and crops 360x200 around the cursor tip
import { createRequire } from 'node:module'; import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/Users/bennettnittke/.local/node/lib/node_modules/@playwright/cli/node_modules/playwright')); }
const cues = JSON.parse(process.argv[2]); const out = process.argv[3]; mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const p = await b.newPage();
await p.goto(pathToFileURL(path.resolve('build/index.html')).href); await p.waitForFunction(() => window.MG);
for (const t of cues) {
  const r = await p.evaluate(async t => { await window.MG.renderFrame(t); const c = document.querySelector('canvas'); const [x, y] = window.__cur || [960, 540];
    const o = document.createElement('canvas'); o.width = 360; o.height = 200; o.getContext('2d').drawImage(c, x - 180, y - 100, 360, 200, 0, 0, 360, 200); return o.toDataURL('image/png').split(',')[1]; }, t);
  writeFileSync(path.join(out, `t${t}.png`), Buffer.from(r, 'base64'));
}
await b.close(); console.log('ok', cues.length);
