// Captures the Andri screens for Academy 11.1 as 2x plates plus element rects (app px, window 1440 x 860).
// Source: DOM snapshots of Andri staging taken 13 Oct 2026 (staging-snapshot/raw), localised by staging-snapshot/localize.py
// (Aldridge Vine, Adam Frith / AF, my matter "Academy 11.1" shown as "Nair v Calderdale Logistics").
// Based on the 8.1 capture.mjs (helpers, float sprites with their own shadow off: known-issues #1).
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
  vis(e) { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.x < 1440 && r.right > 0 && r.y < 860 && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).opacity !== '0'; },
  text(t, nth = 0, root = document) { const m = [...root.querySelectorAll('body *')].filter(e => H.vis(e) && e.textContent.trim() === t && ![...e.children].some(c => c.textContent.trim() === t));
    m.sort((a, b) => { const p = a.getBoundingClientRect(), q = b.getBoundingClientRect(); return Math.abs(p.y - q.y) > 4 ? p.y - q.y : p.x - q.x; }); return m[nth]; },
  starts(t, nth = 0) { const m = [...document.querySelectorAll('body *')].filter(e => H.vis(e) && e.textContent.trim().startsWith(t) && ![...e.children].some(c => c.textContent.trim().startsWith(t))); return m[nth]; },
  btn(t, nth = 0) { return [...document.querySelectorAll('button,a,[role=menuitem],[role=option],[role=tab]')].filter(e => H.vis(e) && e.innerText.trim() === t)[nth]; },
  btnS(t, nth = 0) { return [...document.querySelectorAll('button,a,[role=menuitem],[role=option],[role=tab]')].filter(e => H.vis(e) && e.innerText.trim().startsWith(t))[nth]; },
  ph(p) { return [...document.querySelectorAll('input,textarea')].find(e => (e.placeholder || '').startsWith(p)); },
  dialog() { return [...document.querySelectorAll('[role=dialog],[role=alertdialog]')].find(d => d.getAttribute('aria-label') !== 'Personalisation' && H.vis(d)); },
  pop() { return [...document.querySelectorAll('[data-radix-popper-content-wrapper]')].filter(e => e.getBoundingClientRect().width > 0).pop(); },
  // a popover under its trigger as radix places it at 1440 wide: start-aligned, kept 10 px inside the window
  under(trig, gap = 4) { const w = H.pop(); if (!w || !trig) return; const t = trig.getBoundingClientRect(), m = w.getBoundingClientRect(); const left = Math.min(t.left, 1440 - 10 - m.width), top = t.bottom + gap; w.style.transform = (w.style.transform || '') + ' translate(' + (left - m.left) + 'px,' + (top - m.top) + 'px)'; },
  phrase(t) { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; const all = []; while ((n = w.nextNode())) all.push(n);
    for (const nd of all) { const i = nd.textContent.indexOf(t); if (i < 0) continue; if (!H.vis(nd.parentElement)) continue; const r = document.createRange(); r.setStart(nd, i); r.setEnd(nd, i + t.length);
      return [...r.getClientRects()].filter(x => x.width > 2).map(x => [x.x, x.y, x.width, x.height].map(v => Math.round(v * 10) / 10)); } return null; },
  // the staging account's avatar initial (B) becomes the demo partner's (AF); only the demo matter in the matters list
  fix() {
    for (const e of [...document.querySelectorAll('span,div')].filter(e => e.children.length === 0 && /^(B|bb)$/.test(e.textContent.trim()))) { const r = e.getBoundingClientRect(); if (r.width < 44 && r.height < 44) e.textContent = 'AF'; }
    document.querySelectorAll('#snap111btn').forEach(e => e.remove());
  },
  setVal(el, v) { if (!el) return; el.value = v; el.setAttribute('value', v); if (el.tagName === 'TEXTAREA') el.textContent = v; },
  noPop() { document.querySelectorAll('[data-radix-popper-content-wrapper]').forEach(e => e.style.setProperty('display', 'none', 'important')); },
  // a popover keeps the place staging gave it; put its top at y (app px)
  popTo(top, left) { const w = H.pop(); if (!w) return; const r = w.getBoundingClientRect(); const dy = top - r.top, dx = left == null ? 0 : left - r.left; w.style.transform = (w.style.transform || '') + ' translate(' + dx + 'px,' + dy + 'px)'; },
};`;
async function load(snap, js = '') {
  await pg.goto(pathToFileURL(path.join(SNAP, snap + '.html')).href, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
  await pg.addScriptTag({ content: HELPERS });
  await pg.evaluate('H.fix()');
  if (js) await pg.evaluate(js);
  await pg.waitForTimeout(100);
}
const out = {};
const want = n => !only || only.test(n);
async function rects(spec) { const o = {}; for (const [k, ex] of Object.entries(spec || {})) { o[k] = await pg.evaluate(ex => { try { const e = eval(ex); return Array.isArray(e) ? e : e ? H.R(e) : null; } catch { return null; } }, ex); if (!o[k]) console.log('  no rect', k); } return o; }
async function plate(name, snap, js = '', spec = {}) {
  if (!want(name)) return; await load(snap, js);
  await pg.screenshot({ path: path.join(HERE, name + '.png'), clip: { x: 0, y: 0, width: 1440, height: 860 } });
  out[name] = await rects(spec); console.log('plate', name);
}
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

// ---------------------------------------------------------------- specs
const TOP = { firm: `H.btnS('Aldridge Vine')`, matters: `H.text('Matters', 0)` };
const SIDE = { sCompany: `H.text('Manage your company settings, billing and members.') && [...document.querySelectorAll('a,button')].filter(H.vis).find(a => a.innerText.trim() === 'Company')`,
  heading: `(() => { const h = [...document.querySelectorAll('h1,h2')].find(e => e.textContent.trim() === 'Company'); const g = document.createRange(); g.selectNodeContents(h); const q = g.getBoundingClientRect(); return [q.x, q.y, q.width, q.height].map(v => Math.round(v * 10) / 10); })()`, sMembers: `H.btn('Members')`, sBilling: `H.btn('Billing')` };
const INV = { invite: `H.btnS('Invite Member')`, email: `H.ph('member@company.com') || H.dialog()?.querySelector('input')`,
  role: `H.dialog()?.querySelector('button[role=combobox]')`, submit: `H.dialog() && [...H.dialog().querySelectorAll('button')].filter(H.vis).find(b => b.innerText.trim() === 'Invite Member')`,
  x: `H.dialog() && [...H.dialog().querySelectorAll('button')].find(b => b.querySelector('.lucide-x'))`, dlg: `H.dialog()` };
const ROLES = { admin: `H.text('Admin', 0, H.pop())`, member: `H.text('Member', 0, H.pop())`, support: `H.text('Support', 0, H.pop())`,
  adminD: `H.phrase('Full access to matters, members, billing, and settings.')`, memberD: `H.phrase('Creates and uses matters, documents, and templates.')`,
  supportD: `H.phrase("Like a Member for day-to-day work, but for part-time helpers the firm doesn’t want to give a full seat.") || H.phrase("Like a Member for day-to-day work, but for part-time helpers the firm doesn't want to give a full seat.")`, supportRow: `H.text('Support', 0, H.pop())?.closest('[role=option]')`, lb: `H.pop().querySelector('[role=listbox]')`, lbR: `[parseFloat(getComputedStyle(H.pop().querySelector('[role=listbox]')).borderTopLeftRadius), 0, 0, 0]` };

const EMAIL = 'rosalind.keane@aldridgevine.co.uk';
// the matters list shows only the demo matter: its real row (22 Sept, from a search for it) in place of every other row, search box empty
const nairRow = await (async () => { await load('a01b-search-nair'); return pg.evaluate(() => [...document.querySelectorAll('tbody tr')].find(r => /22 Sept 2026/.test(r.innerText)).outerHTML); })();
const ONLY_NAIR = `{ const tb = document.querySelector('tbody'); tb.innerHTML = ${JSON.stringify(nairRow)}; const pgx = H.text('Page 1 of 2'); if (pgx) pgx.textContent = 'Page 1 of 1'; }`;
const DOTS = `document.querySelector('tbody tr button[aria-label="Open menu"]') || [...document.querySelector('tbody tr').querySelectorAll('button')].pop()`;
// the menu and dialog were opened on my own matter's row (second row); put the menu under the demo row's ⋯ the way staging places it under its own
const MENU_TO_DOTS = `{ const w = H.pop(); const d = (${DOTS}).getBoundingClientRect(); const m = w.getBoundingClientRect(); w.style.transform = (w.style.transform || '') + ' translate(' + (d.right - m.right) + 'px,' + (d.bottom + 4 - m.top) + 'px)'; }`;

// ---------------------------------------------------------------- 1 the matters list, Company, Members (hover looks from the same staging session)
await plate('mat', 'a01-matters', ONLY_NAIR, { ...TOP, dots: DOTS });
await plate('matF', 'a01h-firm-hover', ONLY_NAIR, TOP);
await plate('k0', 'm00-company', '', { ...TOP, ...SIDE });
await plate('k0h', 'm00h-members-hover', '', SIDE);
await plate('k1', 'm01-members', '', { ...TOP, ...SIDE, ...INV });
await plate('k1h', 'm01h-invite-hover', '', INV);
await plate('k1b', 'm01b-billing-hover', '', SIDE);
// ---------------------------------------------------------------- 2 Invite Team Member: empty, the email typed (in the dialog only, never sent), the role menu, Support picked
await plate('k2', 'm02-invite-empty', '', INV);
await plate('k2e', 'm02e-email', '', INV);
await plate('k3', 'm03-role-menu', `H.noPop()`, INV);
await sprite('mRole', 'm03-role-menu', `H.under(H.dialog().querySelector('button[role=combobox]'))`, `H.pop()`, ROLES);
await sprite('mRoleH', 'm03h-support-hover', `H.under(H.dialog().querySelector('button[role=combobox]'))`, `H.pop()`, ROLES);
await plate('k4', 'm04-invite-support', '', { ...INV, roleD: `H.phrase('Like a Member for day-to-day work')` });
await plate('k4h', 'm04h-submit-hover', '', INV);
await plate('k4x', 'm04x-close-hover', '', INV);
// ---------------------------------------------------------------- 3 Billing: top, scrolled to Credits (a tall strip of the scrolling panel for the scroll), the Support tab
const SCR = `document.querySelector('.overflow-y-auto.overscroll-contain')`;
const CREDITS = `document.getElementById('credits')`;
const TOSCROLL = `{ const sc = ${SCR}; sc.scrollTop = 0; const c = (${CREDITS}).getBoundingClientRect(); window.__s1 = Math.round(c.top - sc.getBoundingClientRect().top - 24); }`;
const BILL = { premium: `[...document.querySelectorAll('[role=tab]')].find(e => e.innerText.trim() === 'Premium')`, supTab: `[...document.querySelectorAll('[role=tab]')].find(e => e.innerText.trim() === 'Support')`, how: `H.btn('How does this work?')`, p50: `H.text('£50')?.closest('button,label,div[class*=rounded]')`,
  notSeat: `H.phrase('Support-role members are not billed as a seat. Their AI work is paid from the support wallet instead.')`,
  never: `H.phrase('Credits never expire and are shared across your whole firm.')`, capable: `H.phrase('Premium credits unlock our most capable reasoning, for the hardest work.')`,
  supOnly: `H.phrase('Support credits only fund support-role members.')`, credits: CREDITS, scr: SCR, s1: `[window.__s1, 0, 0, 0]` };
await plate('bT', 'b01-billing-top', `{ ${SCR}.scrollTop = 0; } ` + TOSCROLL, { ...TOP, ...SIDE, ...BILL });
let s1 = out.bT?.s1?.[0] ?? 0;
// the Support tab's content is shorter, so staging can't scroll as far there: use the scroll both tabs reach, so the tab switch doesn't jump
{ await load('b03-billing-support', `document.querySelectorAll('[role=dialog]').forEach(d => d.remove());`); const mx = await pg.evaluate(ex => { const sc = eval(ex); return sc.scrollHeight - sc.clientHeight; }, SCR); s1 = Math.min(s1, mx); console.log('scroll to', s1); }
if (want('bStrip')) {   // the panel's content from scroll 0 down to the Credits view, in one tall picture (same width, so the same layout)
  await pg.setViewportSize({ width: 1440, height: 860 + s1 });
  await load('b01-billing-top', `{ ${SCR}.scrollTop = 0; }`);
  const r = await pg.evaluate(ex => H.R(eval(ex)), SCR);
  await pg.screenshot({ path: path.join(HERE, 'bStrip.png'), clip: { x: r[0], y: r[1], width: r[2], height: r[3] } });
  out.bStrip = { box: r, s1 }; console.log('strip bStrip', r.join(','), 's1', s1);
  await pg.setViewportSize({ width: 1440, height: 860 });
}
const AT_CREDITS = `{ ${SCR}.scrollTop = ${s1}; }`;
await plate('b2', 'b02-billing-credits', AT_CREDITS, { ...TOP, ...SIDE, ...BILL });
await plate('b2h', 'b02h-support-hover', AT_CREDITS, BILL);
await plate('b3', 'b03-billing-support', AT_CREDITS + ` document.querySelectorAll('[role=dialog]').forEach(d => d.remove()); document.querySelectorAll('[data-state=open][class*=fixed][class*=inset-0]').forEach(d => d.remove());`, { ...TOP, ...BILL });
await plate('b3m', 'b03h-matters-hover', AT_CREDITS + ` document.querySelectorAll('[role=dialog]').forEach(d => d.remove()); document.querySelectorAll('[data-state=open][class*=fixed][class*=inset-0]').forEach(d => d.remove());`, TOP);
// ---------------------------------------------------------------- 4 someone leaves: the matter menu, Transfer ownership (opened on my matter, nothing transferred)
await sprite('mMenu', 'a02-menu', ONLY_NAIR + MENU_TO_DOTS, `H.pop()`, { transfer: `H.btn('Transfer ownership')`, lb: `H.pop().querySelector('[role=menu]')`, lbR: `[parseFloat(getComputedStyle(H.pop().querySelector('[role=menu]')).borderTopLeftRadius), 0, 0, 0]` });
await sprite('mMenuH', 'a02h-menu-hover', ONLY_NAIR + MENU_TO_DOTS, `H.pop()`, { transfer: `H.btn('Transfer ownership')`, lb: `H.pop().querySelector('[role=menu]')`, lbR: `[parseFloat(getComputedStyle(H.pop().querySelector('[role=menu]')).borderTopLeftRadius), 0, 0, 0]` });
// the dialog over the demo list; the staging-only hint "No other active members are available in your firm." is left out (a firm with colleagues doesn't show it)
const DLG_FIX = ONLY_NAIR + ` { const h = H.text('No other active members are available in your firm.'); if (h) h.remove(); }`;
const TR = { newOwner: `H.dialog()?.querySelector('button[role=combobox]') || H.btnS('Select a team member')`, cancel: `H.btn('Cancel')`, x: `H.dialog() && [...H.dialog().querySelectorAll('button')].find(b => b.querySelector('.lucide-x'))`,
  lose: `H.phrase('You will lose all access to this matter. It moves entirely to the new owner.')`, mfa: `H.phrase('Two-factor authentication is required to transfer a matter.')`, dlg: `H.dialog()` };
await plate('tD', 'a03-transfer', DLG_FIX, TR);
await plate('tDh', 'a03h-cancel-hover', DLG_FIX, TR);
await b.close();
const merged = { ...RECTS, ...out };
writeFileSync(path.join(HERE, 'rects.json'), JSON.stringify(merged, null, 1));
writeFileSync(path.join(HERE, 'rects.js'), 'window.RECTS_DATA=' + JSON.stringify(merged) + ';\n');
console.log('plates ok', Object.keys(out).length);
