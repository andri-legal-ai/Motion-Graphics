// Shared Playwright loader (same fallback as the 1.2 stills.mjs)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/Users/bennettnittke/.local/node/lib/node_modules/@playwright/cli/node_modules/playwright')); }
export { chromium };
export const SRC = 'file:///Users/bennettnittke/Desktop/Andri/5%20-%20Marketing/Videos/Andri%20Learn%20Video%20Designs/video-1.1/build/s42.html';
