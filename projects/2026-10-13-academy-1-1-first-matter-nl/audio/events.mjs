// Writes audio/events.json from app.js's window.MIX (voice, clicks, whooshes and chapters in video seconds), so the mix and
// the chapters follow the animation's clocks exactly. Usage: node audio/events.mjs
import { createRequire } from 'node:module'; import { writeFileSync } from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/Users/bennettnittke/.local/node/lib/node_modules/@playwright/cli/node_modules/playwright')); }
const HERE = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const p = await b.newPage();
const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto(pathToFileURL(path.resolve(HERE, '../build/index.html')).href); await p.waitForFunction(() => window.MIX);
const mix = await p.evaluate(() => ({ ...window.MIX, marks: { E0: NEW(E0) + INTRO, E1: NEW(E1) + INTRO } }));
writeFileSync(path.join(HERE, 'events.json'), JSON.stringify(mix, null, 1)); console.log(JSON.stringify(mix));
if (errs.length) console.log('ERRORS', errs); await b.close();
