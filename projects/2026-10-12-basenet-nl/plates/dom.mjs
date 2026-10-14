// prints DOM facts from a local snapshot page at 1440 x 860: node dom.mjs <name> '<js expression>'
import { chromium } from './pw.mjs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)); const [n, js] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const pg = await b.newPage({ viewport: { width: 1440, height: 860 } });
await pg.goto(pathToFileURL(path.join(HERE, '../staging-snapshot/loc', n + '.html')).href); await pg.waitForTimeout(200);
console.log(JSON.stringify(await pg.evaluate(js), null, 0)); await b.close();
