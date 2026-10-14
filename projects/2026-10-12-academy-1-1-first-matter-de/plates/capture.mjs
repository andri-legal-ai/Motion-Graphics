// Captures the Andri screens for Academy 1.1 German as 2x plates plus element rects (app px, window 1440 x 860).
// Source: DOM snapshots of Andri staging, firm language German, taken 12 Oct 2026 in my own matter "Academy 1.1 DE"
// (staging-snapshot/raw, localised by staging-snapshot/localize.py: Aldridge Vine / AF, matter "Nair ./. Calderdale Logistics").
// The empty matter and empty Knowledge Base come from the existing empty test matter "Academy 4.1" (viewed only), renamed.
// Plate names follow the 1.1 English app.js where the screen plays the same part; new screens have new names.
// In-between states are built only from parts of real snapshots, never drawn by hand.
// Usage: node capture.mjs [regex of plate names to redo]
import { createRequire } from 'node:module'; import { writeFileSync, readFileSync } from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/Users/bennettnittke/.local/node/lib/node_modules/@playwright/cli/node_modules/playwright')); }
const HERE = path.dirname(fileURLToPath(import.meta.url));
const LOC = path.join(HERE, '../staging-snapshot/loc');
const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const TR = JSON.parse(readFileSync(path.join(HERE, 'tr-de.json'), 'utf8'));
const OUT = (() => { try { return JSON.parse(readFileSync(path.join(HERE, 'rects.json'), 'utf8')); } catch { return {}; } })();
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 860 }, deviceScaleFactor: 2 });
pg.on('pageerror', e => console.log('ERR', String(e)));
const P = n => path.join(HERE, n + '.png');
const full = { x: 0, y: 0, width: 1440, height: 860 };

// helpers available in every page as H
const HELPERS = `window.TRX = window.TRX || {}; const _de = t => window.TRX[t] || t; const _is = (a, t) => a === t || a === _de(t); const _st = (a, t) => a.startsWith(t) || a.startsWith(_de(t));
window.H = {
  R(e) { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(v => Math.round(v * 10) / 10); },
  vis(e) { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; },
  aria(l, nth = 0) { return [...document.querySelectorAll('[aria-label]')].filter(e => _is(e.getAttribute('aria-label') || '', l) && H.vis(e))[nth]; },
  btn(t, nth = 0) { return [...document.querySelectorAll('button,a,[role=button],[role=option]')].filter(e => H.vis(e) && _is(e.innerText.trim(), t))[nth]; },
  btnS(t, nth = 0) { return [...document.querySelectorAll('button,a,[role=button],[role=option]')].filter(e => H.vis(e) && _st(e.innerText.trim(), t))[nth]; },
  text(t, nth = 0) { return [...document.querySelectorAll('body *')].filter(e => H.vis(e) && _is(e.textContent.trim(), t) && ![...e.children].some(c => _is(c.textContent.trim(), t)))[nth]; },
  starts(t, nth = 0) { return [...document.querySelectorAll('body *')].filter(e => H.vis(e) && _st(e.textContent.trim(), t) && ![...e.children].some(c => _st(c.textContent.trim(), t)))[nth]; },
  ph(p) { return [...document.querySelectorAll('input,textarea')].find(e => _st(e.placeholder || '', p)); },
  card() { return [...document.querySelectorAll('div')].find(e => (e.className + '').includes('rounded-andri-lg') && (e.className + '').includes('overflow-hidden') && e.getBoundingClientRect().width > 500); },
  thread() { return document.querySelector('.chat-scroll-container'); },
  // union of an element and every child (rows with buttons that stick out)
  // union of an element's visible boxes (works for display: contents wrappers too)
  U(e, pad = 1) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const add = r => { if (!r.width || !r.height) return; x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); };
    add(e.getBoundingClientRect()); for (const c of e.querySelectorAll('*')) { const cs = getComputedStyle(c); if (cs.visibility === 'hidden' || cs.position === 'absolute' || cs.position === 'fixed') continue; add(c.getBoundingClientRect()); }
    return [x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad].map(v => Math.round(v * 10) / 10); },
  setText(e, t) { if (e) e.textContent = t; },
  rail(l) { return [...document.querySelectorAll('a,button')].find(e => { const r = e.getBoundingClientRect(); return r.x < 30 && r.width > 20 && r.y > 100 && [e.getAttribute('aria-label'), e.getAttribute('title'), e.innerText.trim()].some(v => v && _is(v, l)); }); },
  kb() { return [...document.querySelectorAll('button')].filter(b => _st(b.textContent.trim(), 'Knowledge Base') && b.getBoundingClientRect().width > 100).sort((p, q) => q.getBoundingClientRect().x - p.getBoundingClientRect().x)[0]; },
};`;
// every page: demo state of a new matter (Conversations 1, no conversation name, Inbox 1), card not scrolled
const FIX = `(() => {
  document.getElementById('__dump')?.remove();
  // snapshots taken while staging was back in English (v2 run): the top bar gets the German labels German mode shows
  // (seen 12 Oct: Fälle, Aufgaben, Entdecken); everything inside the matter is the same in both modes
  const TOP = { Matters: 'Fälle', Assignments: 'Aufgaben', Explore: 'Entdecken' };
  document.querySelectorAll('body *').forEach(e => { if (e.children.length === 0 && TOP[e.textContent.trim()] && e.getBoundingClientRect().top < 60) e.textContent = TOP[e.textContent.trim()]; });
  document.querySelectorAll('[data-sonner-toast], [data-sonner-toaster]').forEach(e => e.remove());
  // v2 snapshots came from a narrow window: the side panel kept its narrow inline width; at 1440 staging gives it 768 px (v1 run)
  document.querySelectorAll('div.h-full.shrink-0[style*="width"]').forEach(e => { if (parseFloat(e.style.width) > 0 && parseFloat(e.style.width) < 768) { e.style.transition = 'none'; e.style.width = '768px'; e.querySelectorAll('[style*="width"]').forEach(c => { if (parseFloat(c.style.width) === 376) { c.style.transition = 'none'; c.style.width = '768px'; } }); } });
  const c = H.card(); if (c) c.scrollTop = 0;
  const conv = H.btnS('Conversations'); if (conv) { const n = [...conv.querySelectorAll('*')].find(e => e.children.length === 0 && /^\\d+$/.test(e.textContent.trim())); if (n) n.textContent = '1';
    let seen = false; for (const ch of [...conv.children]) { if (seen) ch.remove(); else if (ch.contains(n)) seen = true; } }
  document.querySelectorAll('body *').forEach(e => { if (e.children.length === 0 && e.textContent.trim() === 'B' && e.getBoundingClientRect().width < 30) e.textContent = 'A'; });
  document.querySelectorAll('[class*="index-module_type"]').forEach(e => e.style.visibility = 'hidden');
  if (!window.KEEP_BELL) document.querySelectorAll('button[aria-label*="unread"]').forEach(bt => { if (bt.querySelector('.lucide-bell')) [...bt.children].forEach(c => { if (c.tagName.toLowerCase() !== 'svg') c.style.display = 'none'; }); });
  const inbox = H.btnS('Inbox'); if (inbox) { const n = [...inbox.querySelectorAll('*')].find(e => e.children.length === 0 && /^\\d+$/.test(e.textContent.trim())); if (n) n.textContent = '1'; }
})()`;

