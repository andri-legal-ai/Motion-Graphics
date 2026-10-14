// Captures the Andri screens for Academy 5.1 as 2x plates plus element rects (app px, window 1440 x 860).
// Source: DOM snapshots of Andri staging taken 9 Oct 2026 in my own matter (staging-snapshot/raw), localised by
// staging-snapshot/localize.py (local CSS and fonts, Aldridge Vine / AF / "Pennbridge Foods").
// In-between states are built only from parts of other real snapshots (see DERIVED below), never drawn by hand.
import { chromium } from './pw.mjs'; import { writeFileSync, readFileSync } from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SNAP = path.join(HERE, '../staging-snapshot');
const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const RECTS = (() => { try { return JSON.parse(readFileSync(path.join(HERE, 'rects.json'), 'utf8')); } catch { return {}; } })();
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 860 }, deviceScaleFactor: 2 });
pg.on('pageerror', e => console.log('ERR', String(e)));

// in-page helpers, injected on every load
const HELPERS = `window.H = {
  R(e) { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(v => Math.round(v * 10) / 10); },
  U(e) { let a = e.getBoundingClientRect(), x0 = a.left, y0 = a.top, x1 = a.right, y1 = a.bottom;
    for (const c of e.querySelectorAll('*')) { const r = c.getBoundingClientRect(); if (!r.width) continue; x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); }
    return [x0, y0, x1 - x0, y1 - y0].map(v => Math.round(v * 10) / 10); },
  vis(e) { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.x < 1440 && r.right > 0 && r.y < 860 && getComputedStyle(e).visibility !== 'hidden'; },
  // smallest visible element whose own text is exactly t (nth match, left to right, top to bottom)
  text(t, nth = 0, root = document) { const m = [...root.querySelectorAll('body *')].filter(e => H.vis(e) && e.textContent.trim() === t && ![...e.children].some(c => c.textContent.trim() === t));
    m.sort((a, b) => { const p = a.getBoundingClientRect(), q = b.getBoundingClientRect(); return Math.abs(p.y - q.y) > 4 ? p.y - q.y : p.x - q.x; }); return m[nth]; },
  al(a, nth = 0) { return [...document.querySelectorAll('[aria-label="' + a + '"]')].filter(H.vis)[nth]; },
  btn(t, nth = 0) { return [...document.querySelectorAll('button,a')].filter(e => H.vis(e) && e.innerText.trim() === t)[nth]; },
  back() { const a = [...document.querySelectorAll('a,button')].find(e => e.innerText.trim() === 'Back to all reviews'); if (a) a.remove(); },
  card(title) { return [...document.querySelectorAll('aside')].find(a => a.innerText.trim().startsWith(title) && a.getBoundingClientRect().x < 1400)?.closest('.rounded-andri-lg'); },
  hideCard(title) { const c = H.card(title); const x0 = c ? c.getBoundingClientRect().left - 2 : 885;
    for (const e of document.querySelectorAll('body *')) { const r = e.getBoundingClientRect(); if (r.width && r.left >= x0 && r.top >= 195) { e.style.setProperty('visibility', 'hidden', 'important'); e.style.setProperty('opacity', '0', 'important'); } } },
  scroller() { return [...document.querySelectorAll('div')].find(e => e.className.toString().includes('overflow-auto') && e.scrollWidth > e.clientWidth + 20 && e.getBoundingClientRect().width > 600); },
  scrollRight() { const s = H.scroller(); if (s) s.scrollLeft = s.scrollWidth; },
  scrollTo(x) { const s = H.scroller(); if (s) s.scrollLeft = x; },
  grid() { return document.querySelector('div.grid.min-w-full'); },
  // the review grid's cells as [row][col] (header row 0), from their positions
  cells() { const rr = [...document.querySelectorAll('[role=row]')].filter(H.vis);
    if (rr.length) return rr.map(r => [...r.querySelectorAll('[role=columnheader],[role=rowheader],[role=cell],[role=gridcell]')].filter(c => c.closest('[role=row]') === r));
    const g = H.grid(); if (!g) return []; const rows = {}; for (const c of g.children) { const r = c.getBoundingClientRect(); const k = Math.round(r.y); (rows[k] = rows[k] || []).push(c); }
    return Object.keys(rows).map(Number).sort((a, b) => a - b).map(k => rows[k].sort((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x)); },
  setInput(v) { const i = [...document.querySelectorAll('input')].find(e => e.placeholder === 'Column header (optional)'); if (i) { i.value = v; i.setAttribute('value', v); } },
  setArea(v) { const t = [...document.querySelectorAll('textarea')].find(e => (e.placeholder || '').startsWith('What do you want')); if (t) { t.value = v; t.textContent = v; } },
  setText(from, to) { const e = H.text(from); if (e) e.textContent = to; },
  tipOn(label) { const s = [...document.querySelectorAll('span')].find(e => e.textContent.trim() === label && e.className.includes('group-hover/nav-item:opacity-100')); if (s) { s.style.opacity = 1; s.style.transform = 'none'; } return s; },
};`;
async function load(snap, js = '') {
  await pg.goto(pathToFileURL(path.join(SNAP, snap + '.html')).href, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.addScriptTag({ content: HELPERS });
  if (js) await pg.evaluate(js);
  await pg.waitForTimeout(80);
}
const out = {};
const want = n => !only || only.test(n);
// rects: { key: js expression returning an element } -> [x,y,w,h]
async function rects(spec) { const o = {}; for (const [k, ex] of Object.entries(spec || {})) { o[k] = await pg.evaluate(ex => { const e = eval(ex); return e ? H.R(e) : null; }, ex); if (!o[k]) console.log('  no rect', k); } return o; }
async function plate(name, snap, js = '', spec = {}) {
  if (!want(name)) return; await load(snap, js);
  await pg.screenshot({ path: path.join(HERE, name + '.png'), clip: { x: 0, y: 0, width: 1440, height: 860 } });
  out[name] = await rects(spec);
  // spinners on this plate (lucide loader-circle): centre, size, colour; app.js turns them
  const spins = await pg.evaluate(() => [...document.querySelectorAll('svg.lucide-loader-circle')].filter(H.vis).map(s => { const r = s.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2, r.width, getComputedStyle(s).color]; }).filter(v => v[1] < 860));
  if (spins.length) out[name].spins = spins;
  console.log('plate', name);
}
// floating UI captured alone: everything else hidden, backgrounds transparent, own shadow off (known-issues #1)
async function sprite(name, snap, js, sel, spec = {}) {
  if (!want(name)) return; await load(snap, js);
  const box = await pg.evaluate(sel => { const el = eval(sel); if (!el) return null; el.setAttribute('data-sprite', '1');
    for (const e of document.querySelectorAll('body *')) if (!e.closest('[data-sprite]') && !e.querySelector('[data-sprite]')) e.style.visibility = 'hidden';
    for (let e = el.parentElement; e; e = e.parentElement) { e.style.background = 'transparent'; e.style.boxShadow = 'none'; e.style.borderColor = 'transparent'; }
    document.documentElement.style.background = 'transparent'; document.body.style.background = 'transparent'; el.style.boxShadow = 'none';
    return H.U(el); }, sel);
  if (!box) { console.log('NO SPRITE', name); return; }
  await pg.screenshot({ path: path.join(HERE, name + '.png'), clip: { x: box[0], y: box[1], width: box[2], height: box[3] }, omitBackground: true });
  out[name] = { box, ...(await rects(spec)) }; console.log('sprite', name, box.join(','));
}
// grabs outerHTML of an element in another snapshot (for DERIVED states)
async function grab(snap, js, ex) { await load(snap, js); return pg.evaluate(ex => eval(ex)?.outerHTML, ex); }

