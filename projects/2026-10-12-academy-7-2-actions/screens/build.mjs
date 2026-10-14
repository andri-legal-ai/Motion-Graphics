// Builds the Andri screens for Academy 7.2 (Actions) and renders them to 2x PNG plates with Playwright.
//   node screens/build.mjs [plateName]   -> screens/out/<name>.html, plates/<name>.png, plates/rects.json(.js)
// Window 1470 x 835, as staging. Every value comes from staging measurements of 12 Oct 2026
// (staging-captures/measure-notes.md): the Actions page, the New action panel, the build log, the detail and share states,
// Nair's Knowledge Base, the @ lists, the real Remedy-check run in Nair, and the workflow Run Action step.
// The nav bar, Explore menu, matter frame and chat boxes reuse the 4.1 staging snapshots (snap41/, measured 9 Oct 2026).
// Demo values: firm Aldridge Vine, avatar AF. Another session's items (21_Letter_Bowater_Sykes_Remedy, the "remedy hearing gap" memory) are left out.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '../plates/pw.mjs';

const P = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAP = f => readFileSync(path.join(P, 'snap41', f), 'utf8');
const U = f => pathToFileURL(path.join(P, f)).href;
const W = 1470, H = 835;
function icon(name) {
  const f = path.join(P, 'icons', name + '.svg');
  if (!existsSync(f)) { console.warn('missing icon', name); return ''; }
  return readFileSync(f, 'utf8').replace(/<!--.*?-->/gs, '').replace(/\s(width|height)="24"/g, ' width="100%" height="100%"').replace(/\sclass="[^"]*"/, '').replace(/\s+/g, ' ');
}
const icons = html => html.replace(/<i class="ic" ([^>]*)data-i="([\w-]+)"([^>]*)><\/i>/g, (m, a, n, b) => `<i class="ic" ${a}${b}>${icon(n)}</i>`);

// ------------------------------------------------------------------ tiny HTML helpers (window coordinates)
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const st = o => Object.entries(o).map(([k, v]) => `${k.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}:${typeof v === 'number' ? v + 'px' : v}`).join(';');
const box = (x, y, w, h, css = {}, inner = '', id = '') => `<div${id ? ` id="${id}"` : ''} style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;${st(css)}">${inner}</div>`;
const txt = (x, y, text, css = {}, id = '') => `<div${id ? ` id="${id}"` : ''} style="left:${x}px;top:${y}px;white-space:nowrap;${st(css)}">${text}</div>`;
const ic = (n, x, y, s, color = '#241e19', id = '') => `<i class="ic"${id ? ` id="${id}"` : ''} data-i="${n}" style="left:${x}px;top:${y}px;width:${s}px;height:${s}px;color:${color}"></i>`;
const icS = (n, s, color = '#241e19', extra = '') => `<i class="ic" data-i="${n}" style="position:static;display:inline-block;width:${s}px;height:${s}px;color:${color};${extra}"></i>`;
const F = (size, lh, w = 400, color = '#241e19', fam = "'Rethink Sans'") => ({ fontFamily: fam, fontSize: size, lineHeight: lh, fontWeight: w, color });
const NECO = 'fontHeading';
const INK = '#241e19', MUTED = '#494746', LINE = 'rgba(204,193,178,0.8)', LINE7 = 'rgba(204,193,178,0.7)', YEL = '#f8e37c';