async function open(name, js = '', vh = 860, keepBell = false, MAP = null) {
  await pg.setViewportSize({ width: 1440, height: vh });
  await pg.goto(pathToFileURL(path.join(LOC, name + '.html')).href);
  await pg.waitForTimeout(250);
  await pg.evaluate(m => { window.TRX = m; }, TR.exact); await pg.evaluate(HELPERS); await pg.evaluate(k => { window.KEEP_BELL = k; }, keepBell); await pg.evaluate(FIX);

  if (js) { try { await pg.evaluate(js); } catch (e) { console.log('JS FAIL in', name, String(e).slice(0, 200), '\n', js.slice(0, 300)); throw e; } }
  // German interface (Bennett, 13 Oct 2026): every English UI text becomes German; layout untouched
  if (!MAP) await pg.evaluate(TR => { const rx = TR.regex.map(([a, b]) => [new RegExp(a), b]); const pre = Object.entries(TR.prefix);
    const tr = s => { const t = s.replace(/\s+/g, ' ').trim(); if (!t) return null; if (TR.exact[t] !== undefined) return s.replace(t, TR.exact[t]);
      for (const [r, b] of rx) if (r.test(t)) return t.replace(r, b); for (const [k, v] of pre) if (t.startsWith(k)) return v; return null; };
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const nodes = []; let n; while ((n = w.nextNode())) nodes.push(n);
    for (const n of nodes) { if (n.parentElement && n.parentElement.closest('script,style,.whitespace-pre-wrap')) continue; const r = tr(n.textContent); if (r !== null) n.textContent = r; }
    document.querySelectorAll('[placeholder],[aria-label],[title]').forEach(e => { for (const a of ['placeholder', 'aria-label', 'title']) { const v = e.getAttribute(a); if (v) { const r = tr(v); if (r !== null) e.setAttribute(a, r); } } });
  }, TR);
  if (MAP) await pg.evaluate(M => { const pre = Object.entries(M.prefix || {});
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const nodes = []; let n; while ((n = w.nextNode())) nodes.push(n);
    for (const n of nodes) { const t = n.textContent.replace(/\s+/g, ' ').trim(); if (!t) continue; const opt = n.parentElement && n.parentElement.closest('[role=option]');
      const k = opt && M.map[t + '_option'] ? t + '_option' : t; if (M.map[k] !== undefined) { n.textContent = n.textContent.replace(t, M.map[k]); continue; }
      for (const [a, b] of pre) if (t.startsWith(a)) { n.textContent = b; break; } }
    document.querySelectorAll('[placeholder],[aria-label],[title]').forEach(e => { for (const a of ['placeholder', 'aria-label', 'title']) { const v = e.getAttribute(a); if (v && M.map[v] !== undefined) e.setAttribute(a, M.map[v]); } });
  }, MAP);
  await pg.waitForTimeout(150);
}
const want = n => !only || only.test(n);
async function plate(n, src, js = '', rects = '({})', vh = 860, MAP = null) { if (!want(n)) return; await open(src, js, vh, false, MAP); await pg.screenshot({ path: P(n), clip: { x: 0, y: 0, width: 1440, height: vh } });
  try { OUT[n] = await pg.evaluate(rects); } catch (e) { console.log('RECTS FAIL', n, await pg.evaluate(`[...document.querySelectorAll('button,a')].filter(b => b.getBoundingClientRect().y < 60 && b.getBoundingClientRect().width > 0).map(b => JSON.stringify(b.textContent.trim())).join(' ')`)); throw e; } console.log('plate', n); }
