// quick look: renders local snapshot pages at 1440 x 860 (1x) to PNGs. Usage: node probe.mjs <outdir> name...
import { chromium } from './pw.mjs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)); const [out, ...names] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const pg = await b.newPage({ viewport: { width: 1440, height: 860 } });
for (const n of names) { await pg.goto(pathToFileURL(path.join(HERE, '../staging-snapshot/loc', n + '.html')).href); await pg.waitForTimeout(300); await pg.screenshot({ path: path.join(out, n + '.png') }); }
await b.close(); console.log('ok');