// ------------------------------------------------------------------ page
const BASE = `
@font-face{font-family:"Rethink Sans";src:url(${U('assets/fonts/RethinkSans.woff2')}) format("woff2");font-weight:400 800}
@font-face{font-family:fontHeading;src:url(${U('assets/fonts/Neco-400.woff2')}) format("woff2");font-weight:400}
@font-face{font-family:fontHeading;src:url(${U('assets/fonts/Neco-500.woff2')}) format("woff2");font-weight:500}
@font-face{font-family:fontHeading;src:url(${U('assets/fonts/Neco-700.woff2')}) format("woff2");font-weight:600 700}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:transparent;-webkit-font-smoothing:antialiased;font-family:"Rethink Sans"}
.win{position:relative;width:1470px;overflow:hidden;background:rgb(242,239,233)}
.win div,.win i.ic,.win img{position:absolute}
.win .flow div,.win .flow i.ic{position:static}
.win i.ic{display:block;line-height:0}
.win i.ic[style*="inline-block"],.win i.ic[style*="static"]{position:static;display:inline-block;vertical-align:-2px}
.win i.ic svg{width:100%;height:100%;display:block}
.win span{position:static}
.ph{font-style:normal;color:oklab(0.399146 0.00200959 0.00227141 / 0.6)}
.clamp2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;white-space:normal!important}
.ell{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
`;
const css41 = SNAP('common.css') + SNAP('chat.css');
const MONO = s => s.replace(/font-family:ui-monospace/g, 'font-family:"SF Mono",Menlo,monospace');
const logo = U('assets/andri-logo.svg');
// nav: 'explore' (matter pages: "Explore", no underline), 'actions', 'workflows' (tab label + underline), null
function nav(kind) {
  let n = SNAP('NAV.html').replace('src="LOGO"', `src="${logo}"`);
  const label = { explore: 'Explore', actions: 'Actions', workflows: 'Workflows' }[kind];
  const tw = { explore: 50, actions: 48.1, workflows: 65.6 }[kind];
  n = n.replace('class="k62" id="navTabTx" style="left:355.7px;top:24px;width:56.9px', `class="${kind === 'explore' ? 'k62n' : 'k62'}" id="navTabTx" style="left:355.7px;top:24px;width:${tw}px`).replace('>Case law<', `>${label}<`)
    .replace('id="navTabIc" data-i="chevron-down" style="left:418.6px', `id="navTabIc" data-i="chevron-down" style="opacity:${kind === 'explore' ? 1 : .6};left:${355.7 + tw + 6.0}px`);
  n = kind === 'explore' ? n.replace('class="k56" id="navUnder" style="left:343.7px;top:67px;width:100.9px', 'class="k56" id="navUnder" style="display:none;left:0;top:67px;width:0')
    : n.replace('class="k56" id="navUnder" style="left:343.7px;top:67px;width:100.9px', `class="k56" id="navUnder" style="left:343.7px;top:67px;width:${tw + 44}px`);
  return n;
}
export function page({ h = H, navKind = 'explore', body, extraCss = '', transparent = false }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}${MONO(css41)}${extraCss}${transparent ? '.win{background:transparent!important}' : ''}</style></head><body>
<div class="win" id="win" style="height:${h}px">${icons(MONO(body)).replace(/src="LOGO"/g, `src="${logo}"`)}${navKind ? icons(nav(navKind)) : ''}</div></body></html>`;
}
export async function render(list) {
  mkdirSync(path.join(P, 'screens/out'), { recursive: true }); mkdirSync(path.join(P, 'plates'), { recursive: true });
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const pg = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  pg.on('pageerror', e => console.log('ERR', String(e)));
  const rects = {};
  for (const s of list) {
    const f = path.join(P, 'screens/out', s.name + '.html'); writeFileSync(f, page(s));
    await pg.setViewportSize({ width: s.vw || W, height: Math.ceil(s.h || H) });
    await pg.goto(pathToFileURL(f).href); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(120);
    if (s.prep) await pg.evaluate(s.prep);
    const clip = s.clip || { x: 0, y: 0, width: s.vw || W, height: s.h || H };
    await pg.screenshot({ path: path.join(P, 'plates', s.name + '.png'), clip, omitBackground: true });
    rects[s.name] = await pg.evaluate(c => { const o = {}; for (const e of document.querySelectorAll('[id]')) { const r = e.getBoundingClientRect(); if (r.width) o[e.id] = [r.left - c.x, r.top - c.y, r.width, r.height].map(v => Math.round(v * 10) / 10); } return o; }, clip);
    if (s.clip) rects[s.name].box = [s.at ? s.at[0] : clip.x, s.at ? s.at[1] : clip.y, clip.width, clip.height];
    console.log('plate', s.name);
  }
  await b.close();
  return rects;
}

// ------------------------------------------------------------------ shared pieces
const ICON_INK = U('assets/Andri-Logo-Icon-Ink.svg');
const btnY = (x, y, w, label, icn, h = 36, r = 12, fs = 14, id = '') => box(x, y, w, h, { background: YEL, borderRadius: r }, (icn ? ic(icn, 14, (h - 16) / 2, 16, INK) : '') + txt(icn ? 36 : 14, (h - 20) / 2, label, F(fs, '20px', 600)), id);
const btnO = (x, y, w, label, icn, id = '') => box(x, y, w, 36, { border: '1px solid #ccc1b3', borderRadius: 12, background: '#fff' }, (icn ? ic(icn, 14, 10, 14, INK) : '') + txt(icn ? 34 : 14, 7, label, F(14, '20px', 600)), id);
const spinnerDisc = (x, y, id) => box(x, y, 24, 24, { border: '1px solid rgba(248,227,124,0.6)', borderRadius: '50%', boxShadow: 'rgba(255,255,255,.06) 0 1px 0 inset, rgba(35,30,25,.04) 0 1px 2px' },
  box(0, 0, 22, 22, { background: '#F7E17E', borderRadius: '50%' }, `<img src="${ICON_INK}" style="left:4px;top:4px;width:14px;height:14px">`), id);

// ---------------------------------------------------------------- Actions page (list side)
// tabs with counts; sel = 'all' | 'personal' | 'company'
function tabs(n = { all: 0, personal: 0, company: 0 }, sel = 'all') {
  const t = [['all', 'All', 20, 62.6], ['personal', 'Personal', 84.6, 0], ['company', 'Company', 173.8, 0]];
  let h = box(16, 84, 256.6, 36, { background: 'rgba(36,30,25,0.03)', border: `1px solid ${LINE7}`, borderRadius: 12 });
  const lx = { all: 32, personal: 96.6, company: 185.8 }, lw = { all: 14.6, personal: 50.7, company: 58.4 };
  for (const [k, label] of t) {
    if (k === sel) {
      const x0 = lx[k] - 12, w = lw[k] + 6 + 18 + 24;
      h += box(x0, 88, w, 28, { background: '#fff', borderRadius: 8, boxShadow: 'rgba(255,255,255,0.6) 0 1px 0 0 inset, rgba(35,30,25,0.04) 0 1px 2px 0, rgba(204,193,179,0.5) 0 0 0 1px' });
      h += txt(lx[k], 92.3, label, F(13, '19.5px', 500));
      h += box(lx[k] + lw[k] + 6, 93, 18, 18, { background: YEL, borderRadius: 6, textAlign: 'center', ...F(10.5, '18px', 700) }, String(n[k]), 'tab_' + k);
    } else {
      h += txt(lx[k], 92.3, label, F(13, '19.5px', 500, MUTED));
      h += txt(lx[k] + lw[k] + 6, 93.8, String(n[k]), F(11, '16.5px', 600, 'rgba(73,71,70,0.8)'), 'tab_' + k);
    }
  }
  return h;
}
const searchBox = () => box(280.6, 84, 240, 36, { background: '#fff', border: '1px solid #ddd3c6', borderRadius: 12, boxShadow: 'rgba(0,0,0,0.05) 0 1px 2px' },
  ic('search', 13, 10, 16, MUTED) + txt(37, 8, '<em class="ph">Search actions...</em>', F(14, '20px')));
// right edge of the toolbar: W-24 without the panel, list right (770) with it
function toolbar(panel) {
  const right = panel ? 770 : W - 24;
  return box(right - 137.6 - 44, 84, 36, 36, { borderRadius: 8 }, ic('info', 9, 9, 18, MUTED), 'infoBtn') + btnY(right - 137.6, 84, 137.6, 'Create Action', 'plus', 36, 12, 14, 'createBtn');
}
const listCard = (panel, inner = '') => box(16, 132, panel ? 754 : W - 32, H - 16 - 132, { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, boxShadow: 'rgba(35,30,25,0.06) 0 1px 2px 0, rgba(35,30,25,0.18) 0 12px 32px -12px', overflow: 'hidden' }, inner, 'listCard');
// empty state, centred in the list card (measured at 1920 and re-centred for the 835 high window)
function emptyState(panel) {
  const cw = panel ? 754 : W - 32, cx = cw / 2, top = 266.4 - 132;   // card-relative
  let h = box(cx - 22, top, 44, 44, { background: 'rgba(36,30,25,0.04)', borderRadius: 12 }, ic('zap', 12, 12, 20, MUTED));
  h += box(cx - 160, top + 52, 320, 20.3, { textAlign: 'center', ...F(13.5, '20.25px', 500) }, 'Brief Andri once, run it in any matter');
  h += box(cx - 150, top + 80.2, 300, 75, { textAlign: 'center', whiteSpace: 'normal', ...F(12.5, '18.75px', 400, MUTED) }, 'Describe a task the way you would brief a junior colleague: what to do, what to read, what the result should look like. Andri follows it the same way every time.');
  h += box(cx - 86.9, top + 171.2, 173.8, 32, { background: YEL, borderRadius: 8 }, ic('plus', 12, 9, 14, INK) + txt(32, 6.6, 'Create your first action', F(12.5, '18.75px', 600)));
  const cells = [['Contract review', 'Flag the clause types you care about and check them against your standard positions.'],
    ['Client intake', 'Check that the documents a new client sends line up, and run the conflict check your firm runs.'],
    ['Due diligence checklist', "Work through a document set against your firm's checklist and report what is missing."]];
  let g = '';
  cells.forEach(([t, p], i) => { g += box(1 + i * 186.3, 1, 185.3, 123.8, { background: '#fff', borderRadius: i === 0 ? '11px 0 0 11px' : i === 2 ? '0 11px 11px 0' : 0 },
    txt(16, 16, t, F(12.5, '18.75px', 500)) + box(16, 38.8, 153.3, 69, { whiteSpace: 'normal', ...F(11.5, '17.25px', 400, MUTED) }, p)); });
  h += box(cx - 280, top + 243.2, 560, 125.8, { background: '#ccc1b3', borderRadius: 12 }, g);
  h += box(cx - 230, top + 401, 460, 17.3, { textAlign: 'center', ...F(11.5, '17.25px', 400, MUTED) }, "Actions are briefs. Write one once, then run it from any matter's chat with @.");
  return h;
}
// a list row (title + one-line description) inside the list card, card-relative coords
function row(y, title, desc, { sel = false, hover = false, spinner = false, id = 'row', full = false } = {}) {
  const w = (full ? W - 32 : 754) - 22;
  return box(11, y, w, 60, { background: sel || !hover ? '#fff' : 'rgba(229,218,205,0.45)', borderRadius: 12, boxShadow: sel ? 'rgba(35,30,25,0.08) 0 1px 2px 0, rgba(35,30,25,0.25) 0 8px 24px -12px, rgba(204,193,179,0.8) 0 0 0 1px' : 'none' },
    txt(14, 10.3, esc(title), F(13.5, '20.25px', 600)) + box(14, 33.5, w - 28 - (spinner ? 40 : 0), 16.3, F(12.5, '16.25px', 400, MUTED), `<div class="ell" style="position:static">${esc(desc)}</div>`)
    + (spinner ? spinnerDisc(w - 38, 18, 'spin') : ''), id);
}
const section = (label, n) => txt(21, 9, label, { ...F(12.5, '15.625px', 500, MUTED, NECO), letterSpacing: '-0.125px' }) + box(21 + (label === 'Personal' ? 57.5 : 62.7), 9, 18, 18, { background: YEL, borderRadius: 6, textAlign: 'center', ...F(10.5, '18px', 700, INK, NECO) }, String(n));
const BRIEF = 'Compare the schedule of loss with the tribunal judgment. For each head of loss, say whether the judgment supports it, what the other side will argue, and the risk. Output a table.';

// ---------------------------------------------------------------- side panel (aside) 778..1454, 84..819
const PX = 778, PW = 676, PY = 84, PH = 735, CX = PX + 33, CW = PW - 66;
const aside = inner => box(PX, PY, PW, PH, { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, overflow: 'hidden' }, inner, 'aside');
function panelHead(crumb2, right = 'x') {
  let h = txt(13, 17.1, 'Actions', F(12.5, '18.75px', 500, MUTED)) + (crumb2 ? ic('chevron-right', 62.2, 20.5, 12, 'rgba(73,71,70,0.6)') : '');
  if (crumb2) h += txt(80.2, 17.1, crumb2, F(12.5, '18.75px', 500), 'crumb2');
  h += box(1, 52, PW - 2, 1, { background: 'rgba(204,193,178,0.6)' });
  const R = PW - 38;   // close icon x (panel-relative)
  if (right === 'x') h += ic('x', R, 17.5, 18, MUTED, 'pClose');
  if (right === 'tools' || right === 'toolsHover') {
    h += box(R - 116, 10.5, 32, 32, { borderRadius: 8 }, ic('copy', 8, 8, 16, MUTED));
    h += box(R - 82, 10.5, 32, 32, { borderRadius: 8, background: right === 'toolsHover' ? 'rgba(229,218,205,0.6)' : 'transparent' }, ic('share-2', 8, 8, 16, right === 'toolsHover' ? INK : MUTED), 'pShare');
    h += box(R - 48, 10.5, 32, 32, { borderRadius: 8 }, ic('trash-2', 8, 8, 16, MUTED));
    h += box(R - 12, 17.5, 1, 18, { background: '#ccc1b3' }) + ic('x', R, 17.5, 18, MUTED, 'pClose');
  }
  if (right === 'confirmShare') {
    h += box(PW - 13 - 160.3 - 8 - 59.8, 10.5, 59.8, 32, { borderRadius: 8, textAlign: 'center', ...F(12.5, '32px', 500, MUTED) }, 'Cancel', 'pCancel');
    h += box(PW - 13 - 160.3, 10.5, 160.3, 32, { borderRadius: 8, background: YEL }, ic('share-2', 12, 9, 14, INK) + txt(33, 6.6, 'Share with company', F(12.5, '18.75px', 600)), 'pShareGo');
  }
  return h;
}
// step switcher, centred; s = 1|2|3
function steps(s) {
  const wx = (PW - 351.1) / 2;
  const pills = [[4, 92, '1. Workflow', 16], [98.4, 107.3, '2. Data & Files', 110], [208.3, 138.6, '3. Expected Output', 219.8]];
  let h = box(wx, 71, 351.1, 36, { background: 'rgba(36,30,25,0.03)', border: `1px solid ${LINE7}`, borderRadius: 12 });
  pills.forEach(([px, pw, label, lx], i) => {
    if (i + 1 === s) h += box(wx + px, 75, pw, 28, { background: YEL, borderRadius: 8, boxShadow: 'rgba(35,30,25,0.04) 0 1px 2px 0' });
    h += txt(wx + lx, 79.3, label, F(13, '19.5px', i + 1 === s ? 600 : 500, i + 1 === s ? INK : MUTED), 'step' + (i + 1));
  });
  return h;
}
const label = (x, y, t, w = 600, color = INK) => txt(x, y, t, F(12, '18px', w, color));
const helpT = (x, y, t, color = MUTED) => txt(x, y, t, F(11.5, '17.25px', 400, color));
const field = (x, y, w, h, inner = '', bg = 'rgba(36,30,25,0.02)', id = '', focus = false) => box(x, y, w, h, { background: bg, border: `1px solid ${focus ? 'rgba(75,67,61,0.51)' : LINE}`, borderRadius: 12 }, inner, id);
// step 1, with the typed name and brief (or their placeholders); counter text shown on the plate
function step1({ name = '', brief = '', counter = '100 more characters needed', nextOn = false, focus = '' } = {}) {
  const x = 33, B = PH - 59;   // panel-relative
  let h = steps(1);
  h += label(x, 121, 'Action Name');
  h += field(x, 145, CW, 36, txt(12, 7, name ? esc(name) : '<em class="ph" style="color:#494746;opacity:.75">e.g., Review Contract, Due Diligence Check</em>', F(14, '20px')), 'rgba(36,30,25,0.02)', 'fName', focus === 'name');
  h += helpT(x, 187, 'A short, descriptive name for your action');
  h += label(x, 220.3, 'What should this action do?');
  const ph = '<em class="ph" style="color:#494746;opacity:.75">Describe in detail what you want this action to do. For example:<br><br>"Review a legal contract and identify key clauses, potential risks, and important dates. Highlight any unusual terms or conditions that might need attention."</em>';
  h += field(x, 244.3, CW, B - 40.6 - 244.3, box(12, 10, CW - 24, 200, { whiteSpace: 'normal', ...F(14, '22.4px') }, brief ? esc(brief) : ph, 'fBriefTx'), 'rgba(36,30,25,0.03)', 'fBrief', focus === 'brief');
  h += txt(x, B - 33.7, 'Be specific about inputs, outputs, and any particular style or format', F(11.5, '16.675px', 400, MUTED));
  h += box(x + CW - 200, B - 33.7, 200, 16.5, { textAlign: 'right', ...F(11, '16.5px', 400, counter.includes('needed') ? '#96732c' : MUTED) }, counter, 'counter');
  h += box(x + CW - 79.1, B, 79.1, 36, { background: YEL, borderRadius: 12, opacity: nextOn ? 1 : 0.6 }, txt(14, 8, 'Next', F(14, '20px', 600)) + ic('arrow-right', 49.1, 10, 16, INK), 'nextBtn');
  return h;
}
const FOLDER_ROW = (y) => ic('folder', 15, y + 14, 14, MUTED) + txt(37, y + 11.3, 'Employment: models and precedents', F(13, '19.5px')) + ic('chevron-right', CW - 29, y + 14, 14, 'rgba(73,71,70,0.6)');
function step2() {
  const x = 33, B = PH - 59;
  let h = steps(2);
  h += label(x, 121, 'What data or files does it need?');
  h += box(x, 145, CW, 34.5, { whiteSpace: 'normal', ...F(11.5, '17.25px', 400, MUTED) }, 'Select knowledge base documents that this action should use as reference material, formulas, calculation models, templates, or data it needs to do its job.');
  h += box(x, 193.5, CW, 36, { background: '#fff', border: '1px solid #ddd3c6', borderRadius: 12, boxShadow: 'rgba(0,0,0,0.05) 0 1px 2px' }, ic('search', 13, 10, 16, MUTED) + txt(37, 8, '<em class="ph">Search documents...</em>', F(14, '20px')));
  h += box(x, 237.5, CW, 280.8, { background: 'rgba(36,30,25,0.02)', border: `1px solid ${LINE}`, borderRadius: 12 }, FOLDER_ROW(0), 'kbList');
  h += helpT(x, B - 149.7, '0 / 5 selected', MUTED).replace('<div', '<div id="sel5"');
  h += txt(x, B - 118.5, 'How should these documents be used? <span style="font-weight:400;color:rgba(73,71,70,0.7)">(Optional)</span>', F(12, '18px', 500, MUTED));
  h += field(x, B - 94.5, CW, 70, txt(12, 10, '<em class="ph" style="color:#494746;opacity:.75">e.g., Focus on sections 3-5 of the calculation model, use the formulas from the spreadsheet to validate totals...</em>', { ...F(14, '22.4px'), width: CW - 24, whiteSpace: 'normal' }), 'rgba(36,30,25,0.03)');
  h += box(x, B, 81.2, 36, { border: '1px solid #ccc1b3', borderRadius: 12 }, ic('arrow-left', 15, 11, 14, INK) + txt(35, 7, 'Back', F(14, '20px', 600)));
  h += box(x + CW - 79.1, B, 79.1, 36, { background: YEL, borderRadius: 12 }, txt(14, 8, 'Next', F(14, '20px', 600)) + ic('arrow-right', 49.1, 10, 16, INK), 'nextBtn2');
  return h;
}
function step3() {
  const x = 33, B = PH - 59;
  let h = steps(3);
  h += label(x, 121, 'What output do you expect?');
  h += box(x, 145, CW, 34.5, { whiteSpace: 'normal', ...F(11.5, '17.25px', 400, MUTED) }, 'Select documents that show what the final result should look like. This helps Andri match the exact format, structure, and style you need.');
  h += box(x, 193.5, CW, 62.7, { background: 'rgba(150,115,44,0.08)', border: '1px solid rgba(150,115,44,0.28)', borderRadius: 12 },
    ic('message-square', 13, 14, 16, '#96732c') + txt(39, 13, 'This action will answer directly in chat', F(12, '18px', 600)) + txt(39, 33, 'No document output needed? Leave this empty and the action will produce text analysis.', F(11.5, '16.675px', 400, MUTED)), 'hint');
  h += box(x, 270.2, CW, 36, { background: '#fff', border: '1px solid #ddd3c6', borderRadius: 12, boxShadow: 'rgba(0,0,0,0.05) 0 1px 2px' }, ic('search', 13, 10, 16, MUTED) + txt(37, 8, '<em class="ph">Search documents...</em>', F(14, '20px')));
  h += box(x, 314.2, CW, 204.1, { background: 'rgba(36,30,25,0.02)', border: `1px solid ${LINE}`, borderRadius: 12 }, FOLDER_ROW(0));
  h += helpT(x, B - 149.7, '0 / 3 selected', MUTED);
  h += txt(x, B - 118.5, 'What should the output look like? <span style="font-weight:400;color:rgba(73,71,70,0.7)">(Optional)</span>', F(12, '18px', 500, MUTED));
  h += field(x, B - 94.5, CW, 70, txt(12, 10, '<em class="ph" style="color:#494746;opacity:.75">e.g., Always generate 2 PDFs, follow the same heading structure as the example, use formal language...</em>', { ...F(14, '22.4px'), width: CW - 24, whiteSpace: 'normal' }), 'rgba(36,30,25,0.03)');
  h += box(x, B, 81.2, 36, { border: '1px solid #ccc1b3', borderRadius: 12 }, ic('arrow-left', 15, 11, 14, INK) + txt(35, 7, 'Back', F(14, '20px', 600)));
  h += box(x + CW - 137.6, B, 137.6, 36, { background: YEL, borderRadius: 12 }, ic('plus', 14, 10, 16, INK) + txt(36, 8, 'Create Action', F(14, '20px', 600)), 'createGo');
  return h;
}
// "How Andri built this": header + timeline (flow layout, measured gaps)
function buildLog(name, cards) {
  let h = ic('brain', 17, 80, 20, '#96732c');
  h += txt(49, 69, 'How Andri built this', { ...F(16, '24px', 600, INK, NECO), letterSpacing: '-0.16px' });
  h += txt(49, 95, `${esc(name)} <span style="margin:0 6px">·</span><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#96732c;vertical-align:1px;margin-right:8px"></span>Working now`, F(12, '16px', 400, MUTED));
  // timeline items
  let y = 125, items = '';
  const small = (label, cur = false) => { const s = box(33.5, y + 3, 8, 8, cur ? { background: '#96732c', borderRadius: '50%' } : { background: '#f2efe9', border: '1.5px solid rgba(220,206,188,0.6)', borderRadius: '50%' }) + txt(57, y, label, F(12, '16px', 400, cur ? 'rgba(36,30,25,0.8)' : MUTED)); y += 16 + 13; return s; };
  const card = (time, text, lines) => { const ch = 15 + 18.6 + 7.9 + lines * 22.75 + 15; const s = box(30.5, y + 17, 14, 14, { background: '#f2efe9', border: '2px solid #96732c', borderRadius: '50%' })
    + box(57, y, PW - 57 - 25, ch, { background: '#fff', border: '1px solid rgba(220,206,188,0.5)', borderRadius: 12 },
      txt(17, 15, 'Thinking', F(13, '18.57px', 600)) + box(PW - 57 - 25 - 17 - 80, 17, 80, 15.7, { textAlign: 'right', ...F(11, '15.7px', 400, MUTED) }, time) + box(17, 41.5, PW - 57 - 25 - 34, lines * 22.75, { whiteSpace: 'normal', ...F(14, '22.75px', 400, MUTED) }, text));
    y += ch + 13; return s; };
  const startY = y;
  for (const c of cards) items += c.small ? small(c.small, c.cur) : card(c.time, c.text, c.lines);
  h += box(37, startY + 7, 1, Math.max(0, y - startY - 20), { background: 'rgba(150,115,44,0.5)' });
  return h + items;
}
const toast = (text, icn, color, h2 = 73) => box(W - 24 - 356, H - 24 - h2, 356, h2, { background: '#fff', border: '1px solid rgba(204,193,179,0.7)', borderRadius: 12 },
  ic(icn, 13, (h2 - 17) / 2, 17, color) + box(44, h2 === 73 ? 17 : 17.3, 295, h2 - 34, { whiteSpace: 'normal', ...F(13, '19.5px', 500) }, text), 'toast');

