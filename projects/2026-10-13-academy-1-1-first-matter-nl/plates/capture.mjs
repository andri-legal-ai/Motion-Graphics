// Captures the Andri screens for Academy 1.1 Dutch as 2x plates plus element rects (app px, window 1440 x 860).
// Source: DOM snapshots of Andri staging taken 13 Oct 2026 (staging-snapshot/raw), localised by staging-snapshot/localize.py
// (Aldridge Vine / AF, my matter "Academy 1.1 NL" shown as "Nair / Calderdale Logistics").
// Firm language: English for the opening (list_en, co_en*), then Dutch (Company → Language → Dutch → Update Company).
// My matter's jurisdiction is Nederland, which turns the matter screens Dutch (Bennett, 13 Oct 2026).
// Plate names follow the German / English 1.1 app.js where the screen plays the same part; new screens have new names.
// In-between states are built only from parts of real snapshots, never drawn by hand.
// Usage: node capture.mjs [regex of plate names to redo]
import { createRequire } from 'node:module'; import { writeFileSync, readFileSync } from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/Users/bennettnittke/.local/node/lib/node_modules/@playwright/cli/node_modules/playwright')); }
const HERE = path.dirname(fileURLToPath(import.meta.url));
const LOC = path.join(HERE, '../staging-snapshot/loc');
const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const OUT = (() => { try { return JSON.parse(readFileSync(path.join(HERE, 'rects.json'), 'utf8')); } catch { return {}; } })();
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 860 }, deviceScaleFactor: 2 });
pg.on('pageerror', e => console.log('ERR', String(e)));
const P = n => path.join(HERE, n + '.png');
const full = { x: 0, y: 0, width: 1440, height: 860 };