// ---------------------------------------------------------------- shared rect specs
const NAV = { review: `H.al('Review') || H.text('Review')` };
const GRID = { sources: `H.text('Sources')`, addq: `H.text('Click to add a question')`, addSrc: `H.text('Add a source')`, addAnother: `H.text('Add another question')`,
  tryBtn: `H.btn('Try one cell')`, start: `H.btn('Start review')`, top: `H.text('Add a source and a question to start') || H.text('Add a question to start')` };
const PANELQ = { fmt: `[...document.querySelectorAll('button')].find(b => /^(Short text|Yes \\/ No|Date|Number|Extract|Choice list)$/.test(b.innerText.trim()) && b.getBoundingClientRect().x > 880)`,
  input: `[...document.querySelectorAll('input')].find(e => e.placeholder === 'Column header (optional)')`,
  area: `[...document.querySelectorAll('textarea')].find(e => (e.placeholder || '').startsWith('What do you want'))`,
  done: `H.btn('Done')`, close: `H.card('Question')?.querySelector('header button')`, card: `H.card('Question')` };
const BASE = `H.back();`;
const sideTip = `[...document.querySelectorAll('a')].find(a => /\\/review$/.test(a.getAttribute('href') || '') && a.closest('aside'))`;

// ---------------------------------------------------------------- 1 the Knowledge Base folder, then Review from the sidebar
await plate('kb', 'k02-kb-folder', '', { crumb: `H.text('supplier contracts')`, review: sideTip, row1: `H.text('Design_Services_Agreement_Holt_Creative.pdf')` });
await plate('kbTip', 'k02-kb-folder', `H.tipOn('Review')`, { tip: `H.tipOn('Review')` });
// ---------------------------------------------------------------- 2 the empty grid (a matter with no reviews yet opens straight on it)
await plate('g0', 's00-empty-grid', BASE, GRID);
// ---------------------------------------------------------------- 3 Add sources (grid narrowed under the panel; panel states as sprites)
await plate('gN', 's01-add-sources-folder', `H.hideCard('Add sources')`, GRID);
const SRC = { tabs: `H.btn('Matter Knowledge Base')?.parentElement`, folder: `H.text('supplier contracts')`, selAll: `H.text('Select all')?.previousElementSibling || H.text('Select all')`,
  use: `H.btn('Use sources')`, count: `H.text('0 of 1') || H.text('6 of 6') || H.text('0 of 6')`, crumb: `H.text('Matter Knowledge Base', 1)` };
