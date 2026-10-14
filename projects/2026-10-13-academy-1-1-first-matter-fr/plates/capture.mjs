// Captures the Andri screens for Academy 1.1 French as 2x plates plus element rects (app px, window 1440 x 860).
// Source: DOM snapshots of Andri staging taken 13 Oct 2026 (staging-snapshot/raw, localised by staging-snapshot/localize.py:
// Aldridge Vine / AF, my matter "Academy 1.1 FR v2" shown as "Nair c. Calderdale Logistique SA").
// The language step's English pages (matters list, Company page, Language dropdown, French chosen but not saved) were captured
// while the firm was still English, the French ones right after Update Company. Everything else was captured with the firm
// in French, in a United Kingdom matter, so the matter screens come out English in staging: every remaining English interface
// text is translated here (TR = Andri's own French dictionary + my table, plates/tr-fr.json), layout untouched.
// Built on the German 1.1 capture.mjs; plate names follow it so app.js keeps working (coENde = French chosen, coDE = French page).
// In-between states are built only from parts of real snapshots, never drawn by hand.
// Usage: node capture.mjs [regex of plate names to redo]
import { createRequire } from 'node:module'; import { writeFileSync, readFileSync } from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/Users/bennettnittke/.local/node/lib/node_modules/@playwright/cli/node_modules/playwright')); }
const HERE = path.dirname(fileURLToPath(import.meta.url));
const LOC = path.join(HERE, '../staging-snapshot/loc');
const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const TR = JSON.parse(readFileSync(path.join(HERE, 'tr-fr.json'), 'utf8'));
const OUT = (() => { try { return JSON.parse(readFileSync(path.join(HERE, 'rects.json'), 'utf8')); } catch { return {}; } })();
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 860 }, deviceScaleFactor: 2 });
pg.on('pageerror', e => console.log('ERR', String(e)));
const P = n => path.join(HERE, n + '.png');
const full = { x: 0, y: 0, width: 1440, height: 860 };
const NOTR = { map: {}, prefix: {} };   // pages that must stay as captured (the English "before" pages, the French Company page)

// helpers available in every page as H (English or French label both match: TRX maps English -> French)
const HELPERS = `window.TRX = window.TRX || {}; const _fr = t => window.TRX[t] || t; const _is = (a, t) => a === t || a === _fr(t); const _st = (a, t) => a.startsWith(t) || a.startsWith(_fr(t));
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
  // union of an element's visible boxes (rows with buttons that stick out; display: contents wrappers)
  U(e, pad = 1) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const add = r => { if (!r.width || !r.height) return; x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); };
    add(e.getBoundingClientRect()); for (const c of e.querySelectorAll('*')) { const cs = getComputedStyle(c); if (cs.visibility === 'hidden' || cs.position === 'absolute' || cs.position === 'fixed') continue; add(c.getBoundingClientRect()); }
    return [x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad].map(v => Math.round(v * 10) / 10); },
  rail(l) { return [...document.querySelectorAll('a,button')].find(e => { const r = e.getBoundingClientRect(); return r.x < 30 && r.width > 20 && r.y > 100 && [e.getAttribute('aria-label'), e.getAttribute('title'), e.innerText.trim()].some(v => v && _is(v, l)); }); },
  kb() { return [...document.querySelectorAll('button')].filter(b => _st(b.textContent.trim(), 'Knowledge Base') && b.getBoundingClientRect().width > 100).sort((p, q) => q.getBoundingClientRect().x - p.getBoundingClientRect().x)[0]; },
};`;
// every page: demo state of a new matter (Inbox 1, no unread bell count), card not scrolled, no toasts, no typing suggestion
const FIX = `(() => {
  document.getElementById('__dump')?.remove();
  document.querySelectorAll('[data-sonner-toast], [data-sonner-toaster]').forEach(e => e.remove());

  window.scrollTo(0, 0); document.scrollingElement.scrollTop = 0;
  const c = H.card(); if (c) { c.scrollTop = 0; let p = c.parentElement; while (p) { p.scrollTop = 0; p = p.parentElement; } }
  document.querySelectorAll('body *').forEach(e => { if (e.children.length === 0 && e.textContent.trim() === 'B' && e.getBoundingClientRect().width < 30) e.textContent = 'A'; });
  document.querySelectorAll('[class*="index-module_type"]').forEach(e => e.style.visibility = 'hidden');
  if (!window.KEEP_BELL) document.querySelectorAll('button[aria-label*="Notifications"], button[aria-label*="unread"]').forEach(bt => { if (bt.querySelector('.lucide-bell')) [...bt.children].forEach(c => { if (c.tagName.toLowerCase() !== 'svg') c.style.display = 'none'; }); });
  const inbox = [...document.querySelectorAll('a,button')].find(e => /^(Inbox|Boîte de réception)/.test(e.textContent.trim()) && e.getBoundingClientRect().y < 60);
  if (inbox) { const n = [...inbox.querySelectorAll('*')].find(e => e.children.length === 0 && /^\\d+$/.test(e.textContent.trim())); if (n) n.textContent = '1'; }
  // the floating help bubble staging shows at the right edge after a reload is not part of the demo screens
  document.querySelectorAll('body *').forEach(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); if (cs.position === 'fixed' && r.width < 50 && r.height < 50 && r.x > 1380 && r.y > 200 && r.y < 700) e.style.display = 'none'; });
})()`;