// helpers available in every page as H
const HELPERS = `window.H = {
  R(e) { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(v => Math.round(v * 10) / 10); },
  vis(e) { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; },
  aria(l, nth = 0) { return [...document.querySelectorAll('[aria-label]')].filter(e => e.getAttribute('aria-label') === l && H.vis(e))[nth]; },
  btn(t, nth = 0) { return [...document.querySelectorAll('button,a,[role=button],[role=option]')].filter(e => H.vis(e) && e.innerText.trim() === t)[nth]; },
  btnS(t, nth = 0) { return [...document.querySelectorAll('button,a,[role=button],[role=option]')].filter(e => H.vis(e) && e.innerText.trim().startsWith(t))[nth]; },
  text(t, nth = 0) { return [...document.querySelectorAll('body *')].filter(e => H.vis(e) && e.textContent.trim() === t && ![...e.children].some(c => c.textContent.trim() === t))[nth]; },
  starts(t, nth = 0) { return [...document.querySelectorAll('body *')].filter(e => H.vis(e) && e.textContent.trim().startsWith(t) && ![...e.children].some(c => c.textContent.trim().startsWith(t)))[nth]; },
  ph(p) { return [...document.querySelectorAll('input,textarea')].find(e => (e.placeholder || '').startsWith(p)); },
  card() { return [...document.querySelectorAll('div')].find(e => (e.className + '').includes('rounded-andri-lg') && (e.className + '').includes('overflow-hidden') && e.getBoundingClientRect().width > 500); },
  U(e, pad = 1) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const add = r => { if (!r.width || !r.height) return; x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); };
    add(e.getBoundingClientRect()); for (const c of e.querySelectorAll('*')) { const cs = getComputedStyle(c); if (cs.visibility === 'hidden' || cs.position === 'absolute' || cs.position === 'fixed') continue; add(c.getBoundingClientRect()); }
    return [x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad].map(v => Math.round(v * 10) / 10); },
  rail(l) { return [...document.querySelectorAll('a,button')].find(e => { const r = e.getBoundingClientRect(); return r.x < 30 && r.width > 20 && r.y > 100 && [e.getAttribute('aria-label'), e.getAttribute('title'), e.innerText.trim()].includes(l); }); },
  kb() { return [...document.querySelectorAll('button')].filter(b => b.textContent.trim().startsWith('Kennisbank') && b.getBoundingClientRect().width > 100).sort((p, q) => q.getBoundingClientRect().x - p.getBoundingClientRect().x)[0]; },
  firm() { return [...document.querySelectorAll('a[href^="/company"]')].find(a => a.getBoundingClientRect().y < 60); },
  top(t) { return [...document.querySelectorAll('a,button')].find(e => e.getBoundingClientRect().y < 60 && e.innerText.trim() === t); },
};`;
// every page: demo state of a new matter (Gesprekken 1, Inbox 1), card not scrolled, toasts and the snapshot button gone
const FIX = `(() => {
  document.getElementById('__dump')?.remove(); document.getElementById('snap11nlbtn')?.remove();
  if (!window.KEEP_TOAST) document.querySelectorAll('[data-sonner-toast], [data-sonner-toaster]').forEach(e => e.remove());
  const c = H.card(); if (c) c.scrollTop = 0;
  const conv = H.btnS('Gesprekken'); if (conv) { const n = [...conv.querySelectorAll('*')].find(e => e.children.length === 0 && /^\\d+$/.test(e.textContent.trim())); if (n) n.textContent = '1'; }
  document.querySelectorAll('body *').forEach(e => { if (e.children.length === 0 && e.textContent.trim() === 'B' && e.getBoundingClientRect().width < 30) e.textContent = 'A'; });
  document.querySelectorAll('[class*="index-module_type"]').forEach(e => e.style.visibility = 'hidden');
  if (!window.KEEP_BELL) document.querySelectorAll('button[aria-label*="unread"], button[aria-label*="ongelezen"]').forEach(bt => { if (bt.querySelector('.lucide-bell')) [...bt.children].forEach(c => { if (c.tagName.toLowerCase() !== 'svg') c.style.display = 'none'; }); });
  document.querySelectorAll('[aria-label="Inbox"]').forEach(bt => { if (bt.querySelector('.lucide-bell')) [...bt.children].forEach(c => { if (c.tagName.toLowerCase() !== 'svg') c.style.display = 'none'; }); });
  const inbox = H.btnS('Inbox'); if (inbox) { const n = [...inbox.querySelectorAll('*')].find(e => e.children.length === 0 && /^\\d+$/.test(e.textContent.trim())); if (n) n.textContent = '1'; }
})()`;

async function open(name, js = '', vh = 860, opts = {}) {
  await pg.setViewportSize({ width: 1440, height: vh });
  await pg.goto(pathToFileURL(path.join(LOC, name + '.html')).href);
  await pg.waitForTimeout(250);
  await pg.evaluate(HELPERS); await pg.evaluate(o => { window.KEEP_BELL = !!o.bell; window.KEEP_TOAST = !!o.toast; }, opts); await pg.evaluate(FIX);
  if (js) { try { await pg.evaluate(js); } catch (e) { console.log('JS FAIL in', name, String(e).slice(0, 200), '\n', js.slice(0, 300)); throw e; } }
  await pg.waitForTimeout(150);
}
const want = n => !only || only.test(n);
async function plate(n, src, js = '', rects = '({})', vh = 860, opts = {}) { if (!want(n)) return; await open(src, js, vh, opts); await pg.screenshot({ path: P(n), clip: { x: 0, y: 0, width: 1440, height: vh } });
  try { OUT[n] = await pg.evaluate(rects); } catch (e) { console.log('RECTS FAIL', n, String(e).slice(0, 200)); throw e; } console.log('plate', n); }