await sprite('pRoot', 's10-panel-root', '', `H.card('Add sources')`, SRC);
await sprite('pFolder', 's11-panel-folder', '', `H.card('Add sources')`, SRC);
await sprite('pAll', 's12-panel-all-selected', '', `H.card('Add sources')`, SRC);
await plate('r6', 'n02-six-rows-noq', BASE, GRID);
// ---------------------------------------------------------------- 4-5 question 1
await plate('q1a', 'n03-q1-panel', BASE, { ...GRID, ...PANELQ });
await plate('q1N', 'n03-q1-panel', BASE + `H.hideCard('Question 1')`, GRID);
await sprite('pQ1a', 'n03-q1-panel', BASE, `H.card('Question 1')`, PANELQ);
const MENU = `document.querySelector('[role=listbox]')?.closest('[data-radix-popper-content-wrapper]') || document.querySelector('[role=listbox]')`;
const ITEMS = { shortText: `H.text('Short text', 1)`, yesNo: `H.text('Yes / No')`, extract: `H.text('Extract')`, date: `H.text('Date')`, number: `H.text('Number')`, choice: `H.text('Choice list')` };
await sprite('menuFmt', 'n04-format-menu', BASE, MENU, Object.fromEntries(Object.entries(ITEMS).map(([k, v]) => [k, v.replace(/\)$/, ')?.closest("[role=option]")')])));
await plate('q1b', 'n05-yesno-empty', BASE, { ...GRID, ...PANELQ });
await plate('q1c', 'n06-header-typed', BASE, { ...GRID, ...PANELQ, h1: `H.text('Liability cap')` });
await plate('q1d', 'n07-q1-typed', BASE, { ...GRID, ...PANELQ, h1: `H.text('Liability cap')`, h1q: `H.text("Does the contract cap the supplier's liability?")`, cells: `H.text('6 cells · 1 × 6')` });
await sprite('pQ1d', 'n07-q1-typed', BASE, `H.card('Question 1')`, PANELQ);
await plate('q1Nd', 'n07-q1-typed', BASE + `H.hideCard('Question 1')`, {});
await plate('q1done', 'n08-q1-done', BASE, GRID);
// ---------------------------------------------------------------- 6 questions 2 and 3 (DERIVED: the empty panel and empty column header come from question 1's real empty state)
const emptyHead = await grab('n03-q1-panel', BASE, `H.cells()[0][1]`);
const shortTrig = await grab('n03-q1-panel', BASE, `${PANELQ.fmt}`);
const shortDesc = 'A concise prose answer (default).';
const emptyQ = (col, fmtHtml, desc, top) => BASE + `{ const c = H.cells(); c[0][${col}].outerHTML = ${JSON.stringify(emptyHead)}; H.setInput(''); H.setArea('');
  ${fmtHtml ? `(${PANELQ.fmt}).outerHTML = ${JSON.stringify(fmtHtml)};` : ''} ${desc ? `{ const d = [...document.querySelectorAll('p,div,span')].find(e => e.children.length === 0 && /^(One date per document|One number per document)/.test(e.textContent.trim())); if (d) d.textContent = ${JSON.stringify(desc)}; }` : ''}
  ${top ? `{ const e = [...document.querySelectorAll('span,div,p')].find(e => e.children.length === 0 && /^\\d+ cells · /.test(e.textContent.trim())); if (e) e.textContent = ${JSON.stringify(top)}; }` : ''} }`;