// detail view (flow content inside a positioned column at CX, scrollable as one sprite)
const SKILL_CSS = `
.dv{position:absolute;left:33px;top:73px;width:${CW}px}
.dv *{position:static!important}
.dv h2.t{font:600 20px/25px fontHeading;color:#241e19;letter-spacing:-.2px;margin:0 0 20px}
.dv .l{font:500 13.5px/20.25px "Rethink Sans";color:#241e19;margin:0 0 8px}
.dv p.ask{font:400 13.5px/21.6px "Rethink Sans";color:rgba(36,30,25,.85);margin:0 0 20px}
.dv .sd{background:rgba(36,30,25,.02);border:1px solid rgba(204,193,178,.7);border-radius:12px;padding:14px 16px 16px}
.dv .sd h1,.dv .sd h2,.dv .sd h3{font:700 12.5px/15px fontHeading;color:#241e19;letter-spacing:-.125px;margin:12px 0 4px}
.dv .sd h2,.dv .sd h3{line-height:15.625px}
.dv .sd p{font:400 12.5px/20px "Rethink Sans";color:rgba(36,30,25,.85);margin:0}
.dv .sd ul{margin:6px 0 0;padding-left:16px}
.dv .sd li{font:400 12.5px/20px "Rethink Sans";color:rgba(36,30,25,.85);margin:0 0 4px}
.dv .sd li strong{font-weight:700}
.dv .sd a{color:rgba(36,30,25,.85);text-decoration:underline;text-underline-offset:2px}
.dv .sd pre{font:400 11.5px/18.4px "SF Mono",Menlo,monospace;color:rgba(36,30,25,.85);background:rgba(36,30,25,.05);border-radius:8px;padding:10px;margin:8px 0 0;white-space:pre}
.dv .det{margin-top:20px}
.dv .dr{display:flex;gap:10px;margin:8px 0 0}
.dv .dk{width:104px;font:400 11.5px/17.25px "Rethink Sans";color:#494746}
.dv .dvv{font:400 12.5px/18.75px "Rethink Sans";color:#241e19}
`;
function detailBody(title) {
  const li = (k, v) => `<li><strong>${k}</strong>: ${v}</li>`;
  return `<div class="dv flow" id="dv"><h2 class="t">${esc(title)}</h2><div class="l">What you asked for</div><p class="ask">${esc(BRIEF)}</p><div class="l">Skill Definition</div>
<div class="sd" id="sd"><h1 style="margin-top:12px">Remedy Check</h1><p>Tests each head of loss in a schedule of loss against the findings in an employment tribunal judgment and outputs a remedy table in markdown.</p>
<h2 id="inpHead">Inputs</h2><ul><li>Schedule of loss (or counter-schedule) - required.</li><li>Tribunal judgment with written reasons - required. If only the judgment without reasons is supplied, proceed but rate every head that depends on findings of fact as no better than Medium and say so in the Summary.</li><li>Which party the user acts for. Default: the claimant. If acting for the respondent, the Opposing argument column records the claimant's likely response instead.</li></ul>
<h2>Terms</h2><p>Use these terms consistently:</p><ul>${li('head of loss', 'one line or category in the schedule.')}${li('schedule', 'the schedule of loss under review.')}${li('judgment', 'the tribunal judgment and its written reasons.')}${li('foundation', 'the successful claim on which a head of loss depends.')}${li('opposing party', 'the party the user does not act for.')}${li('EDT', 'effective date of termination.')}</ul>
<h2>Reference files</h2><ul><li><a>reference/heads-of-loss.md</a> - read in Step 2. For each head of loss: required foundation, findings to look for, standard opposing arguments, key authorities.</li><li><a>reference/adjustments-and-limits.md</a> - read in Step 4. Order of adjustments, statutory limits and Vento bands by effective date, recoupment.</li></ul>
<h2 id="wfHead">Workflow</h2><p>Copy this checklist and tick it off:</p><pre id="checklist">- [ ] 1. Map the judgment
- [ ] 2. Test each head of loss
- [ ] 3. Run the arithmetic check
- [ ] 4. Check adjustments and caps
- [ ] 5. Assign risk ratings
- [ ] 6. Produce the output
- [ ] 7. Verify</pre>
<h3>Step 1. Map the judgment</h3><p>Extract from the judgment, with paragraph numbers:</p><ul><li>Each claim and its outcome: succeeded, failed, withdrawn, dismissed on time limits. For discrimination and detriment claims, list the individual acts found proved and in time.</li><li>Findings on dates (start, EDT, acts), pay and benefits.</li></ul></div></div>`;
}

// ---------------------------------------------------------------- screens
const NAME0 = 'Remedy check', NAME1 = 'Remedy-check', NAME2 = 'Remedy-check [0f3c9b3j]';
const actionsPage = ({ panel = null, list = '', tabsN, tabSel = 'all' } = {}) => { const open = panel !== null; return tabs(tabsN, tabSel) + searchBox() + toolbar(open) + listCard(open, list) + (panel ? aside(panel) : ''); };
const LIST_BUILT = (title, tabsSec = 'Personal', sel = true, spinner = false, full = false, hover = false) => section(tabsSec, 1) + row(37, title, BRIEF, { sel, spinner, id: 'row1', full, hover });
const BUILD_CARDS = [
  { small: 'Running code' },
  { time: '1m ago', text: 'Since there are no input documents, I should quickly search to verify the current 2025 figures.', lines: 2 },
  { small: 'Using tools' },
  { time: '14s ago', text: 'Working through the award calculation with someone born 1980-03-15 against an effective date of 2025-06-30, at age 45. Checking years back from that date, I find the rate changes at certain milestones: 4 years at 1.5 plus 8 years at 1.0 gives a total of 14.', lines: 4 },
  { small: 'Running code', cur: true }];

