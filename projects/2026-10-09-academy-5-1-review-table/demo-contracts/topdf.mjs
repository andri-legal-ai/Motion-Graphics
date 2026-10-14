import { chromium } from '../../2026-10-08-academy-3-1-memory/plates/pw.mjs';
import fs from 'node:fs';
const b = await chromium.launch(); const p = await b.newPage();
for (const f of fs.readdirSync('.').filter(f => f.endsWith('.html'))) {
  await p.goto('file://' + process.cwd() + '/' + f); await p.pdf({ path: f.replace('.html', '.pdf'), format: 'A4' });
}
await b.close();