async function open(name, js = '', vh = 860, keepBell = false, MAP = null) {
  await pg.setViewportSize({ width: 1440, height: vh });
  await pg.goto(pathToFileURL(path.join(LOC, name + '.html')).href);
  await pg.waitForTimeout(250);
  await pg.evaluate(m => { window.TRX = m; }, TR.exact); await pg.evaluate(HELPERS); await pg.evaluate(k => { window.KEEP_BELL = k; }, keepBell); await pg.evaluate(FIX);
  if (js) { try { await pg.evaluate(js); } catch (e) { console.log('JS FAIL in', name, String(e).slice(0, 200), '\n', js.slice(0, 300)); throw e; } }
  // French interface (Bennett, 13 Oct 2026): every English UI text becomes French; layout untouched. Andri's own answers are skipped.
  if (!MAP) await pg.evaluate(TR => { const rx = TR.regex.map(([a, b]) => [new RegExp(a), b]); const pre = Object.entries(TR.prefix);
    const tr = s => { const t = s.replace(/\s+/g, ' ').trim(); if (!t) return null; if (TR.exact[t] !== undefined) return s.replace(t, TR.exact[t]);
      for (const [r, b] of rx) if (r.test(t)) return t.replace(r, b); for (const [k, v] of pre) if (t.startsWith(k)) return v; return null; };
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const nodes = []; let n; while ((n = w.nextNode())) nodes.push(n);
    for (const n of nodes) { if (n.parentElement && n.parentElement.closest('script,style,.whitespace-pre-wrap')) continue;
      if (n.parentElement && n.parentElement.closest('.stream-chunks') && !n.parentElement.closest('button')) continue;   // Andri's own French answer text
      const r = tr(n.textContent); if (r !== null) n.textContent = r; }
    document.querySelectorAll('[placeholder],[aria-label],[title]').forEach(e => { for (const a of ['placeholder', 'aria-label', 'title']) { const v = e.getAttribute(a); if (v) { const r = tr(v); if (r !== null) e.setAttribute(a, r); } } });
  }, TR);
  await pg.waitForTimeout(150);
}
const want = n => !only || only.test(n);
async function plate(n, src, js = '', rects = '({})', vh = 860, MAP = null) { if (!want(n)) return; await open(src, js, vh, false, MAP); await pg.screenshot({ path: P(n), clip: { x: 0, y: 0, width: 1440, height: vh } });
  try { OUT[n] = await pg.evaluate(rects); } catch (e) { console.log('RECTS FAIL', n, String(e).slice(0, 300)); throw e; } console.log('plate', n); }
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

