// Captures the Andri screens for Academy 9.1 as 2x plates plus element rects (app px, window 1470 x 835).
// Source: DOM snapshots of Andri staging taken 12 Oct 2026 (staging-snapshot/raw), localised by staging-snapshot/localize91.py
// (local CSS and fonts, Aldridge Vine / AF / adam.frith@aldridgevine.co.uk).
// Edits made here, each one noted where it happens: another session's upload hidden from the Knowledge Base list, the typed
// address added to Who may send (staging was not changed, Bennett's call), and the "How it works" slides showing Priya Nair's
// return-to-work email (19_Email_Return_to_Work.eml, no attachments) instead of the app's Hartley v. Northgate sample.
// The slide scenes are the app's own CSS animations, stepped frame by frame (frames/<slide>/fNNN.png).
// Usage: node capture.mjs [regex of plate names]
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
  al(a, nth = 0) { return [...document.querySelectorAll('[aria-label="' + a + '"]')].filter(H.vis)[nth]; },
  btn(t, nth = 0) { return [...document.querySelectorAll('button,a')].filter(e => H.vis(e) && e.innerText.trim() === t)[nth]; },
  href(s) { return [...document.querySelectorAll('a')].filter(e => H.vis(e) && (e.getAttribute('href') || '').includes(s) && e.getBoundingClientRect().x < 60)[0]; },
  // replace text in every text node (demo swaps)
  swap(a, b2) { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (n.nodeValue.includes(a)) n.nodeValue = n.nodeValue.split(a).join(b2);
    for (const e of document.querySelectorAll('[title]')) if (e.title.includes(a)) e.title = e.title.split(a).join(b2); },
  stage() { return document.querySelector('[data-testid=tour-stage]'); },
  panel() { return H.stage()?.closest('.flex.h-full.min-h-0.flex-col'); },
  // smallest element holding text t, then its ancestor that is a row of the slide scene
  sceneRow(t) { const e = H.text(t) || [...H.stage().querySelectorAll('*')].find(x => x.textContent.trim() === t); return e; },
};`;
async function load(snap, js = '') {
  await pg.goto(pathToFileURL(path.join(SNAP, snap + '.html')).href, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.addScriptTag({ content: HELPERS });
  await pg.evaluate(COMMON);
  if (js) await pg.evaluate(js);
  await pg.waitForTimeout(80);
}
// on every page: the inbox count as one consistent number, and nothing from other sessions' work in staging
const INBOX_N = 2;   // unread count shown everywhere: the two Nair client-update letters left in the list below
const COMMON = `(() => {
  document.getAnimations().forEach(a => { try { a.finish(); } catch (e) {} });   // entry animations settled (cards were mid fade-in when captured)
  for (const e of [...document.querySelectorAll('tr,[role=row]')]) if (e.textContent.includes('21_Letter_Bowater_Sykes_Remedy')) e.remove();   // 4.2's own upload, not mock-case data
  if (!/k00-kb-hover/.test(location.href)) document.querySelectorAll('[role=tooltip],[data-radix-popper-content-wrapper]').forEach(e => e.remove());
  // Inbox: only the Nair document notifications (the rest are other sessions' test runs), counts to match
  const lis = [...document.querySelectorAll('li')].filter(e => e.querySelector('button.grid'));
  for (const li of lis) if (!/Nair v Calderdale/.test(li.innerText) || /Bowater/.test(li.innerText)) li.remove();
  for (const e of document.querySelectorAll('[data-testid=inbox-count] span[aria-hidden], [data-testid=inbox-count] .sr-only')) e.textContent = e.className.includes('sr-only') ? '${INBOX_N} unread' : '${INBOX_N}';
  for (const e of [...document.querySelectorAll('span')]) if (e.children.length === 0 && e.textContent.trim() === '9' && /bg-andri-gold|rounded-andri-full/.test(e.className + e.parentElement.className)) e.textContent = '${INBOX_N}';
  for (const e of [...document.querySelectorAll('h2,h3,div,p,span')]) if (e.children.length === 0 && e.textContent.trim() === 'Today' && !e.parentElement.querySelector('li')) e.remove();
  for (const e of [...document.querySelectorAll('span,div,p')]) if (e.children.length === 0 && e.textContent.trim() === '9 unread') e.textContent = '${INBOX_N} unread';
})()`;
const want = n => !only || only.test(n);
async function rects(spec) { const o = {}; for (const [k, ex] of Object.entries(spec || {})) { o[k] = await pg.evaluate(ex => { const e = eval(ex); return e ? H.R(e) : null; }, ex); if (!o[k]) console.log('  no rect', k); } return o; }
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
const TOP = { inbox: `[...document.querySelectorAll('a')].filter(H.vis).find(e => (e.getAttribute('href') || '').endsWith('/inbox') && e.getBoundingClientRect().y < 60)`, pers: `document.querySelector('.pz-glyph-btn')` };
const SIDE = { sbEmail: `H.href('/email')`, sbKB: `H.href('/documents/')` };
const KB = { ...TOP, ...SIDE, emailDocs: `H.btn('Email Documents')`, connect: `H.btn('Connect')` };
const ME = { ...TOP, ...SIDE, watch: `H.btn('Watch how it works')`, addr: `H.text('andri+ef4241f0f4a554be@inbox.andri.ai')`,
  copy: `[...document.querySelectorAll('button')].filter(H.vis).find(e => { const a = H.text('andri+ef4241f0f4a554be@inbox.andri.ai').getBoundingClientRect(), r = e.getBoundingClientRect(); return Math.abs(r.y + r.height / 2 - a.y - a.height / 2) < 12 && r.x > a.x + 100; })`,
  input: `document.querySelector('input[placeholder="name@firm.com"]')`, add: `H.btn('Add')`, row: `H.text('adam.frith@aldridgevine.co.uk')?.parentElement` };
const SLIDE = { stage: `H.stage()`, next: `H.btn('Next') || H.btn('Done')`, close: `H.panel()?.querySelector('[aria-label=Close]')`, dots: `[...document.querySelectorAll('button')].filter(H.vis).find(e => /of 5/.test(e.parentElement?.previousElementSibling?.textContent || '')) || null` };

const DOCS_LIST = `(() => { const e = [...document.querySelectorAll('[role=dialog]:not(.pz-box) *')].find(x => x.children.length === 0 && x.textContent.trim() === 'adam.frith@aldridgevine.co.uk'); if (!e) return;
  const row = e.closest('.justify-between'); const fix = (r, a, ini) => { const w = document.createTreeWalker(r, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const v = n.nodeValue.trim(); if (v === 'B' || v === 'A') n.nodeValue = ini; else if (v.includes('adam.frith')) n.nodeValue = a; } };
  fix(row, 'adam.frith@aldridgevine.co.uk', 'A');   // the initial was the staging account's B
  const c = row.cloneNode(true); row.after(c); fix(c, 'priya.nair@outlook.com', 'P'); })()`;   // the same list as Who may send, so Priya is on it
// ---------------------------------------------------------------- Knowledge Base and its two dialogs
await plate('kb', 'k01-kb-root', '', KB);
await plate('kbTip', 'k00-kb-hover-email', `(() => { const s = [...document.querySelectorAll('span')].find(e => e.textContent.trim() === 'Matter Email' && /group-hover/.test(e.className)); if (s) { s.style.opacity = 1; s.style.transform = 'none'; s.style.visibility = 'visible'; } })()`, { tip: `[...document.querySelectorAll('span,div')].filter(H.vis).find(e => e.textContent.trim() === 'Matter Email' && e.getBoundingClientRect().x < 140 && e.getBoundingClientRect().x > 40)` });
await plate('kbDocs', 'k02-email-documents', DOCS_LIST, { dlg: `document.querySelector('[role=dialog]:not(.pz-box)')`, close: `document.querySelector('[role=dialog]:not(.pz-box) button:has(svg.lucide-x), [role=dialog] [aria-label=Close]') || [...document.querySelectorAll('[role=dialog]:not(.pz-box) button')].pop()`,
  addr: `H.text('andri+ef4241f0f4a554be@inbox.andri.ai')` });
await plate('kbConn', 'k03-connect', '', { dlg: `document.querySelector('[role=dialog]:not(.pz-box)')`, close: `document.querySelector('[role=dialog]:not(.pz-box) button:has(svg.lucide-x)')`,
  files: `H.text('File integrations')`, tools: `H.text('Tool integrations')`, sp: `H.text('Microsoft SharePoint')`, gw: `H.text('Google Workspace')` });
// the dialogs alone, to draw their opening over the page
await sprite('dlgDocs', 'k02-email-documents', DOCS_LIST, `document.querySelector('[role=dialog]:not(.pz-box)')`);
await sprite('dlgConn', 'k03-connect', '', `document.querySelector('[role=dialog]:not(.pz-box)')`);

// ---------------------------------------------------------------- Matter Email
await plate('me', 'm01-matter-email', '', ME);
await plate('meTipKB', 'm01-matter-email', `(() => { const s = [...document.querySelectorAll('span')].find(e => e.textContent.trim() === 'Knowledge Base' && /group-hover/.test(e.className)); if (s) { s.style.opacity = 1; s.style.transform = 'none'; s.style.visibility = 'visible'; } })()`,
  { tip: `[...document.querySelectorAll('span')].find(e => e.textContent.trim() === 'Knowledge Base' && /group-hover/.test(e.className))` });
await plate('meCopied', 'm02-copied', '', { toast: `document.querySelector('[data-sonner-toast]')` });
await plate('meTyped', 'm03-typed', '', ME);
// after Add: the field empties and the address joins the list (staging not changed: the row is a copy of the real one)
await plate('meAdded', 'm03-typed', `(() => { const i = document.querySelector('input[placeholder="name@firm.com"]'); i.value = ''; i.setAttribute('value', ''); i.blur();
  i.className = i.className; i.style.borderColor = ''; document.activeElement && document.activeElement.blur();
  const row = H.text('adam.frith@aldridgevine.co.uk').parentElement; const c = row.cloneNode(true); row.after(c);
  const w = document.createTreeWalker(c, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (n.nodeValue.includes('adam.frith')) n.nodeValue = 'priya.nair@outlook.com'; })()`,
  { ...ME, row2: `H.text('priya.nair@outlook.com')?.parentElement` });

// ---------------------------------------------------------------- How it works (the panel beside Matter Email)
const ADDR_SAMPLE = 'andri+7f3a9c2e1b4d6f08@inbox.andri.ai', ADDR = 'andri+ef4241f0f4a554be@inbox.andri.ai';
const SUBJ = 'Return from maternity leave - 13 January 2025';
const SLIDES = {
  h1: ['h01-address', `H.swap('Hartley v. Northgate', 'Nair v Calderdale Logistics'); H.swap('${ADDR_SAMPLE}', '${ADDR}');`],
  h2: ['h02-forward', `H.swap('${ADDR_SAMPLE}', '${ADDR}'); H.swap('Meeting notes 20 July [notes]', '${SUBJ}');
    const chip = [...H.stage().querySelectorAll('span')].find(e => e.textContent.trim() === 'Meeting 20 July.m4a'); chip && chip.parentElement.remove();`],
  h3: ['h03-senders', `H.swap('j.smith@example.com', 'priya.nair@outlook.com'); H.swap('Meeting notes 20 July [notes]', '${SUBJ}');`],
  h4: ['h04-documents', `H.swap('Hartley v. Northgate', 'Nair v Calderdale Logistics'); H.swap('Email: Meeting notes 20 July', 'Email: ${SUBJ}');
    const st = H.stage(); for (const t of ['Meeting 20 July.m4a', 'Quote.pdf']) { const e = [...st.querySelectorAll('span')].find(x => x.children.length === 0 && x.textContent.trim() === t); e && e.closest('div.emt-left').remove(); }
    for (const e of [...st.querySelectorAll('span')]) if (e.children.length === 0 && e.textContent.trim() === 'notes') e.remove();`],
  h5: ['h05-told', `H.swap('Email received from j.smith@example.com, 2 attachments', 'Email received from priya.nair@outlook.com');
    const st = H.stage(); const card = [...st.querySelectorAll('div')].find(d => d.textContent.includes('New files received') && /absolute/.test(d.className)); card && card.remove();`],
};
const ADD_PRIYA = `(() => { const row = H.text('adam.frith@aldridgevine.co.uk')?.parentElement; if (!row) return; const c = row.cloneNode(true); row.after(c);
  const w = document.createTreeWalker(c, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (n.nodeValue.includes('adam.frith')) n.nodeValue = 'priya.nair@outlook.com'; })();`;
for (const k of Object.keys(SLIDES)) SLIDES[k][1] = ADD_PRIYA + SLIDES[k][1];   // she was added just before the panel opens
for (const [name, [snap, js]] of Object.entries(SLIDES)) {
  // the panel itself, its scene frozen at its settled moment
  await plate(name, snap, js + `; document.getAnimations().forEach(a => { a.pause(); a.currentTime = ${name === 'h2' ? 4300 : 4300}; });`, { ...ME, ...SLIDE });
}

// the scenes, frame by frame (the app's CSS animations stepped, 30 frames a second, until just before each scene fades out)
const SCENE_FPS = 30, SCENE_END = 4.4;
for (const [name, [snap, js]] of Object.entries(SLIDES)) {
  if (!want('frames-' + name)) continue;
  await load(snap, js);
  const r = await pg.evaluate(() => H.R(H.stage()));
  const dir = path.join(HERE, 'frames', name); mkdirSync(dir, { recursive: true });
  const n = Math.round(SCENE_END * SCENE_FPS);
  for (let i = 0; i <= n; i++) {
    await pg.evaluate(ms => document.getAnimations().forEach(a => { a.pause(); a.currentTime = ms; }), i * 1000 / SCENE_FPS);
    await pg.screenshot({ path: path.join(dir, `f${String(i).padStart(3, '0')}.png`), clip: { x: r[0], y: r[1], width: r[2], height: r[3] } });
  }
  out['frames-' + name] = { stage: r, n, fps: SCENE_FPS }; console.log('frames', name, n + 1);
}

// ---------------------------------------------------------------- Personalisation (drawn over whichever page is behind it)
await sprite('pz0', 'p00-personalisation', '', `document.querySelector('.pz-box')`, { glyph: `document.querySelector('.pz-glyph-btn')`, connectors: `H.text('Connectors')` });
await sprite('pz1', 'p01-connectors', '', `document.querySelector('.pz-box')`, { glyph: `document.querySelector('.pz-glyph-btn')`,
  c1: `H.btn('Connect', 0)`, c2: `H.btn('Connect', 1)`, c3: `H.btn('Connect', 2)`, gmail: `H.text('Gmail')`, body: `H.text('Mail and files')?.previousElementSibling` });
// the X glyph sits in the top bar, above the box; capture it on its own too
await sprite('pzX', 'p01-connectors', '', `document.querySelector('.pz-glyph-btn')`);

// ---------------------------------------------------------------- Inbox
await plate('inbox', 'i00-inbox-andri', '', { ...TOP, emailTab: `H.btn('Email') || H.text('Email')` });
await plate('inboxEmail', 'i01-inbox-email', '', { ...TOP, emailTab: `H.text('Email')`, gmail: `H.btn('Connect Gmail')`, outlook: `H.btn('Connect Outlook')`, head: `H.text('Your email, sorted by Andri')` });

writeFileSync(RJ, JSON.stringify(out, null, 1));
writeFileSync(path.join(HERE, 'rects.js'), 'window.RECTS_DATA = ' + JSON.stringify(out) + ';\n');
await b.close();