await plate('q2a', 'n09-q2-typed', emptyQ(2, shortTrig, shortDesc, '6 cells · 1 × 6'), { ...GRID, ...PANELQ });
await plate('q2b', 'n09-q2-typed', emptyQ(2, null, null, '6 cells · 1 × 6'), { ...GRID, ...PANELQ });
await plate('q2d', 'n09-q2-typed', BASE, { ...GRID, ...PANELQ, h2: `H.text('Expiry date')` });
await plate('q2N', 'n09-q2-typed', emptyQ(2, shortTrig, shortDesc, '6 cells · 1 × 6') + `H.hideCard('Question 2')`, GRID);
await sprite('pQ2a', 'n09-q2-typed', emptyQ(2, shortTrig, shortDesc, '6 cells · 1 × 6'), `H.card('Question 2')`, PANELQ);
await sprite('pQ2d', 'n09-q2-typed', BASE, `H.card('Question 2')`, PANELQ);
await plate('q2Nd', 'n09-q2-typed', BASE + `H.hideCard('Question 2')`, {});
await plate('q2done', 'n10-q2-done', BASE, GRID);
await plate('q3a', 'n11-q3-typed', emptyQ(3, shortTrig, shortDesc, '12 cells · 2 × 6'), { ...GRID, ...PANELQ });
await plate('q3b', 'n11-q3-typed', emptyQ(3, null, null, '12 cells · 2 × 6'), { ...GRID, ...PANELQ });
await plate('q3d', 'n11-q3-typed', BASE, { ...GRID, ...PANELQ, h3: `H.text('Notice (days)')` });
await plate('q3N', 'n11-q3-typed', emptyQ(3, shortTrig, shortDesc, '12 cells · 2 × 6') + `H.hideCard('Question 3')`, GRID);
await sprite('pQ3a', 'n11-q3-typed', emptyQ(3, shortTrig, shortDesc, '12 cells · 2 × 6'), `H.card('Question 3')`, PANELQ);
await sprite('pQ3d', 'n11-q3-typed', BASE, `H.card('Question 3')`, PANELQ);
await plate('q3Nd', 'n11-q3-typed', BASE + `H.hideCard('Question 3')`, {});
// ---------------------------------------------------------------- 7 Try one cell (first pass in staging: same six rows and three questions, no back link)
await plate('g3', 's13-six-rows', '', { ...GRID, cell11: `H.cells()[1][1]` });
await plate('tryRun', 's14-try-running', '', { ...GRID, cancelPrev: `H.btn('Cancel preview')`, cell11: `H.cells()[1][1]` });
await plate('tryDone', 's16-try-result', '', { ...GRID, cell11: `H.cells()[1][1]`, yes: `H.text('Yes')` });
// ---------------------------------------------------------------- 8 the run (DERIVED from the real runs: the 3-column page while running,
// cells "Queued" / "Andri is thinking…" copied from the add-a-question run, answers from the first run)
const queuedCell = await grab('s24-q4-queued', '', `H.cells()[1][4]`);
const thinkCell = await grab('s25-q4-thinking', '', `H.cells()[1][4]`);
const running = (cellHtml, k, from = 1) => `{ const g = H.grid(); const c = H.cells(); for (const row of c) if (row[4]) row[4].remove();
  g.style.gridTemplateColumns = getComputedStyle(g).gridTemplateColumns.split(' ').slice(0, 4).map((v, i) => i ? 'minmax(280px, 1fr)' : v).join(' ');
  ${cellHtml ? `for (let r = ${from}; r < c.length; r++) for (let q = 1; q <= 3; q++) c[r][q].outerHTML = ${JSON.stringify(cellHtml)};` : ''}
  const pill = [...document.querySelectorAll('span')].find(e => /^\\d+\\/24$/.test(e.textContent.trim())); if (pill) pill.lastChild.textContent = '${k}/18';
  const cnt = [...document.querySelectorAll('span')].find(e => /^\\d+\\/24 cells/.test(e.textContent.trim())); if (cnt) cnt.textContent = '${k}/18 cells · ${Math.round(k / 18 * 100)}%';
  const bar = cnt && cnt.nextElementSibling?.firstElementChild; if (bar) bar.style.width = '${Math.round(k / 18 * 100)}%'; }`;
