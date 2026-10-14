// Captures the Andri screens for Academy 7.1 as 2x plates plus element rects (app px, window 1470 x 835).
// Source: DOM snapshots of Andri staging taken 12 Oct 2026 (staging-snapshot/raw, my own specialist, folder and
// conversation), localised by staging-snapshot/localize71.py (local fonts, Aldridge Vine / AF, demo conversation name).
// In-between states are built only from parts of real snapshots (an earlier turn, an emptied composer), never drawn by hand.
// Usage: node plates/capture71.mjs [regex of plate names]
import { chromium } from './pw.mjs'; import { writeFileSync, readFileSync } from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SNAP = path.join(HERE, '../staging-snapshot');
const AW = 1470, AH = 835;
const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const OUT = path.join(HERE, 'rects.json');
const out = (() => { try { return JSON.parse(readFileSync(OUT, 'utf8')); } catch { return {}; } })();
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const pg = await b.newPage({ viewport: { width: AW, height: AH }, deviceScaleFactor: 2 });
pg.on('pageerror', e => console.log('ERR', String(e)));

const HELPERS = `window.H = {
  R(e) { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(v => Math.round(v * 10) / 10); },
  U(e) { let a = e.getBoundingClientRect(), x0 = a.left, y0 = a.top, x1 = a.right, y1 = a.bottom;
    for (const c of e.querySelectorAll('*')) { const r = c.getBoundingClientRect(); if (!r.width) continue; x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); }
    return [x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4].map(v => Math.round(v * 10) / 10); },
  vis(e) { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.x < innerWidth && r.right > 0 && r.y < innerHeight && r.bottom > 0 && getComputedStyle(e).visibility !== 'hidden'; },
  text(t, nth = 0, root = document) { const m = [...root.querySelectorAll('body *')].filter(e => H.vis(e) && e.textContent.trim() === t && ![...e.children].some(c => c.textContent.trim() === t));
    m.sort((a, b) => { const p = a.getBoundingClientRect(), q = b.getBoundingClientRect(); return Math.abs(p.y - q.y) > 4 ? p.y - q.y : p.x - q.x; }); return m[nth]; },
  textAny(t, nth = 0) { return [...document.querySelectorAll('body *')].filter(e => e.textContent.trim() === t && ![...e.children].some(c => c.textContent.trim() === t))[nth]; },
  btn(t, nth = 0) { return [...document.querySelectorAll('button,a,[role=button]')].filter(e => H.vis(e) && e.innerText.trim() === t)[nth]; },
  al(a, nth = 0) { return [...document.querySelectorAll('[aria-label="' + a + '"]')].filter(H.vis)[nth]; },
  // line boxes of a substring (inside one text node), for the highlight sweep
  sub(str, nth = 0) { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n, k = 0;
    while ((n = w.nextNode())) { const i = n.data.indexOf(str); if (i < 0 || !H.vis(n.parentElement)) continue; if (k++ < nth) continue;
      const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + str.length);
      return [...r.getClientRects()].filter(q => q.width > 1).map(q => [q.x, q.y, q.width, q.height].map(v => Math.round(v * 10) / 10)); } return null; },
  subAny(str) { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (n.data.includes(str) && n.parentElement.closest('.thread-pane-active')) return n.parentElement; return null; },
  // all visible matches of a substring, preferring the active chat pane; returns line rects of the last one (or nth)
  subs(str) { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; const m = [];
    while ((n = w.nextNode())) { const i = n.data.indexOf(str); if (i < 0 || !H.vis(n.parentElement)) continue; const pane = n.parentElement.closest('.thread-pane'); if (pane && !pane.classList.contains('thread-pane-active')) continue;
      const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + str.length); m.push([...r.getClientRects()].filter(q => q.width > 1).map(q => [q.x, q.y, q.width, q.height].map(v => Math.round(v * 10) / 10))); } return m; },
  subLast(str) { const m = H.subs(str); return m.length ? m[m.length - 1] : null; },
  // "Consulting @employment-law" is two text nodes: one box from the start of the first to the end of the second
  consultLast() { const a = H.subLast('Consulting'), b = H.subLast('@employment-law'); if (!a || !b) return null; const x0 = a[0][0], x1 = b[0][0] + b[0][2]; return [[x0, a[0][1], x1 - x0, a[0][3]]]; },
  el(str) { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (n.data.includes(str) && H.vis(n.parentElement)) return n.parentElement; return null; },
  aside() { return document.querySelector('aside[data-pane="specialist"]'); },
  panelScroller() { const a = H.aside(); return a && [...a.querySelectorAll('div')].find(e => e.className.toString().startsWith('flex min-h-0 flex-1 flex-col overflow-y-auto')); },
  chat() { return document.querySelector('.thread-pane-active .chat-scroll-container'); },
  turns() { const c = H.chat(); return c ? [...c.querySelector('.flex.flex-col.space-y-4').children] : []; },
  composer() { return [...document.querySelectorAll('textarea')].find(t => { const r = t.getBoundingClientRect(); if (r.width < 300 || !(t.placeholder || '').startsWith('Ask Andri')) return false; const e = document.elementFromPoint(r.x + 20, r.y + r.height / 2); return e && (e === t || t.contains(e) || e.contains(t)); }); },
  setComposer(v) { const t = H.composer(); t.value = v; t.textContent = v; },
  // the floating @ list (the box holding the "Use ↑↓ to navigate" footer)
  atList() { const f = H.text('Use ↑↓ to navigate, Enter to select'); if (!f) return null; let e = f, best = null; while (e && e !== document.body) { const r = e.getBoundingClientRect(); if (r.height > 60 && r.height < 600 && r.width < 900 && /rounded/.test(e.className)) best = e; e = e.parentElement; } return best; },
  hideAtList() { const l = H.atList(); if (l) l.style.setProperty('display', 'none', 'important'); },
  scrollTurn(i, top = 16) { const c = H.chat(), t = H.turns()[i]; c.scrollTop = t.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop - top; },
  scrollTo(el, top) { const c = H.chat(); c.scrollTop += el.getBoundingClientRect().top - top; },
  bottom() { const c = H.chat(); c.scrollTop = c.scrollHeight; },
  // where typed text starts in a field: [x, y of first line top, line height, font size]
  field(e) { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return [r.x + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth), r.y + parseFloat(cs.paddingTop) + parseFloat(cs.borderTopWidth), parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5, parseFloat(cs.fontSize)]; },
  common(a, b) { for (let e = a; e; e = e.parentElement) if (e.contains(b)) return e; },
};`;
async function load(snap, js = '') {
  await pg.goto(pathToFileURL(path.join(SNAP, snap + '.html')).href, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(120);
  await pg.addScriptTag({ content: HELPERS });
  await pg.addStyleTag({ content: '*{scroll-behavior:auto!important}' });
  if (js) await pg.evaluate(js);
  await pg.waitForTimeout(80);
}
const want = n => !only || only.test(n);
async function rects(spec) { const o = {}; for (const [k, ex] of Object.entries(spec || {})) { o[k] = await pg.evaluate(ex => { const e = eval(ex); return Array.isArray(e) ? e : e ? H.R(e) : null; }, ex); if (!o[k]) console.log('  no rect', k); } return o; }
async function plate(name, snap, js = '', spec = {}) {
  if (!want(name)) return; await load(snap, js);
  await pg.screenshot({ path: path.join(HERE, name + '.png'), clip: { x: 0, y: 0, width: AW, height: AH } });
  out[name] = await rects(spec);
  const spins = await pg.evaluate(() => [...document.querySelectorAll('svg.lucide-loader-circle,svg.animate-spin')].filter(H.vis).map(s => { const r = s.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2, r.width, getComputedStyle(s).color]; }));
  if (spins.length) out[name].spins = spins;
  console.log('plate', name);
}
async function again(name, js = '', spec = {}) {
  if (!want(name)) return; if (js) await pg.evaluate(js); await pg.waitForTimeout(80);
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
    const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(v => Math.round(v * 10) / 10); }, sel);
  if (!box) { console.log('NO SPRITE', name); return; }
  await pg.screenshot({ path: path.join(HERE, name + '.png'), clip: { x: box[0], y: box[1], width: box[2], height: box[3] }, omitBackground: true });
  out[name] = { box, ...(await rects(spec)) }; console.log('sprite', name, box.join(','));
}
// the whole scrolling content of the New specialist form, at the real window height: the top and the bottom of the
// scroll range captured separately and stitched (the picker box sizes itself to the window, so no taller viewport)
import { execFileSync } from 'node:child_process';
async function tall(name, snap, spec = {}) {
  if (!want(name)) return;
  await load(snap, `H.panelScroller().scrollTop = 0`);
  const r = await pg.evaluate(() => { const s = H.panelScroller(); const q = s.getBoundingClientRect(); return [q.x, q.y, q.width, q.height, s.scrollHeight]; });
  const clip = { x: r[0], y: r[1], width: r[2], height: r[3] };
  await pg.screenshot({ path: '/tmp/academy71-top.png', clip });
  const sp = await rects(spec);
  const max = await pg.evaluate(() => { const s = H.panelScroller(); s.scrollTop = 1e6; return s.scrollTop; });
  await pg.waitForTimeout(60);
  const sp2 = await rects(spec);
  await pg.screenshot({ path: '/tmp/academy71-bot.png', clip });
  // rects relative to the content top: from the top capture if on screen there, else from the bottom one
  const rel = (q, off) => [q[0], q[1] - r[1] + off, q[2], q[3]];
  const pick = (a, b) => { if (!a && !b) return null; const inTop = v => v[1] >= r[1] && v[1] + v[3] <= r[1] + r[3];
    if (Array.isArray((a || b)[0])) { const A = a && a.every(inTop) ? a.map(v => rel(v, 0)) : null; return A || (b ? b.map(v => rel(v, max)) : null); }
    return a && inTop(a) ? rel(a, 0) : b ? rel(b, max) : rel(a, 0); };
  const o = {}; for (const k in spec) o[k] = pick(sp[k], sp2[k]);
  const H2 = Math.round(r[3] * 2), need = Math.round(max * 2);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', '/tmp/academy71-top.png', '-i', '/tmp/academy71-bot.png', '-filter_complex',
    `[1]crop=iw:${need}:0:${H2 - need}[b];[0][b]vstack`, path.join(HERE, name + '.png')]);
  out[name] = { size: [r[2], r[3] + max], ...o }; console.log('tall', name, r.join(','), 'max', max);
}

