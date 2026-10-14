// Turns the raw Chrome captures (caps/*.jpg, real Word on the web + the real staging Andri add-in) into clean plates (plates/*.png):
// - removes the mouse pointer the screenshot baked in (copied from a capture of the same state without it, or filled from
//   its neighbours on flat areas), so only the drawn cursor shows
// - swaps staging traces for the demo firm: the test matter "Academy 6.1" reads "Nair v Calderdale Logistics", "Bennet law"
//   reads "Aldridge Vine", the Microsoft avatar "BN" reads "AF"; the case list keeps only the real Nair row
// Run: node plates/prep.mjs
import { createRequire } from 'node:module'; import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/Users/bennettnittke/.local/node/lib/node_modules/@playwright/cli/node_modules/playwright')); }
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAPS = fs.readdirSync(path.join(ROOT, 'caps')).filter(f => f.endsWith('.jpg')).map(f => f.slice(0, -4));

// ops per plate. cur: pointer tip [x, y] + how to clean it ('fill' = from neighbours, or a source plate [+dx, dy])
const NAIR = 'Nair v Calderdale Logistics';
const OPS = {
  'a14-caselist': [['cur', 64, 55, 'a15-matter-drafts-empty'], ['caselist']],
  'a15-matter-drafts-empty': [['cur', 1183, 307, 'fill'], ['crumb']],
  'a16-casefiles': [['cur', 1318, 207, 'undim:a17-open-dialog'], ['crumb']],
  'a17-open-dialog': [['cur', 1320, 347, 'a40-open-settlement'], ['crumbDim']],
  'a19-opening-letter': [['cur', 1319, 527, 'fill']],
  'a20-letter-ready': [['cur', 1319, 527, 'fill']],
  'a21-date-selected': [['cur', 355, 297, 'keep']],
  'a22-date-typed': [['rect', 'a23-para2-selected', 350, 284, 22, 40]],
  'a23-para2-selected': [['rect', 'a24-request-typed', 492, 548, 26, 46]],
  'a24-request-typed-k': [],
  'a32-review-edits-k': [],
  'a45-clause5-typed-k': [],
  'b68-allow-k': [['rect', 'a14-caselist', 75, 6, 140, 26], ['rect', 'a14-caselist', 0, 64, 1518, 36]],
  'a24-request-typed': [['cur', 1300, 678, 'fill']],
  'a25-thinking': [['cur', 1479, 712, 'keep']],
  'a26-steps': [['cur', 1479, 712, 'keep']],
  'a27-reply-card': [['cur', 1479, 712, 'a30-card']],
  'a30-card': [['cur', 1318, 357, 'fillS']],
  'a32-review-edits': [['cur', 1316, 520, 'fillS']],
  'a34-kept-tracked': [['cur', 1419, 650, 'fill']],
  'a35-reviewed-redline': [['cur', 1000, 407, 'fill']],
  'a36-saving': [['cur', 1401, 175, 'keep']],
  'a37-saved': [['cur', 1401, 175, 'a35-reviewed-redline']],
  'a38-web-drafts-word': [['cur', 335, 153, 'keep'], ['web']],
  'a38-web-drafts-word-k': [['web']],
  'a39-pane-drafts': [['rect', 'a15-matter-drafts-empty', 1140, 160, 26, 36], ['crumb']],
  'a40-open-settlement': [['cur', 1307, 310, 'a17-open-dialog'], ['crumbDim']],
  'a41-settlement-open': [['cur', 64, 55, 'a42-settlement-scrolled']],
  'a42-settlement-scrolled': [['cur', 553, 507, 'a41-settlement-open', 0, 237]],
  'a44-clause5-selected': [['rect', 'a45-clause5-typed', 495, 515, 22, 40]],
  'a45-clause5-typed': [['cur', 1300, 678, 'fillS']],
  'a46-thinking2': [['cur', 1479, 712, 'keep']],
  'a47-steps2': [['cur', 1479, 712, 'keep']],
  'a48-reply2-card': [['cur', 1479, 712, 'a55-reviewed2']],
  'a49-reply2-top': [['cur', 1318, 357, 'fillS']],
  'a53-review2': [['cur', 1316, 570, 'fill']],
  'a54-kept2': [['cur', 1419, 453, 'fill']],
  'a55-reviewed2': [['cur', 1000, 407, 'fill']],
  'a56-drafts2': [['rect', 'a15-matter-drafts-empty', 1140, 160, 26, 36], ['crumb']],
  'b58-blank-doc': [['cur', 225, 157, 'fill'], ['rect', 'a14-caselist', 75, 6, 140, 26]],
  'b59-addins-panel': [['cur', 1210, 89, 'b60-addins-search'], ['rect', 'a14-caselist', 75, 6, 140, 26]],
  'b60-addins-search': [['cur', 1345, 131, 'b59-addins-panel'], ['rect', 'a14-caselist', 75, 6, 140, 26]],
  'b62-store-home': [['cur', 1421, 467, 'fill']],
  'b64-store-search': [['cur', 135, 78, 'fillS']],
  'b65-store-listing': [['cur', 450, 124, 'undim:b64-store-search'], ['copy', 'b65-store-listing', 455, 175, 26, 50, 455, 105]],   // the dialog's straight left edge, from just below
  'b67-welcome': [['cur', 1250, 215, 'fill'], ['rect', 'a14-caselist', 75, 6, 140, 26], ['rect', 'a14-caselist', 0, 64, 1518, 36]],
  'b68-allow': [['cur', 1318, 727, 'fillS'], ['rect', 'a14-caselist', 75, 6, 140, 26], ['rect', 'a14-caselist', 0, 64, 1518, 36]],
};