// file-type icons (staging's own SVGs, same shape for every type, colours per type)
const FT = { pdf: [['#b82025', '#a11b1f', '#861418'], ['#e63a3a', '#d22c2c', '#b22222'], ['#ff6b6b', '#e63a3a'], ['#d12b2b', '#751010'], '<path d="M1.13,21.5H2.47A2.92,2.275 0 0 1 2.47,26.05V28.5H1.13ZM2.47,22.56V24.99A1.58,1.215 0 0 0 2.47,22.56Z" fill="#fff"/><path d="M6.05,21.5H7.39A3.12,3.5 0 0 1 7.39,28.5H6.05ZM7.39,22.56V27.44A1.78,2.44 0 0 0 7.39,22.56Z" fill="#fff"/><path d="M11.17,21.5H14.87V22.56H12.51V24.32H14.37V25.38H12.51V28.5H11.17Z" fill="#fff"/>'],
  xlsx: [['#18884f', '#117e43', '#0b6631'], ['#1abd6b', '#13a25a', '#0f8a4c'], ['#36d689', '#1dbb69'], ['#2aa866', '#0b5f32'], '<path d="M4.1,20.43h2.28l1.74,3.34,1.85-3.34h2.12l-2.78,4.57,2.85,4.57h-2.22l-1.9-3.45-1.9,3.45h-2.22l2.92-4.57-2.74-4.57Z" fill="#fff"/>'],
  eml: [['#3730a3', '#312a8f', '#262070'], ['#6366f1', '#5558dc', '#4a4cc4'], ['#b4b6fb', '#8184f5'], ['#5a5de6', '#26216f'], '<rect x="2.6" y="21.2" width="10.8" height="7.6" rx="1.5" fill="none" stroke="#fff" stroke-width="1.5"/><path d="M3.3,22.3 8,26 12.7,22.3" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>'],
  jpg: [['#86198f', '#741579', '#5c105f'], ['#c026d3', '#ab1fbd', '#9419a4'], ['#f0abfc', '#dc6bf0'], ['#b52cc8', '#560d5c'], '<rect x="2.6" y="21" width="10.8" height="8" rx="1.5" fill="none" stroke="#fff" stroke-width="1.5"/><circle cx="6" cy="23.9" r="1.1" fill="#fff"/><path d="M3.4,28.3 6.6,25.3 8.6,27.1 10.4,25.5 12.7,28.3Z" fill="#fff"/>'],
  mp3: [['#b45309', '#9a4708', '#7c3a07'], ['#f59e0b', '#e08f0a', '#c77f09'], ['#fcd34d', '#fbbf24'], ['#e8940c', '#6b3d05'], '<rect x="2.2" y="23.5" width="1.7" height="3" rx=".85" fill="#fff"/><rect x="4.7" y="21.5" width="1.7" height="7" rx=".85" fill="#fff"/><rect x="7.2" y="20.2" width="1.7" height="9.6" rx=".85" fill="#fff"/><rect x="9.7" y="22.2" width="1.7" height="5.6" rx=".85" fill="#fff"/><rect x="12.2" y="23" width="1.7" height="4" rx=".85" fill="#fff"/>'],
  docx: [['#1657f4', '#0036c4', '#002a9c'], ['#66c0ff', '#0094f0', '#0077d0'], ['#9deaff', '#3bd5ff'], ['#367af2', '#001a8f'], '<path d="M13.49,20.43l-1.97,9.14h-2.35s-1.16-5.48-1.16-5.48l-1.22,5.49h-2.38l-1.89-9.14h1.94l1.17,6.03,1.16-6.03h2.38l1.21,6.03,1.14-6.03h1.97Z" fill="#fff"/>'] };
let ftN = 0;
function fileIcon(kind, x, y) {
  const [a, b, c, d, g] = FT[kind]; const id = 'ft' + (ftN++);
  const lg = (n, y1, cols) => `<linearGradient id="${id}${n}" x1="5" y1="${y1}" x2="35" y2="${y1}" gradientUnits="userSpaceOnUse">${cols.map((s, i) => `<stop offset="${cols.length === 2 ? i : i / 2}" stop-color="${s}"/>`).join('')}</linearGradient>`;
  return `<svg style="position:absolute;left:${x}px;top:${y}px;width:24px;height:24px" viewBox="0 0 35 36"><defs>${lg('a', 29.5, a)}${lg('b', 18, b)}${lg('c', 6, c)}<radialGradient id="${id}d" cx="-600.8" cy="515.58" r="1" gradientTransform="translate(1363.5 17878.99) rotate(45) scale(22.63 -22.63)" gradientUnits="userSpaceOnUse"><stop offset=".08" stop-color="${d[0]}"/><stop offset=".87" stop-color="${d[1]}"/></radialGradient></defs>
<path d="M5,27.09l14-17.09,16,11.11v11.39c0,1.93-1.57,3.5-3.5,3.5H11c-3.31,0-6-2.69-6-6v-2.91Z" fill="url(#${id}a)"/><path d="M5,15.04c0-2.49,2.01-4.5,4.5-4.5h20.39l5.11-2.54v12.5c0,1.93-1.57,3.5-3.5,3.5H11c-3.31,0-6,2.69-6,6v-14.96Z" fill="url(#${id}b)"/><path d="M5,6C5,2.69,7.69,0,11,0h20.5c1.93,0,3.5,1.57,3.5,3.5v5c0,1.93-1.57,3.5-3.5,3.5H11c-3.31,0-6,2.69-6,6V6Z" fill="url(#${id}c)"/><rect y="17" width="16" height="16" rx="3.25" fill="url(#${id}d)"/>${g}</svg>`;
}
// Nair's Knowledge Base, folder "employment" (20 files; real order, summaries and tags from staging 12 Oct 2026)
const KB_ROWS = [
  ['docx', '12_Skeleton_Argument.docx', 'A two-page skeleton argument filed in the Leeds Employment Tribunal (claim number 1803442/2025) on behalf of Priya Nair (Claimant) against Calderdale Logistics Limited (Respondent), dated 30 January 2026.', ['Brief']],
  ['pdf', '08_Invoice.pdf', 'A one-page invoice from Aldridge Vine LLP dated 20 January 2026 to Ms Priya Nair for legal services relating to employment tribunal proceedings.', ['Invoice']],
  ['jpg', '15_WhatsApp_Manager.jpg', 'A screenshot of a messaging conversation between Geoffrey Marsden (online) and another party, taken on 16 February 2025 at 18:01 using an iPhone 13.', ['Screenshot', 'Correspondence']],
  ['eml', '20_Email_HR_Role.eml', 'Email dated 8 January 2025 from Sandra Okeke, Calderdale Logistics HR, to Priya Nair welcoming her return from maternity leave on 13 January 2025.', ['Email']],
  ['docx', '11_File_Note.docx', 'One-page file note dated 10 April 2025 from Adam Frith to file recording initial instructions from Ms Priya Nair following her dismissal by Calderdale Logistics.', ['Memo']],
  ['docx', '09_Dismissal_Letter.docx', 'A two-page termination letter from Calderdale Logistics Limited, through Geoffrey Marsden (Operations Director), to Priya Nair, confirming termination.', ['Termination Letter']],
  ['pdf', '02_ACAS_EC_Certificate.pdf', 'A one-page Acas Early Conciliation Certificate dated 21 May 2025 for Priya Nair (Claimant) against Calderdale Logistics Limited (Respondent), EC Reference.', ['Compliance Certificate']],
  ['pdf', '06_Medical_Report.pdf', 'A one-page expert medical report dated 5 December 2025 by Dr Helena Brooke, GMC 6184422, concerning Ms Priya Nair (DOB 11 July 1986), referred following dismissal.', ['Expert Report']],
  ['docx', '10_Letter_Settlement.docx', 'A two-page letter dated 12 January 2026 from Aldridge Vine LLP for Ms Priya Nair to Bowater Sykes Solicitors, marked without prejudice save as to costs.', ['Letter', 'Settlement Offer']],
  ['mp3', '18_Audio_Consultation.mp3', 'A recording transcript (1 minute 11 seconds) of a second consultation meeting between an HR manager (Jeff) and Priya, the Operations Manager, regarding her proposed redundancy.', ['Deposition']],
  ['pdf', '01_ET1_Grounds_of_Claim.pdf', 'An Employment Tribunal Claim Form (ET1) filed with the Leeds Employment Tribunal, case number 1803442/2025, signed on 2 June 2025. Ms Priya Nair claims unfair dismissal.', ['Pleadings']],
  ['pdf', '03_ET3_Response.pdf', 'One-page Response to Employment Tribunal Claim (ET3) filed with Leeds Employment Tribunal on 30 June 2025 by Calderdale Logistics Limited, represented by Bowater Sykes.', ['Pleadings']],
  ['eml', '19_Email_Return_to_Work.eml', 'An email dated 6 January 2025 from employee Priya Nair to Geoffrey Marsden (with copy to hr@calderdalelogistics.co.uk) confirming her return from maternity leave.', ['Email']],
  ['pdf', '07_Bank_Statement.pdf', 'A one-page bank statement from HSBC plc for Ms Priya Nair (sort code 40-22-18, account number 61553012, IBAN GB44 HBUK 4022 1861 5530 12) covering 1 March to 31 May 2025.', ['Statement of Account']],
  ['pdf', '05_Tribunal_Judgment.pdf', 'A two-page reserved judgment from the Employment Tribunal (Leeds) dated 19 March 2026. The tribunal found in favour of Ms Priya Nair on claims of unfair dismissal.', ['Judgment']],
  ['jpg', '16_WhatsApp_Colleague.jpg', 'A screenshot of a WhatsApp conversation between Sandra Okeke (HR) and another party, captured on 5 February 2025 at 13:21 on a Samsung Galaxy A54.', ['Screenshot', 'Correspondence', '+1']],
  ['xlsx', '13_Schedule_of_Loss.xlsx', 'An Excel spreadsheet with two worksheets: a Schedule of Loss and a Payslip History. The Schedule quantifies an employment tribunal damages claim totalling GBP 71,640.', ['Evidence File']],
  ['xlsx', '14_Chronology.xlsx', 'A chronology spreadsheet covering an employment tribunal case from 4 January 2018 to 19 March 2026. The claimant commenced employment as Operations Manager.', ['Dossier']],
  ['jpg', '17_Evidence_Office.jpg', 'This is a photograph of an Operations Manager workstation captured on 13 January 2025 at 09:15 using an iPhone 13. The image shows a desk layout diagram.', ['Photograph', 'Diagram', '+1']],
  ['pdf', '04_Witness_Statement_Claimant.pdf', 'A 2-page witness statement filed by Priya Nair, the Claimant, in the Leeds Employment Tribunal (claim 1803442/2025) dated 8 January 2026 in support of claims.', ['Witness Statement']]];