const RUN = { pill: `[...document.querySelectorAll('span')].find(e => /^\\d+\\/18$/.test(e.textContent.trim()))?.closest('span.inline-flex, span[class*=rounded]')`, cnt: `[...document.querySelectorAll('span')].find(e => /^\\d+\\/18 cells/.test(e.textContent.trim()))`, cancel: `H.btn('Cancel')` };
await plate('runQ', 's24-q4-queued', running(queuedCell, 0), RUN);
await plate('runT', 's24-q4-queued', running(thinkCell, 0), RUN);
for (let k = 0; k <= 18; k += 1) { const n = 'runA' + String(k).padStart(2, '0'); if (k === 18 || k === 0) await plate(n, 's24-q4-queued', running(null, k), { ...RUN, ...Object.fromEntries([1, 2, 3, 4, 5, 6].flatMap(r => [1, 2, 3].map(q => ['c' + r + q, `H.cells()[${r}][${q}]`]))) }); }
for (let r = 1; r <= 5; r++) await plate('runR' + r, 's24-q4-queued', running(thinkCell, r * 3, r + 1), RUN);
// the status line for each count (small sprite, the rest of the page comes from runA00 / runA18)
for (let k = 0; k <= 18; k++) await sprite('st' + String(k).padStart(2, '0'), 's24-q4-queued', running(null, k), `[...document.querySelectorAll('span')].find(e => /^\\d+\\/18 cells/.test(e.textContent.trim()))?.parentElement`);
// ---------------------------------------------------------------- the finished table, sources, filter
const CELLS = Object.fromEntries([1, 2, 3, 4, 5, 6].flatMap(r => [1, 2, 3].map(q => ['c' + r + q, `H.cells()[${r}][${q}]`])));
await plate('done', 's17-completed', '', { ...CELLS, cite31: `[...H.cells()[3][1].querySelectorAll('*')].find(e => e.textContent.trim().startsWith('1') && e.textContent.includes('Page 1') && e.children.length < 4)`,
  filter1: `H.al('Filter by question 1')`, addCol: `H.al('Add a question column')`, exportBtn: `H.btn('Export')`, newRev: `H.btn('New review')` });
await plate('cell', 's18-cell-source', '', { page1: `H.text('Page 1', 3) || H.text('Page 1')`, passage: `[...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.trim().startsWith('5.2 Each party shall be liable'))`,
  close: `H.card('Liability cap')?.querySelector('header button')`, card: `H.card('Liability cap')`, doc: `H.card('Liability cap')?.querySelector('a,button[aria-label^=Open], [class*=border]')` });
