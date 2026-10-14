// node tools-t.mjs : prints the timeline (T, VO, END, DURATION) as the page computes it
import { chromium } from './plates/pw.mjs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const p = await b.newPage();
const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errs.push(m.text()); });
await p.goto(pathToFileURL(path.resolve('build/index.html')).href); await p.waitForFunction(() => window.MG);
const c = await p.evaluate(() => window.CUES);
console.log(JSON.stringify({ VO: c.VO, T: Object.fromEntries(Object.entries(c.T).map(([k, v]) => [k, +v.toFixed(2)])), END: +c.END.toFixed(2), DUR: c.DUR }));
if (errs.length) console.log('MSG', [...new Set(errs)].slice(0, 20));
await b.close();