// a floating element alone on transparent (rounded corners stay clean, shadow drawn on canvas)
async function sprite(n, src, sel, js = '', rects = '({})') {
  if (!want(n)) return; await open(src, js);
  const extra = await pg.evaluate(rects);
  const h = await pg.evaluateHandle(sel);
  await pg.evaluate(e => { e.dataset.keep = '1'; for (let p = e.parentElement; p; p = p.parentElement) p.dataset.keepPath = '1';
    document.querySelectorAll('body *').forEach(x => { if (!x.dataset.keep && !x.dataset.keepPath && !x.closest('[data-keep]')) x.style.visibility = 'hidden'; });
    for (let p = e.parentElement; p; p = p.parentElement) { p.style.background = 'transparent'; p.style.boxShadow = 'none'; p.style.backdropFilter = 'none'; }
    document.documentElement.style.background = 'transparent'; document.body.style.background = 'transparent'; e.style.boxShadow = 'none'; }, h);
  const box = await pg.evaluate(e => H.R(e), h);
  await pg.screenshot({ path: P(n), clip: { x: box[0], y: box[1], width: box[2], height: box[3] }, omitBackground: true });
  OUT[n] = { box, ...extra }; console.log('sprite', n);
}


// ---------------------------------------------------------------- 0 the language switch (new step, Bennett 13 Oct 2026)
// Kanzlei settings captured in Dutch mode (13 Oct), shown in English before the switch and in German after it,
// with the labels Andri shows in each language. The page is taller than the window: captured 1440 x 1000, scrolled on canvas.
const CO = JSON.parse(readFileSync(path.join(HERE, '../staging-snapshot/tr-company.json'), 'utf8'));
const MAP_EN = { map: CO.en, prefix: CO.prefix_en }, MAP_DE = { map: CO.de, prefix: CO.prefix_de };
const MAP_LIST_EN = { map: Object.assign({}, CO.list_en), prefix: {} };
const LIST_EN = `(() => { const rows = [...document.querySelectorAll('tbody tr')]; const tpl = rows.find(r => r.innerText.startsWith('Academy 6.1'));
  const body = tpl.parentElement; rows.forEach(r => r.remove());
  for (const [n, s, d] of [['Hallam / Brightwater supply', 'Case knowledge base: a commercial dispute over a supply agreement for haulage services', '29 Sept 2026'],
    ['Okafor v Pennine Health', 'Case knowledge base: an employment law matter on a flexible working request that was refused', '24 Sept 2026'],
    ['Van Hoven lease renewal', 'Case knowledge base: a commercial lease renewal for warehouse premises in Wakefield', '22 Sept 2026'],
    ['Marsh estate', 'Case knowledge base: a contentious probate matter concerning a 2019 will', '21 Sept 2026']]) { const r = tpl.cloneNode(true);
    const leafs = [...r.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim());
    leafs.find(e => e.textContent.trim() === 'Academy 6.1').textContent = n; leafs.find(e => e.textContent.trim().startsWith('Case Knowledge Base')).textContent = s;
    leafs.find(e => e.textContent.trim() === '12 Oct 2026').textContent = d; body.appendChild(r); } })()`;
const CHIP = `({ chip: H.R([...document.querySelectorAll('button,a')].find(b => b.textContent.trim() === 'Aldridge Vine' && b.getBoundingClientRect().y < 60)),
  navFirst: H.R([...document.querySelectorAll('a,button')].find(e => ['Fälle', 'Matters', 'Zaken'].includes(e.textContent.trim()) && e.getBoundingClientRect().y < 60)) })`;
await plate('listEN', 'list', LIST_EN, CHIP, 860, MAP_LIST_EN);
const CORECTS = `({ trig: H.R(document.querySelector('button[role=combobox]')), opts: [...document.querySelectorAll('[role=option]')].map(H.R),
  upd: H.R([...document.querySelectorAll('button[type=submit],button')].filter(b => /bijwerken|Update Company|aktualisieren/i.test(b.textContent)).pop()), chip: H.R([...document.querySelectorAll('button,a')].find(b => b.textContent.trim() === 'Aldridge Vine' && b.getBoundingClientRect().y < 60)),
  navFirst: H.R([...document.querySelectorAll('a,button')].find(e => ['Fälle', 'Matters', 'Zaken'].includes(e.textContent.trim()) && e.getBoundingClientRect().y < 60)) })`;
const CHECK_EN = `(() => { const o = [...document.querySelectorAll('[role=option]')]; const sel = o.find(x => x.getAttribute('data-state') === 'checked'); const chk = sel.querySelector('span'); const ck = chk && chk.querySelector('svg') ? chk : null;
  if (ck) o[0].prepend(ck); o.forEach(x => { x.setAttribute('data-state', 'unchecked'); x.removeAttribute('data-highlighted'); x.style.background = ''; });
  o[0].setAttribute('data-state', 'checked'); o[0].setAttribute('data-highlighted', ''); })()`;
const TRIG = v => `(() => { const s = document.querySelector('button[role=combobox] span'); if (s) s.textContent = '${v}'; })()`;
await plate('coEN', 'co-page', '', CORECTS, 1000, MAP_EN);                       // Company page, English, Language: English
await plate('coENdd', 'co-dropdown', CHECK_EN, CORECTS, 1000, MAP_EN);          // dropdown open, English ticked
await plate('coENde', 'co-page', TRIG('Duits'), CORECTS, 1000, MAP_EN);         // German chosen, not saved yet (page still English)
await plate('coDE', 'co-page', TRIG('Duits'), CORECTS, 1000, MAP_DE);           // saved: Kanzlei page in German, Sprache: Deutsch

