// Captures the BAILII page that "View case" opens for Ballerino v Racecourse Association (UKEAT 2024/98), 2x, top of page.
import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);
const { chromium } = require('/Users/bennettnittke/.local/node/lib/node_modules/@playwright/cli/node_modules/playwright');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1470, height: 835 }, deviceScaleFactor: 2 });
const r = await p.goto('https://www.bailii.org/uk/cases/UKEAT/2024/98.html', { waitUntil: 'load', timeout: 60000 });
console.log('status', r.status(), await p.title());
await p.screenshot({ path: 'plates/bailii.png' });
await b.close();