// the Knowledge Base layout at 1470: content column 80..1446 (the 1512 px column of the 1920 view does not fit; it fills the main area less 24 px a side)
const KX = 80, KW = 1366;
const KCOL = { cb: 25, name: 49, created: 49 + 330, summary: 49 + 330 + 160, status: 49 + 330 + 160 + 420, tags: 49 + 330 + 160 + 420 + 150, menu: KW - 37 };
function kbRows(y0) {
  let h = '';
  KB_ROWS.forEach(([k, n, s, tags], i) => {
    const y = y0 + i * 49.2 * 1.2245 / 1.2245 * 1;   // row pitch 60.2 at 1920 (screenshot 49.2 x 1.2245)
    const ry = y0 + i * 60.2;
    h += box(KX + 6, ry, KW - 12, 60, { borderRadius: 12 }, '', 'kr_' + n.slice(0, 2));
    h += box(KX + KCOL.cb, ry + 22, 16, 16, { background: '#f2efe9', border: '1px solid #ccc1b3', borderRadius: 6 });
    h += fileIcon(k, KX + KCOL.name + 20, ry + 18);
    h += txt(KX + KCOL.name + 58, ry + 20, n, F(14, '20px', 500), 'kn_' + n.slice(0, 2));
    h += box(KX + KCOL.created + 16, ry + 20, 20, 20, { background: 'rgba(36,30,25,0.1)', borderRadius: '50%', textAlign: 'center', ...F(7, '20px', 600, 'rgba(36,30,25,0.7)') }, 'AF');
    h += txt(KX + KCOL.created + 44, ry + 20, '22/09/2026', F(14, '20px', 400, MUTED));
    h += box(KX + KCOL.summary + 16, ry + 10, KCOL.status - KCOL.summary - 32, 40, F(14, '20px', 400, MUTED), `<div class="clamp2" style="position:static">${esc(s)}</div>`);
    h += box(KX + KCOL.status + 16, ry + 20.5, 88.1, 19, { background: 'rgba(99,131,99,0.15)', borderRadius: 6 }, ic('lock', 8, 3.5, 12, '#638363') + txt(26, 2, 'Complete', F(12, '15px', 500, '#638363')));
    const tg = tags.map(t => `<span style="display:inline-block;border:1px solid #ccc1b3;border-radius:6px;padding:1px 6px;margin:0 4px 4px 0;font:600 12px/16px 'Rethink Sans';color:#241e19">${t}</span>`).join('');
    h += box(KX + KCOL.tags + 16, ry + (tags.length > 1 && tags.join('').length > 24 ? 9 : 19), 160, 44, { whiteSpace: 'normal', lineHeight: '0' }, `<div style="position:static;width:160px">${tg}</div>`);
    h += ic('ellipsis', KX + KCOL.menu, ry + 22, 16, INK);
  });
  return h;
}
function kbHeader() {
  let h = box(0, 68, W, 69, { background: 'rgba(242,239,232,0.9)', borderBottom: '1px solid rgba(204,193,178,0.3)' });
  const crumbs = [['Matters', 68, 'house'], ['Nair v Calderdale Logistics', 0], ['Matter Knowledge Base', 0], ['employment', 0]];
  let x = 68 + 0; h += ic('house', 68, 95, 14, MUTED); x = 88;
  const cw = ['Matters', 'Nair v Calderdale Logistics', 'Matter Knowledge Base', 'employment'], ww = [50.1, 171.7, 151.9, 81];
  cw.forEach((c, i) => { h += txt(x, 92, c, F(14, '20px', i === 3 ? 500 : 400, i === 3 ? INK : MUTED)); x += ww[i] + 10; if (i < 3) { h += ic('chevron-right', x, 95, 14, '#638363'); x += 24; } });
  h += box(x + 6, 80, 1, 44, { background: 'rgba(204,193,178,0.5)' });
  h += txt(x + 26, 80, 'Nair v Calderdale Logistics', { ...F(20, '28px', 700, INK, NECO), letterSpacing: '-0.2px' }) + txt(x + 26, 108, 'United Kingdom', F(12, '16px', 500, MUTED));
  return h;
}
const kbRail = () => box(12, 272.5 + 44 - 8, 32, 32, { background: '#fff', border: '1px solid rgba(248,227,124,0.9)', borderRadius: 10, boxShadow: '0 0 0 2px rgba(248,227,124,0.35)' })
  + [['message-square', 'railChat'], ['file-text', 'railKB'], ['play', ''], ['git-branch', ''], ['table-2', ''], ['pen-tool', ''], ['clipboard-list', ''], ['file-plus-2', ''], ['mail', ''], ['shield', '']]
  .map(([n, id], i) => ic(n, 20, 272.5 + i * 44, 16, '#494746', id)).join('');
function kbToolbar() {
  let h = box(KX, 161 + 0, 240, 36, { background: '#fff', border: '1px solid #ddd3c6', borderRadius: 12 }, ic('search', 13, 10, 16, MUTED) + txt(37, 8, '<em class="ph">Search documents...</em>', F(14, '20px')));
  const g = { background: '#f2efe9', border: '2px solid #ccc1b3', borderRadius: 12, boxShadow: 'rgba(0,0,0,0.1) 0 1px 3px 0, rgba(0,0,0,0.1) 0 1px 2px -1px' };
  h += box(KX + 248, 161, 36, 36, g, ic('refresh-ccw', 8, 8, 16, INK)) + box(KX + 292, 161, 36, 36, g, ic('arrow-up-down', 8, 8, 16, INK)) + box(KX + 336, 161, 115.7, 36, g, ic('sliders-horizontal', 16, 8, 16, INK) + txt(38, 6, 'Filters', { ...F(14, '20px', 600), letterSpacing: '-0.35px' }) + ic('chevron-down', 79.7, 8, 16, INK));
  const right = [['Upload Matter Documents', 213.7, 'upload', true], ['Client upload', 138.2, 'user-round-plus'], ['toggle', 92], ['Email Documents', 164.7, 'mail'], ['Connect', 110.3, 'link'], ['New Folder', 125.2, 'folder-plus']];
  let x = KX + KW;
  for (const [l, w, n, y] of right) { x -= w; if (l === 'toggle') h += box(x, 161, 92, 36, { background: '#e7e3da', borderRadius: 12 }, box(4, 4, 40, 28, { background: '#fff', borderRadius: 8 }, ic('list', 12, 6, 16, INK)) + ic('layout-grid', 60, 10, 16, INK));
    else h += box(x, 161, w, 36, y ? { ...g, border: 'none', background: YEL } : g, ic(n, 16, 8, 16, INK) + txt(38, 6, l, { ...F(14, '20px', 600), letterSpacing: '-0.35px' })); x -= 8; }
  return h;
}