// ---------------------------------------------------------------- 1 the firm's models, Company > Knowledge base
await plate('kbF', 'k02-folder-complete', '', {
  sideKB: `H.text('Knowledge base', 1)`, crumb: `H.text('Employment: models and precedents')`, explore: `H.btn('Explore')`,
  f1: `H.sub('12_Skeleton_Argument.docx')`, f2: `H.sub('Aldridge_Vine_Memo_Template.docx')`, f3: `H.sub('Aldridge_Vine_Letter_Template.docx')`,
});
// the Explore menu (as opened on the Matters page; the top bar is the same on every page)
await sprite('menuEx', 'm02-explore-specialists', '', `H.common(H.text('Case law'), H.text('Give Andri a colleague who knows one part of your practice.'))`, {
  spItem: `H.text('Specialists', 0).closest('a') || H.text('Specialists', 0)`,
});

// ---------------------------------------------------------------- 2 Specialists, empty
const LIST = { newBtn: `H.btn('New specialist')`, counter: `H.text('0 of 15 specialists') || H.text('1 of 15 specialists')`, specNav: `H.btn('Specialists')` };
await plate('s00', 's00-specialists-empty', '', { ...LIST,
  line1: `H.sub('A specialist is a colleague Andri consults.')`, footer: `H.sub('A specialist advises Andri with direction and references. It never drafts for you.')` });

