import { chromium } from '../plates/pw.mjs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const p = await b.newPage(); const SRC = pathToFileURL(path.resolve('assets/Andri-Logo-Ink.svg')).href;
await p.goto(pathToFileURL(path.resolve('build/index.html')).href);
const r = await p.evaluate(async (src) => { const img = new Image(); img.src = src; await img.decode(); const c = document.createElement('canvas'); c.width = 2299; c.height = 600; const g = c.getContext('2d'); g.drawImage(img, 0, 0, 2299, 600);
  const d = g.getImageData(0, 0, 2299, 600).data; const cols = []; for (let x = 0; x < 2299; x++) { let on = false; for (let y = 0; y < 600; y += 2) if (d[(y * 2299 + x) * 4 + 3] > 10) { on = true; break; } cols.push(on); }
  const runs = []; let s = -1; cols.forEach((o, x) => { if (o && s < 0) s = x; if (!o && s >= 0) { runs.push([s, x - 1]); s = -1; } }); if (s >= 0) runs.push([s, 2298]); return runs; }, SRC);
console.log(JSON.stringify(r)); await b.close();