// ---------------------------------------------------------------- 0 the language switch (Cabinet -> Langue -> Français)
// Real staging pages: English before, French after. Taller than the window: captured 1440 x 1000, scrolled on canvas.
const LIST_EN = `(() => { const rows = [...document.querySelectorAll('tbody tr')]; const tpl = rows.find(r => r.innerText.includes('Case Knowledge Base'));
  const body = tpl.parentElement; rows.forEach(r => r.remove());
  for (const [n, s, d] of [['Hallam / Brightwater supply', 'Case knowledge base: a commercial dispute over a supply agreement for haulage services', '29 Sept 2026'],
    ['Okafor v Pennine Health', 'Case knowledge base: an employment law matter on a flexible working request that was refused', '24 Sept 2026'],
    ['Van Hoven lease renewal', 'Case knowledge base: a commercial lease renewal for warehouse premises in Wakefield', '22 Sept 2026'],
    ['Marsh estate', 'Case knowledge base: a contentious probate matter concerning a 2019 will', '21 Sept 2026']]) { const r = tpl.cloneNode(true);
    const leafs = [...r.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim());
    leafs.find(e => e.textContent.trim().startsWith('Academy')).textContent = n; leafs.find(e => e.textContent.trim().startsWith('Case Knowledge Base')).textContent = s;
    leafs.find(e => /^\\d+ \\w+ 2026$/.test(e.textContent.trim())).textContent = d; body.appendChild(r); } const pg1 = [...document.querySelectorAll('body *')].find(e => e.children.length === 0 && /^Page \\d+ (of|sur) \\d+$/.test(e.textContent.trim())); if (pg1) pg1.textContent = pg1.textContent.includes('sur') ? 'Page 1 sur 1' : 'Page 1 of 1'; })()`;
const NAVQ = `[...document.querySelectorAll('a,button')].find(e => ['Dossiers', 'Matters'].includes(e.textContent.trim()) && e.getBoundingClientRect().y < 60)`;
const CHIPQ = `[...document.querySelectorAll('button,a')].find(b => b.textContent.trim() === 'Aldridge Vine' && b.getBoundingClientRect().y < 60)`;
const CHIP = `({ chip: H.R(${CHIPQ}), navFirst: H.R(${NAVQ}) })`;
await plate('listEN', 'list-en', LIST_EN, CHIP, 860, NOTR);
const UPDQ = `[...document.querySelectorAll('button')].filter(b => /Update Company|Mettre à jour le cabinet/.test(b.textContent)).pop()`;
const CORECTS = `({ trig: H.R(document.querySelector('button[role=combobox]')), opts: [...document.querySelectorAll('[role=option]')].map(H.R), upd: H.R(${UPDQ}), chip: H.R(${CHIPQ}), navFirst: H.R(${NAVQ}) })`;
await plate('coEN', 'co-page-en', '', CORECTS, 1000, NOTR);          // Company page, English, Language: English
await plate('coENdd', 'co-dropdown-en', '', CORECTS, 1000, NOTR);    // dropdown open, English ticked
await plate('coENde', 'co-page-enfr', '', CORECTS, 1000, NOTR);      // French chosen, not saved yet (page still English)
await plate('coDE', 'co-page-fr', '', CORECTS, 1000, NOTR);          // saved: Cabinet page in French, Langue: Français

// ---------------------------------------------------------------- 1 matters list and New Matter
// The other rows are other sessions' and my own test matters; the list shows the four demo matters of the English 1.1 instead,
// built from staging's own rows, names and summaries in French (Bennett: everything in the language).
const DEMO = [['Hallam / Brightwater', 'Base de connaissances du dossier : litige commercial portant sur un contrat de transport et de livraison', '29 sept. 2026'],
  ['Okafor c. Pennine', 'Base de connaissances du dossier : droit du travail, demande d’aménagement du temps de travail refusée', '24 sept. 2026'],
  ['Bail Van Hoven', 'Base de connaissances du dossier : renouvellement d’un bail commercial pour des entrepôts à Wakefield', '22 sept. 2026'],
  ['Succession Marsh', 'Base de connaissances du dossier : succession litigieuse portant sur un testament de 2019', '21 sept. 2026']];
