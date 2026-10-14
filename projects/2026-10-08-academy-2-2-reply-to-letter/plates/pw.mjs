// Shared Playwright loader (same module the toolkit renderer uses).
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/Users/bennettnittke/.local/node/lib/node_modules/@playwright/cli/node_modules/playwright'); }
export const chromium = pw.chromium;
export const SRC = 'file:///Users/bennettnittke/Desktop/Andri/5%20-%20Marketing/Videos/Andri%20Learn%20Video%20Designs/video-1.1/build/s22.html';
