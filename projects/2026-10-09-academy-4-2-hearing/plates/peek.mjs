// Screenshots rebuild states for checking against staging: node peek.mjs name "js" [name "js" ...]
import { chromium, SRC } from './pw.mjs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { mkdirSync } from 'node:fs';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'stills', 'peek'); mkdirSync(OUT, { recursive: true });
const a = process.argv.slice(2);
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 860 }, deviceScaleFactor: 1 });
pg.on('pageerror', e => console.log('ERR', String(e)));
for (let i = 0; i < a.length; i += 2) {
  await pg.goto(SRC); await pg.waitForFunction(() => window.READY === true);
  await pg.evaluate(js => { const S = window.STATE; S.base(); eval(js); }, a[i + 1]);
  await pg.waitForTimeout(150);
  await pg.screenshot({ path: path.join(OUT, a[i] + '.png'), clip: { x: 0, y: 0, width: 1440, height: 860 } });
}
await b.close(); console.log('ok');