const LIST = `(() => { const rows = [...document.querySelectorAll('tbody tr')]; const tpl = rows.find(r => r.innerText.includes('Case Knowledge Base'));
  const body = tpl.parentElement; rows.forEach(r => r.remove());
  for (const [n, s, d] of ${JSON.stringify(DEMO)}) { const r = tpl.cloneNode(true);
    const leafs = [...r.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim());
    leafs.find(e => e.textContent.trim().startsWith('Academy')).textContent = n;
    leafs.find(e => e.textContent.trim().startsWith('Case Knowledge Base')).textContent = s;
    leafs.find(e => /^\\d+ \\w+ 2026$/.test(e.textContent.trim())).textContent = d; body.appendChild(r); } const pg1 = [...document.querySelectorAll('body *')].find(e => e.children.length === 0 && /^Page \\d+ (of|sur) \\d+$/.test(e.textContent.trim())); if (pg1) pg1.textContent = pg1.textContent.includes('sur') ? 'Page 1 sur 1' : 'Page 1 of 1'; })()`;
const LISTR = `({ btnNew: H.R(H.btn('New Matter')) })`;
await plate('list', 'list-fr', LIST, LISTR);
const DLG = `({ dlg: H.R([...document.querySelectorAll('[role=dialog].andri-dialog')].find(H.vis) || [...document.querySelectorAll('[role=dialog]')].find(H.vis)), dlgIn: H.R(document.getElementById('dlgIn') || H.ph('Enter matter name')), btnCreate: H.R(H.btn('Create')), btnNew: H.R(H.btn('New Matter')) })`;
const FOCUS = `;(() => { const i = document.getElementById('dlgIn') || H.ph('Enter matter name'); i.style.borderColor = 'rgb(36, 30, 25)'; i.style.boxShadow = '0 0 0 3px rgba(36, 30, 25, .5)'; })()`;
// the dialog behind it: the French list with the demo rows (the snapshot's own list is another page state)
await plate('dlg0', 'dlg-empty', LIST + FOCUS, DLG);                                      // placeholder, Create disabled
const EMPTYIN = `;(() => { const i = H.ph('Enter matter name') || document.querySelector('[role=dialog] input'); i.id = 'dlgIn'; i.value = ''; i.setAttribute('value', ''); i.placeholder = ''; })()`;
await plate('dlgE', 'dlg-typed-uk', LIST + EMPTYIN + FOCUS, DLG);                         // enabled, text drawn on canvas
// ---------------------------------------------------------------- 2 the new matter, empty
await plate('m0', 'm0', '', `({ btnKB: H.R(H.kb()) })`);
// ---------------------------------------------------------------- 3 Knowledge Base, empty, and the upload dialog (the seven French files, as uploaded)
const KBR = `({ btnUp: H.R(H.btn('Upload Matter Documents')), btnEmail: H.R(H.btn('Email Documents')), railChatKB: H.R(H.rail('Chat')) })`;
await plate('kb0', 'kb-empty', '', KBR);
const UPR = `({ dlg: H.R(H.text('Upload Matter Documents', 0).closest('[role=dialog]') || H.text('Upload Matter Documents', 0).parentElement), pickChoose: H.R(H.text('Choose files to upload')), pickUp: H.R(H.btn('Upload')), pickCancel: H.R(H.btn('Cancel')) })`;
const DIALOG = `(H.text('Upload Matter Documents', 1) || H.text('Upload Matter Documents', 0)).closest('[role=dialog]')`;
await sprite('pick0', 'upload-empty', DIALOG, '', UPR);
await sprite('pick1', 'upload-sel', DIALOG, `(() => { const l = [...document.querySelectorAll('[class*=overflow-y]')].find(e => e.textContent.includes('01_Demande.pdf')); if (l) l.scrollTop = 0; })()`, UPR);

