// Captures the Andri screens for Academy 8.1 as 2x plates plus element rects (app px, window 1440 x 860).
// Source: DOM snapshots of Andri staging taken 12 Oct 2026 on my own assignment "Summarise the ET3 (Academy 8.1)" in Nair
// (staging-snapshot/raw), localised by staging-snapshot/localize.py (Aldridge Vine, Adam Frith / AF, "(Academy 8.1)" dropped).
// FIX removes another session's "Summarise the ET3 (Academy test)" assignment and its counts from every page.
// In-between states are built only from parts of other real snapshots (DERIVED below), never drawn by hand.
import { chromium } from './pw.mjs'; import { writeFileSync, readFileSync } from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SNAP = path.join(HERE, '../staging-snapshot/loc');
const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const RECTS = (() => { try { return JSON.parse(readFileSync(path.join(HERE, 'rects.json'), 'utf8')); } catch { return {}; } })();
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 860 }, deviceScaleFactor: 2 });
pg.on('pageerror', e => console.log('ERR', String(e)));

const HELPERS = `window.H = {
  R(e) { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(v => Math.round(v * 10) / 10); },
  U(e) { let a = e.getBoundingClientRect(), x0 = a.left, y0 = a.top, x1 = a.right, y1 = a.bottom;
    for (const c of e.querySelectorAll('*')) { const r = c.getBoundingClientRect(); if (!r.width) continue; x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); }
    return [x0 - 1, y0 - 1, x1 - x0 + 2, y1 - y0 + 2].map(v => Math.round(v * 10) / 10); },
  vis(e) { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.x < 1440 && r.right > 0 && r.y < 860 && getComputedStyle(e).visibility !== 'hidden'; },
  text(t, nth = 0, root = document) { const m = [...root.querySelectorAll('body *')].filter(e => H.vis(e) && e.textContent.trim() === t && ![...e.children].some(c => c.textContent.trim() === t));
    m.sort((a, b) => { const p = a.getBoundingClientRect(), q = b.getBoundingClientRect(); return Math.abs(p.y - q.y) > 4 ? p.y - q.y : p.x - q.x; }); return m[nth]; },
  starts(t, nth = 0) { const m = [...document.querySelectorAll('body *')].filter(e => H.vis(e) && e.textContent.trim().startsWith(t) && ![...e.children].some(c => c.textContent.trim().startsWith(t))); return m[nth]; },
  btn(t, nth = 0) { return [...document.querySelectorAll('button,a,[role=menuitem],[role=option]')].filter(e => H.vis(e) && e.innerText.trim() === t)[nth]; },
  btnS(t, nth = 0) { return [...document.querySelectorAll('button,a,[role=menuitem],[role=option]')].filter(e => H.vis(e) && e.innerText.trim().startsWith(t))[nth]; },
  ph(p) { return [...document.querySelectorAll('input,textarea')].find(e => (e.placeholder || '').startsWith(p)); },
  panel() { return [...document.querySelectorAll('aside')].find(a => { const r = a.getBoundingClientRect(); return r.x > 800 && r.x < 1440 && r.width > 300; }); },
  dialog() { return [...document.querySelectorAll('[role=dialog]')].find(d => d.getAttribute('aria-label') !== 'Personalisation' && H.vis(d)); },
  pop() { return [...document.querySelectorAll('[data-radix-popper-content-wrapper]')].filter(H.vis).pop(); },
  // the text of a phrase as one rect per line (for the highlight sweep)
  phrase(t) { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; const all = []; while ((n = w.nextNode())) all.push(n);
    for (const nd of all) { const i = nd.textContent.indexOf(t); if (i < 0) continue; const r = document.createRange(); r.setStart(nd, i); r.setEnd(nd, i + t.length);
      return [...r.getClientRects()].filter(x => x.width > 2).map(x => [x.x, x.y, x.width, x.height].map(v => Math.round(v * 10) / 10)); } return null; },
  num(root, y1) { return [...root.querySelectorAll('*')].find(e => e.children.length === 0 && /^\\d+$/.test(e.textContent.trim()) && e.getBoundingClientRect().y < y1); },
  dec(el) { if (el) el.textContent = String(Math.max(0, +el.textContent.trim() - 1)); },
  // another session's assignment is left out of every screen (ACADEMY-LESSONS: show staging as it should be)
  fix() {
    const T = '(Academy test)';
    for (const e of [...document.querySelectorAll('body *')].filter(e => e.children.length === 0 && e.textContent.includes(T))) {
      if (!e.isConnected) continue;
      const li = e.closest('li'); if (li) { li.remove(); continue; }
      const card = [...(function* (a) { for (; a; a = a.parentElement) yield a; })(e)].find(a => String(a.className).includes('@container') && a.getBoundingClientRect().height < 260 && a.getBoundingClientRect().height > 60);
      if (card) { const lane = card.closest('section'); card.remove(); if (lane) H.dec(H.num(lane, lane.getBoundingClientRect().y + 45)); continue; }
      const row = e.closest('[class*="group/row"]'); if (row) { const sec = row.closest('section'); const rows = sec ? sec.querySelectorAll('[class*="group/row"]').length : 0;
        if (sec && rows <= 1) sec.remove(); else { row.remove(); if (sec) H.dec(H.num(sec, sec.getBoundingClientRect().y + 30)); } continue; }
    }
    const all = H.btnS('All'); if (all) H.dec(H.num(all, 9999));
    // the staging account's avatar initial (B, bb) becomes the demo partner's (AF)
    for (const e of [...document.querySelectorAll('span,div')].filter(e => e.children.length === 0 && /^(B|bb)$/.test(e.textContent.trim()))) { const r = e.getBoundingClientRect(); if (r.width < 40 && r.height < 40) e.textContent = 'AF'; }
  },
  content() { return document.querySelector('main > div > div > div'); },
  setVal(el, v) { if (!el) return; el.value = v; el.setAttribute('value', v); if (el.tagName === 'TEXTAREA') el.textContent = v; },
  hide(el) { if (el) { el.style.setProperty('visibility', 'hidden', 'important'); for (const c of el.querySelectorAll('*')) c.style.setProperty('visibility', 'hidden', 'important'); } },
  // popovers keep the position staging gave them in its 723 px tall window; the dialog they hang from re-centres at 860 px, so move them with it
  popTo(top) { const w = H.pop(); if (!w) return; const dy = top - w.getBoundingClientRect().top; w.style.transform = (w.style.transform || '') + ' translateY(' + dy + 'px)'; },
  shiftPop(top723) { const d = H.dialog(), w = H.pop(); if (!d || !w) return; const dy = d.getBoundingClientRect().top - top723; w.style.transform = (w.style.transform || '') + ' translateY(' + dy + 'px)'; },
  noPop() { document.querySelectorAll('[data-radix-popper-content-wrapper]').forEach(e => e.style.setProperty('display', 'none', 'important')); },
  row() { return [...document.querySelectorAll('[class*="group/row"]')].find(r => r.innerText.includes('Summarise the ET3')); },
  hideAll(els) { for (const e of els) H.hide(e); },
};`;
async function load(snap, js = '') {
  await pg.goto(pathToFileURL(path.join(SNAP, snap + '.html')).href, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.addScriptTag({ content: HELPERS });
  await pg.evaluate('H.fix()');
  if (js) await pg.evaluate(js);
  await pg.waitForTimeout(80);
}
const out = {};
const want = n => !only || only.test(n);
async function rects(spec) { const o = {}; for (const [k, ex] of Object.entries(spec || {})) { o[k] = await pg.evaluate(ex => { try { const e = eval(ex); return Array.isArray(e) ? e : e ? H.R(e) : null; } catch { return null; } }, ex); if (!o[k]) console.log('  no rect', k); } return o; }
async function plate(name, snap, js = '', spec = {}) {
  if (!want(name)) return; await load(snap, js);
  await pg.screenshot({ path: path.join(HERE, name + '.png'), clip: { x: 0, y: 0, width: 1440, height: 860 } });
  out[name] = await rects(spec); console.log('plate', name);
}
// floating UI captured alone: everything else hidden, backgrounds transparent, own shadow off (known-issues #1)
async function sprite(name, snap, js, sel, spec = {}) {
  if (!want(name)) return; await load(snap, js);
  const box = await pg.evaluate(sel => { const el = eval(sel); if (!el) return null; el.setAttribute('data-sprite', '1');
    for (const e of document.querySelectorAll('body *')) if (!e.closest('[data-sprite]') && !e.querySelector('[data-sprite]')) e.style.visibility = 'hidden';
    for (let e = el.parentElement; e; e = e.parentElement) { e.style.background = 'transparent'; e.style.boxShadow = 'none'; e.style.borderColor = 'transparent'; }
    document.documentElement.style.background = 'transparent'; document.body.style.background = 'transparent'; el.style.boxShadow = 'none';
    for (const c of el.querySelectorAll('*')) if (getComputedStyle(c).boxShadow !== 'none' && c.getBoundingClientRect().width > el.getBoundingClientRect().width * .9) c.style.boxShadow = 'none';
    return H.U(el); }, sel);
  if (!box) { console.log('NO SPRITE', name); return; }
  await pg.screenshot({ path: path.join(HERE, name + '.png'), clip: { x: box[0], y: box[1], width: box[2], height: box[3] }, omitBackground: true });
  out[name] = { box, ...(await rects(spec)) }; console.log('sprite', name, box.join(','));
}
async function grab(snap, js, ex) { await load(snap, js); return pg.evaluate(ex => eval(ex)?.outerHTML, ex); }

// ---------------------------------------------------------------- shared rect specs
const TOP = { tabAssign: `H.text('Assignments', 0)`, inbox: `[...document.querySelectorAll('a')].find(a => /\\/inbox$/.test(a.getAttribute('href') || ''))`, firm: `H.btnS('Aldridge Vine')` };
const BAR = { myWork: `H.btn('My work')`, viewAll: `H.btn('My work')?.nextElementSibling`, status: `H.btnS('All') || H.btnS('Backlog')`, matterF: `H.btn('Matter')`, dueF: `H.btn('Due date')`,
  prioF: `H.btn('Due date')?.nextElementSibling`, listV: `[...document.querySelectorAll('button')].filter(H.vis).find(b => /board/i.test(b.getAttribute('aria-label') || ''))?.previousElementSibling`,
  boardV: `[...document.querySelectorAll('button')].filter(H.vis).find(b => /board/i.test(b.getAttribute('aria-label') || ''))`, newBtn: `H.btn('New')`,
  filters: `(() => { const a = H.btnS('All') || H.btnS('Backlog'), z = H.btn('Due date')?.nextElementSibling; if (!a || !z) return null; const p = a.getBoundingClientRect(), q = z.getBoundingClientRect(); return [p.x, p.y, q.right - p.x, p.height].map(v => Math.round(v * 10) / 10); })()` };
const DLG = { title: `H.ph('Assignment title') || H.dialog()?.querySelector('[contenteditable],input,textarea')`, desc: `H.dialog()?.querySelector('[aria-label=Description]')?.closest('.relative')`,
  cStatus: `H.dialog() && [...H.dialog().querySelectorAll('button')].find(b => /^(To do|Backlog)$/.test(b.innerText.trim()))`, cPri: `H.dialog() && [...H.dialog().querySelectorAll('button')].find(b => /^(Normal|High|Urgent|Low)$/.test(b.innerText.trim()))`,
  cType: `H.dialog() && [...H.dialog().querySelectorAll('button')].find(b => /^(General|Review)$/.test(b.innerText.trim()))`, cWho: `H.dialog() && [...H.dialog().querySelectorAll('button')].find(b => b.innerText.trim() === 'Adam Frith')`,
  cMatter: `H.dialog() && [...H.dialog().querySelectorAll('button')].find(b => /^(Matter|Nair v Calderdale Logistics)$/.test(b.innerText.trim()))`, cDue: `H.dialog() && [...H.dialog().querySelectorAll('button')].find(b => /^(Due date|16 October 2026)$/.test(b.innerText.trim()))`,
  create: `H.btn('Create')`, dlg: `H.dialog()` };
const PAN = { panel: `H.panel()`, close: `[...(H.panel()?.querySelector('header')?.querySelectorAll('button') || [])].filter(H.vis).pop()`,
  status: `H.panel()?.querySelector('header button')`, delegate: `H.btnS('Delegate to Andri')`, runBg: `H.btnS('Run in the background')`, together: `H.btnS('Work together')`,
  stop: `H.btn('Stop')`, thread: `H.btnS('Open thread')`, change: `H.btn('Request change')`, markDone: `H.btnS('Mark done')`,
  addCheck: `H.ph('Add a checklist') || H.ph('Add an item')`, checkbox: `H.panel()?.querySelector('[role=checkbox]')`, checkItem: `H.panel()?.querySelector('[role=checkbox]')?.parentElement`,
  comment: `H.ph('Write a comment')`, who: `H.panel() && [...H.panel().querySelectorAll('button')].find(b => /^(Andri|Adam Frith)$/.test(b.innerText.trim()))`,
  activity: `H.starts('Activity')`, report: `H.phrase('Please check the point that it cites the 2013 Rules')`, mention: `H.starts('@Adam Frith')`,
  andriCard: `H.starts('Picking this up')?.closest('[class*=rounded]')` };
const ROW = { row: `H.row()`, rowTitle: `H.row()?.querySelector('.truncate')` };
const CARD = { card: `H.text('Summarise the ET3')?.closest('[class*="@container"]')`, review: `H.text('Andri finished')?.closest('button,a,[class*=rounded-full]')`, reviewLink: `[...document.querySelectorAll('*')].filter(e => H.vis(e) && e.children.length <= 2 && /^Review\s*$/.test(e.textContent) && e.getBoundingClientRect().y > 300).pop()`, laneTodo: `H.text('To do')`, laneRev: `H.text('In review')`, laneDone: `H.text('Done')` };
const POP = `H.pop()`;

// ---------------------------------------------------------------- 1 the board before anything exists (another session's card left out)
const boardHtml = await grab('a01-board-before', '', `H.content()`);
await plate('bE', 'a01-board-before', '', { ...TOP, ...BAR });
// ---------------------------------------------------------------- 2-3 New assignment, over the board (DERIVED: the dialog snapshots were taken over the list; the board behind is swapped in)
const overBoard = `H.content().outerHTML = ${JSON.stringify(boardHtml)}; H.fix();`;
await plate('n1', 'n01-new-empty', overBoard, { ...TOP, ...BAR, ...DLG });
await plate('n3', 'n03-typed', overBoard, DLG);
const emptyDesc = await grab('n01-new-empty', overBoard, `H.dialog().querySelector('[aria-label=Description]').closest('.relative')`);
await plate('n3t', 'n03-typed', overBoard + `H.dialog().querySelector('[aria-label=Description]').closest('.relative').outerHTML = ${JSON.stringify(emptyDesc)};`, DLG);   // title typed, description still empty
await sprite('mPri', 'n04-priority-menu', overBoard + `H.popTo(377.8);`, POP, { high: `H.btnS('High')` });
await plate('n4', 'n05-type-menu', overBoard + `H.noPop()`, DLG);            // High picked, menu closed
await sprite('mType', 'n05-type-menu', overBoard + `H.popTo(377.8);`, POP, { review: `H.btnS('Review')` });
await plate('n5', 'n07-matter-nair', overBoard + `H.noPop()`, DLG);          // Review picked
await sprite('mMat', 'n07-matter-nair', overBoard + `H.popTo(377.8);`, POP, { nair: `H.btnS('Nair v Calderdale Logistics')`, search: `H.ph('Search matters')` });
await plate('n6', 'n08-due-picker', overBoard + `H.noPop()`, DLG);           // Nair picked (Due date wraps to a second row)
await sprite('mCal', 'n08-due-picker', overBoard + `H.popTo(414.8);`, POP, { d16: `[...H.pop().querySelectorAll('button')].find(b => b.innerText.trim() === '16')` });
await plate('n9', 'n09-filled', overBoard, DLG);
// ---------------------------------------------------------------- 4 created: the card on the board under To do (DERIVED: the real card from the board snapshots,
// without the checklist and attachment chips it only got later; lanes and counts as staging shows them)
const cardHtml = await grab('b02-board-done', '', `(() => { const c = H.text('Summarise the ET3').closest('[class*="@container"]');
  for (const e of [...c.querySelectorAll('*')].filter(e => e.children.length === 0 && /^(1\\/1|2)$/.test(e.textContent.trim()))) { const chip = e.closest('[class*=rounded]'); if (chip && chip !== c) chip.remove(); }
  return c; })()`);
await plate('bC', 'a01-board-before', `{ const lanes = [...document.querySelectorAll('section')].filter(s => /^To do/.test(s.innerText.trim()));
  const lane = lanes[0]; const slot = lane.querySelector('[class*="-mx-[3px]"]') || lane.children[1]; slot.insertAdjacentHTML('afterbegin', ${JSON.stringify(cardHtml)});
  const n = H.num(lane, lane.getBoundingClientRect().y + 45); if (n) n.textContent = '1'; const all = H.btnS('All'); const m = all && H.num(all, 9999); if (m) m.textContent = '1'; }`, { ...TOP, ...BAR, ...CARD });
// ---------------------------------------------------------------- 5 the list, then the task opened in the side panel
await plate('lC', 'n10-created-list', '', { ...TOP, ...BAR, ...ROW });
await plate('dN', 'd01-detail-todo', `H.hide(H.panel())`, {});
await sprite('pD1', 'd01-detail-todo', '', `H.panel()`, PAN);
await plate('d1', 'd01-detail-todo', '', { ...BAR, ...ROW, ...PAN });
await plate('d2', 'd02-delegate-menu', '', PAN);
// ---------------------------------------------------------------- 6-7 Andri working (real timed snapshots: starting, then working, scrolled to the activity)
await plate('wS', 'w04-t6', '', { ...ROW, ...PAN });
await sprite('toast', 'w00-t0.6', '', `[...document.querySelectorAll('li,[data-sonner-toast]')].find(e => e.innerText.trim() === 'Andri is on it')`, {});
await plate('wW', 'w09-t30', '', { ...ROW, ...PAN });
// ---------------------------------------------------------------- 8-10 Andri done (In review, the report, the three buttons)
await plate('dF', 'd05-done-scrolled', '', { ...ROW, ...PAN });
// ---------------------------------------------------------------- 11 checklist and comments (panel scrolled back to the top)
await plate('dT', 'd04-done-top', '', { ...ROW, ...PAN });
await plate('c0', 'c01-checklist-typed', `H.setVal(H.ph('Add a checklist'), '')`, PAN);
await plate('c1', 'c01-checklist-typed', '', PAN);
await plate('c2', 'c02-checklist-saved', '', PAN);
await plate('c3', 'c03-mention-menu', '', { ...PAN, menu: POP + ` || [...document.querySelectorAll('[role=listbox],[role=menu]')].filter(H.vis)[0]`, andriOpt: `H.starts('Give Andri an instruction')` });
// ---------------------------------------------------------------- 12 Inbox
await plate('i1', 'i01-inbox', '', { ...TOP, item: `H.text('Summarise the ET3')?.closest('button')` });
await plate('i2', 'i02-inbox-open', '', { ...TOP, goTicket: `H.btnS('Go to ticket')` });
// ---------------------------------------------------------------- 13 the trainee: Company → Members → Invite (email typed in the rebuild only, never sent in staging)
const EMAIL = 'rosalind.keane@aldridgevine.co.uk';
const INV = { members: `H.text('Members')`, invite: `H.btnS('Invite Member')`, email: `H.ph('member@company.com')`, role: `H.dialog()?.querySelector('button[role=combobox], [role=combobox]') || H.text('Member', 1)?.closest('button')`,
  support: `H.text('Support')?.closest('[role=option]') || H.text('Support')`, x: `[...H.dialog().querySelectorAll('button')].find(b => b.querySelector('.lucide-x'))`, dlg: `H.dialog()` };
await plate('k0', 'm00-company', '', { ...TOP, ...INV });
await plate('k1', 'm01-members', '', { ...TOP, ...INV });
await plate('k2', 'm02-invite-empty', '', INV);
await plate('k2e', 'm02-invite-empty', `H.setVal(H.ph('member@company.com'), ${JSON.stringify(EMAIL)})`, INV);
await plate('k3', 'm03-role-menu', `H.noPop();` + `H.setVal(H.ph('member@company.com'), ${JSON.stringify(EMAIL)})`, INV);
await sprite('mRole', 'm03-role-menu', `H.popTo(546.3)`, POP, { support: `H.text('Support')` });
await plate('k4', 'm04-invite-support', `H.setVal(H.ph('member@company.com'), ${JSON.stringify(EMAIL)})`, INV);
// ---------------------------------------------------------------- 14 back to Assignments (list, In review), then the board
// DERIVED: the wide list from the created-list snapshot, with the In review group holding my real "Andri done" row from the done snapshot
const doneRow = await grab('d05-done-scrolled', '', `H.row()`);
const rawN10 = readFileSync(path.join(SNAP, 'n10-created-list.html'), 'utf8');
await plate('lD', 'n10-created-list', '', {});   // placeholder load (replaced below)
if (want('lD')) {
  await pg.goto(pathToFileURL(path.join(SNAP, 'n10-created-list.html')).href, { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready); await pg.addScriptTag({ content: HELPERS });
  await pg.evaluate(doneRow => { const secs = [...document.querySelectorAll('section')]; const rev = secs.find(s => /^In review/.test(s.innerText.trim())), todo = secs.find(s => /^To do/.test(s.innerText.trim()));
    const old = rev.querySelector('[class*="group/row"]'); old.outerHTML = doneRow; todo.remove(); H.fix(); const all = H.btnS('All'); const m = all && H.num(all, 9999); if (m) m.textContent = '1'; }, doneRow);
  await pg.waitForTimeout(80); await pg.screenshot({ path: path.join(HERE, 'lD.png'), clip: { x: 0, y: 0, width: 1440, height: 860 } });
  out.lD = await rects({ ...TOP, ...BAR, ...ROW }); console.log('plate lD (derived)');
}
await plate('bR', 'b01-board-after', '', { ...TOP, ...BAR, ...CARD });
await plate('rN', 'r01-board-panel', `H.hide(H.panel())`, {});
await sprite('pR1', 'r01-board-panel', '', `H.panel()`, PAN);
await plate('r1', 'r01-board-panel', '', { ...PAN, ...CARD });
await plate('r2', 'r02-checked', '', { ...PAN, ...CARD });
await plate('r3', 'r03-checked-scrolled', '', { ...PAN, ...CARD });
await plate('r5', 'r05-done', '', { ...PAN, ...CARD });
await plate('bD', 'b02-board-done', '', { ...TOP, ...BAR, ...CARD });

await b.close();
const merged = { ...RECTS, ...out };
writeFileSync(path.join(HERE, 'rects.json'), JSON.stringify(merged, null, 1));
writeFileSync(path.join(HERE, 'rects.js'), 'window.RECTS_DATA=' + JSON.stringify(merged) + ';\n');
console.log('plates ok', Object.keys(out).length);