await plate('cellN', 's18-cell-source', `H.hideCard('Liability cap')`, {});
await sprite('pCell', 's18-cell-source', '', `H.card('Liability cap')`, {});
const FMENU = `[...document.querySelectorAll('[data-radix-popper-content-wrapper]')].find(e => e.innerText.includes('Yes'))`;
await plate('fOpen', 's19-filter-menu', `{ const m = ${FMENU}; if (m) m.style.visibility = 'hidden'; }`, { filter1: `H.al('Filter by question 1')` });
await sprite('menuFilter', 's19-filter-menu', '', FMENU, { no: `H.text('No', 0)`, yes: `H.text('Yes', 0)` });
await plate('fNo', 's20-filter-no', '', { no: `H.text('No', 0)`, revFiltered: `H.btn('Review filtered')` });
await plate('fDone', 's21-filtered', '', { of6: `H.text('2 of 6 documents')`, clear: `H.text('2 of 6 documents')?.nextElementSibling`, revFiltered: `H.btn('Review filtered')` });
// ---------------------------------------------------------------- 11 a question added later (the grid scrolled to its right end, as in staging)
const Q4 = { ...PANELQ, card: `H.card('Question 4')`, close: `H.card('Question 4')?.querySelector('header button')`, bar: `H.text('Run review on 6 new cells') || H.text('Add at least one new source or question.')`, run: `H.btn('Run review')` };
const emptyHead4 = (await grab('s29-q5-empty', '', `H.cells()[0][5]`)).replace('Question 5', 'Question 4');
const head4 = `{ const c = H.cells(); c[0][4].outerHTML = ${JSON.stringify(emptyHead4)}; }`;
const barEmpty = await grab('s17-completed', '', `H.text('Add at least one new source or question.')?.parentElement?.parentElement`);
await plate('q4Nd', 's22-q4-panel', `H.scrollTo(138); H.hideCard('Question 4')`, {});
await plate('doneR', 's17-completed', `H.scrollRight()`, {});
await plate('q4d', 's22-q4-panel', `H.scrollTo(138)`, Q4);
await plate('q4a', 's22-q4-panel', `H.scrollTo(138); ${head4} H.setInput(''); H.setArea(''); { const b = H.text('Run review on 6 new cells')?.parentElement?.parentElement; if (b) b.outerHTML = ${JSON.stringify(barEmpty)}; }`, Q4);
await plate('q4N', 's22-q4-panel', `H.scrollTo(138); ${head4} { const b = H.text('Run review on 6 new cells')?.parentElement?.parentElement; if (b) b.outerHTML = ${JSON.stringify(barEmpty)}; } H.hideCard('Question 4')`, {});
await sprite('pQ4a', 's22-q4-panel', `H.scrollRight(); H.setInput(''); H.setArea('');`, `H.card('Question 4')`, Q4);
await sprite('pQ4d', 's22-q4-panel', `H.scrollRight()`, `H.card('Question 4')`, Q4);
await plate('q4done', 's23-q4-added', `H.scrollRight()`, { bar: `H.text('Run review on 6 new cells')`, run: `H.btn('Run review')`, sub: `H.text('6 documents × 1 question')` });
await plate('q4q', 's24-q4-queued', `H.scrollRight()`, {});
await plate('q4t', 's25-q4-thinking', `H.scrollRight()`, {});
await plate('q4p', 's26-q4-partial', `H.scrollRight()`, {});
await plate('q4z', 's27-q4-done', `H.scrollRight()`, { exportBtn: `H.btn('Export')`, ...Object.fromEntries([1, 2, 3, 4, 5, 6].map(r => ['g' + r, `H.cells()[${r}][4]`])) });
const spinBtn = await grab('s14-try-running', '', `H.btn('Try one cell')`);
await plate('q4exp', 's27-q4-done', `H.scrollRight(); { const e = H.btn('Export'); const s = ${JSON.stringify(spinBtn)}.replace('Try one cell', 'Export'); e.outerHTML = s; }`, { exportBtn: `H.btn('Export')` });
// the review list (a review stays in the matter)
await plate('list', 's28-review-list', '', { item: `H.text('Review – 6 documents × 3 questions')`, start: `H.btn('Start new review')` });

await b.close();
const merged = { ...RECTS, ...out };
writeFileSync(path.join(HERE, 'rects.json'), JSON.stringify(merged, null, 1));
writeFileSync(path.join(HERE, 'rects.js'), 'window.RECTS_DATA=' + JSON.stringify(merged) + ';\n');
console.log('plates ok', Object.keys(out).length);