// ---------------------------------------------------------------- 3 the New specialist panel
const hidePanel = `H.aside().style.setProperty('opacity','0','important')`;
await plate('fN', 'f00-form-empty', hidePanel, LIST);
await sprite('pF0', 'f00-form-empty', '', `H.aside()`);
const FORM = {
  name: `H.aside().querySelector('input')`, consult: `H.aside().querySelectorAll('textarea')[0]`, notes: `H.aside().querySelectorAll('textarea')[1]`,
  hint: `H.text('A short name, two or three words at most.') || H.text('Andri will consult it as employment-law')`,
  count: `H.text('0 / 300') || H.text('95 / 300')`, scroller: `H.panelScroller()`, help: `H.sub('This is the only thing Andri reads when it decides whether to ask this specialist')`,
  nameF: `H.field(H.aside().querySelector('input'))`, consultF: `H.field(H.aside().querySelectorAll('textarea')[0])`, notesF: `H.field(H.aside().querySelectorAll('textarea')[1])`,
};
await plate('f00', 'f00-form-empty', '', FORM);
// the same fields with no placeholder: the background the typed text is revealed over
await plate('f00b', 'f00-form-empty', `H.aside().querySelector('input').placeholder = ''`, {});
await plate('f01b', 'f01-name', `H.aside().querySelectorAll('textarea')[0].placeholder = ''`, {});
await plate('f02b', 'f02-consult', `H.aside().querySelectorAll('textarea')[1].placeholder = ''`, {});
await plate('f01', 'f01-name', '', FORM);
await plate('f02', 'f02-consult', '', FORM);
await plate('f03', 'f03-notes', '', FORM);
// the scrolling part of the form, whole: before and after the folder is chosen
const TALL = { choose: `H.aside().querySelector('button[aria-label="Choose Employment: models and precedents"]')`, build: `H.btn('Build specialist')`,
  folder: `H.text('Employment: models and precedents', 0)`, chip: `H.sub('A folder brings everything inside it, now and later.')` };
await tall('tallA', 'f04-picker', TALL);
await tall('tallB', 'f06-ready-to-build', TALL);