// a floating element alone on transparent (rounded corners stay clean, shadow drawn on canvas)
async function sprite(n, src, sel, js = '', rects = '({})', opts = {}) {
  if (!want(n)) return; await open(src, js, 860, opts);
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

// ---------------------------------------------------------------- 0 matters list (English, then Dutch) and the language switch
// The other rows are other sessions' test matters; the list shows four demo matters instead, built from staging's own rows.
const DEMO_EN = [['Hallam v Brightwater supply contract', 'Case knowledge base: a commercial dispute over a supply agreement for haulage services', '29 Sept 2026'],
  ['Okafor v Pennine Health', 'Case knowledge base: an employment law matter on a flexible working request that was refused', '24 Sept 2026'],
  ['Van Hoven lease renewal', 'Case knowledge base: a commercial lease renewal for warehouse premises in Wakefield', '22 Sept 2026'],
  ['Estate of Marsh', 'Case knowledge base: a contentious probate matter concerning a 2019 will', '21 Sept 2026']];
// Dutch names; Andri writes summaries in the firm's language once it is Dutch (seen 13 Oct: Dutch summaries in my matter)
const DEMO_NL = [['Hallam / Brightwater leveringscontract', 'Een handelsgeschil over een leveringsovereenkomst voor transportdiensten', '29 sep 2026'],
  ['Okafor / Pennine Health', 'Een arbeidszaak over een afgewezen verzoek om flexibel te werken', '24 sep 2026'],
  ['Van Hoven huurverlenging', 'Verlenging van een bedrijfshuurovereenkomst voor een magazijn in Wakefield', '22 sep 2026'],
  ['Nalatenschap Marsh', 'Een geschil over een nalatenschap en een testament uit 2019', '21 sep 2026']];
const LIST = demo => `(() => { const rows = [...document.querySelectorAll('tbody tr')]; const tpl = rows.find(r => r.innerText.split('\\n')[0].trim() === 'Academy 6.1');
  const body = tpl.parentElement; rows.forEach(r => r.remove());
  for (const [n, s, d] of ${JSON.stringify(demo)}) { const r = tpl.cloneNode(true);
    const leafs = [...r.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim());
    leafs.find(e => e.textContent.trim() === 'Academy 6.1').textContent = n;
    leafs.find(e => /^Case Knowledge Base/i.test(e.textContent.trim())).textContent = s;
    leafs.find(e => /^12 (Oct|okt) 2026$/.test(e.textContent.trim())).textContent = d; body.appendChild(r); } })()`;
await plate('listEn', 'list_en', LIST(DEMO_EN), `({ firm: H.R(H.firm()), btnNew: H.R(H.btn('New Matter')) })`);
await plate('list', 'list', LIST(DEMO_NL), `({ btnNew: H.R(H.btn('Nieuwe zaak')), zaken: H.R(H.top('Zaken')) })`);
// Company page, English: taller plates (1000 px) because Update Company sits below the fold at 860; the page scrolls in the video
const COR = `({ lang: H.R(document.querySelector('[role=combobox]')), upd: H.R([...document.querySelectorAll('button')].find(x => /Update Company|Kantoor bijwerken/.test(x.innerText))),
  optDutch: (() => { const o = [...document.querySelectorAll('[role=option]')].find(e => e.innerText.trim() === 'Dutch'); return o ? H.R(o) : null; })(),
  zaken: (() => { const z = H.top('Zaken'); return z ? H.R(z) : null; })(), firm: H.R(H.firm()) })`;
await plate('coEn', 'co_en', '', COR, 1000);
await plate('coEnOpen', 'co_en_open', '', COR, 1000);
await plate('coEnHover', 'co_en_hover', '', COR, 1000);
await plate('coEnDutch', 'co_en_dutch', '', COR, 1000);
await plate('coNl', 'co_nl', '', COR, 1000);
// the toast staging shows as it saves ("Company Updated"), alone on transparent
await sprite('toast', 'co_toast', `document.querySelector('[data-sonner-toast]')`, '', '({})', { toast: true });
// the Update button pressed (saving spinner) is not captured; the toast follows the click

// ---------------------------------------------------------------- 1 New Matter: English dialog, Jurisdiction → Netherlands turns it Dutch
const DLGEL = `[...document.querySelectorAll('[role=dialog]')].find(e => e.getBoundingClientRect().width > 300)`;
const DLG = `({ dlg: H.R(${DLGEL}), dlgIn: H.R(document.getElementById('dlgIn') || document.querySelector('[role=dialog] input')),
  jur: H.R(document.querySelector('[role=dialog] [role=combobox]')), btnNew: H.R(H.btn('Nieuwe zaak')),
  btnCreate: H.R(H.btn('Create') || H.btn('Aanmaken')), optNL: (() => { const o = [...document.querySelectorAll('[role=option]')].find(e => e.innerText.trim() === 'Netherlands'); return o ? H.R(o) : null; })() })`;
const RING = `(() => { const i = document.querySelector('[role=dialog] input'); i.id = 'dlgIn'; i.style.borderColor = 'rgb(36, 30, 25)'; i.style.boxShadow = '0 0 0 3px rgba(36, 30, 25, .5)'; })()`;
const NOFOCUS = `(() => { const i = document.querySelector('[role=dialog] input'); i.id = 'dlgIn'; })()`;
await plate('dlg0', 'dlg-empty', LIST(DEMO_NL) + ';' + RING, DLG);                                                  // placeholder, Create disabled
await plate('dlgE', 'dlg-typed', LIST(DEMO_NL) + `;(() => { const i = document.querySelector('[role=dialog] input'); i.value = ''; i.setAttribute('value', ''); i.placeholder = ''; })();` + RING, DLG);  // text drawn on canvas
// the Jurisdiction list keeps the 1920-wide window's position in the snapshot: put it back under its field (10.2 lesson), same gap as staging (4 px)
const JURMENU = `(() => { const tr = document.querySelector('[role=dialog] [role=combobox]').getBoundingClientRect(); const w = [...document.querySelectorAll('[data-radix-popper-content-wrapper]')].find(e => e.textContent.includes('Netherlands'));
  w.style.transform = 'translate(' + tr.x + 'px, ' + (tr.bottom + 4) + 'px)'; w.style.minWidth = tr.width + 'px'; })()`;
await plate('dlgJ', 'dlg-jur-open', LIST(DEMO_NL) + ';' + NOFOCUS + ';' + JURMENU, DLG);                                           // Jurisdiction list open
await plate('dlgN', 'dlg-nl', LIST(DEMO_NL) + ';' + NOFOCUS, DLG);                                                 // Nederland: the dialog is Dutch
// ---------------------------------------------------------------- 2 the new matter, empty
await plate('m0', 'm0', '', `({ btnKB: H.R(H.kb()) })`);
// ---------------------------------------------------------------- 3 Kennisbank, empty, and the upload dialog
const KBR = `({ btnUp: H.R(H.btn('Upload zaakdocumenten')), btnEmail: H.R(H.btn('E-mail documenten')), railChatKB: H.R(H.rail('Chat')) })`;
await plate('kb0', 'kb-empty', '', KBR);
const UPR = `({ pickChoose: H.R(H.text('Kies bestanden om te uploaden')), pickUp: H.R(H.btn('Uploaden')), pickCancel: H.R(H.btn('Annuleren')) })`;
const DIALOG = `[...document.querySelectorAll('[role=dialog]')].find(e => e.getBoundingClientRect().width > 300)`;
await sprite('pick0', 'upload-empty', DIALOG, '', UPR);
await sprite('pick1', 'upload-sel', DIALOG, `(() => { const l = [...document.querySelectorAll('[role=dialog] *')].find(e => e.scrollHeight > e.clientHeight + 4 && e.clientHeight > 60); if (l) l.scrollTop = 0; })()`, UPR);
// ---------------------------------------------------------------- 4 Kennisbank rows: processing and done
const ROWS = `({ kbRows: [...document.querySelectorAll('tbody tr')].map(r => ({ row: H.R(r), status: H.R(r.children[4]) })), railChatKB: H.R(H.rail('Chat')), btnUp: H.R(H.btn('Upload zaakdocumenten')) })`;
await plate('kbDone', 'kb-done', '', ROWS);
await plate('kbProc', 'kb-done', `document.querySelectorAll('tbody tr').forEach(r => { for (const i of [3, 4, 5]) r.children[i].style.opacity = '0'; })`, ROWS);
// ---------------------------------------------------------------- 5 the matter with its files: greeting, Voorbeeldvragen, the SWOT example picked
const BOX = `(() => { const ta = document.querySelector('.thread-pane-active textarea'); let b = ta; while (b && !(b.getAttribute('class') || '').includes('rounded-[1.5rem]')) b = b.parentElement; return b; })()`;
const GREETR = `({ cbox: H.R(${BOX}), eqBtn: H.R(H.aria('Voorbeeldvragen')), go: H.R(H.aria('Versturen')), btnKB: H.R(H.kb()), disc: H.R(H.starts('Andri is een AI-systeem')) })`;
await plate('m1', 'm1-greet', '', GREETR);
const EQP = `document.querySelector('.composer-overlay[role=listbox]')`;
await plate('m1hot', 'eqp-open', `${EQP}.style.visibility = 'hidden'`, GREETR);
const EQR = `({ eqPick: H.R(H.starts('Maak een SWOT-analyse')) })`;
// the list blurs what is behind it (backdrop filter), so it is cropped from the full page instead of captured alone
async function crop(n, src, sel, rects) { if (!want(n)) return; await open(src); const extra = await pg.evaluate(rects); const box = await pg.evaluate(`H.R(${sel})`);
  await pg.screenshot({ path: P(n), clip: { x: box[0], y: box[1], width: box[2], height: box[3] } }); OUT[n] = { box, ...extra }; console.log('crop', n); }
await crop('eqp0', 'eqp-open', EQP, EQR);
await crop('eqp1', 'eqp-hover', EQP, EQR);
await plate('m1swot', 'cbox-swot', '', GREETR);

// ---------------------------------------------------------------- 6 the conversation
// Andri's visible reasoning ("Nadenken") came out in English, and the letter turn's question step (Vraag gebruiker) is left out
// of the video: those rows are cut. Answers are shortened by cutting whole blocks only (ACADEMY-LESSONS: cut, never reword).
const TURNS = `[...document.querySelector('.thread-pane-active .chat-scroll-container .flex.flex-col.space-y-4').children].filter(c => c.children.length)`;
// the first answer keeps its first paragraph (with the judgment link) and leaves out Andri's English SWOT headings; memory rows are
// cut because they show the staging account's English memory names (Bennett, 13 Oct: everything in the language)
const CUT = `(() => { const keep = [1, 3, 1]; ${TURNS}.forEach((t, i) => { const st = t.querySelector('[class~="space-y-2.5"]');
  [...st.children].slice(0, -1).forEach(r => { const s = r.innerText.trim(); if (/^Nadenken/.test(s) || /^Vraag gebruiker/.test(s) || /^Geheugen raadplegen/.test(s)) r.remove(); });
  const ans = st.lastElementChild.querySelector('.stream-chunks');
  [...ans.children].forEach((c, j) => { if (j >= keep[i]) c.remove(); }); }); })()`;
const COMPOSER = BOX;
const HIDE_TEXT = `(() => { const ta = document.querySelector('.thread-pane-active textarea'); ta.style.color = 'transparent'; ta.style.caretColor = 'transparent'; ta.placeholder = '';
  [...ta.parentElement.children].forEach(c => { if (c !== ta) c.style.visibility = 'hidden'; }); })()`;
const DOCKR = `({ cbox: H.R(${COMPOSER}), go: H.R(H.aria('Versturen')), atb: H.R(H.aria('Documenten vermelden')), railJobs: H.R(H.rail('Taken')), disc: H.R(H.starts('Andri is een AI-systeem')),
  text0: (() => { const ta = document.querySelector('.thread-pane-active textarea'); const r = ta.getBoundingClientRect(); return [r.x + 16, r.y + 16]; })() })`;
const THREAD_OFF = `(() => { const t = document.querySelector('.thread-pane-active .chat-scroll-container'); t.style.visibility = 'hidden'; t.style.opacity = '0'; })()`;
const MENU_PRE = `[...document.querySelectorAll('[role=listbox],.composer-overlay')].forEach(e => { if (e.textContent.includes('Zaakdocumenten')) e.style.display = 'none'; })`;
// chat-thread was snapshotted with the letter panel open: hide it so the card takes the full width again (same as chat-thread1)
const NOPANEL = `(() => { const s = [...document.querySelectorAll('div')].find(e => { const r = e.getBoundingClientRect(); return (e.getAttribute('class') || '').includes('shrink-0') && r.x > 600 && r.width > 500 && r.height > 700; }); if (s) s.style.display = 'none'; })()`;
await plate('chat', 'chat-thread', NOPANEL + ';' + CUT + ';' + THREAD_OFF + `;${COMPOSER}.style.visibility = 'hidden'; H.starts('Andri is een AI-systeem').style.visibility = 'hidden';`, `({ railJobs: H.R(H.rail('Taken')), btnKB: H.R(H.kb()) })`);
await sprite('cboxDock', 'cbox-empty', COMPOSER, THREAD_OFF, DOCKR);                                   // empty, placeholder
await sprite('cboxDockOn', 'at-et3', COMPOSER, HIDE_TEXT + ';' + THREAD_OFF + `;${MENU_PRE}`, DOCKR);   // text in the box
await sprite('cboxDockAt', 'at-et3-typed', COMPOSER, HIDE_TEXT + ';' + THREAD_OFF, DOCKR);              // after an @ pick: @ lit with its 1 badge
// request and template chip: at 1440 the chip wraps to a second line and staging grows the box to two lines (24 px each);
// the snapshot came from a 1920 window where it fit on one line, so the textarea gets its two-line height back
const TWO = `(() => { const ta = document.querySelector('.thread-pane-active textarea'); ta.style.height = '72px'; ta.style.minHeight = '72px'; })()`;
await sprite('cboxDock2', 'at-ald-chip', COMPOSER, HIDE_TEXT + ';' + THREAD_OFF + ';' + TWO, DOCKR);
// the disclaimer line, cropped from the real page with the thread and chat box (and its shadow) hidden; make_disc.py keys out the
// background so only the text is drawn (the chat box's drop shadow used to show as a grey band on this row)
if (want('disc')) { await open('cbox-empty', THREAD_OFF + `;${COMPOSER}.style.visibility = 'hidden'; [...document.querySelectorAll('*')].forEach(e => { if (getComputedStyle(e).boxShadow !== 'none') e.style.boxShadow = 'none'; });`); const extra = await pg.evaluate(DOCKR); const box = await pg.evaluate(`H.R(H.starts('Andri is een AI-systeem'))`);
  await pg.screenshot({ path: P('disc'), clip: { x: box[0], y: box[1], width: box[2], height: box[3] } }); OUT.disc = { box, ...extra }; console.log('crop disc'); }
const MENU = `[...document.querySelectorAll('[role=listbox],.composer-overlay')].find(e => H.vis(e) && e.textContent.includes('Zaakdocumenten'))`;
await sprite('mp0', 'at-et3', MENU);
await sprite('mp2a', 'at-ald', MENU);
// the whole thread as one tall sprite + item rects relative to it
if (want('thread')) {
  await open('chat-thread', NOPANEL + ';' + CUT, 860);
  const h = await pg.evaluate(`(() => { const t = document.querySelector('.thread-pane-active .chat-scroll-container'); return t.scrollHeight; })()`);
  await open('chat-thread', NOPANEL + ';' + CUT + `;(() => { const t = document.querySelector('.thread-pane-active .chat-scroll-container'); const c = H.card();
    c.style.height = '${h + 400}px'; c.style.maxHeight = 'none'; c.style.overflow = 'visible'; t.style.height = '${h}px'; t.style.maxHeight = 'none'; t.style.overflow = 'visible'; t.style.flex = 'none';
    ${COMPOSER}.style.visibility = 'hidden'; H.starts('Andri is een AI-systeem').style.visibility = 'hidden';
    document.querySelectorAll('.thread-pane-active .chat-scroll-container ~ *, .fixed').forEach(e => { if (!e.contains(t)) e.style.visibility = 'hidden'; }); })()`, h + 600);
  const info = await pg.evaluate(`(() => { const t = document.querySelector('.thread-pane-active .chat-scroll-container'); const T = t.getBoundingClientRect();
    const rel = r => [r[0] - T.x, r[1] - T.y, r[2], r[3]].map(v => Math.round(v * 10) / 10);
    const turns = ${TURNS}; const o = { box: H.R(t), items: {} };
    turns.forEach((tu, i) => { const n = i + 1; const st = tu.querySelector('[class~="space-y-2.5"]'); const rows = [...st.children];
      o.items['ub' + n] = rel(H.U(tu.children[0], 2));
      o.items['steps' + n + '_children'] = rows.slice(0, -1).map(r => { const q = r.getBoundingClientRect(); return rel([q.x - 2, q.y - 2, q.width + 4, q.height + 4]); });
      const ans = rows[rows.length - 1]; const chunks = [...ans.querySelector('.stream-chunks').children];
      o.items['ans' + n + '_children'] = chunks.map(c => rel(H.U(c, 2)));
      const act = tu.querySelector('.mt-4.flex-shrink-0'); if (act) o.items['act' + n] = rel(H.U(act, 2)); });
    const cite = [...turns[0].querySelectorAll('.stream-chunks button, .stream-chunks a, .stream-chunks [role=button]')].find(b => ((b.getAttribute('aria-label') || '') + b.textContent).includes('05_Uitspraak_Tribunal'));
    o.items.cite1 = rel(H.R(cite)); return o; })()`);
  await pg.screenshot({ path: P('thread'), clip: { x: info.box[0], y: info.box[1], width: info.box[2], height: h }, omitBackground: false });
  OUT.thread = info; console.log('thread', h, Object.keys(info.items).join(','), JSON.stringify(info.items.steps1_children.length));
  await pg.setViewportSize({ width: 1440, height: 860 });
}

// ---------------------------------------------------------------- 7 source panel (narrow card + PDF viewer)
const SIDE = `[...document.querySelectorAll('div')].find(e => { const r = e.getBoundingClientRect(); return (e.getAttribute('class') || '').includes('shrink-0') && r.x > 600 && r.width > 500 && r.height > 700; })`;
const PANEL_OFF = `(() => { const s = ${SIDE}; const R = s.getBoundingClientRect(); s.style.visibility = 'hidden';
  document.querySelectorAll('body *').forEach(e => { const r = e.getBoundingClientRect(); if (r.width && r.left >= R.left - 1 && r.top >= 60 && !e.closest('.thread-pane-active')) e.style.visibility = 'hidden'; }); })()`;
const CITE = `[...document.querySelectorAll('.thread-pane-active .stream-chunks button, .thread-pane-active .stream-chunks a, .thread-pane-active .stream-chunks [role=button]')].find(b => ((b.getAttribute('aria-label') || '') + b.textContent).includes('05_Uitspraak_Tribunal'))`;
const NARROW = y => `(() => { const t = document.querySelector('.thread-pane-active .chat-scroll-container'); t.style.scrollBehavior = 'auto'; const c = ${CITE};
  t.scrollTop = 0; t.scrollTop = c.getBoundingClientRect().y - ${y}; })()`;
const BOTTOM = `(() => { const t = document.querySelector('.thread-pane-active .chat-scroll-container'); t.style.scrollBehavior = 'auto'; t.scrollTop = t.scrollHeight; })()`;
await plate('split', 'src-open', CUT + ';' + NARROW(470) + ';' + PANEL_OFF, `({ cite: H.R(${CITE}) })`);
const SRCR = `(() => { const p = ${SIDE}.getBoundingClientRect(); const marks = [...document.querySelectorAll('mark.pdf-citation-highlight')].map(m => m.getBoundingClientRect());
  const x0 = Math.min(...marks.map(m => m.left)), y0 = Math.min(...marks.map(m => m.top)), x1 = Math.max(...marks.map(m => m.right)), y1 = Math.max(...marks.map(m => m.bottom));
  const c = [...document.querySelectorAll('button[aria-label=Close], button[aria-label=Sluiten]')].map(b => b.getBoundingClientRect()).find(r => r.x > 1200 && r.y < 130);
  return { panel: [p.x, p.y, p.width, p.height], para: [x0 - p.x, y0 - p.y, x1 - x0, y1 - y0], lines: marks.map(m => [m.x - p.x, m.y - p.y, m.width, m.height]), close: [c.x - p.x, c.y - p.y, c.width, c.height] }; })()`;
await sprite('src0', 'src-open', SIDE, `document.querySelectorAll('mark.pdf-citation-highlight').forEach(m => m.style.background = 'transparent')`, `({ src: ${SRCR} })`);
await sprite('src1', 'src-open', SIDE, '', `({ src: ${SRCR} })`);
if (OUT.src1) OUT.src = OUT.src1.src;
// ---------------------------------------------------------------- 8 Taken panel and the letter
if (want('jobs')) {
  await open('jobs-panel', CUT + ';' + BOTTOM + ';' + PANEL_OFF, 860, { bell: true });
  await pg.screenshot({ path: P('jobsSplit'), clip: full });
  OUT.jobsSplit = await pg.evaluate(`({ railJobs: H.R(H.rail('Taken')) })`); console.log('plate jobsSplit');
}
const JOBR = `({ jobRow: H.R([...document.querySelectorAll('li, [role=listitem], div')].filter(l => H.vis(l) && l.textContent.trim().startsWith('Brief_Stand_van_zaak_Nair.docx') && l.getBoundingClientRect().height < 80).sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0]) })`;
await sprite('jobsP', 'jobs-panel', SIDE, '', JOBR);
await sprite('docP', 'doc-open2', SIDE);
if (want('letter')) {   // page 1 of Andri's real letter, from the viewer's canvas; marks from the viewer's text layer
  await open('doc-open2', '', 1900, { bell: true });
  await pg.waitForTimeout(500);
  const L = await pg.evaluate(`(() => { const cv = [...document.querySelectorAll('canvas')].filter(c => c.getBoundingClientRect().width > 300)[0]; const C = cv.getBoundingClientRect();
    const find = t => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const i = n.textContent.indexOf(t); if (i < 0) continue;
      const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + t.length); const q = [...r.getClientRects()].filter(x => x.width > 2 && x.x >= C.x - 5 && x.x < C.right);
      if (q.length) return q.map(x => [x.x - C.x, x.y - C.y, x.width, x.height]); } return null; };
    return { box: [0, 0, C.width, C.height], abs: [C.x, C.y, C.width, C.height], lm1: find('ALDRIDGE VINE LLP'), lm2: find('1803442/2025'), lm3: find('19 maart 2026') }; })()`);
  console.log('letter', JSON.stringify(L).slice(0, 500));
  await pg.screenshot({ path: P('letter0'), clip: { x: L.abs[0], y: L.abs[1], width: L.abs[2], height: L.abs[3] } });
  OUT.letter = { box: L.box };   // marks come from make_letter.py (page image + text-layer line positions)
  await pg.setViewportSize({ width: 1440, height: 860 });
}
await b.close();
writeFileSync(path.join(HERE, 'rects.json'), JSON.stringify(OUT, null, 1));
writeFileSync(path.join(HERE, 'rects.js'), 'window.RECTS_DATA=' + JSON.stringify(OUT) + ';\n');
console.log('done');
