// prints the cue times as the page computes them (window.CUES), so the mix and the picture share one timeline
import { chromium } from '../plates/pw.mjs'; import path from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const p = await b.newPage();
await p.goto(pathToFileURL(path.resolve(here, '../build/index.html')).href); await p.waitForFunction(() => window.CUES);
const c = await p.evaluate(() => window.CUES); await b.close();
console.log(JSON.stringify({ VO: c.VO, CLICKS: c.CLICKS, WH: c.WH.map(x => +x.toFixed(2)), DUR: c.DUR }));