// ---------------------------------------------------------------- 4 Knowledge Base rows: processing and done
const ROWS = `({ kbRows: [...document.querySelectorAll('tbody tr')].map(r => ({ row: H.R(r), status: H.R(r.children[4]) })), railChatKB: H.R(H.rail('Chat')), btnUp: H.R(H.btn('Upload Matter Documents')) })`;
await plate('kbDone', 'kb-done', '', ROWS);
await plate('kbProc', 'kb-done', `document.querySelectorAll('tbody tr').forEach(r => { for (const i of [3, 4, 5]) r.children[i].style.opacity = '0'; })`, ROWS);
// ---------------------------------------------------------------- 5 the matter with its files: greeting, Example questions
const BOX = `(() => { const ta = document.querySelector('.thread-pane-active textarea'); let b = ta; while (b && !(b.getAttribute('class') || '').includes('rounded-[1.5rem]')) b = b.parentElement; return b; })()`;
const DISC = `H.starts('Andri is an AI system and can make mistakes, so please double-check responses.')`;
const GREETR = `({ cbox: H.R(${BOX}), eqBtn: H.R(H.aria('Example questions')), go: H.R(H.aria('Send')), btnKB: H.R(H.kb()), disc: H.R(${DISC}) })`;
await plate('m1', 'm1-greet', '', GREETR);
const EQP = `document.querySelector('.composer-overlay[role=listbox]')`;
await plate('m1hot', 'eqp-open', `${EQP}.style.visibility = 'hidden'`, GREETR);
await sprite('eqp0', 'eqp-open', EQP, '', `({})`);
// the first question is typed in French by the user (no English Example question is sent). Box states from the typed snapshot.
const Q1BOX = h => `(() => { const ta = document.querySelector('.thread-pane-active textarea'); ta.value = ''; ta.textContent = ''; ta.placeholder = ''; ta.style.height = '${h}px'; ta.style.minHeight = '${h}px'; ta.style.color = 'transparent'; ta.style.caretColor = 'transparent';
  [...ta.parentElement.children].forEach(c => { if (c !== ta) c.style.visibility = 'hidden'; }); })()`;
const Q1R = `({ cbox: H.R(${BOX}), go: H.R(H.aria('Send')), eqBtn: H.R(H.aria('Example questions')), disc: H.R(${DISC}),
  text0: (() => { const r = document.querySelector('.thread-pane-active textarea').getBoundingClientRect(); return [r.x + 16, r.y + 16, r.width - 32]; })() })`;
await plate('m1q1', 'cbox-q1', Q1BOX(48), Q1R);
await plate('m1q2', 'cbox-q1', Q1BOX(72), Q1R);

// ---------------------------------------------------------------- 6 the conversation
// Answers are shortened by cutting whole blocks only; step rows that only show staging's own setup are cut, never reworded:
// memory lookups (the staging account's memories), the reasoning about the staging matter's jurisdiction setting and about the
// staging firm, and Andri's question about the signer (answered in staging, left out like the Dutch 1.1).
const TURNS = `[...document.querySelector('.thread-pane-active .chat-scroll-container .flex.flex-col.space-y-4').children].filter(c => c.children.length)`;
const CUT = `(() => { const keep = [4, 3, 1]; ${TURNS}.forEach((t, i) => { const st = t.querySelector('[class~="space-y-2.5"]'); const rows = [...st.children]; const ans = rows[rows.length - 1].querySelector('.stream-chunks');
  [...ans.children].forEach((c, j) => { if (j >= keep[i]) c.remove(); });
  rows.slice(0, -1).forEach(r => { const s = r.innerText.replace(/\\s+/g, ' ');
    if (/^Accessing memories/.test(s) || /^Ask user/.test(s) || s.includes('jurisdiction mismatch') || s.includes('I need to draft a letter to Priya Nair updating her')) r.remove(); }); });
  const t = document.querySelector('.thread-pane-active .chat-scroll-container'); t.style.scrollBehavior = 'auto'; t.scrollTop = 0; })()`;