const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const p = await b.newPage();
p.on('console', m => console.log('page:', m.text())); p.on('pageerror', e => console.log('ERR', String(e)));
await p.goto(pathToFileURL(path.join(ROOT, 'plates', 'prep.html')).href);
const out = await p.evaluate(async ({ CAPS, OPS, NAIR }) => {
  const IMG = {};
  const load = n => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(IMG[n] = i); i.onerror = () => rej(n); i.src = `../caps/${n}.jpg`; });
  await Promise.all(CAPS.map(load));
  for (const [fam, file, w] of [['Rethink', 'RethinkSans', '400 800'], ['Neco', 'Neco-500', '500']]) { const f = new FontFace(fam, `url(../assets/fonts/${file}.woff2)`, { weight: w }); document.fonts.add(await f.load()); }
  // the pointer: the macOS arrow with its white rim, as a mask around the tip (dilated 2 px)
  const ARROW = [[0, -0.5], [0, 13.5], [3, 10.8], [5.6, 16.5], [8.2, 15.4], [6, 10], [10.8, 10]];   // measured on a capture
  const maskCv = document.createElement('canvas'); maskCv.width = 28; maskCv.height = 38; const mg = maskCv.getContext('2d');
  mg.translate(5, 5); mg.beginPath(); ARROW.forEach(([x, y], i) => i ? mg.lineTo(x, y) : mg.moveTo(x, y)); mg.closePath();
  mg.fillStyle = '#000'; mg.fill(); mg.lineWidth = 9; mg.lineJoin = 'round'; mg.strokeStyle = '#000'; mg.stroke();
  const m2 = document.createElement('canvas'); m2.width = 28; m2.height = 38; const g2 = m2.getContext('2d');
  g2.translate(5, 5); g2.beginPath(); ARROW.forEach(([x, y], i) => i ? g2.lineTo(x, y) : g2.moveTo(x, y)); g2.closePath();
  g2.fillStyle = '#000'; g2.fill(); g2.lineWidth = 4.5; g2.lineJoin = 'round'; g2.strokeStyle = '#000'; g2.stroke();
  const M2 = g2.getImageData(0, 0, 28, 38).data; const inMask2 = (x, y) => M2[(y * 28 + x) * 4 + 3] > 20;
  const M = mg.getImageData(0, 0, 28, 38).data; const inMask = (x, y) => M[(y * 28 + x) * 4 + 3] > 20;
  const res = {};
  for (const name of CAPS) {
    const im = IMG[name], cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
    const g = cv.getContext('2d'); g.drawImage(im, 0, 0);
    const pix = (x, y) => g.getImageData(x, y, 1, 1).data;
    const rgb = d => `rgb(${d[0]},${d[1]},${d[2]})`;
    const fillRect = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const text = (s, x, y, f, col) => { g.font = f; g.fillStyle = col; g.textBaseline = 'middle'; g.fillText(s, x, y); return g.measureText(s).width; };
    for (const op of OPS[name] || []) {
      if (op[0] === 'cur') {
        const [, tx, ty, how, dx = 0, dy = 0] = op; if (how === 'keep') continue;
        const ox = tx - 5, oy = ty - 12;   // the arrow's tip is drawn 7 px above the click point
        if (how === 'fillS') {   // over text: tight mask, blend the pixels right next to the pointer (smears less text)
          const W = 32, d = g.getImageData(ox - 2, oy, W, 38);
          for (let y = 0; y < 38; y++) {
            let xa = -1, xb = -1; for (let x = 0; x < 28; x++) if (inMask2(x, y)) { if (xa < 0) xa = x; xb = x; }
            if (xa < 0) continue;
            const L = (y * W + xa + 1) * 4, R = (y * W + xb + 3) * 4;
            for (let x = xa; x <= xb; x++) { const k = (x - xa + 1) / (xb - xa + 2), i = (y * W + x + 2) * 4; for (let c = 0; c < 3; c++) d.data[i + c] = d.data[L + c] * (1 - k) + d.data[R + c] * k; }
          }
          g.putImageData(d, ox - 2, oy);
        } else if (how === 'fill') {   // row by row, blend pixels 5 px clear of the pointer on each side (past the JPEG halo)
          const P = 8, W = 28 + 2 * P, d = g.getImageData(ox - P, oy, W, 38);
          for (let y = 0; y < 38; y++) {
            let xa = -1, xb = -1; for (let x = 0; x < 28; x++) if (inMask(x, y)) { if (xa < 0) xa = x; xb = x; }
            if (xa < 0) continue;
            const a = Math.max(0, xa - 5), b = Math.min(27 + 2 * P, xb + 2 * P - 3), L = (y * W + a) * 4, R = (y * W + b) * 4;
            for (let x = a + 1; x < b; x++) { const k = (x - a) / (b - a), i = (y * W + x) * 4; for (let c = 0; c < 3; c++) d.data[i + c] = d.data[L + c] * (1 - k) + d.data[R + c] * k; }
          }
          g.putImageData(d, ox - P, oy);
        } else if (how.startsWith('undim:')) {   // the same area under a dim overlay: estimate the overlay from flat white, then invert it
          const s = IMG[how.slice(6)], sc = document.createElement('canvas'); sc.width = s.width; sc.height = s.height; const sg = sc.getContext('2d'); sg.drawImage(s, 0, 0);
          const k = sg.getImageData(1490, 600, 1, 1).data[0] / g.getImageData(1490, 600, 1, 1).data[0];   // overlay = multiply by k
          const sd = sg.getImageData(ox, oy, 28, 38), d = g.getImageData(ox, oy, 28, 38);
          for (let y = 0; y < 38; y++) for (let x = 0; x < 28; x++) if (inMask(x, y)) { const i = (y * 28 + x) * 4; for (let c = 0; c < 3; c++) d.data[i + c] = Math.min(255, sd.data[i + c] / k); }
          g.putImageData(d, ox, oy);
        } else {   // copy from another capture of the same state
          const s = IMG[how], sc = document.createElement('canvas'); sc.width = s.width; sc.height = s.height; const sg = sc.getContext('2d'); sg.drawImage(s, 0, 0);
          const sd = sg.getImageData(ox + dx, oy + dy, 28, 38), d = g.getImageData(ox, oy, 28, 38);
          for (let y = 0; y < 38; y++) for (let x = 0; x < 28; x++) if (inMask(x, y)) { const i = (y * 28 + x) * 4; for (let c = 0; c < 3; c++) d.data[i + c] = sd.data[i + c]; }
          g.putImageData(d, ox, oy);
        }
      }
      if (op[0] === 'copy') { const [, src, sx, sy, w, h, dx, dy] = op; g.drawImage(IMG[src], sx, sy, w, h, dx, dy, w, h); }
      if (op[0] === 'rect') { const [, src, x, y, w, h] = op; g.drawImage(IMG[src], x, y, w, h, x, y, w, h); }
      if (op[0] === 'crumb' || op[0] === 'crumbDim') {   // "Cases / Academy 6.1 [UK]" -> "Cases / Nair v Calderdale Logistics [UK]"
        const dim = op[0] === 'crumbDim';
        const badge = g.getImageData(1271, 159, 24, 19);
        const strip = g.getImageData(1440, 156, 1, 24);   // clean header background between the badge and the settings icon
        for (let x = 1202; x < 1440; x++) g.putImageData(strip, x, 156);
        const tw = text(NAIR, 1205, 168.5, '600 12.5px Rethink', dim ? '#1C1814' : '#231E19');
        g.putImageData(badge, Math.round(1205 + tw + 6), 159);
      }
      if (op[0] === 'caselist') {   // keep the real Nair row only, at the top of the list; drop the count above it
        const bg = rgb(pix(1320, 720));
        const row = g.getImageData(1140, 323, 360, 38), bottom = g.getImageData(1136, 655, 368, 12);
        fillRect(1138, 224, 80, 16, rgb(pix(1220, 232)));
        g.putImageData(row, 1140, 249);
        fillRect(1131, 287, 380, 400, bg);
        g.putImageData(bottom, 1136, 283);
      }
      if (op[0] === 'web') {   // staging web Drafts page: matter name in the breadcrumb and the header, firm chip
        const chev = g.getImageData(218, 76, 12, 15), drafts = g.getImageData(234, 73, 40, 20), divider = g.getImageData(285, 64, 3, 40);
        const strip = g.getImageData(760, 60, 1, 50); for (let x = 132; x < 760; x++) g.putImageData(strip, x, 60);
        const w1 = text(NAIR, 141, 83.5, '400 12.5px Rethink', '#5F5953');
        let x = Math.round(141 + w1 + 9); g.putImageData(chev, x, 76); x += 16; g.putImageData(drafts, x, 73); x += 40 + 13;
        g.putImageData(divider, x, 64); x += 13;
        text(NAIR, x, 77.5, '500 19px Neco', '#231E19');
        text('United Kingdom', x, 95, '400 11px Rethink', '#5F5953');
        // firm chip: "Bennet law" -> "Aldridge Vine"; the chip is right-aligned, so it grows to the left and pushes the icon before it
        const D = 27, left = g.getImageData(1150, 8, 109, 40), capL = g.getImageData(1259, 8, 9, 40), mid = g.getImageData(1283, 8, 1, 40),
          capR = g.getImageData(1340, 8, 9, 40), icon = g.getImageData(1267, 16, 15, 24), bgCol = g.getImageData(1146, 8, 1, 40);
        for (let xx = 1123; xx < 1150; xx++) g.putImageData(bgCol, xx, 8);
        g.putImageData(left, 1150 - D, 8);
        g.putImageData(capL, 1259 - D, 8); for (let xx = 1268 - D; xx < 1340; xx++) g.putImageData(mid, xx, 8); g.putImageData(capR, 1340, 8);
        g.putImageData(icon, 1267 - D, 16);
        text('Aldridge Vine', 1286 - D, 27.5, '500 13px Rethink', '#2B2621');
      }
    }
    // the Microsoft account avatar at the top right of Word: BN -> AF (outlined circle, dark initials)
    if (!name.startsWith('a38') && !/^b6[245]/.test(name)) {
      const inside = rgb(pix(1489, 19));
      g.save(); g.beginPath(); g.arc(1498, 19, 9.6, 0, Math.PI * 2); g.fillStyle = inside; g.fill();
      g.fillStyle = '#3B3A39'; g.font = '600 10.5px Rethink'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('AF', 1498, 19.5); g.restore();
    }
    res[name] = cv.toDataURL('image/png').split(',')[1];
  }
  return res;
}, { CAPS, OPS, NAIR });
for (const [n, d] of Object.entries(out)) fs.writeFileSync(path.join(ROOT, 'plates', n + '.png'), Buffer.from(d, 'base64'));
await b.close(); console.log('plates:', Object.keys(out).length);