// ---------------------------------------------------------------- 1 matters list and New Matter
// The other rows are another session's and my own test matters; the list shows the four demo matters of the English 1.1 instead,
// built from staging's own rows (summary text in staging's English summary style).
// names in German (Bennett, 12 Oct: everything in the language except Andri's own text); the summaries stay in English,
// because Andri writes its summaries in English even for German files (seen in staging, 12 Oct)
const DEMO = [['Hallam / Brightwater', 'Fallwissensdatenbank: Handelsstreit über einen Liefervertrag für Speditionsleistungen', '29 Sept 2026'],
  ['Okafor ./. Pennine', 'Fallwissensdatenbank: arbeitsrechtliche Sache zu einem abgelehnten Antrag auf flexible Arbeitszeiten', '24 Sept 2026'],
  ['Van Hoven Miete', 'Fallwissensdatenbank: Verlängerung eines gewerblichen Mietvertrags für Lagerflächen in Wakefield', '22 Sept 2026'],
  ['Nachlass Marsh', 'Fallwissensdatenbank: streitige Nachlasssache zu einem Testament von 2019', '21 Sept 2026']];
const LIST = `(() => { const rows = [...document.querySelectorAll('tbody tr')]; const tpl = rows.find(r => r.innerText.startsWith('Academy 6.1'));
  const body = tpl.parentElement; rows.forEach(r => r.remove());
  for (const [n, s, d] of ${JSON.stringify(DEMO)}) { const r = tpl.cloneNode(true); const tds = r.children;
    const leafs = [...r.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim());
    leafs.find(e => e.textContent.trim() === 'Academy 6.1').textContent = n;
    leafs.find(e => e.textContent.trim().startsWith('Case Knowledge Base')).textContent = s;
    leafs.find(e => e.textContent.trim() === '12 Oct 2026').textContent = d; body.appendChild(r); } })()`;
const LISTR = `({ btnNew: H.R(H.btn('Neuer Fall')) })`;
await plate('list', 'list', LIST, LISTR);
const DLG = `({ dlg: H.R([...document.querySelectorAll('[role=dialog].andri-dialog')].find(H.vis)), dlgIn: H.R(document.getElementById('dlgIn') || H.ph('Enter matter name')), btnCreate: H.R(H.btn('Create')), btnNew: H.R(H.btn('Neuer Fall')) })`;
await plate('dlg0', 'dlg-empty', LIST + `;(() => { const i = document.getElementById('dlgIn') || H.ph('Enter matter name'); i.style.borderColor = 'rgb(36, 30, 25)'; i.style.boxShadow = '0 0 0 3px rgba(36, 30, 25, .5)'; })()`, DLG);                                      // placeholder, Create disabled
await plate('dlgE', 'dlg-typed', LIST + `;(() => { const i = H.ph('Enter matter name'); i.id = 'dlgIn'; i.value = ''; i.setAttribute('value', ''); i.placeholder = ''; })();(() => { const i = document.getElementById('dlgIn') || H.ph('Enter matter name'); i.style.borderColor = 'rgb(36, 30, 25)'; i.style.boxShadow = '0 0 0 3px rgba(36, 30, 25, .5)'; })()`, DLG);  // enabled, text drawn on canvas
// ---------------------------------------------------------------- 2 the new matter, empty
await plate('m0', 'm0', '', `({ btnKB: H.R(H.kb()) })`);
// ---------------------------------------------------------------- 3 Knowledge Base, empty, and the upload dialog
const KBR = `({ btnUp: H.R(H.btn('Upload Matter Documents')), btnEmail: H.R(H.btn('Email Documents')), railChatKB: H.R(H.rail('Chat')) })`;
await plate('kb0', 'kb-empty', '', KBR);
// upload dialog: the files chosen are the six case files plus the firm's letter template (seventh row built from a real Word row)
const ADD7 = `(() => { const lab = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.startsWith('Selected files per upload')); lab.textContent = lab.textContent.replace(/\\d+$/, '7');
  const sp = [...document.querySelectorAll('span')].find(e => e.textContent.trim() === '10_Vergleichsangebot.docx'); const row = sp.closest('.group'); const r = row.cloneNode(true);
  [...r.querySelectorAll('span')].find(e => e.textContent.trim() === '10_Vergleichsangebot.docx').textContent = 'Aldridge_Vine_Briefvorlage.docx';
  row.parentElement.appendChild(r); row.parentElement.scrollTop = 0; })()`;
const UPR = `({ dlg: H.R(H.text('Upload Matter Documents', 0).closest('[role=dialog]') || H.text('Upload Matter Documents', 0).parentElement), pickChoose: H.R(H.text('Choose files to upload')), pickUp: H.R(H.btn('Upload')), pickCancel: H.R(H.btn('Cancel')) })`;
const DIALOG = `(H.text('Upload Matter Documents', 1) || H.text('Upload Matter Documents', 0)).closest('[role=dialog]')`;
await sprite('pick0', 'upload-empty', DIALOG, '', UPR);
await sprite('pick1', 'upload-sel', DIALOG, ADD7, UPR);