const COMPOSER = BOX;
const HIDE_TEXT = `(() => { const ta = document.querySelector('.thread-pane-active textarea'); ta.style.color = 'transparent'; ta.style.caretColor = 'transparent'; ta.placeholder = '';
  [...ta.parentElement.children].forEach(c => { if (c !== ta) c.style.visibility = 'hidden'; }); })()`;
const DOCKR = `({ cbox: H.R(${COMPOSER}), go: H.R(H.aria('Send')), atb: H.R(H.aria('Mention documents')), railJobs: H.R(H.rail('Jobs')), disc: H.R(${DISC}),
  text0: (() => { const ta = document.querySelector('.thread-pane-active textarea'); const r = ta.getBoundingClientRect(); return [r.x + 16, r.y + 16]; })() })`;
const THREAD_OFF = `(() => { const t = document.querySelector('.thread-pane-active .chat-scroll-container'); t.style.visibility = 'hidden'; t.style.opacity = '0'; })()`;
const MENU_PRE = `[...document.querySelectorAll('[role=listbox],.composer-overlay')].forEach(e => { if (/Matter Documents|Documents du dossier/.test(e.textContent)) e.style.display = 'none'; })`;
// conversation frame (wide), thread and composer drawn separately
await plate('chat', 'chat-thread', CUT + ';' + THREAD_OFF + `;${COMPOSER}.style.opacity = '0'; ${DISC}.style.opacity = '0';`, `({ railJobs: H.R(H.rail('Jobs')), btnKB: H.R(H.kb()) })`);
// composer states (wide). Text is drawn on canvas over them.
await sprite('cboxDock', 'chat-thread', COMPOSER, THREAD_OFF, DOCKR);                                         // empty, placeholder
await sprite('cboxDockOn', 'at-rep', COMPOSER, HIDE_TEXT + ';' + THREAD_OFF + `;${MENU_PRE}`, DOCKR);          // text in the box (pencil, bookmark, send lit)
await sprite('cboxDockAt', 'at-rep-typed', COMPOSER, HIDE_TEXT + ';' + THREAD_OFF, DOCKR);                    // after an @ pick: @ lit with its 1 badge
await sprite('cboxDock2', 'at-ald-chip', COMPOSER, HIDE_TEXT + ';' + THREAD_OFF, DOCKR);                      // two lines: the request and the template chip
// the @ menus
const MENU = `[...document.querySelectorAll('[role=listbox],.composer-overlay')].find(e => H.vis(e) && /Matter Documents|Documents du dossier/.test(e.textContent))`;
await sprite('mp0', 'at-rep', MENU);
await sprite('mp2a', 'at-ald', MENU);
// the whole thread as one tall sprite + item rects relative to it (wide card); image and rects from the same page load
if (want('thread')) {
  await open('chat-thread', CUT, 860);
  const h = await pg.evaluate(`(() => { const t = document.querySelector('.thread-pane-active .chat-scroll-container'); return t.scrollHeight; })()`);
  await pg.setViewportSize({ width: 1440, height: h + 600 });
  await pg.evaluate(`(() => { const t = document.querySelector('.thread-pane-active .chat-scroll-container'); const c = H.card();
    c.style.height = '${h + 400}px'; c.style.maxHeight = 'none'; c.style.overflow = 'visible'; t.style.height = '${h}px'; t.style.maxHeight = 'none'; t.style.overflow = 'visible'; t.style.flex = 'none';
    ${COMPOSER}.style.opacity = '0'; ${DISC}.style.opacity = '0';
    document.querySelectorAll('.thread-pane-active .chat-scroll-container ~ *, .fixed').forEach(e => { if (!e.contains(t)) e.style.visibility = 'hidden'; }); })()`);
  await pg.waitForTimeout(300);
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
    const cite = [...turns[0].querySelectorAll('.stream-chunks button')].find(b => ((b.getAttribute('aria-label') || '') + b.textContent).includes('09_Lettre_de_licenciement'));
    o.items.cite1 = rel(H.R(cite)); return o; })()`);
  await pg.screenshot({ path: P('thread'), clip: { x: info.box[0], y: info.box[1], width: info.box[2], height: h }, omitBackground: false });
  OUT.thread = info; console.log('thread', h, Object.keys(info.items).join(','));
  await pg.setViewportSize({ width: 1440, height: 860 });
}

// ---------------------------------------------------------------- 7 source panel (narrow card + document viewer, staging's own highlight)
const SIDE = `[...document.querySelectorAll('div')].find(e => { const r = e.getBoundingClientRect(); return (e.getAttribute('class') || '').includes('shrink-0') && r.x > 600 && r.width > 500 && r.height > 600; })`;
const PANEL_OFF = `(() => { const s = ${SIDE}; const R = s.getBoundingClientRect(); s.style.visibility = 'hidden';
  document.querySelectorAll('body *').forEach(e => { const r = e.getBoundingClientRect(); if (r.width && r.left >= R.left - 1 && r.top >= R.top - 1 && !e.closest('.thread-pane-active')) e.style.visibility = 'hidden'; }); })()`;
const CITE = `[...document.querySelectorAll('.thread-pane-active .stream-chunks button')].find(b => ((b.getAttribute('aria-label') || '') + b.textContent).includes('09_Lettre_de_licenciement'))`;
const NARROW = y => `(() => { const t = document.querySelector('.thread-pane-active .chat-scroll-container'); t.style.scrollBehavior = 'auto'; const c = ${CITE};
  t.scrollTop = 0; t.scrollTop = c.getBoundingClientRect().y - ${y}; })()`;
const BOTTOM = `(() => { const t = document.querySelector('.thread-pane-active .chat-scroll-container'); t.style.scrollBehavior = 'auto'; t.scrollTop = t.scrollHeight; })()`;
await plate('split', 'src-open', CUT + ';' + NARROW(470) + ';' + PANEL_OFF, `({ cite: H.R(${CITE}) })`);
const SRCR = `(() => { const p = ${SIDE}.getBoundingClientRect(); const marks = [...document.querySelectorAll('mark.pdf-citation-highlight')].map(m => m.getBoundingClientRect()).filter(m => m.width > 1);
  const x0 = Math.min(...marks.map(m => m.left)), y0 = Math.min(...marks.map(m => m.top)), x1 = Math.max(...marks.map(m => m.right)), y1 = Math.max(...marks.map(m => m.bottom));
  const c = [...document.querySelectorAll('button[aria-label=Close], button[aria-label="Fermer"]')].map(b => b.getBoundingClientRect()).find(r => r.x > 1300 && r.y < 130);
  return { panel: [p.x, p.y, p.width, p.height], para: [x0 - p.x, y0 - p.y, x1 - x0, y1 - y0], lines: marks.map(m => [m.x - p.x, m.y - p.y, m.width, m.height]), close: [c.x - p.x, c.y - p.y, c.width, c.height] }; })()`;
await sprite('src0', 'src-open', SIDE, `document.querySelectorAll('mark.pdf-citation-highlight').forEach(m => m.style.background = 'transparent')`, `({ src: ${SRCR} })`);
await sprite('src1', 'src-open', SIDE, '', `({ src: ${SRCR} })`);
if (OUT.src1) OUT.src = OUT.src1.src;
// ---------------------------------------------------------------- 8 Jobs panel and the letter
// The Jobs panel title is "Travaux" in Andri's French (jobs.title); the rail tooltip says "Traitements" (common.jobs).
const JOBSFR = `document.querySelectorAll('body *').forEach(e => { if (e.children.length === 0 && e.textContent.trim() === 'Jobs' && e.getBoundingClientRect().x > 800 && e.getBoundingClientRect().y < 140) e.textContent = 'Travaux'; })`;
if (want('jobs')) {
  await open('jobs-panel', CUT + ';' + BOTTOM + ';' + PANEL_OFF, 860, true);
  await pg.screenshot({ path: P('jobsSplit'), clip: full });
  OUT.jobsSplit = await pg.evaluate(`({ railJobs: H.R(H.rail('Jobs')) })`); console.log('plate jobsSplit');
}
const JOBR = `({ jobRow: H.R([...document.querySelectorAll('li, [role=listitem], div')].filter(l => H.vis(l) && l.textContent.trim().startsWith('Lettre_Nair_etat_de_la_procedure.docx') && l.getBoundingClientRect().height < 80 && l.getBoundingClientRect().height > 30).pop()) })`;
await sprite('jobsP', 'jobs-panel', SIDE, JOBSFR, JOBR);
await sprite('docP', 'doc-jobs', SIDE, '');

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
await hoverCrop('hv_chip', 'list-en', LIST_EN, CHIPQ, 10, 860, NOTR);
await hoverCrop('hv_trig', 'co-page-en', '', `document.querySelector('button[role=combobox]')`, 10, 1000, NOTR);
await hoverCrop('hv_optDe', 'co-dropdown-en', '', `[...document.querySelectorAll('[role=option]')].find(o => o.textContent.trim() === 'French')`, 2, 1000, NOTR);
await hoverCrop('hv_upd', 'co-page-enfr', '', UPDQ, 12, 1000, NOTR);
await hoverCrop('hv_navDe', 'co-page-fr', '', NAVQ, 4, 1000, NOTR);
await hoverCrop('hv_new', 'list-fr', LIST, BTN('Nouveau dossier'), 12);
await hoverCrop('hv_create', 'dlg-typed-uk', LIST + EMPTYIN + FOCUS, BTN('Créer'), 12);
await hoverCrop('hv_kb', 'm0', '', `H.kb()`, 12);
await hoverCrop('hv_upl', 'kb-empty', '', BTN('Importer les documents du dossier'), 12);
await hoverCrop('hv_choose', 'upload-empty', '', `H.text('Choose files to upload').closest('button,label,[role=button]') || H.text('Choose files to upload')`, 12);
await hoverCrop('hv_uploadBtn', 'upload-sel', '', BTN('Importer'), 12);
await hoverCrop('hv_railChat', 'kb-done', '', RAIL('Chat'), 4);
await hoverCrop('hv_eq', 'm1-greet', '', `H.aria('Example questions')`, 6);
await hoverCrop('hv_send1', 'cbox-q1', Q1BOX(72), `H.aria('Send')`, 6);
await hoverCrop('hv_send2', 'at-rep-typed', HIDE_TEXT + ';' + THREAD_OFF, `H.aria('Send')`, 6);
await hoverCrop('hv_send3', 'at-ald-chip', HIDE_TEXT + ';' + THREAD_OFF, `H.aria('Send')`, 6);
await hoverCrop('hv_railJobs', 'chat-thread', CUT, RAIL('Jobs'), 4);
await hoverCrop('hv_jobRow', 'jobs-panel', JOBSFR, `[...document.querySelectorAll('li, [role=listitem], div')].filter(l => H.vis(l) && l.textContent.trim().startsWith('Lettre_Nair_etat_de_la_procedure.docx') && l.getBoundingClientRect().height < 80 && l.getBoundingClientRect().height > 30).pop()`, 2);
await b.close();
writeFileSync(path.join(HERE, 'rects.json'), JSON.stringify(OUT, null, 1));
writeFileSync(path.join(HERE, 'rects.js'), 'window.RECTS_DATA=' + JSON.stringify(OUT) + ';\n');
console.log('done');
