// Renders single frames of build/index.html at the given times (seconds) to storyboard/*.png.
// Usage: node stills.mjs 3.2 10 18.5 ...   (or no args: one frame per beat)
import { chromium } from './plates/pw.mjs';
import { mkdirSync } from 'node:fs';
import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)); const OUT = path.join(HERE, 'storyboard'); mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
pg.on('pageerror', e => console.log('PAGE ERROR', e.message));
await pg.goto(pathToFileURL(path.join(HERE, 'build/index.html')).href);
await pg.waitForFunction(() => window.MG);
const times = process.argv.slice(2).map(Number);
for (const t of times) {
  const data = await pg.evaluate(async t => { await window.MG.renderFrame(t); return document.querySelector('canvas').toDataURL('image/png'); }, t);
  const f = path.join(OUT, `t${t.toFixed(2).padStart(6, '0')}.png`);
  (await import('node:fs')).writeFileSync(f, Buffer.from(data.split(',')[1], 'base64'));
}
console.log('duration', await pg.evaluate(() => window.MG.duration));
await b.close();