// ---------------------------------------------------------------- chat: matter frame, @ lists, chip, thread
const FRAME = (convN, convName, kbN = 22) => {
  let f = SNAP('M-frame.html').replace('>2</div>', `>${convN}</div>`).replace('>Acas uplift<', `>${convName}<`).replace('class="m44" style="left:573.4px;top:36px;width:72px', `class="m44" style="left:573.4px;top:36px;width:${convName.length * 7}px`)
    .replace('<span class="m49">22</span>', `<span class="m49">${kbN}</span>`).replace('class="m39" style="left:419.2px;top:32px;width:223px', `class="m39" style="left:419.2px;top:32px;width:${154 + convName.length * 6.9}px`);
  return '<div class="r0" style="left:0;top:0;width:1470px;height:767px;background:rgb(242,239,233)"></div>' + f;
};
const mainwrap = h => `<div id="mainwrap" style="left:0;top:68px;width:1470px;height:767px">${h}</div>`;
// @ list sprites (picker is 85% of the docked box, 612 wide, centred over it); kind: docs | company | tags | actions
function picker(kind) {
  const w = 720, kb = (t) => `<span style="display:inline-block;font:500 10px/18px 'SF Mono',Menlo,monospace;color:#494746;background:#e7e3da;border:1px solid #ccc1b3;border-radius:4px;padding:0 4px;margin-right:4px">←/→</span>${t}`;
  const head = (icn, col, title, next) => ic(icn, 13, 14, 14, col) + txt(35, 13, title, F(12, '16px', 500)) + box(w - 30 - 240, 11, 240, 20, { textAlign: 'right', whiteSpace: 'nowrap', ...F(10, '20px', 500, MUTED) }, kb('Next: ' + next)) + ic('chevron-right', w - 30, 14, 14, MUTED);
  const foot = (y, extra = '') => box(15, y, 20, 20, { background: 'rgba(150,115,44,0.1)', borderRadius: '50%' }, ic('sliders-horizontal', 4, 4, 12, '#96732c')) + txt(43, y + 2.6, 'Use ↑↓ to navigate, Enter to select', F(11, '14.67px', 500)) + extra;
  let h, H2;
  if (kind === 'actions') {
    H2 = 152; h = head('sliders-horizontal', '#638363', 'Actions', 'Assignments');
    h += box(1, 45, w - 2, 58, { background: '#e5dacd' }, ic('sliders-horizontal', 12, 12, 14, '#638363') + txt(36, 12, 'Remedy-check', F(12, '16px', 500)) + box(127.7, 10, 65.9, 20, { background: 'rgba(220,206,188,0.2)', border: '1px solid rgba(204,193,178,0.6)', borderRadius: 4, textAlign: 'center', ...F(12, '18px', 500) }, 'Company') + txt(36, 32, 'Compare the schedule of loss with the tribunal judgment. For...', F(12, '16px', 400, MUTED)), 'pkRow');
    h += foot(123);
  } else if (kind === 'company') {
    H2 = 148; h = head('file-text', '#96732c', 'Company Documents', 'Document Tags');
    const pill = (x, wd, inner) => box(x, 15.5, wd, 22.7, { background: '#ebe5db', borderRadius: 8, boxShadow: 'rgba(36,30,25,0.05) 0 1px 0 0 inset, rgba(35,30,25,0.1) 0 1px 1px 0, rgba(35,30,25,0.16) 0 2px 5px -1px', textAlign: 'center', ...F(11, '22.7px', 500) }, inner);
    h += box(1, 45, w - 2, 54, { background: '#e5dacd' }, ic('folder', 12, 12, 14, '#96732c') + txt(36, 10, 'Employment: models and precedents', F(12, '16px', 500)) + ic('calendar', 36, 30, 12, MUTED) + txt(52, 28, '12/10/2026 11:24', F(12, '16px', 400, MUTED)) + pill(w - 96.2 - 2, 27, 'all') + pill(w - 62.2 - 2, 50.2, 'Tab ' + icS('chevron-right', 14, INK, 'vertical-align:-3px')));
    h += foot(119);
  } else if (kind === 'tags') {
    H2 = 440; h = head('tag', '#638363', 'Document Tags', 'Actions');
    const T = [['letter', 2], ['correspondence', 2], ['email', 2], ['memo', 2], ['pleadings', 2], ['screenshot', 2], ['brief', 1], ['compliance certificate', 1], ['deposition', 1]];
    T.forEach(([t, n], i) => { h += box(1, 41 + i * 42, w - 2, 40, i === 0 ? { background: '#e5dacd' } : {}, ic('tag', 12, 12, 14, '#638363') + txt(36, 12, t, F(12, '16px', 500) + '') + ''); });
    // counts sit right after each word
    h = h.replace(/(<div style="left:36px;top:12px;white-space:nowrap;[^"]*">)([a-z ]+)(<\/div>)/g, (m, a, t, c) => { const n = (T.find(x => x[0] === t) || [0, ''])[1]; return a + t + `<span style="display:inline-block;margin-left:8px;padding:0 5px;border-radius:4px;background:rgba(99,131,99,0.1);color:#638363;font:500 12px/20px 'Rethink Sans'">${n}</span>` + c; });
    h += box(1, 400, w - 2, 39, { background: '#ebe5db', borderRadius: '0 0 15px 15px' }) + foot(411, box(w - 60, 411 + 2.6, 45, 15, { textAlign: 'right', ...F(11, '14.67px', 500, 'rgba(73,71,70,0.8)') }, '1-8 / 21'));
  } else {   // matter documents (the first list); another session's 21_Letter (This Week) left out
    H2 = 316; h = head('file-text', '#638363', 'Matter Documents', 'Company Documents');
    const pill = (x, wd, inner) => box(x, 15.5, wd, 22.7, { background: '#ebe5db', borderRadius: 8, boxShadow: 'rgba(36,30,25,0.05) 0 1px 0 0 inset, rgba(35,30,25,0.1) 0 1px 1px 0, rgba(35,30,25,0.16) 0 2px 5px -1px', textAlign: 'center', ...F(11, '22.7px', 500) }, inner);
    h += box(1, 45, w - 2, 54, { background: '#e5dacd' }, ic('folder', 12, 12, 14, '#638363') + txt(36, 10, 'employment', F(12, '16px', 500)) + ic('calendar', 36, 30, 12, MUTED) + txt(52, 28, '22/09/2026 14:41', F(12, '16px', 400, MUTED)) + pill(w - 96.2 - 2, 27, 'all') + pill(w - 62.2 - 2, 50.2, 'Tab ' + icS('chevron-right', 14, INK, 'vertical-align:-3px')));
    h += ic('calendar', 13, 113, 14, MUTED) + txt(35, 112, 'September 2026 <span style="font-weight:400">(2)</span>', F(12, '16px', 500, MUTED));
    const doc = (y, n, tag) => fileIcon('docx', 12, y + 1).replace('width:24px;height:24px', 'width:14px;height:14px') + txt(36, y - 2, n + `<span style="display:inline-block;margin-left:8px;width:36.1px;height:19.3px;box-sizing:border-box;background:rgba(43,87,154,0.1);border:1px solid rgba(43,87,154,0.3);border-radius:4px;text-align:center;font:500 10px/17.3px 'Rethink Sans';color:#2b579a;vertical-align:1px">DOC</span>`, F(12, '19.3px', 500))
      + box(36, y + 19.3, tag.length * 6.6 + 12, 16, { background: 'rgba(220,206,188,0.6)', borderRadius: 4, textAlign: 'center', ...F(12, '16px', 400) }, tag) + ic('calendar', 36, y + 41.3, 12, MUTED) + txt(52, y + 39.3, '22/09/2026 14:43', F(12, '16px', 400, MUTED))
      + box(w - 56, y + 12, 28, 28, { background: '#ebe5db', border: '1px solid rgba(204,193,178,0.8)', borderRadius: 8 }, ic('eye', 6, 6, 14, MUTED));
    h += doc(145, 'Aldridge_Vine_Letter_Template.docx', 'Letter') + doc(222, 'Aldridge_Vine_Memo_Template.docx', 'Memo');
    h += foot(287);
  }
  return { html: box(0, 0, w, H2, { background: '#ebe5db', border: '1px solid #ccc1b3', borderRadius: 16, overflow: 'hidden' }, h, 'pk'), h: H2, w };
}
// the docked chat box with the action picked (chip), measured from staging; drawn as a sprite at the 4.1 dock position (395, 682.9)
function cbChip(typed = true) {
  const cb = SNAP('M-cbox.html');
  return cb.replace('id="cbDock" style="left:395px;top:614.9px', 'id="cbDock" style="left:0px;top:0px');
}

// thread sprite (column 243..1267 of the window): user message, a few of the real step rows, then the real answer
const TH_CSS = `
.th{position:absolute;left:0;top:0;width:1024px}
.th .flow, .th .flow *{position:static}
.ans{position:absolute;left:84px;width:884px;font:400 16px/26px "Rethink Sans";color:#2e2924}
.ans *{position:static!important}
.ans h1{font:700 24px/28.8px fontHeading;letter-spacing:-.24px;color:#241e19;margin:0 0 20px}
.ans h2{font:600 20.8px/26px fontHeading;letter-spacing:-.208px;color:#241e19;margin:24px 0 10px}
.ans ul{margin:0;padding-left:24px} .ans li{margin:0 0 4px}
.ans .pl{color:#96732c;text-decoration:underline;text-decoration-color:#96732c;text-underline-offset:3px}
.ans .dl{color:#638363;text-decoration:underline;text-decoration-color:#638363;text-underline-offset:3px}
.ans .ll{color:#587e77;font-weight:500;text-decoration:underline dotted;text-underline-offset:4px}
.ans .tw{overflow:hidden;margin:6px -8px 0;padding:0 8px}
.ans table{border-collapse:separate;border-spacing:0;font:400 15.2px/21.714px "Rethink Sans";color:#2e2924;border:1px solid #e6decf;border-radius:16px;overflow:hidden}
.ans th,.ans td{padding:7.6px;border-right:1px solid #e6decf;border-bottom:1px solid #e6decf;text-align:left;vertical-align:middle}
.ans th{font-weight:700;background:#f0ede6}
.ans tr>*:last-child{border-right:none} .ans tbody tr:last-child>*{border-bottom:none}
.ans .ico{display:inline-block;width:14px;height:14px;vertical-align:-2px;margin-right:3px}
`;
const pl = t => `<span class="pl">${icS('user', 14, '#96732c', 'margin-right:3px')}${t}</span>`;
const dt = t => `<span class="pl">${icS('calendar-clock', 14, '#96732c', 'margin-right:3px')}${t}</span>`;
const dl = t => `<span class="dl">${icS('file-text', 14, '#638363', 'margin-right:3px')}${t}</span>`;
const FINDINGS = [['Credibility and respondent\'s evidence', "The Claimant was credible and consistent. Mr Marsden's evidence on the restructuring was vague and unsupported by contemporaneous documents.", '2'],
  ['Business case', 'The claimed 22% fall in volumes was not borne out by the figures, which showed volumes broadly flat with two new clients onboarded in early 2025.', '2'],
  ['Redundancy situation', "Mr Thornton was retained in a role materially identical to the Claimant's. No genuine redundancy situation existed.", '3'],
  ['Procedure and predetermination', 'The consultation was a sham and the decision to dismiss was taken before it began. The s.136 burden shifted and the respondent did not discharge it.', '4'],
  ['Discriminatory acts', "The dismissal and the reduction in the Claimant's role were direct sex discrimination and pregnancy and maternity discrimination.", '5'],
  ['Remedy directions', 'Remedy to be determined at a further hearing if not agreed. The provisional view is an award for injury to feelings in the middle Vento band, with basic and compensatory awards reflecting loss of earnings, subject to mitigation.', '6']];
const REMEDY = [
  ['1', 'Basic award', '4900.00', 'Unfair dismissal (ERA 1996 s.98, s.99)', 'Partly supported', 'Para 5: unfair dismissal upheld. No finding on start date, EDT or pay.', `The dismissal letter says a statutory redundancy payment based on length of service ${dl('09_Dismissal_Letter')} is to be paid. That payment is set off against the basic award (s.122(4)), and any excess goes to reduce the compensatory award <span class="ll">Employment Rights Act 1996</span>.`, 'Medium', 'Obtain redundancy payment evidence'],
  ['2', 'Net loss of earnings to date of hearing (9 months)', '25200.00', 'Unfair dismissal; EqA s.13 and s.18', 'Open', 'Paras 5-6: entitlement in principle, "subject to mitigation". Paras 3-4 undercut a "would have ended anyway" case. No finding on period, amount or mitigation.', `The ET3 pleads failure to mitigate ${dl('03_ET3_Response')}.`, 'Medium', 'Obtain jobsearch log'],
  ['3', 'Future loss of earnings (6 months)', '16800.00', 'Unfair dismissal; EqA s.13 and s.18', 'Open', `Para 6 only. No finding on prospects. The medical report expects good recovery within nine to twelve months ${dl('06_Medical_Report')} with a return to suitable employment.`, 'Comparable work was available within six months, so the claim for six months\' future loss should be withdrawn. The schedule describes the head only as "Estimated".', 'High', 'Obtain labour market evidence'],
  ['4', 'Loss of statutory rights', '600.00', 'Unfair dismissal', 'Supported', 'Para 5: unfair dismissal upheld.', 'The sum is excessive, or the protection has been re-accrued. Unlikely to bite at a conventional figure.', 'Low', 'Retain conventional figure'],
  ['5', 'Pension loss', '1740.00', 'Unfair dismissal; EqA s.13 and s.18', 'Open', 'No finding. No scheme document or contribution rate on file.', 'The 3 per cent employer rate and the scheme type are unevidenced, and no credit is given for a replacement pension.', 'High', 'Obtain pension scheme documents'],
  ['6', 'Injury to feelings', '18000.00', 'EqA s.13 and s.18', 'Partly supported', 'Paras 5-6: discrimination upheld and middle band provisionally indicated. No finding on duration or effect.', 'The respondent says the employment ended after a short process, there is no lasting injury, and any award should fall within the lower band. The medical report answers this: adjustment disorder directly attributable to the circumstances of the dismissal.', 'Medium', 'Serve impact statement']];
function threadHtml() {
  // user message (right aligned to the step column's right edge + 8)
  let h = `<div class="th" id="th">`;
  const R = 976;   // bubble right edge (column-relative)
  h += box(R - 236, 0, 236, 32, {}, box(0, 2, 28, 28, { background: '#f2efe9', border: '1px solid #ccc1b3', borderRadius: '50%' }, ic('bookmark', 7, 7, 14, MUTED)) + box(32, 2, 28, 28, { background: 'rgba(166,64,48,0.1)', border: '1px solid rgba(166,64,48,0.4)', borderRadius: '50%' }, ic('x', 6, 6, 16, '#a64030'))
    + txt(70, 8, '12 October 2026 11:28', F(12, '16px', 500, MUTED)) + box(204, 4, 24, 24, { background: YEL, borderRadius: '50%', textAlign: 'center', ...F(9, '24px', 700) }, 'AF'), 'it_meta');
  h += box(R - 171.6, 32, 171.6, 49, { background: 'rgba(248,227,124,0.9)', borderRadius: '16px 16px 12px', boxShadow: 'rgba(0,0,0,0.1) 0 1px 3px 0, rgba(0,0,0,0.1) 0 1px 2px -1px' },
    box(16, 13, 135.4, 24, { background: 'rgba(36,30,25,0.09)', borderRadius: 6, textAlign: 'center', ...F(16, '24px', 600) }, '@Remedy-check'), 'it_user');
  h += box(R - 40, 93, 28, 28, { background: 'rgba(242,239,232,0.95)', border: '1px solid #ccc1b3', borderRadius: '50%', boxShadow: 'rgba(0,0,0,0.1) 0 1px 3px 0, rgba(0,0,0,0.1) 0 1px 2px -1px' }, ic('chevron-right', 6, 6, 16, MUTED), 'it_col');
  // step rows (real labels from the run; another session's "remedy hearing gap" memory left out)
  const rowsDef = [
    ['Accessing memories', [['chip', 'brain', 'memories']], 33],
    ['Accessing memories', [['tag', 'Personal', '#587e77', 'rgba(88,126,119,0.1)', 'rgba(88,126,119,0.35)'], ['chip', 'brain', 'working preferences']], 33],
    ['Accessing memories', [['tag', 'Firm', '#638363', 'rgba(99,131,99,0.12)', 'rgba(99,131,99,0.4)'], ['chip', 'brain', 'house style']], 33],
    ['Search case documents', [['qtag', 'by_title'], ['it', '05_Tribunal_Judgment']], 60, '05_Tribunal_Judgment'],
    ['Load Case Documents', [], 51.5, null, true],
    ['Execute Command', [], 51.5, null, true]];
  let y = 152;
  rowsDef.forEach(([lab, parts, rh, hit, hits1], i) => {
    let inner = ic('circle-check', 10.3, 7.3, 15.4, '#638363') + txt(31, 8, lab, F(11, '16.5px', 600));
    let x = 31 + lab.length * 5.95 + 6;
    for (const p of parts) {
      if (p[0] === 'chip') { const w = p[2].length * 5.2 + 28; inner += box(x, 7, w, 19, { background: 'rgba(88,126,119,0.08)', border: '1px solid rgba(88,126,119,0.3)', borderRadius: 9999 }, ic('brain', 7, 4.5, 10, '#587e77') + txt(21, 2, p[2], F(10, '15px', 500))); x += w + 5; }
      if (p[0] === 'tag') { const w = p[1].length * 5.6 + 16; inner += box(x, 7, w, 19, { background: p[3], border: `1px solid ${p[4]}`, borderRadius: 9999, textAlign: 'center', ...F(10, '17px', 500, p[2]) }, p[1]); x += w + 5; }
      if (p[0] === 'qtag') { inner += box(x, 6.8, 49.3, 19, { background: 'rgba(248,227,124,0.1)', border: '1px solid rgba(248,227,124,0.3)', borderRadius: 9999, textAlign: 'center', ...F(10, '17px', 500, 'rgba(36,30,25,0.65)') }, p[1]); x += 55.3; }
      if (p[0] === 'it') inner += txt(x, 8.8, p[1], { ...F(10.5, '15.75px', 400, 'rgba(36,30,25,0.3)'), fontStyle: 'italic' });
    }
    if (hit) inner += txt(11, 36, '1 hits', F(10, '15px', 500, '#638363')) + box(41.9, 34, 139.3, 19, { background: 'rgba(99,131,99,0.08)', border: '1px solid rgba(99,131,99,0.25)', borderRadius: 9999 }, txt(7, 2, hit, F(10, '15px', 400, 'rgba(36,30,25,0.65)')) + box(118.5, 3, 13.9, 13, { background: 'rgba(99,131,99,0.2)', borderRadius: 9999, textAlign: 'center', ...F(10, '13px', 600, '#638363') }, '2'));
    if (hits1) inner += txt(11, 29.5, '1 hits', F(10, '15px', 500, '#638363'));
    h += box(54, y + 4, 16, 16, { background: '#fff', border: '2px solid rgba(99,131,99,0.7)', borderRadius: '50%' }, box(2, 2, 8, 8, { background: 'rgba(99,131,99,0.5)', borderRadius: '50%' }));
    if (i < rowsDef.length - 1) h += box(62, y + 16, 1, rh - 6, { background: 'rgba(220,206,188,0.6)' });
    h += box(76, y, 892, rh, { background: 'rgba(242,239,232,0.3)', border: '1px solid rgba(220,206,188,0.4)', borderRadius: 12 }, inner, 'st' + i);
    y += rh + 10;
  });
  // the answer
  h += box(54, y + 4, 16, 16, { background: '#fff', border: '2px solid rgba(99,131,99,0.8)', borderRadius: '50%' }, box(2, 2, 8, 8, { background: 'rgba(99,131,99,0.55)', borderRadius: '50%' }));
  h += `<div class="ans" id="ans" style="top:${y}px">
<h1 id="aH1">Remedy Check: ${pl('Priya Nair')} v ${pl('Calderdale Logistics Limited')} (1803442/2025)</h1>
<h2 style="margin-top:0">1. Case Summary</h2><ul>
<li>Tribunal and judgment date: Employment Tribunal, Leeds, ${pl('Employment Judge Hartley')} sitting with members. Reserved judgment sent to the parties on ${dt('19 March 2026')}.</li>
<li>Claim presented: ${dt('2 June 2025')}, after Acas early conciliation. The Eighth Addendum Vento bands therefore apply.</li>
<li>EDT: ${dt('31 March 2025')}. The judgment makes no finding on it. See check 2 in section 4 on a possible extension to 2 May 2025.</li>
<li>Acting for: Claimant</li>
<li>Claims succeeded: unfair dismissal under s.98 ERA 1996, automatic unfairness under s.99 ERA 1996, direct sex discrimination under s.13 EqA 2010, and pregnancy and maternity discrimination under s.18 EqA 2010 ${dl('05_Tribunal_Judgment')}.</li>
<li>Claims failed, withdrawn or struck out: none recorded in the judgment.</li></ul>
<h2>2. Findings Register</h2><div class="tw"><table style="width:100%"><thead><tr><th style="width:170px">Topic</th><th>Finding</th><th style="width:56px">Para</th></tr></thead><tbody>
${FINDINGS.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div>
<h2 id="aRT">3. Remedy Table</h2><div class="tw" id="rtWrap"><table id="rt" style="width:100%"><thead><tr><th>No.</th><th>Head of loss</th><th>Claimed</th><th>Linked claim</th><th id="thSup">Support status</th><th>Judgment basis (para)</th><th id="thOpp">Other side's argument</th><th id="thRisk">Risk rating</th><th>Action</th></tr></thead><tbody>
${REMEDY.map((r, i) => `<tr id="rr${i + 1}">${r.map((c, j) => `<td${j === 4 ? ` id="sup${i + 1}"` : j === 7 ? ` id="risk${i + 1}"` : ''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
  return h + '</div>';
}

// ---------------------------------------------------------------- workflow builder (the Run Action step, not saved)
function workflow(open) {
  const card = box(16, 84, W - 32, H - 100, { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, boxShadow: 'rgba(35,30,25,0.1) 0 1px 2px 0, rgba(35,30,25,0.35) 0 24px 60px -12px' });
  let h = card + ic('chevron-left', 33, 103, 16, MUTED) + txt(55, 101.6, 'Workflows', F(12.5, '18.75px', 500, MUTED)) + txt(129.7, 101, 'Untitled Workflow', F(13.5, '20.25px', 600));
  const RP = W - 27 - 460;   // right panel x
  h += box(W - 217.3, 95, 104.5, 32, { border: '1px solid #ccc1b3', borderRadius: 8 }, ic('save', 13, 9, 14, INK) + txt(33, 6.6, 'Save Draft', F(12.5, '18.75px', 600)));
  h += box(W - 16 - 24 - 64.8, 95, 64.8, 32, { background: YEL, borderRadius: 8, textAlign: 'center', ...F(12.5, '32px', 600) }, 'Publish') + box(W - 16 - 18, 102, 1, 18, { background: '#ccc1b3' });
  // canvas
  const CWd = RP - 8 - 27;
  h += box(27, 137, CWd, 772 - (936 - H), { background: '#f2efe9', border: `1px solid ${LINE}`, borderRadius: 16, backgroundImage: 'radial-gradient(#ccc1b3 1.2px, transparent 1.3px)', backgroundSize: '20px 20px', backgroundPosition: '6px 6px' });
  h += box(38, 148, 91.6, 32, { background: YEL, borderRadius: 8, textAlign: 'center', ...F(12.5, '32px', 600) }, '+ Add Node') + box(137.6, 148, 91.7, 32, { border: '1px solid #ccc1b3', borderRadius: 8 }, ic('settings-2', 13, 9, 14, INK) + txt(33, 6.6, 'Settings', F(12.5, '18.75px', 600)));
  h += box(38, H - 38 - 100, 34, 100, { background: '#fff', border: '1px solid #ccc1b3', borderRadius: 12 }, ic('zoom-in', 8, 8, 16, MUTED) + ic('zoom-out', 8, 41, 16, MUTED) + box(0, 66, 32, 32, { background: 'rgba(229,218,205,0.6)', borderRadius: '0 0 11px 11px' }, ic('maximize-2', 8, 8, 16, INK)));
  // the node (from the staging capture, 434 x 218, centred on the canvas, selected)
  const nx = 27 + CWd / 2 - 217, ny = 137 + (772 - 101) / 2 - 109;
  h += box(nx, ny, 434, 218, { background: '#fff', border: '2px solid #d8cfc1', borderRadius: 20, boxShadow: 'rgba(0,0,0,0.12) 0 4px 14px' },
    box(124, 28, 56, 56, { background: '#ebe7e0', borderRadius: 12 }, ic('circle-play', 14, 14, 28, INK)) + txt(200, 42, 'Run Action', F(21, '28px', 400, '#3a332c'))
    + box(0, 104, 434, 36, { textAlign: 'center', ...F(26, '36px', 500, INK) }, 'Run Action') + box(32, 154, 370, 34, { background: '#f4efe5', borderRadius: 8, textAlign: 'center', ...F(19, '34px', 500, '#96732c') }, `${icS('info', 18, '#96732c', 'vertical-align:-3px;margin-right:8px')}Not configured`), 'wfNode');
  h += box(nx + 208, ny - 9, 16, 16, { background: '#c8b9a3', border: '2px solid #fff', borderRadius: '50%' }) + box(nx + 208, ny + 210, 16, 16, { background: '#c8b9a3', border: '2px solid #fff', borderRadius: '50%' });
  // configure panel
  let p = box(0, 0, 458, 52, { borderBottom: '1px solid rgba(204,193,178,0.7)' }, ic('chevron-left', 14, 17.5, 16, MUTED) + box(46, 11.5, 28, 28, { background: 'rgba(220,206,188,0.3)', borderRadius: 8 }, ic('circle-play', 7, 7, 14, INK)) + txt(82, 15.8, 'Configure: Run Action', F(13, '19.5px', 600)) + ic('x', 421, 17.5, 16, MUTED));
  const X = 14, PWd = 429;
  p += txt(X, 66, 'Display name', F(12.5, '18.75px', 500)) + box(X, 90.8, PWd, 36, { background: '#f2efe9', border: '1px solid #ccc1b3', borderRadius: 12 }, txt(12, 9, 'Run Action', F(12.5, '18px')));
  p += txt(X, 130.8, 'This label appears on the workflow canvas.', F(11, '15.95px', 400, MUTED));
  p += box(X, 166.7, PWd, 115.6, { background: 'rgba(88,126,119,0.05)', border: '1px solid rgba(88,126,119,0.15)', borderRadius: 8 }, ic('info', 13, 13, 14, '#587e77') + txt(35, 11, 'Actions are reusable skills from your library', F(12, '16px', 500))
    + box(35, 29, 381, 75.6, { whiteSpace: 'normal', ...F(11, '15.125px', 400, MUTED) }, "Select an action you've built in the Action Library. It receives the full workflow context including any files from previous steps. The action runs its own processing logic and can produce output files, text summaries, or both. If the trigger was an email with attachments, those files are bundled and passed to the action automatically."));
  p += txt(X, 302.3, 'Action to run *', F(12.5, '18.75px', 500));
  p += box(X, 329.1, PWd, 42, { background: 'rgba(231,227,218,0.4)', border: '1px solid #ccc1b3', borderRadius: 8 }, txt(13, 10, 'Select an action from your library', F(14, '20px', 400, MUTED)) + ic('chevron-down', PWd - 29, 12, 16, MUTED), 'wfSelect');
  p += txt(X, 387.1, 'Input files', F(12.5, '18.75px', 500)) + box(X, 409.8, PWd, 31.9, { whiteSpace: 'normal', ...F(11, '15.95px', 400, MUTED) }, 'Select which files from upstream steps to pass into this action. These become the reference documents the action processes.');
  p += txt(X, 457.7, 'Additional instructions (optional)', F(12.5, '18.75px', 500)) + box(X, 482.5, PWd, 112, { background: '#f2efe9', border: '1px solid #ccc1b3', borderRadius: 12 }, box(12, 9, PWd - 24, 60, { whiteSpace: 'normal', ...F(12, '19px', 400, 'rgba(36,30,25,0.85)') }, 'Focus specifically on section 3.2 regarding liability clauses and cross-reference with the attached precedent document.'));
  p += box(0, 770 - 101 - 56, 458, 56, { background: '#fff', borderTop: '1px solid rgba(204,193,178,0.7)' }, box(458 - 14 - 82.5 - 8 - 65.7, 12.5, 65.7, 32, { border: '1px solid #ccc1b3', borderRadius: 8, textAlign: 'center', ...F(12.5, '30px', 600) }, 'Cancel') + box(458 - 14 - 82.5, 12.5, 82.5, 32, { background: YEL, borderRadius: 8, textAlign: 'center', ...F(12.5, '32px', 600) }, 'Save Draft'));
  if (open) p += box(X, 375.1, PWd, 112.1, { background: '#fff', border: '1px solid #ccc1b3', borderRadius: 12, boxShadow: 'rgba(0,0,0,0.1) 0 4px 6px -1px, rgba(0,0,0,0.1) 0 2px 4px -2px' },
    box(0, 0, PWd - 2, 45, { borderBottom: '1px solid #ccc1b3' }, ic('search', 12, 14, 16, INK) + txt(36, 12, '<em class="ph">Search actions...</em>', F(14, '20px')))
    + box(4, 49, PWd - 10, 57.1, { background: '#e5dacd', borderRadius: 8 }, ic('building-2', 34, 12, 16, MUTED) + txt(62, 10, 'Remedy-check [0f3c9b3j]', F(14, '20px', 500)) + txt(62, 32, 'Compare the schedule of loss with the tribunal judgment. For each...', F(11, '15.1px', 400, MUTED)), 'wfItem'), 'wfDrop');
  h += box(RP, 137, 460, 772 - 101, { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, overflow: 'hidden' }, p, 'wfPanel');
  return h;
}

// ---------------------------------------------------------------- the plate list
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const which = process.argv[2] ? new RegExp(process.argv[2]) : null;
  const SPR = '';
  const exploreCss = '.win{background:transparent!important}';
  // Explore menu with Actions hovered: the 4.1 snapshot with the Actions preview card (staging 12 Oct 2026)
  let ex = SNAP('X-explore.html').replace('<div id="exCase" style="left:10px;top:46px;width:284px;height:72.5px;border-radius:12px"></div>', '<div id="exAct" style="left:11px;top:122px;width:284px;height:73px;border-radius:12px;background:rgba(231,227,218,0.6)"></div>');
  const prevStart = ex.indexOf('<div class="x67"'), prevEnd = ex.indexOf('<div class="x77"');
  const pv = (y, t, d, hi = false) => (hi ? `<div style="left:323px;top:${y - 7}px;width:324px;height:40px;background:rgba(229,218,205,0.45);border-radius:8px"></div>` : '') + `<div style="left:331px;top:${y}px;white-space:nowrap;font:600 11.5px/11.5px 'Rethink Sans';color:#241e19">${t}</div><div style="left:331px;top:${y + 15.5}px;white-space:nowrap;font:400 10.5px/10.5px 'Rethink Sans';color:#494746">${d}</div>`;
  const prev = `<div class="x67" style="left:316px;top:58px;width:338px;height:233.7px"></div><div style="left:317px;top:59px;width:336px;height:26px;border-bottom:1px solid rgba(204,193,178,0.6)"></div><i class="ic" data-i="zap" style="left:327px;top:65.5px;width:12px;height:12px;color:#494746"></i><div style="left:345px;top:63.5px;font:600 11px/16.5px 'Rethink Sans';color:#241e19">Actions</div>
<div style="left:331px;top:89.8px;font:500 11px/11px 'Rethink Sans';color:#494746">Personal</div>${pv(111.8, 'Review contract', 'Checks a contract against your standard terms')}
<div style="left:331px;top:153.8px;font:500 11px/11px 'Rethink Sans';color:#494746">Company</div>${pv(176.8, 'Due diligence check', 'Reads the file for risks and missing points', true)}${pv(216.8, 'Extract key dates', 'Lists every deadline and date in a document')}${pv(256.8, 'Compare versions', 'Shows what changed between two versions')}`;
  ex = ex.slice(0, prevStart) + prev + ex.slice(prevEnd).replace('The latest court rulings from every country we cover.', 'Describe a task once, then call it in any chat.');
  const chatFrame = (n, name) => mainwrap(FRAME(n, name));
  const empty = actionsPage({ tabsN: { all: 0, personal: 0, company: 0 }, list: emptyState(false) });
  const emptyP = (panel, n = { all: 0, personal: 0, company: 0 }) => actionsPage({ tabsN: n, list: emptyState(true), panel });
  const ACT = 'actions';
  const list = [
    // the matter page we start on, and the Explore menu (sprite, drawn at window 344.7, 17)
    { name: 'mGreet', navKind: 'explore', body: chatFrame(2, 'Main') + mainwrap(SNAP('M-greet.html').replace('Good afternoon', 'Good afternoon')) },
    { name: 'spExplore', navKind: null, h: 336, body: ex, extraCss: exploreCss, clip: { x: 0, y: 0, width: 674, height: 336 }, at: [344.7, 17], transparent: true },
    // Actions page
    { name: 'aEmpty', navKind: ACT, body: empty },
    { name: 'aEmptyN', navKind: ACT, body: emptyP('') },   // the list narrowed under the panel (panel drawn as a sprite)
    { name: 'pForm1', navKind: null, body: aside(panelHead('New action') + step1()), clip: { x: PX, y: PY, width: PW, height: PH }, transparent: true },
    { name: 'pForm1b', navKind: null, body: aside(panelHead('New action') + step1({ name: NAME0, brief: BRIEF, counter: '179 / 60,000', nextOn: true, focus: 'brief' })), clip: { x: PX, y: PY, width: PW, height: PH }, transparent: true },
    { name: 'pForm2', navKind: null, body: aside(panelHead('New action') + step2()), clip: { x: PX, y: PY, width: PW, height: PH }, transparent: true },
    { name: 'pForm3', navKind: null, body: aside(panelHead('New action') + step3()), clip: { x: PX, y: PY, width: PW, height: PH }, transparent: true },
    // building: card on top of the list, panel "How Andri built this" (first state), toast
    { name: 'aBuild0', navKind: ACT, body: actionsPage({ tabsN: { all: 0, personal: 0, company: 0 }, list: row(7, NAME0, 'Andri is making this action', { sel: true, spinner: true }), panel: panelHead(null) + buildLog(NAME0, [{ small: 'Working now', cur: true }]) }) + toast('Action creation started. This may take a moment...', 'info', '#587e77') },
    { name: 'aBuild1', navKind: ACT, body: actionsPage({ tabsN: { all: 1, personal: 1, company: 0 }, list: LIST_BUILT(NAME1, 'Personal', true, true), panel: panelHead('Personal') + buildLog(NAME1, BUILD_CARDS) }) },
    { name: 'aBuildFull', navKind: ACT, body: actionsPage({ tabsN: { all: 1, personal: 1, company: 0 }, list: LIST_BUILT(NAME1, 'Personal', false, true, true) }) },
    ...[['spCbMid', 'cbMid', 768, 'left:371px;top:519.9px', '#cbDock{display:none}'], ['spCbDock', 'cbDock', 720, 'left:395px;top:614.9px', '#cbMid{display:none}']].map(([n, id, w, pos, hide]) => ({ name: n, navKind: null, h: 140, vw: w, transparent: true, clip: { x: 0, y: 0, width: w, height: 140 },
      body: SNAP('M-cbox.html').replace(`id="${id}" style="${pos}`, `id="${id}" style="left:0px;top:0px`), extraCss: hide + '.m50{box-shadow:none!important}' })),
    { name: 'aBuilt', navKind: ACT, body: actionsPage({ tabsN: { all: 1, personal: 1, company: 0 }, list: LIST_BUILT(NAME2, 'Personal', false, false, true) }) },
    { name: 'aBuiltHover', navKind: ACT, body: actionsPage({ tabsN: { all: 1, personal: 1, company: 0 }, list: LIST_BUILT(NAME2, 'Personal', false, false, true, true) }) },
    // built: the detail (content as a tall sprite so it can scroll under the header)
    { name: 'aDetail', navKind: ACT, body: actionsPage({ tabsN: { all: 1, personal: 1, company: 0 }, list: LIST_BUILT(NAME2), panel: panelHead('Personal', 'tools') }), extraCss: SKILL_CSS },
    { name: 'aDetailHover', navKind: ACT, body: actionsPage({ tabsN: { all: 1, personal: 1, company: 0 }, list: LIST_BUILT(NAME2), panel: panelHead('Personal', 'toolsHover') }) },
    { name: 'aConfirm', navKind: ACT, body: actionsPage({ tabsN: { all: 1, personal: 1, company: 0 }, list: LIST_BUILT(NAME2), panel: panelHead('Personal', 'confirmShare') }) },
    { name: 'aShared', navKind: ACT, body: actionsPage({ tabsN: { all: 1, personal: 0, company: 1 }, list: LIST_BUILT(NAME2, 'Company'), panel: panelHead('Company', 'toolsHover') }) + toast('Action shared with company', 'circle-check', '#638363', 54) },
    { name: 'spDetail', navKind: null, vw: PW, h: 1500, body: `<div style="left:0;top:0;width:${PW}px;height:1500px;background:#fff">${detailBody(NAME2).replace('top:73px', 'top:20px')}</div>`, extraCss: SKILL_CSS, clip: { x: 0, y: 0, width: PW, height: 1500 } },
    // Nair: Knowledge Base, employment folder (rows as one tall sprite under the sticky header)
    { name: 'kbFrame', navKind: 'explore', body: box(0, 68, W, H - 68, { background: '#f2efe9' }) + kbRail() + kbToolbar() + kbHeader() },
    { name: 'spKB', navKind: null, h: 1300, body: box(0, 0, W, 1300, { background: '#f2efe9' }) + box(KX, 0, KW, 40 + 20 * 60.2 + 12, { background: '#fff', border: '1px solid rgba(204,193,178,0.8)', borderRadius: 16 },
      box(25, 12, 16, 16, { background: '#f2efe9', border: '1px solid #ccc1b3', borderRadius: 6 }) + [['Name', 49], ['Created', 49 + 330], ['Summary', 49 + 330 + 160], ['Status', 49 + 330 + 160 + 420], ['Tags', 49 + 330 + 160 + 420 + 150]].map(([t, x], i) => txt(x + 20, 11.4, t, F(12, '17.14px', 500, MUTED)) + (i ? box(x - 0.5, 10, 1, 20, { background: '#ccc1b3', borderRadius: 9 }) : '')).join(''))
      + kbRows(40).replace(/left:(\d+(\.\d+)?)px/g, (m, v) => m), clip: { x: 0, y: 0, width: W, height: 1300 } },
    // matter chat for the run: greeting, the @ lists, the chip, the thread
    { name: 'cGreet', navKind: 'explore', body: chatFrame(3, 'Remedy check') + mainwrap(SNAP('M-greet.html')) },
    { name: 'cConv', navKind: 'explore', body: chatFrame(3, 'Remedy check') },
    ...['docs', 'company', 'tags', 'actions'].map(k => { const p = picker(k); return { name: 'pk_' + k, navKind: null, h: p.h, vw: p.w, body: `<div style="left:0;top:0;width:${p.w}px;height:${p.h}px">${p.html}</div>`, transparent: true, clip: { x: 0, y: 0, width: p.w, height: p.h } }; }),
    ...[['spCbAt', '@', false], ['spCbChip', '', true]].map(([n, t, chip]) => ({ name: n, navKind: null, h: 140, vw: 768, transparent: true, clip: { x: 0, y: 0, width: 768, height: 140 },
      body: SNAP('M-cbox.html').replace('id="cbMid" style="left:371px;top:519.9px', 'id="cbMid" style="left:0px;top:0px')
        .replace('id="cbMidPh"><em class="ph">Ask Andri...</em>', 'id="cbMidPh">' + (chip ? `<span style="display:inline-block;color:#638363;background:rgba(99,131,99,0.16);border-radius:2px;font:400 16px/21px 'Rethink Sans'">@[A:Remedy-check]</span> ` : t))
        .replace('<i class="ic" data-i="at-sign" style="left:53px;top:63px', '<div style="left:47px;top:57px;width:28px;height:28px;border-radius:8px;background:rgba(248,227,124,' + (chip ? '0.15' : '0.1') + ')"></div>' + (chip ? '<div style="left:63px;top:55px;width:14px;height:14px;border-radius:50%;background:#f8e37c;font:700 9px/14px \'Rethink Sans\';color:#241e19;text-align:center">1</div>' : '') + '<i class="ic" data-i="at-sign" style="left:53px;top:63px'),
      extraCss: '#cbDock{display:none}.m50{box-shadow:none!important;background:#fff!important;' + (chip ? 'border-color:rgba(99,131,99,0.7)!important' : 'border-color:rgba(248,227,124,0.8)!important') + '}#cbMidTy{display:block!important}#cbMidGo{opacity:1}' })),
    { name: 'spThread', navKind: null, vw: 1024, h: 2300, body: threadHtml(), extraCss: TH_CSS, transparent: true, clip: { x: 0, y: 0, width: 1024, height: 2300 } },
    // workflow builder
    { name: 'wf', navKind: 'workflows', body: workflow(false) },
    { name: 'wfOpen', navKind: 'workflows', body: workflow(true) },
  ];
  const r = await render(list.filter(s => !which || which.test(s.name)));
  const f = path.join(P, 'plates/rects.json'); const old = existsSync(f) ? JSON.parse(readFileSync(f)) : {};
  Object.assign(old, r); writeFileSync(f, JSON.stringify(old, null, 1)); writeFileSync(path.join(P, 'plates/rects.js'), 'window.RECTS_DATA=' + JSON.stringify(old) + ';');
}
