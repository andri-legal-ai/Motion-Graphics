// Renders single frames to PNG for review: node stills.mjs <draftA|draftB> <out-dir> t1 t2 ...
import { createRequire } from 'node:module'; import { writeFileSync, mkdirSync } from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/Users/bennettnittke/.local/node/lib/node_modules/@playwright/cli/node_modules/playwright')); }
const [dir, out, ...ts] = process.argv.slice(2); mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const p = await b.newPage();
const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(pathToFileURL(path.resolve(dir, 'index.html')).href); await p.waitForFunction(() => window.MG);
for (const t of ts) { const d = await p.evaluate(async t => { await window.MG.renderFrame(t); return document.querySelector('canvas').toDataURL('image/png').split(',')[1]; }, Number(t)); writeFileSync(path.join(out, `t${t}.png`), Buffer.from(d, 'base64')); }
if (errs.length) console.log('ERRORS', errs.slice(0, 5)); await b.close(); console.log('ok');