// ---------------------------------------------------------------- 4 Knowledge Base rows: processing and done
const ROWS = `({ kbRows: [...document.querySelectorAll('tbody tr')].map(r => ({ row: H.R(r), status: H.R(r.children[4]) })), railChatKB: H.R(H.rail('Chat')), btnUp: H.R(H.btn('Upload Matter Documents')) })`;
await plate('kbDone', 'kb-done', '', ROWS);
await plate('kbProc', 'kb-done', `document.querySelectorAll('tbody tr').forEach(r => { for (const i of [3, 4, 5]) r.children[i].style.opacity = '0'; })`, ROWS);
// ---------------------------------------------------------------- 5 the matter with its files: greeting, Example questions
const BOX = `(() => { const ta = document.querySelector('.thread-pane-active textarea'); let b = ta; while (b && !(b.getAttribute('class') || '').includes('rounded-[1.5rem]')) b = b.parentElement; return b; })()`;
const GREETR = `({ cbox: H.R(${BOX}), eqBtn: H.R(H.aria('Example questions')), go: H.R(H.aria('Send')), btnKB: H.R(H.kb()), disc: H.R(H.starts('Andri is an AI system and can make mistakes, so please double-check responses.')) })`;
await plate('m1', 'm1-greet', '', GREETR);
const EQP = `document.querySelector('.composer-overlay[role=listbox]')`;
await plate('m1hot', 'eqp-open', `${EQP}.style.visibility = 'hidden'`, GREETR);
const EQR = `({ eqPick: H.R(H.starts('Erstelle eine SWOT-Analyse zur Position von Priya Nair')) })`;
await sprite('eqp0', 'eqp-open', EQP, '', EQR);
await sprite('eqp1', 'eqp-hover', EQP, '', EQR);
await plate('m1swot', 'cbox-swot', '', GREETR);
// v2: the first question is typed in German (no English Example question is sent). Box states from the typed snapshot.
const Q1BOX = h => `(() => { const ta = document.querySelector('.thread-pane-active textarea'); ta.value = ''; ta.textContent = ''; ta.placeholder = ''; ta.style.height = '${h}px'; ta.style.minHeight = '${h}px'; ta.style.color = 'transparent'; ta.style.caretColor = 'transparent';
  [...ta.parentElement.children].forEach(c => { if (c !== ta) c.style.visibility = 'hidden'; }); })()`;
const Q1R = `({ cbox: H.R(${BOX}), go: H.R(H.aria('Send')), eqBtn: H.R(H.aria('Example questions')), disc: H.R(H.starts('Andri is an AI system and can make mistakes, so please double-check responses.')),
  text0: (() => { const r = document.querySelector('.thread-pane-active textarea').getBoundingClientRect(); return [r.x + 16, r.y + 16, r.width - 32]; })() })`;
await plate('m1q1', 'v2-cbox-q1', Q1BOX(48), Q1R);
await plate('m1q2', 'v2-cbox-q1', Q1BOX(72), Q1R);


// ---------------------------------------------------------------- 6 the conversation
// answers are shortened by cutting whole blocks only (ACADEMY-LESSONS: cut, never reword)
const TURNS = `[...document.querySelector('.thread-pane-active .chat-scroll-container .flex.flex-col.space-y-4').children].filter(c => c.children.length)`;
const CUT = `(() => { const keep = [4, 3, 1]; ${TURNS}.forEach((t, i) => { const st = t.querySelector('[class~="space-y-2.5"]'); const ans = st.lastElementChild.querySelector('.stream-chunks');
  [...ans.children].forEach((c, j) => { if (j >= keep[i]) c.remove(); }); }); })()`;
const COMPOSER = `(() => { const ta = document.querySelector('.thread-pane-active textarea'); let b = ta; while (b && !(b.getAttribute('class') || '').includes('rounded-[1.5rem]')) b = b.parentElement; return b; })()`;
const HIDE_TEXT = `(() => { const ta = document.querySelector('.thread-pane-active textarea'); ta.style.color = 'transparent'; ta.style.caretColor = 'transparent'; ta.placeholder = '';
  [...ta.parentElement.children].forEach(c => { if (c !== ta) c.style.visibility = 'hidden'; }); })()`;
const DOCKR = `({ cbox: H.R(${COMPOSER}), go: H.R(H.aria('Send')), atb: H.R(H.aria('Mention documents')), railJobs: H.R(H.rail('Jobs')), disc: H.R(H.starts('Andri is an AI system and can make mistakes, so please double-check responses.')),
  text0: (() => { const ta = document.querySelector('.thread-pane-active textarea'); const r = ta.getBoundingClientRect(); return [r.x + 16, r.y + 16]; })() })`;
const THREAD_OFF = `(() => { const t = document.querySelector('.thread-pane-active .chat-scroll-container'); t.style.visibility = 'hidden'; t.style.opacity = '0'; })()`;
const MENU_PRE = `[...document.querySelectorAll('[role=listbox],.composer-overlay')].forEach(e => { if (e.textContent.includes('Matter Documents')) e.style.display = 'none'; })`;
// conversation frame (wide), thread and composer drawn separately
await plate('chat', 'v2-chat-thread', CUT + ';' + THREAD_OFF + `;${COMPOSER}.style.visibility = 'hidden'; H.starts('Andri is an AI system and can make mistakes, so please double-check responses.').style.visibility = 'hidden';`, `({ railJobs: H.R(H.rail('Jobs')), btnKB: H.R(H.kb()) })`);
// composer states (wide). Text is drawn on canvas over them.
await sprite('cboxDock', 'cbox-empty', COMPOSER, THREAD_OFF, DOCKR);                     // empty, placeholder
await sprite('cboxDockOn', 'at-et3', COMPOSER, HIDE_TEXT + ';' + THREAD_OFF + `;${MENU_PRE}`, DOCKR);               // text in the box (pencil, bookmark, send lit)
await sprite('cboxDockAt', 'at-et3-typed', COMPOSER, HIDE_TEXT + ';' + THREAD_OFF, DOCKR);          // after an @ pick: @ lit with its 1 badge
await sprite('cboxDock2', 'at-ald-chip', COMPOSER, HIDE_TEXT + ';' + THREAD_OFF, DOCKR);            // two lines: the request and the template chip
// disclaimer: cropped from the real page with the thread hidden, so it sits on the card's own white (a transparent cut-out picked up the page gray)
if (want('disc')) { await open('cbox-empty', ''); const r = await pg.evaluate(`H.R(H.starts('Andri is an AI system and can make mistakes, so please double-check responses.'))`);
  const clip = { x: r[0] - 6, y: r[1] - 2, width: r[2] + 12, height: r[3] + 4 }; await pg.screenshot({ path: P('disc'), clip }); OUT.disc = { box: [clip.x, clip.y, clip.width, clip.height] }; console.log('plate disc'); }
