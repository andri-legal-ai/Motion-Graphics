// Writes cues.json from app.js's window.MIX (voice, clicks, whooshes, chapters in video seconds), so the mix follows the picture.
import { chromium } from '../plates/pw.mjs'; import { writeFileSync } from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const p = await b.newPage();
await p.goto(pathToFileURL(path.resolve(HERE, '../build/index.html')).href); await p.waitForFunction(() => window.MIX);
const mix = await p.evaluate(() => window.MIX); writeFileSync(path.join(HERE, 'cues.json'), JSON.stringify(mix, null, 1)); console.log('cues', Object.keys(mix.VO).length, mix.CLICKS.length, mix.WH.length, mix.DUR); await b.close();