// ---------------------------------------------------------------- 4 build, then ready
await plate('b01', 'b01-building', '', { wait: `H.sub('This takes a few minutes. You can leave this page; the build carries on.')`, steps: `H.text('Working now')`, row: `H.text('employment-law', 0)`, badge: `H.text('Building', 1) || H.text('Building', 0)`, counter: LIST.counter });
await plate('b02', 'b02-build-steps', '', { counter: LIST.counter });
await plate('r02', 'r02-detail-top', '', { ready: `H.text('Ready', 1) || H.text('Ready', 0)`,
  line: `H.sub("Knows Aldridge Vine LLP's house letter and memo templates", 1) || H.sub("Knows Aldridge Vine LLP's house letter and memo templates")`,
  edit: `H.sub('Edit them and it follows yours instead.')`, brief: `H.aside().querySelector('textarea')` });

// ---------------------------------------------------------------- 5 back in the matter: the Matters list (Nair only), then the chat
await plate('mL', 'm02-explore-specialists', `
  { let e = H.common(H.text('Case law'), H.text('Give Andri a colleague who knows one part of your practice.')); while (e.parentElement && !/fixed|absolute/.test(getComputedStyle(e).position)) e = e.parentElement; e.style.setProperty('display','none','important'); }
  for (const r of document.querySelectorAll('tbody tr, [role=row]')) if (!/Nair v Calderda/.test(r.innerText) && r.querySelector('td,[role=cell]')) r.style.display = 'none';`,
  { nair: `H.text('Nair v Calderda...') || H.sub('Nair v Calderda')`, matters: `H.btn('Matters')` });
const CHAT = { compF: `H.field(H.composer())`, send: `H.composer().closest('.composer-shell, [class*="rounded-[1.5rem]"]').querySelector('button[type=submit], button[aria-label*="Send" i]') || [...H.composer().closest('[class*="rounded-[1.5rem]"]').querySelectorAll('button')].pop()`,
  composer: `H.composer()`, at: `H.al('Mention') || H.composer().closest('[class*="rounded-[1.5rem]"]').querySelectorAll('button')[1]` };
// before the house-style check: the letter Andri drafted is the last turn, composer empty
const T1 = `H.turns()[1].remove(); H.setComposer(''); H.scrollTo(H.subAny('Here is a draft on the Aldridge Vine client-letter format'), 130);`;
await plate('cJ1', 'c04-answer', T1, { ...CHAT, dear: `H.subLast('Dear Ms Nair')`, draft: `H.sub('Here is a draft on the Aldridge Vine client-letter format.')` });
await again('cJ1b', `window.__c = H.composer(); __c.placeholder = '';`, {});
await again('cJ2', `__c.placeholder = 'Ask Andri...'; H.setComposer("Check that letter against our firm's house style before it goes out.");`, CHAT);
// sent: the new turn moves to the top, Andri thinks, then consults the specialist
await plate('cJ3', 'c03-consulting', `H.setComposer(''); H.scrollTurn(1, 90);`, { ...CHAT, consult: `H.consultLast()` });
await plate('cJ4', 'c04-answer', `H.setComposer(''); H.scrollTo(H.subAny('The draft does not yet match the house style'), 330);`, { ...CHAT, consult: `H.consultLast()`,
  verdict: `H.subLast('The draft does not yet match the house style')`, link: `H.subLast('Aldridge Vine letter template')` });

// ---------------------------------------------------------------- 6 asking it directly
const T2 = `H.hideAtList(); H.bottom();`;
await plate('cK0', 'c04-answer', `H.bottom();`, CHAT);
await plate('cK1', 'c05-at-list', T2, CHAT);
await sprite('lsDocs', 'c05a-at-docs', '', `H.atList()`, { head: `H.text('Matter Documents')`, hint: `H.text('←/→')` });
await sprite('lsSpec', 'c05-at-list', '', `H.atList()`, { head: `H.text('Specialists')`, item: `H.text('employment-law')` });
await plate('cK2', 'c06-picked', `H.bottom();`, { ...CHAT, chip: `H.sub('@[S:employment-law]')` });
await plate('cK3', 'c07-direct-consulting', `H.setComposer(''); H.scrollTurn(2, 40);`, { ...CHAT, consult: `H.consultLast()` });
await plate('cK4', 'c08-direct-answer', `H.scrollTurn(2, 40);`, { ...CHAT, memo: `H.subLast('memo template')`, heads: `H.subLast('Background')`, explore: `H.btn('Explore')` });

// ---------------------------------------------------------------- 7 one per team: the Specialists page now
await plate('r01', 'r01-list-ready', '', { ...LIST, row: `H.text('employment-law', 0)`, desc: `H.el("Knows Aldridge Vine LLP")` });

writeFileSync(OUT, JSON.stringify(out, null, 1));
writeFileSync(path.join(HERE, 'rects.js'), 'window.RECTS_DATA = ' + JSON.stringify(out) + ';\n');
await b.close();