// the @ menus
const MENU = `[...document.querySelectorAll('[role=listbox],.composer-overlay')].find(e => H.vis(e) && (e.textContent.includes('Matter Documents') || e.textContent.includes('Falldokumente')))`;
await sprite('mp0', 'at-et3', MENU);
await sprite('mp2a', 'at-ald', MENU);
// the whole thread as one tall sprite + item rects relative to it (wide card)
if (want('thread')) {
  await open('v2-chat-thread', CUT, 860);
  const h = await pg.evaluate(`(() => { const t = document.querySelector('.thread-pane-active .chat-scroll-container'); return t.scrollHeight; })()`);
  await open('v2-chat-thread', CUT + `;(() => { const t = document.querySelector('.thread-pane-active .chat-scroll-container'); const c = H.card();
    c.style.height = '${h + 400}px'; c.style.maxHeight = 'none'; c.style.overflow = 'visible'; t.style.height = '${h}px'; t.style.maxHeight = 'none'; t.style.overflow = 'visible'; t.style.flex = 'none';
    ${COMPOSER}.style.visibility = 'hidden'; H.starts('Andri is an AI system and can make mistakes, so please double-check responses.').style.visibility = 'hidden';
    document.querySelectorAll('.thread-pane-active .chat-scroll-container ~ *, .fixed').forEach(e => { if (!e.contains(t)) e.style.visibility = 'hidden'; }); })()`, h + 600);
  const info = await pg.evaluate(`(() => { const t = document.querySelector('.thread-pane-active .chat-scroll-container'); const T = t.getBoundingClientRect();
    const rel = r => [r[0] - T.x, r[1] - T.y, r[2], r[3]].map(v => Math.round(v * 10) / 10);
    const turns = ${TURNS}; const o = { box: H.R(t), items: {} };
    turns.forEach((tu, i) => { const n = i + 1; const st = tu.querySelector('[class~="space-y-2.5"]'); const rows = [...st.children];
      o.items['ub' + n] = rel(H.U(tu.children[0], 2));
      o.items['steps' + n + '_children'] = rows.slice(0, -1).map(r => { const q = r.getBoundingClientRect(); return rel([q.x - 2, q.y - 2, q.width + 4, q.height + 4]); });
      const ans = rows[rows.length - 1]; const chunks = [...ans.querySelector('.stream-chunks').children];
      o.items['ans' + n + '_children'] = chunks.map(c => rel(H.U(c, 2)));
      o.items['ans' + n + '_dot'] = rel(H.U(ans, 2));
      const act = tu.querySelector('.mt-4.flex-shrink-0'); if (act) o.items['act' + n] = rel(H.U(act, 2)); });
    const cite = [...turns[0].querySelectorAll('.stream-chunks button')].find(b => ((b.getAttribute('aria-label') || '') + b.textContent).includes('05_Urteil_Arbeitsgericht'));
    o.items.cite1 = rel(H.R(cite)); return o; })()`);
  await pg.screenshot({ path: P('thread'), clip: { x: info.box[0], y: info.box[1], width: info.box[2], height: h }, omitBackground: false });
  OUT.thread = info; console.log('thread', h, Object.keys(info.items).join(','));
  await pg.setViewportSize({ width: 1440, height: 860 });
}

// ---------------------------------------------------------------- 7 source panel (narrow card + PDF viewer)
const SIDE = `[...document.querySelectorAll('div')].find(e => { const r = e.getBoundingClientRect(); return (e.getAttribute('class') || '').includes('shrink-0') && r.x > 600 && r.width > 700 && r.height > 700; })`;
const PANEL_OFF = `(() => { const s = ${SIDE}; const R = s.getBoundingClientRect(); s.style.visibility = 'hidden';
  document.querySelectorAll('body *').forEach(e => { const r = e.getBoundingClientRect(); if (r.width && r.left >= R.left - 1 && r.top >= R.top - 1 && !e.closest('.thread-pane-active')) e.style.visibility = 'hidden'; }); })()`;
const NARROW = y => `(() => { const t = document.querySelector('.thread-pane-active .chat-scroll-container'); t.style.scrollBehavior = 'auto'; const c = [...t.querySelectorAll('.stream-chunks button')].find(b => ((b.getAttribute('aria-label') || '') + b.textContent).includes('05_Urteil_Arbeitsgericht'));
  t.scrollTop = 0; t.scrollTop = c.getBoundingClientRect().y - ${y}; })()`;
