// Captures the Andri screens for Academy 9.2 as 2x plates plus element rects (app px, window 1470 x 835).
// Source: DOM snapshots of Andri staging taken 12 Oct 2026 in my own tab (staging-snapshot/raw, SNAP92), localised by
// staging-snapshot/localize92.py (local CSS and fonts, Aldridge Vine / AF). The Knowledge Base page is 9.1's snapshot of the
// same day (k01-kb-root.html, copied). Nothing was saved or connected in staging.
// The LegalSense intro scenes are the app's own CSS animations, stepped frame by frame (frames/<slide>/fNNN.png).
// Based on the 9.1 capture.mjs. Usage: node capture.mjs [regex of plate names]
import { chromium } from './pw.mjs'; import { writeFileSync, readFileSync, mkdirSync } from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SNAP = path.join(HERE, '../staging-snapshot');
const AW = 1470, AH = 835;
const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const RJ = path.join(HERE, 'rects.json');
const out = (() => { try { return JSON.parse(readFileSync(RJ, 'utf8')); } catch { return {}; } })();
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const pg = await b.newPage({ viewport: { width: AW, height: AH }, deviceScaleFactor: 2 });
pg.on('pageerror', e => console.log('ERR', String(e)));

const HELPERS = `window.H = {
  R(e) { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(v => Math.round(v * 10) / 10); },
  vis(e) { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.x < ${AW} && r.right > 0 && r.y < ${AH} && getComputedStyle(e).visibility !== 'hidden'; },
  text(t, nth = 0, root = document) { const m = [...root.querySelectorAll('body *')].filter(e => H.vis(e) && e.textContent.trim() === t && ![...e.children].some(c => c.textContent.trim() === t));
    m.sort((a, b) => { const p = a.getBoundingClientRect(), q = b.getBoundingClientRect(); return Math.abs(p.y - q.y) > 4 ? p.y - q.y : p.x - q.x; }); return m[nth]; },
  has(t) { return [...document.querySelectorAll('body *')].filter(e => H.vis(e) && e.children.length === 0 && e.textContent.includes(t))[0]; },
  btn(t, nth = 0) { return [...document.querySelectorAll('button,a')].filter(e => H.vis(e) && e.innerText.trim() === t)[nth]; },
  dlg() { return [...document.querySelectorAll('.andri-dialog')].filter(H.vis)[0]; },
  // the lines of a text element, as rects (for the highlight sweep)
  lines(e) { const r = document.createRange(); r.selectNodeContents(e); const out = [];
    for (const q of r.getClientRects()) { const l = out.find(o => Math.abs(o[1] - q.y) < 3); if (l) { const x2 = Math.max(l[0] + l[2], q.right); l[0] = Math.min(l[0], q.x); l[2] = x2 - l[0]; } else out.push([q.x, q.y, q.width, q.height]); }
    return out.map(a => a.map(v => Math.round(v * 10) / 10)); },
};`;
async function load(snap, js = '', settle = true) {
  await pg.goto(pathToFileURL(path.join(SNAP, snap + '.html')).href, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.addScriptTag({ content: HELPERS });
  await pg.evaluate(COMMON(settle));
  if (js) await pg.evaluate(js);
  await pg.waitForTimeout(80);
}
// on every page: the inbox count as one consistent number (as 9.1), and nothing from other sessions' work in staging
const INBOX_N = 2;
const COMMON = settle => `(() => {
  ${settle ? `document.getAnimations().forEach(a => { try { a.finish(); } catch (e) {} });` : ''}
  for (const e of [...document.querySelectorAll('tr,[role=row]')]) if (e.textContent.includes('21_Letter_Bowater_Sykes_Remedy')) e.remove();   // 4.2's own upload, not mock-case data
  document.querySelectorAll('[role=tooltip],[data-radix-popper-content-wrapper]').forEach(e => e.remove());
  for (const e of document.querySelectorAll('[data-testid=inbox-count] span[aria-hidden], [data-testid=inbox-count] .sr-only')) e.textContent = e.className.includes('sr-only') ? '${INBOX_N} unread' : '${INBOX_N}';
})()`;
const want = n => !only || only.test(n);
async function rects(spec) { const o = {}; for (const [k, ex] of Object.entries(spec || {})) { o[k] = await pg.evaluate(ex => { const e = eval(ex); return e == null ? null : Array.isArray(e) ? e : H.R(e); }, ex); if (!o[k]) console.log('  no rect', k); } return o; }
async function plate(name, snap, js = '', spec = {}) {
  if (!want(name)) return; await load(snap, js);
  await pg.screenshot({ path: path.join(HERE, name + '.png'), clip: { x: 0, y: 0, width: AW, height: AH } });
  out[name] = await rects(spec); console.log('plate', name);
}
// floating UI captured alone: everything else hidden, backgrounds transparent, own shadow off (known-issues #1)
async function sprite(name, snap, js, sel, spec = {}) {
  if (!want(name)) return; await load(snap, js);
  const box = await pg.evaluate(sel => { const el = eval(sel); if (!el) return null; el.setAttribute('data-sprite', '1');
    for (const e of document.querySelectorAll('body *')) if (!e.closest('[data-sprite]') && !e.querySelector('[data-sprite]')) e.style.visibility = 'hidden';
    for (let e = el.parentElement; e; e = e.parentElement) { e.style.background = 'transparent'; e.style.boxShadow = 'none'; e.style.borderColor = 'transparent'; }
    document.documentElement.style.background = 'transparent'; document.body.style.background = 'transparent'; el.style.boxShadow = 'none';
    return H.R(el); }, sel);
  if (!box) { console.log('NO SPRITE', name); return; }
  out[name] = { box, ...(await rects(spec)) };
  await pg.screenshot({ path: path.join(HERE, name + '.png'), clip: { x: box[0], y: box[1], width: box[2], height: box[3] }, omitBackground: true });
  console.log('sprite', name, box.join(','));
}

// ---------------------------------------------------------------- rect specs
const TOP = { company: `H.btn('Aldridge Vine')`, pers: `document.querySelector('.pz-glyph-btn')` };
const DLG = { dlg: `H.dlg()`, close: `H.dlg()?.querySelector('[aria-label=Close]') || [...H.dlg().querySelectorAll('button')].find(e => e.querySelector('svg.lucide-x'))` };

// ---------------------------------------------------------------- the pages
await plate('kb', 'k01-kb-root', '', TOP);                                       // Nair's Knowledge Base (9.1's snapshot)
await plate('co', 'c00-company', '', { ...TOP, sbConn: `H.text('Company connectors')` });
await plate('cc', 'c01-page', '', { ...TOP, sbConn: `H.text('Company connectors')`, chip: `H.text('Not connected')`, connect: `H.btn('Connect')`,
  card: `H.text('LegalSense')?.closest('.rounded-andri-lg, .rounded-andri-md, [class*=rounded]')`, head: `H.text('Company connectors', 1)` });
// the page under the dimmed scrim, dialog hidden: drawn while a dialog opens or closes
await plate('ccDim', 's01-connect', `H.dlg().style.setProperty('opacity', '0', 'important')`, {});   // opacity, not visibility: the yellow Next button sets its own visibility

// ---------------------------------------------------------------- the LegalSense intro, three slides, and the setup form
const SL = { s1: 's01-connect', s2: 's02-cando', s3: 's03-how' };
for (const [name, snap] of Object.entries(SL))
  await plate(name, snap, `document.getAnimations().forEach(a => { try { a.finish(); } catch (e) {} });`, { ...DLG, next: `H.btn('Next')`, cont: `H.btn('Continue')` });
await plate('form', 'c04-form', '', { ...DLG, input: `H.dlg().querySelector('input')`, twofa: `H.btn('Set up 2FA')`, save: `H.btn('Save installation')`, cancel: `H.btn('Cancel')`,
  req: `H.lines(H.text('Two-factor authentication is required'))`, help: `H.lines(H.has('The address of your LegalSense Online installation'))` });

// the scenes, frame by frame: only the scene's own emt- animations are stepped (the dialog's entry and the slide text stay settled), 30 frames a
// second over one loop of the app's scene (4.8 s, the length of its progress bar)
const SCENE_FPS = 30, SCENE_LEN = 4.8;
for (const [name, snap] of Object.entries(SL)) {
  if (!want('frames-' + name)) continue;
  await load(snap, '', false);
  await pg.evaluate(() => document.getAnimations().forEach(a => { if (!/^emt-/.test(a.animationName)) a.finish(); }));   // dialog entry and slide text settled
  const r = await pg.evaluate(() => H.R(H.dlg()));
  const dir = path.join(HERE, 'frames', name); mkdirSync(dir, { recursive: true });
  const n = Math.round(SCENE_LEN * SCENE_FPS);
  for (let i = 0; i < n; i++) {
    await pg.evaluate(ms => document.getAnimations().forEach(a => { if (/^emt-/.test(a.animationName)) { a.pause(); a.currentTime = ms; } }), i * 1000 / SCENE_FPS);
    await pg.screenshot({ path: path.join(dir, `f${String(i).padStart(3, '0')}.png`), clip: { x: r[0], y: r[1], width: r[2], height: r[3] } });
  }
  out['frames-' + name] = { dlg: r, n, fps: SCENE_FPS }; console.log('frames', name, n);
}

// ---------------------------------------------------------------- Personalisation (drawn over the Company connectors page)
await sprite('pz0', 'p00-answers', '', `document.querySelector('.pz-box')`, { glyph: `document.querySelector('.pz-glyph-btn')`, connectors: `H.text('Connectors')` });
await sprite('pz1', 'p01-connectors', '', `document.querySelector('.pz-box')`, { glyph: `document.querySelector('.pz-glyph-btn')`, connectors: `H.text('Connectors')`,
  foot: `H.lines(H.has('such as LegalSense'))`, footLink: `H.btn('Company connectors')`, list: `H.text('Mail and files')` });

writeFileSync(RJ, JSON.stringify(out, null, 1));
writeFileSync(path.join(HERE, 'rects.js'), 'window.RECTS_DATA = ' + JSON.stringify(out) + ';\n');
await b.close();
