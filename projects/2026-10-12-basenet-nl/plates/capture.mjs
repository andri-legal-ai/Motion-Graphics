// Captures the Andri screens for the BaseNet NL video as 2x plates plus element rects (app px, window 1440 x 860).
// Source: DOM snapshots of Andri staging taken 13 Oct 2026 (staging-snapshot/raw), localised by staging-snapshot/localize.py:
// Timothy's staging account (firm in Dutch, BaseNet signed in with BaseNet's own test login, my matter "De Vries / Bakker"
// linked to test dossier D100009) and, for the empty Kennisbank with "Aanmelden bij BaseNet", Bennett's account.
// Shown as firm "Van Hoven & Partners", lawyer Sanne van Hoven (SH). The test dossier also holds the test team's own files
// (loop-*, E2E-*, Test*, flynn@...): those rows are left out of the lists, and chat rows that name them are cut. Andri's
// English "Nadenken" rows and the memory rows are cut too (cut, never reworded). Engine and helpers from 11.1.
// Usage: node capture.mjs [regex of plate names to redo]
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
  U(e) { let a = e.getBoundingClientRect(), x0 = a.width ? a.left : 1e9, y0 = a.width ? a.top : 1e9, x1 = a.width ? a.right : -1e9, y1 = a.width ? a.bottom : -1e9;
    for (const c of e.querySelectorAll('*')) { const r = c.getBoundingClientRect(); if (!r.width || getComputedStyle(c).visibility === 'hidden') continue; x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); }
    return [x0 - 1, y0 - 1, x1 - x0 + 2, y1 - y0 + 2].map(v => Math.round(v * 10) / 10); },
  vis(e) { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.x < 1440 && r.right > 0 && r.y < 860 && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).opacity !== '0'; },
  text(t, nth = 0, root = document) { const m = [...root.querySelectorAll('*')].filter(e => H.vis(e) && e.textContent.trim() === t && ![...e.children].some(c => c.textContent.trim() === t));
    m.sort((a, b) => { const p = a.getBoundingClientRect(), q = b.getBoundingClientRect(); return Math.abs(p.y - q.y) > 4 ? p.y - q.y : p.x - q.x; }); return m[nth]; },
  starts(t, nth = 0, root = document) { return [...root.querySelectorAll('*')].filter(e => H.vis(e) && e.textContent.trim().startsWith(t) && ![...e.children].some(c => c.textContent.trim().startsWith(t)))[nth]; },
  btn(t, nth = 0) { return [...document.querySelectorAll('button,a,[role=menuitem],[role=option],[role=tab],[role=radio]')].filter(e => H.vis(e) && e.innerText.trim() === t)[nth]; },
  btnS(t, nth = 0) { return [...document.querySelectorAll('button,a,[role=menuitem],[role=option],[role=tab]')].filter(e => H.vis(e) && e.innerText.trim().startsWith(t))[nth]; },
  aria(l) { return [...document.querySelectorAll('[aria-label]')].find(e => e.getAttribute('aria-label') === l && H.vis(e)); },
  dialog() { return [...document.querySelectorAll('[role=dialog],[role=alertdialog]')].find(d => H.vis(d) && d.getBoundingClientRect().width > 300); },
  pop() { return [...document.querySelectorAll('[data-radix-popper-content-wrapper]')].filter(e => e.getBoundingClientRect().width > 0).pop(); },
  under(trig, gap = 4) { const w = H.pop(); if (!w || !trig) return; const t = trig.getBoundingClientRect(), m = w.getBoundingClientRect(); w.style.transform = (w.style.transform || '') + ' translate(' + (t.left - m.left) + 'px,' + (t.bottom + gap - m.top) + 'px)'; },
  phrase(t, root = document.body) { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const i = n.textContent.indexOf(t); if (i < 0 || !H.vis(n.parentElement)) continue;
      const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + t.length); return [...r.getClientRects()].filter(x => x.width > 2).map(x => [x.x, x.y, x.width, x.height].map(v => Math.round(v * 10) / 10)); } return null; },
  setVal(el, v) { if (!el) return; el.value = v; el.setAttribute('value', v); if (el.tagName === 'TEXTAREA') el.textContent = v; },
  rail(l) { return [...document.querySelectorAll('a,button')].find(e => { const r = e.getBoundingClientRect(); return r.x < 30 && r.width > 20 && r.y > 100 && [e.getAttribute('aria-label'), e.getAttribute('title')].includes(l); }); },
  kb() { return [...document.querySelectorAll('button')].filter(b => b.textContent.trim().startsWith('Kennisbank') && b.getBoundingClientRect().width > 100).sort((p, q) => q.getBoundingClientRect().x - p.getBoundingClientRect().x)[0]; },
  top(t) { return [...document.querySelectorAll('a,button')].find(e => e.getBoundingClientRect().y < 60 && e.innerText.trim() === t); },
  leaf(root, re) { return [...root.querySelectorAll('*')].find(e => e.children.length === 0 && re.test(e.textContent.trim())); },
  // every page: the same top bar state (Inbox count), no snapshot button, scroll containers back to the top
  fix() {
    document.querySelectorAll('#snapbnbtn').forEach(e => e.remove());
    const inbox = H.btnS('Inbox'); if (inbox) { const n = H.leaf(inbox, /^\\d+$/); if (n) n.textContent = '4'; }
    if (!window.KEEP_TOAST) document.querySelectorAll('[data-sonner-toast], [data-sonner-toaster]').forEach(e => e.remove());
  },
};`;
async function load(snap, js = '', opts = {}) {
  await pg.setViewportSize({ width: 1440, height: opts.vh || 860 });
  await pg.goto(pathToFileURL(path.join(SNAP, snap + '.html')).href, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
  await pg.addScriptTag({ content: HELPERS });
  await pg.evaluate(o => { window.KEEP_TOAST = !!o.toast; }, opts);
  await pg.evaluate('H.fix()');
  if (js) { try { await pg.evaluate(js); } catch (e) { console.log('JS FAIL', snap, String(e).slice(0, 300)); throw e; } }
  await pg.waitForTimeout(120);
}
const out = {};
const want = n => !only || only.test(n);
async function rects(spec) { const o = {}; for (const [k, ex] of Object.entries(spec || {})) { o[k] = await pg.evaluate(ex => { try { const e = eval(ex); return Array.isArray(e) ? e : e ? H.R(e) : null; } catch (er) { return null; } }, ex); if (!o[k]) console.log('  no rect', k); } return o; }
async function plate(name, snap, js = '', spec = {}, opts = {}) {
  if (!want(name)) return; await load(snap, js, opts);
  await pg.screenshot({ path: path.join(HERE, name + '.png'), clip: { x: 0, y: 0, width: 1440, height: 860 } });
  out[name] = await rects(spec); console.log('plate', name);
}
async function sprite(name, snap, js, sel, spec = {}, opts = {}) {
  if (!want(name)) return; await load(snap, js, opts);
  const extra = await rects(spec);
  const box = await pg.evaluate(sel => { const el = eval(sel); if (!el) return null; el.setAttribute('data-sprite', '1');
    for (const e of document.querySelectorAll('body *')) if (!e.closest('[data-sprite]') && !e.querySelector('[data-sprite]')) e.style.visibility = 'hidden';
    for (let e = el.parentElement; e; e = e.parentElement) { e.style.background = 'transparent'; e.style.boxShadow = 'none'; e.style.borderColor = 'transparent'; }
    document.documentElement.style.background = 'transparent'; document.body.style.background = 'transparent'; el.style.boxShadow = 'none';
    return H.R(el); }, sel);
  if (!box) { console.log('NO SPRITE', name); return; }
  await pg.screenshot({ path: path.join(HERE, name + '.png'), clip: { x: box[0], y: box[1], width: box[2], height: box[3] }, omitBackground: true });
  out[name] = { box, ...extra }; console.log('sprite', name, box.join(','));
}

// ---------------------------------------------------------------- shared page fixes
// matters list: four demo matters built from staging's own rows (the real list is the test team's E2E matters)
const DEMO = [['Jansen Bouw / Gemeente Arnhem', 'Een aanbestedingsgeschil over de renovatie van een sporthal', '6 okt 2026'],
  ['Huurgeschil Meijer', 'Achterstallige huur en de opzegging van een winkelruimte', '2 okt 2026'],
  ['Nalatenschap Visser', 'De verdeling van een nalatenschap met een testament uit 2019', '29 sep 2026'],
  ['Smit Transport / Van Leeuwen', 'Incasso van openstaande facturen voor transportdiensten', '24 sep 2026']];
const LIST = `(() => { const rows = [...document.querySelectorAll('tbody tr')]; if (!rows.length) return; const tpl = rows.find(r => /Zaakoverzicht dossier D100008/.test(r.textContent)) || rows[2];
  const body = tpl.parentElement; rows.forEach(r => r.remove());
  for (const [n, s, d] of ${JSON.stringify(DEMO)}) { const r = tpl.cloneNode(true);
    r.querySelectorAll('[aria-label^="Details van de BaseNet"]').forEach(e => e.remove());
    const c = [...r.children]; H.leaf(c[0], /./).textContent = n; H.leaf(c[3], /./).textContent = s; H.leaf(c[4], /./).textContent = d; body.appendChild(r); }
  const pgx = H.starts('Pagina 1 van'); if (pgx) pgx.textContent = 'Pagina 1 van 1'; })()`;
// matter header: the video's matter, one conversation, Kennisbank count as in the new matter
const MATTER = (name, kb) => `(() => { const h = [...document.querySelectorAll('h1,h2,span,div')].find(e => e.children.length === 0 && /^(De Vries \\/ Bakker|Rijnveld Distributie B\\.V\\. \\/ Verhoef)$/.test(e.textContent.trim()) && e.getBoundingClientRect().y < 130);
  document.querySelectorAll('*').forEach(e => { if (e.children.length === 0 && /^(Rijnveld Distributie B\\.V\\. \\/ Verhoef|Rijnveld Distributie B\\.V\\. \\/ Verh…|De Vries \\/ Bakker)$/.test(e.textContent.trim()) && e.getBoundingClientRect().y < 130) e.textContent = ${JSON.stringify(name)}; });
  const conv = H.btnS('Gesprekken'); if (conv) { const n = H.leaf(conv, /^\\d+$/); if (n) n.textContent = '1'; [...document.querySelectorAll('*')].filter(e => e.getBoundingClientRect().y < 130 && e.getBoundingClientRect().y > 60 && /Zorgregeling/.test(e.textContent) && !e.textContent.includes('Gesprekken') && !e.querySelector('*:not(span):not(svg):not(path):not(circle)')).forEach(e => e.remove()); }
  ${kb == null ? '' : `const k = H.kb(); if (k) { const n = H.leaf(k, /^\\d+$/); if (n) n.textContent = '${kb}'; }`} })()`;
// Kennisbank, BaseNet source: only the dossier's case files (the test team's rows left out), "SS" = Sanne van Hoven
const TEST_ROW = /^(loop-|E2E-|Test123|Test BaseNet|flynn@)/;
const DOCS = `(() => { document.querySelectorAll('tbody tr').forEach(r => { const n = r.children[1] ? r.children[1].textContent.trim() : r.textContent.trim(); if (${TEST_ROW}.test(n)) r.remove(); });
  document.querySelectorAll('tbody td').forEach(td => { const l = H.leaf(td, /^SS$/); if (l) l.textContent = 'SH'; });
  document.querySelectorAll('[data-snap-scroll]').forEach(e => { e.scrollTop = 0; }); document.scrollingElement.scrollTop = 0; })()`;
const ROWR = n => `(() => { const r = [...document.querySelectorAll('tbody tr')].find(r => r.textContent.includes('${n}')); return r ? H.R(r) : null; })()`;
const CBR = n => `(() => { const r = [...document.querySelectorAll('tbody tr')].find(r => r.textContent.includes('${n}')); return r ? H.R(r.querySelector('[role=checkbox]')) : null; })()`;
const STATER = n => `(() => { const r = [...document.querySelectorAll('tbody tr')].find(r => r.textContent.includes('${n}')); return r ? H.R(r.lastElementChild.querySelector('span,div') || r.lastElementChild) : null; })()`;

// ---------------------------------------------------------------- 1 matters list (demo), a demo matter, its Kennisbank, the sign-in form
const TOP = { zaken: `H.top('Zaken')`, pers: `H.aria('Personalisatie')`, nieuw: `H.btn('Nieuwe zaak')` };
await plate('zl', 'z01-zaken', LIST, { ...TOP, row1: `document.querySelector('tbody tr')`, row1name: `H.text('Jansen Bouw / Gemeente Arnhem')` });
// the demo matter "Jansen Bouw / Gemeente Arnhem": the greeting page of a new matter (my De Vries matter before its first question)
await plate('mJ', 'c01-chat-empty', MATTER('Jansen Bouw / Gemeente Arnhem', 0), { kbBtn: `H.kb()`, pers: `H.aria('Personalisatie')` });
// its Kennisbank, empty, with Aanmelden bij BaseNet (Bennett's account, NL matter: the button shows before anyone signs in)
const KB1 = MATTER('Jansen Bouw / Gemeente Arnhem', 0);
await plate('k1', 'k01-kb-empty', KB1, { signin: `H.btn('Aanmelden bij BaseNet')`, pers: `H.aria('Personalisatie')`, zaken: `H.top('Zaken')` });
// the sign-in form, empty and filled (a demo username; the password shows as dots, as staging masks it)
const FORM = { dlg: `H.dialog()`, user: `document.getElementById('connector-login-username')`, pass: `document.getElementById('connector-login-password')`, go: `H.btn('Aanmelden', 1) || [...H.dialog().querySelectorAll('button[type=submit]')][0]`,
  title: `(() => { const d = H.dialog(); const h = [...d.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.trim() === 'Aanmelden bij BaseNet' && e.getBoundingClientRect().width > 40); return h ? H.R(h) : null; })()`,
  // width of the typed value as the field draws it (the password as staging's dots), and the field's left padding
  userW: `(() => { const i = document.getElementById('connector-login-username'); const g = document.createElement('canvas').getContext('2d'); const cs = getComputedStyle(i); g.font = cs.font; return [g.measureText(i.value).width, parseFloat(cs.paddingLeft), 0, 0]; })()`,
  passW: `(() => { const i = document.getElementById('connector-login-password'); const g = document.createElement('canvas').getContext('2d'); const cs = getComputedStyle(i); g.font = cs.font; return [g.measureText('\u2022'.repeat(i.value.length)).width, parseFloat(cs.paddingLeft), 0, 0]; })()` };
await plate('kF0', 'k02-signin-form', KB1, FORM);
await plate('kF1', 'k02-signin-form', KB1 + `; H.setVal(document.getElementById('connector-login-username'), 's.vanhoven'); H.setVal(document.getElementById('connector-login-password'), 'basenetwachtwoord');`, FORM);
await plate('k1d', 'k02-signin-form', KB1 + `; document.querySelectorAll('[role=dialog]').forEach(d => d.remove()); document.querySelectorAll('[data-state=open][class*=fixed][class*=inset-0]').forEach(d => d.remove());`, {});

// ---------------------------------------------------------------- 2 Personalisatie: the panel (as staging shows it at 1440), Koppelingen
// the Gmail and Outlook rows of the staging account show "expired" warnings with its addresses; they show the not-connected state
// staging gives SharePoint on the same page (its own status line and Koppelen button)
const PANEL = `[...document.querySelectorAll('[role=dialog]')].find(d => d.getAttribute('aria-label') === 'Personalisatie' && d.getBoundingClientRect().width > 300) || H.dialog()`;
const CENTRE = `(() => { const d = ${PANEL}; d.style.height = '832px'; d.style.maxHeight = '832px'; const r = d.getBoundingClientRect(); d.style.transform = 'translate(' + ((1440 - r.width) / 2 - r.x) + 'px, ' + (14 - r.y) + 'px)'; })()`;
const NOMAIL = `(() => { const spStatus = H.text('Niet gekoppeld'); if (!spStatus) return; let spRow = spStatus; while (spRow && ![...spRow.querySelectorAll('button')].some(b => b.innerText.trim() === 'Koppelen')) spRow = spRow.parentElement;
  const spBtn = [...spRow.querySelectorAll('button')].find(b => b.innerText.trim() === 'Koppelen');
  for (const name of ['Gmail', 'Outlook']) { const t = H.text(name); if (!t) continue; let row = t; while (row && !row.textContent.includes('Opnieuw koppelen')) row = row.parentElement; if (!row) continue;
    const st = [...row.querySelectorAll('*')].filter(e => /is verlopen/.test(e.textContent) && ![...e.children].some(c => /is verlopen/.test(c.textContent)))[0];
    if (st) { const line = st.parentElement.querySelector('svg') ? st.parentElement : st; const n = spStatus.cloneNode(true); line.replaceWith(n); }
    const btns = [...row.querySelectorAll('button')].filter(b => /koppelen/i.test(b.innerText)); const holder = btns[0] && btns[0].parentElement; if (holder) { holder.innerHTML = ''; holder.appendChild(spBtn.cloneNode(true)); } } })()`;
const PZ = { panel: PANEL, koppel: `H.btn('Koppelingen')`, close: `H.aria('Sluiten') || H.aria('Close')`, bnRow: `(() => { const t = H.text('BaseNet'); let r = t; while (r && !r.textContent.includes('Afmelden')) r = r.parentElement; return r; })()`,
  bnSigned: `H.starts('Aangemeld als')`, how: `H.btn('Hoe werkt het?')` };
await sprite('pz0', 'p03-personalisatie-open', CENTRE, PANEL, PZ);
await sprite('pz1', 'p02-koppelingen-signedin', CENTRE + ';' + NOMAIL, PANEL, PZ);

// ---------------------------------------------------------------- 3 New matter with its BaseNet dossier (demo list behind the dialog)
const NM = { dlg: `H.dialog()`, name: `H.dialog().querySelector('input')`, dossier: `H.btnS('Koppel een van uw dossiers') || H.btnS('De Vries / Bakker - echtscheiding')`,
  create: `H.btn('Aanmaken')`, search: `document.querySelector('[data-radix-popper-content-wrapper] input')`, opt: `H.starts('De Vries / Bakker - echtscheiding en ouderschapsplan', 0, H.pop() || document)` };
const PICK = `H.under(H.btnS('Koppel een van uw dossiers'), 4)`;
await plate('n0', 'n01-newmatter-empty', LIST, NM);
await plate('n0e', 'n01-newmatter-empty', LIST + `; (() => { const i = H.dialog().querySelector('input'); i.placeholder = ''; })()`, NM);       // name drawn on canvas over this
await plate('n1', 'n02-picker-open', LIST + ';' + PICK + `; H.setVal(H.dialog().querySelector('input'), 'De Vries / Bakker')`, NM);
await plate('n1e', 'n02-picker-open', LIST + ';' + PICK + `; (() => { const i = document.querySelector('[data-radix-popper-content-wrapper] input'); i.placeholder = ''; })()`, NM);
await plate('n2', 'n03-picker-search', LIST + ';' + PICK, NM);
await plate('n3', 'n04-picked', LIST, NM);

// ---------------------------------------------------------------- 4 the new matter: greeting, Kennisbank (Andri, then BaseNet source)
const GREET = { kbBtn: `H.kb()`, chatRail: `H.rail('Chat') || H.rail('Chat openen')`, ta: `document.querySelector('textarea')`, go: `H.aria('Versturen')` };
await plate('mD', 'c01-chat-empty', MATTER('De Vries / Bakker', 0), GREET);
// the question in the box (the text I typed in staging; the send button lit as staging shows it with text in the box)
const Q = 'Hoe is de zorg voor de kinderen verdeeld? Geef een kort overzicht.';
await plate('mDq', 'c02-chat-typed', MATTER('De Vries / Bakker', 0) + `; H.setVal(document.querySelector('textarea'), ${JSON.stringify(Q)})`, GREET);
const KBR = { andri: `H.btn('Andri')`, basenet: `[...document.querySelectorAll('[role=radio]')].find(e => e.innerText.trim() === 'BaseNet')`, badge: `H.btnS('De Vries / Bakker - echtsch')`,
  notice: `H.phrase('Documenten in het gekoppelde BaseNet-dossier.')`, chatRail: `H.rail('Chat')`,
  f1: ROWR('File_01_Samenvatting'), f2: ROWR('File_02_Ouderschapsplan'), cb1: CBR('File_01_Samenvatting'), cb2: CBR('File_02_Ouderschapsplan'),
  st1: STATER('File_01_Samenvatting'), st2: STATER('File_02_Ouderschapsplan'), mail: ROWR('vervolgregeling'), sync: `H.btnS('Synchroniseren naar Andri')`, bar: `H.starts('2 documenten geselecteerd')`,
  toast: `document.querySelector('[data-sonner-toast]')`, mailType: `H.phrase('E-mail (archief)')` };
await plate('kA', 'k10-andri-empty', MATTER('De Vries / Bakker', 0), KBR);
await plate('kB', 'k11-basenet-docs', MATTER('De Vries / Bakker', 0) + ';' + DOCS, KBR);
await plate('kBs', 's01-selected', MATTER('De Vries / Bakker', 0) + ';' + DOCS, KBR);
await plate('kBp', 's02-auto-30', MATTER('De Vries / Bakker', 0) + ';' + DOCS, KBR);
await plate('kBd', 's02-auto-44', MATTER('De Vries / Bakker', 2) + ';' + DOCS, KBR, { toast: true });
await plate('kBn', 's04-synced-clean', MATTER('De Vries / Bakker', 2) + ';' + DOCS, KBR);

// ---------------------------------------------------------------- 5 the conversation: base card, docked chat box, the thread as one tall sprite
const TURNS = `[...document.querySelector('.thread-pane-active .chat-scroll-container .flex.flex-col.space-y-4').children].filter(c => c.children.length)`;
const CUTROWS = (keep, paras = null, tableEnd = false) => `(() => { ${TURNS}.forEach((t, i) => { const st = t.querySelector('[class~="space-y-2.5"]'); if (!st) return;
  [...st.children].slice(0, -1).forEach(r => { const s = r.textContent.trim(); if (/^(Nadenken|Geheugen raadplegen|Onthouden|Execute Code|Deliver File)/.test(s)) r.remove(); });
  const ans = st.lastElementChild.querySelector('.stream-chunks'); if (ans && ${keep} != null) [...ans.children].forEach((c, j) => { if (j >= ${keep}) c.remove(); });
  const last = st.lastElementChild, A = last.querySelector('.markdown') || last;
  if (${keep} === 0) last.remove();
  else if (${paras} != null) [...A.querySelectorAll(':scope > p')].forEach((q, j) => { if (j >= ${paras}) q.remove(); });
  if (${tableEnd}) A.querySelectorAll('table').forEach(tb => { let wrap = tb; while (wrap.parentElement && wrap.parentElement !== A) wrap = wrap.parentElement; let n = wrap.nextElementSibling; while (n) { const x = n.nextElementSibling; n.remove(); n = x; } }); }); })()`;
const BOX = `(() => { const ta = document.querySelector('.thread-pane-active textarea') || document.querySelector('textarea'); let b = ta; while (b && !(b.getAttribute('class') || '').includes('rounded-[1.5rem]')) b = b.parentElement; return b || ta.parentElement.parentElement; })()`;
const THREAD_OFF = `(() => { const t = document.querySelector('.thread-pane-active .chat-scroll-container'); t.style.visibility = 'hidden'; })()`;
const C16 = MATTER('De Vries / Bakker', 0);
await plate('cT', 'c16-answer-top-nopanel', C16 + ';' + THREAD_OFF + `; (${BOX}).style.visibility = 'hidden'; (H.starts('Andri is een AI-systeem') || {style:{}}).style.visibility = 'hidden';`, { kbBtn: `H.kb()` });
await sprite('dock', 'c16-answer-top-nopanel', C16 + ';' + THREAD_OFF, BOX, { go: `H.aria('Versturen')` });
await sprite('disc', 'c16-answer-top-nopanel', C16 + ';' + THREAD_OFF + `; (${BOX}).style.visibility = 'hidden';`, `H.starts('Andri is een AI-systeem')`);
async function thread(name, snap, js, turnIdx) {
  if (!want(name)) return;
  await load(snap, js);
  const h = await pg.evaluate(`(() => { const t = document.querySelector('.thread-pane-active .chat-scroll-container'); return t.scrollHeight; })()`);
  await load(snap, js + `; (() => { const t = document.querySelector('.thread-pane-active .chat-scroll-container'); let c = t; while (c && c !== document.body) { c.style.height = 'auto'; c.style.maxHeight = 'none'; c.style.overflow = 'visible'; c = c.parentElement; }
    t.style.height = '${h}px'; t.style.flex = 'none'; (${BOX}).style.visibility = 'hidden'; const d = H.starts('Andri is een AI-systeem'); if (d) d.style.visibility = 'hidden'; t.scrollTop = 0; })()`, { vh: h + 400 });
  const info = await pg.evaluate(`(() => { const t = document.querySelector('.thread-pane-active .chat-scroll-container'); const T = t.getBoundingClientRect();
    const rel = r => [r[0] - T.x, r[1] - T.y, r[2], r[3]].map(v => Math.round(v * 10) / 10);
    const turns = ${TURNS}; const tu = turns[${turnIdx} < 0 ? turns.length + ${turnIdx} : ${turnIdx}]; const st = tu.querySelector('[class~="space-y-2.5"]'); const rows = [...st.children];
    const o = { box: H.R(t), ub: rel(H.U(tu.children[0])), steps: rows.slice(0, -1).map(r => { const q = r.getBoundingClientRect(); return rel([q.x - 2, q.y - 2, q.width + 4, q.height + 4]); }),
      stepNames: rows.slice(0, -1).map(r => r.textContent.trim().slice(0, 40)), ans: [...(rows[rows.length - 1].querySelector('.stream-chunks') || { children: [] }).children].map(c => rel(H.U(c))), turnTop: rel(H.R(tu))[1] };
    const act = tu.querySelector('.mt-4.flex-shrink-0'); if (act) o.act = rel(H.U(act));
    const cite = [...tu.querySelectorAll('.stream-chunks button, .stream-chunks a, .stream-chunks [role=button]')].find(b => ((b.getAttribute('aria-label') || '') + b.textContent).includes('File_02_Ouderschapsplan'));
    if (cite) o.cite = rel(H.U(cite)); return o; })()`);
  await pg.screenshot({ path: path.join(HERE, name + '.png'), clip: { x: info.box[0], y: info.box[1], width: info.box[2], height: h } });
  out[name] = info; console.log('thread', name, h, info.stepNames.join(' | '), 'ans', info.ans.length);
  await pg.setViewportSize({ width: 1440, height: 860 });
}
await thread('th', 'c16-answer-top-nopanel', C16 + ';' + CUTROWS(4), 0);

// ---------------------------------------------------------------- 6 writing to BaseNet (Timothy's test matter on the same dossier D100009; my own matter
// never wrote anything): one turn per plate, the turn alone and at the top of the conversation
const ONE = idx => `(() => { const turns = ${TURNS}; turns.forEach((t, i) => { if (i !== ${idx}) t.remove(); }); document.querySelectorAll('button').forEach(bt => { if (/^Eerdere Berichten Laden$/i.test(bt.innerText.trim())) bt.remove(); });
  const t = document.querySelector('.thread-pane-active .chat-scroll-container'); t.style.scrollBehavior = 'auto'; t.scrollTop = 0; })()`;
const W = MATTER('De Vries / Bakker', 2);
const WR = { chips: `(() => { const st = ${TURNS}[0].querySelector('[class~="space-y-2.5"]'); const rows = [...st.children]; const chip = r => /^(Sanne vragen|Document in BaseNet|Uren registreren|BaseNet-)/.test(r.textContent.trim()); return rows.filter(chip).map(r => H.R(r)); })()`,
  ans: `(() => { const st = ${TURNS}[0].querySelector('[class~="space-y-2.5"]'); const last = st.lastElementChild; if (!last || /^(Sanne vragen|Document in BaseNet|Uren registreren|BaseNet-)/.test(last.textContent.trim())) return []; const a = last.querySelector('.markdown') || last.querySelector('.stream-chunks'); return a ? [...a.children].map(c => H.U(c)) : []; })()`,
  ub: `H.U(${TURNS}[0].children[0])`,
  // the user's own message bubble (the yellow pill), not the whole row with its date and buttons
  bubble: `(() => { const u = ${TURNS}[0].children[0]; const m = [...u.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); const bg = getComputedStyle(e).backgroundColor; return r.height > 24 && r.height < 120 && r.width > 60 && bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && e.textContent.trim().length > 8 && !e.querySelector('button'); }); m.sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width); return m[0] ? H.R(m[0]) : null; })()`, chatRail: `H.rail('Chat')`, kbRail: `H.rail('Kennisbank')` };
await plate('wDoc', 'h11-hours-answer', W + ';' + ONE(3) + ';' + CUTROWS(0), WR);
await plate('wHrs', 'h11-hours-answer', W + ';' + ONE(4) + ';' + CUTROWS(1, 1), WR);
await plate('wAg', 'h11-hours-answer', W + ';' + ONE(0) + ';' + CUTROWS(1, 1, true), WR);
await b.close();
const merged = { ...RECTS, ...out };
writeFileSync(path.join(HERE, 'rects.json'), JSON.stringify(merged, null, 1));
writeFileSync(path.join(HERE, 'rects.js'), 'window.RECTS_DATA=' + JSON.stringify(merged) + ';\n');
console.log('plates ok', Object.keys(out).length);