const BOTTOM = `(() => { const t = document.querySelector('.thread-pane-active .chat-scroll-container'); t.style.scrollBehavior = 'auto'; t.scrollTop = t.scrollHeight; })()`;
await plate('split', 'v2-src-open', CUT + ';' + NARROW(470) + ';' + PANEL_OFF, `({ cite: H.R([...document.querySelectorAll('.thread-pane-active .stream-chunks button')].find(b => ((b.getAttribute('aria-label') || '') + b.textContent).includes('05_Urteil_Arbeitsgericht'))) })`);
const SRCR = `(() => { const p = ${SIDE}.getBoundingClientRect(); const marks = [...document.querySelectorAll('mark.pdf-citation-highlight')].map(m => m.getBoundingClientRect());
  const x0 = Math.min(...marks.map(m => m.left)), y0 = Math.min(...marks.map(m => m.top)), x1 = Math.max(...marks.map(m => m.right)), y1 = Math.max(...marks.map(m => m.bottom));
  const cl = H.aria('Close') ; const c = [...document.querySelectorAll('button[aria-label=Close], button[aria-label="Schließen"]')].map(b => b.getBoundingClientRect()).find(r => r.x > 1300 && r.y < 130);
  return { panel: [p.x, p.y, p.width, p.height], para: [x0 - p.x, y0 - p.y, x1 - x0, y1 - y0], lines: marks.map(m => [m.x - p.x, m.y - p.y, m.width, m.height]), close: [c.x - p.x, c.y - p.y, c.width, c.height] }; })()`;
await sprite('src0', 'src-open', SIDE, `document.querySelectorAll('mark.pdf-citation-highlight').forEach(m => m.style.background = 'transparent')`, `({ src: ${SRCR} })`);
await sprite('src1', 'src-open', SIDE, '', `({ src: ${SRCR} })`);
if (OUT.src1) OUT.src = OUT.src1.src;
// ---------------------------------------------------------------- 8 Jobs panel and the letter
if (want('jobs')) {
  await open('v2-jobs-panel', CUT + ';' + BOTTOM + ';' + PANEL_OFF, 860, true);
  await pg.screenshot({ path: P('jobsSplit'), clip: full });
  OUT.jobsSplit = await pg.evaluate(`({ railJobs: H.R(H.rail('Jobs')) })`); console.log('plate jobsSplit');
}
const OLDROW = `[...document.querySelectorAll('li')].filter(l => l.textContent.includes('Sachstandsbrief_Nair_2026-10-12.docx')).forEach(l => l.remove())`;
const JOBR = `({ jobRow: H.R([...document.querySelectorAll('li')].find(l => H.vis(l) && l.textContent.includes('Sachstandsbrief_Nair.docx'))) })`;
await sprite('jobsP', 'v2-jobs-panel', SIDE, OLDROW, JOBR);

const PAGE1 = 'data:image/png;base64,' + readFileSync(path.join(HERE, 'letterpage1.png')).toString('base64');
const DOCV2 = `(async () => { const cv = [...document.querySelectorAll('canvas')].filter(c => c.getBoundingClientRect().width > 300)[0];
  const img = new Image(); img.src = window.PAGE1; await img.decode(); cv.width = img.width; cv.height = img.height; cv.getContext('2d').drawImage(img, 0, 0);
  document.querySelectorAll('body *').forEach(e => { if (e.children.length === 0) { if (e.textContent.trim() === 'Sachstandsbrief_Nair_2026-10-12.docx') e.textContent = 'Sachstandsbrief_Nair.docx'; if (e.textContent.trim() === '1 / 1') e.textContent = '1 / 2'; } }); })()`;
await pg.addInitScript(d => { window.PAGE1 = d; }, PAGE1);
await sprite('docP', 'doc-open', SIDE, DOCV2);
if (want('letterV1')) {   // v1 letter; v2 uses the v2 page image (make_letter.py)
  await open('doc-open', '', 1700, true);
  const L = await pg.evaluate(`(() => { const cv = [...document.querySelectorAll('canvas')].filter(c => c.getBoundingClientRect().width > 300)[0]; const C = cv.getBoundingClientRect();
    const find = t => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const i = n.textContent.indexOf(t); if (i < 0) continue;
      const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + t.length); const q = [...r.getClientRects()].filter(x => x.width > 2 && x.x >= C.x - 5 && x.x < C.right);
      if (q.length) return q.map(x => [x.x - C.x, x.y - C.y, x.width, x.height]); } return null; };
    return { box: [0, 0, C.width, C.height], abs: [C.x, C.y, C.width, C.height], lm1: [[87, 40, 178, 15.5]] /* letterhead is in the page image: measured from its navy pixels */, lm2: find('Az. 1803442/2025'), lm3: find('Employment Judge Hartley') }; })()`);
  console.log('letter', JSON.stringify(L).slice(0, 400));
  await pg.screenshot({ path: P('letter0'), clip: { x: L.abs[0], y: L.abs[1], width: L.abs[2], height: L.abs[3] } });
  await pg.evaluate(L => { for (const k of ['lm1', 'lm2', 'lm3']) for (const r of (L[k] || (k === 'lm1' && window.LM1 ? [window.LM1] : []))) { const d = document.createElement('div');
    Object.assign(d.style, { position: 'fixed', left: (L.abs[0] + r[0] - 2) + 'px', top: (L.abs[1] + r[1] - 1) + 'px', width: (r[2] + 4) + 'px', height: (r[3] + 2) + 'px', background: '#F8E37C', mixBlendMode: 'multiply', zIndex: 99999 }); document.body.appendChild(d); } }, L);
  await pg.screenshot({ path: P('letter1'), clip: { x: L.abs[0], y: L.abs[1], width: L.abs[2], height: L.abs[3] } });
  const U = a => { const x0 = Math.min(...a.map(r => r[0])), y0 = Math.min(...a.map(r => r[1])), x1 = Math.max(...a.map(r => r[0] + r[2])), y1 = Math.max(...a.map(r => r[1] + r[3])); return [x0, y0, x1 - x0, y1 - y0]; };
  OUT.letter = { box: L.box, lm1: L.lm1 ? U(L.lm1) : null, lm2: U(L.lm2), lm3: U(L.lm3), lines: { lm1: L.lm1, lm2: L.lm2, lm3: L.lm3 } };
  await pg.setViewportSize({ width: 1440, height: 860 });
}

// ---------------------------------------------------------------- hover states (Bennett 13 Oct: match Andri's hover look 1:1)
// Each control the cursor rests on is hovered for real in the local snapshot (its own :hover CSS) and cropped with a margin
// for the hover shadow. app.js draws the crop over the plate while the cursor rests there.
async function hoverCrop(n, src, js, sel, pad = 10, vh = 860, MAP = null) {
  if (!want(n) && !want('^hv')) return;
  await open(src, js, vh, false, MAP);
  const h = await pg.evaluateHandle(sel); const el = h.asElement(); const bb = el ? await el.boundingBox() : null;
  if (!bb) { console.log('HOVER MISS', n); return; }
  await pg.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await pg.waitForTimeout(350);
  const clip = { x: Math.max(0, bb.x - pad), y: Math.max(0, bb.y - pad), width: bb.width + 2 * pad, height: bb.height + 2 * pad };
  await pg.screenshot({ path: P(n), clip }); await pg.mouse.move(1, 1);
  OUT[n] = { box: [clip.x, clip.y, clip.width, clip.height], el: [bb.x, bb.y, bb.width, bb.height] }; console.log('hover', n);
}
const BTN = t => `[...document.querySelectorAll('button,a,[role=option]')].filter(e => H.vis(e) && (e.textContent.trim() === '${t}' || (e.getAttribute('aria-label') || '') === '${t}')).pop()`;
const RAIL = l => `H.rail('${l}')`;
await hoverCrop('hv_chip', 'list', LIST_EN, `[...document.querySelectorAll('button,a')].find(b => b.textContent.trim() === 'Aldridge Vine' && b.getBoundingClientRect().y < 60)`, 10, 860, MAP_LIST_EN);
await hoverCrop('hv_trig', 'co-page', '', `document.querySelector('button[role=combobox]')`, 10, 1000, MAP_EN);
await hoverCrop('hv_optDe', 'co-dropdown', CHECK_EN, `[...document.querySelectorAll('[role=option]')][3]`, 2, 1000, MAP_EN);
await hoverCrop('hv_upd', 'co-page', TRIG('Duits'), `[...document.querySelectorAll('button')].filter(b => /Update Company/.test(b.textContent)).pop()`, 12, 1000, MAP_EN);
await hoverCrop('hv_navDe', 'co-page', TRIG('Duits'), `[...document.querySelectorAll('a,button')].find(e => e.textContent.trim() === 'Fälle' && e.getBoundingClientRect().y < 60)`, 4, 1000, MAP_DE);
await hoverCrop('hv_new', 'list', LIST, BTN('Neuer Fall'), 12);
await hoverCrop('hv_create', 'dlg-typed', LIST + `;(() => { const i = H.ph('Enter matter name'); i.id = 'dlgIn'; i.value = ''; i.setAttribute('value', ''); i.placeholder = ''; i.style.borderColor = 'rgb(36, 30, 25)'; i.style.boxShadow = '0 0 0 3px rgba(36, 30, 25, .5)'; })()`, BTN('Erstellen'), 12);
await hoverCrop('hv_kb', 'm0', '', `H.kb()`, 12);
await hoverCrop('hv_upl', 'kb-empty', '', BTN('Falldokumente hochladen'), 12);
await hoverCrop('hv_choose', 'upload-empty', '', `H.text('Choose files to upload').closest('button,label,[role=button]') || H.text('Choose files to upload')`, 12);
await hoverCrop('hv_uploadBtn', 'upload-sel', ADD7, BTN('Hochladen'), 12);
await hoverCrop('hv_railChat', 'kb-done', '', RAIL('Chat'), 4);
await hoverCrop('hv_eq', 'm1-greet', '', `H.aria('Example questions')`, 6);
await hoverCrop('hv_send1', 'v2-cbox-q1', Q1BOX(72), `H.aria('Send')`, 6);
await hoverCrop('hv_send2', 'at-et3-typed', HIDE_TEXT + ';' + THREAD_OFF, `H.aria('Send')`, 6);
await hoverCrop('hv_send3', 'at-ald-chip', HIDE_TEXT + ';' + THREAD_OFF, `H.aria('Send')`, 6);
await hoverCrop('hv_railJobs', 'v2-chat-thread', CUT, RAIL('Jobs'), 4);
await hoverCrop('hv_jobRow', 'v2-jobs-panel', OLDROW, `[...document.querySelectorAll('li')].find(l => H.vis(l) && l.textContent.includes('Sachstandsbrief_Nair.docx'))`, 2);
await b.close();
writeFileSync(path.join(HERE, 'rects.json'), JSON.stringify(OUT, null, 1));
writeFileSync(path.join(HERE, 'rects.js'), 'window.RECTS_DATA=' + JSON.stringify(OUT) + ';\n');
console.log('done');
