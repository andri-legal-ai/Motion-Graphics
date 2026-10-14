// Builds the Andri screens for Academy 4.1 from the staging snapshots (staging-snapshot/*.html, read from staging on 9 Oct 2026)
// and renders them to 2x PNG plates with Playwright.
//   node screens/build.mjs            -> writes screens/out/<name>.html and plates/<name>.png
// Every snapshot is absolute-positioned boxes and text with the computed styles staging used; icons are Lucide (same set as staging).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/Users/bennettnittke/.local/node/lib/node_modules/@playwright/cli/node_modules/playwright')); }

const P = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAP = f => readFileSync(path.join(P, 'staging-snapshot', f), 'utf8');
const U = f => pathToFileURL(path.join(P, f)).href;
const ALIAS = { building2: 'building-2', 'triangle-alert': 'triangle-alert' };
function icon(name) {
  name = ALIAS[name] || name;
  const f = path.join(P, 'icons', name + '.svg');
  if (!existsSync(f)) { console.warn('missing icon', name); return ''; }
  return readFileSync(f, 'utf8').replace(/<!--.*?-->/gs, '').replace(/\s(width|height)="24"/g, ' width="100%" height="100%"').replace(/\sclass="[^"]*"/, '').replace(/\s+/g, ' ');
}
const icons = html => html.replace(/<i class="ic" ([^>]*)data-i="([\w-]+)"([^>]*)><\/i>/g, (m, a, n, b) => n === 'svg' ? '' : `<i class="ic" ${a}${b}>${icon(n)}</i>`)
  .replace(/<i class="ic" ([^>]*)data-i="([\w-]+)"([^>]*)>/g, (m, a, n, b) => `<i class="ic" ${a}${b}>${icon(n)}`);

const BASE = `
@font-face{font-family:"Rethink Sans";src:url(${U('assets/fonts/RethinkSans.woff2')}) format("woff2");font-weight:400 800}
@font-face{font-family:fontHeading;src:url(${U('assets/fonts/Neco-400.woff2')}) format("woff2");font-weight:400}
@font-face{font-family:fontHeading;src:url(${U('assets/fonts/Neco-500.woff2')}) format("woff2");font-weight:500}
@font-face{font-family:fontHeading;src:url(${U('assets/fonts/Neco-700.woff2')}) format("woff2");font-weight:600 700}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:transparent;-webkit-font-smoothing:antialiased;font-family:"Rethink Sans"}
.win{position:relative;width:1470px;overflow:hidden;background:rgb(242,239,233)}
.win div,.win i.ic,.win img{position:absolute}
.win i.ic{display:block;line-height:0}
.win i.ic[style*="inline-block"],.win i.ic[style*="static"]{position:static;display:inline-block;margin:0 4px;vertical-align:-1px}
.win i.ic svg{width:100%;height:100%;display:block}
.win span{position:static}
.ph{font-style:normal;color:oklab(0.399146 0.00200959 0.00227141 / 0.6)}
mark{background:rgb(250,236,180);color:inherit;border-radius:3px;padding:0 2px}
`;
const css = readFileSync(path.join(P, 'staging-snapshot/common.css'), 'utf8');
const MONO = s => s.replace(/font-family:ui-monospace/g, 'font-family:"SF Mono",Menlo,monospace');
const logo = U('assets/andri-logo.svg');

// one page per screen: { name, h (px, page height incl. nav), nav: 'caselaw'|'explore'|'matters'|null, body: html (positioned at y=68 unless navless) }
export function page({ h = 835, nav = 'caselaw', body, extraCss = '', top = 68 }) {
  let navHtml = '';
  if (nav) {
    navHtml = SNAP('NAV.html').replace('src="LOGO"', `src="${logo}"`);
    if (nav !== 'caselaw') navHtml = navHtml.replace('class="k62" id="navTabTx"', 'class="k62n" id="navTabTx"').replace('>Case law<', '>Explore<')
      .replace('id="navTabTx" style="left:355.7px;top:24px;width:56.9px', 'id="navTabTx" style="left:355.7px;top:24px;width:50px').replace('id="navTabIc" data-i="chevron-down" style="left:418.6px', 'id="navTabIc" data-i="chevron-down" style="left:409px')
      .replace('class="k56" id="navUnder" style="left:343.7px;top:67px;width:100.9px', nav === 'matters' ? 'class="k56" id="navUnder" style="left:76px;top:67px;width:72.9px' : 'class="k56" id="navUnder" style="display:none;left:0;top:67px;width:0');
    if (nav === 'matters') navHtml = navHtml.replace('class="k57" id="navMatters"', 'class="k57 on" id="navMatters"');
  }
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}${MONO(css)}${extraCss}</style></head><body>
<div class="win" id="win" style="height:${h}px"><div id="mainwrap" style="left:0;top:${nav ? top : 0}px;width:1470px;height:${h - (nav ? top : 0)}px">${icons(MONO(body)).replace(/src="LOGO"/g, `src="${logo}"`)}</div>${icons(navHtml)}</div></body></html>`;
}

export async function render(list) {
  mkdirSync(path.join(P, 'screens/out'), { recursive: true }); mkdirSync(path.join(P, 'plates'), { recursive: true });
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const pg = await b.newPage({ viewport: { width: 1470, height: 835 }, deviceScaleFactor: 2 });
  pg.on('pageerror', e => console.log('ERR', String(e)));
  const rects = {};
  for (const s of list) {
    const f = path.join(P, 'screens/out', s.name + '.html'); writeFileSync(f, page(s));
    await pg.setViewportSize({ width: 1470, height: Math.ceil(s.h || 835) });
    await pg.goto(pathToFileURL(f).href); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(150);
    if (s.prep) await pg.evaluate(s.prep);
    await pg.evaluate(() => { for (const d of document.querySelectorAll('.win div')) { if (![...d.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
      if (!d.offsetParent && getComputedStyle(d).position !== 'fixed') continue;
      const lh = parseFloat(getComputedStyle(d).lineHeight) || 20; if (d.clientHeight < lh * 1.6) { d.style.whiteSpace = 'nowrap'; } } });
    const clip = s.clip || { x: 0, y: 0, width: 1470, height: s.h || 835 };
    await pg.screenshot({ path: path.join(P, 'plates', s.name + '.png'), clip, omitBackground: true });
    rects[s.name] = await pg.evaluate(() => { const o = {}; for (const e of document.querySelectorAll('[id]')) { const r = e.getBoundingClientRect(); if (r.width) o[e.id] = [r.left, r.top, r.width, r.height].map(v => Math.round(v * 10) / 10); } return o; });
    console.log('plate', s.name);
  }
  await b.close();
  return rects;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const which = process.argv[2];
  const A = SNAP('A-feed-all.html'), B = SNAP('B-employment.html');
  const C = SNAP('C-search-left.html') + SNAP('C-search-main.html');
  const tick = ids => `for (const id of ${JSON.stringify(ids)}) { const c = document.getElementById(id); c.className = 'k87 cb'; c.innerHTML = '<svg viewBox="0 0 24 24" style="position:absolute;left:1px;top:1px;width:12px;height:12px" fill="none" stroke="rgb(99,131,99)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'; }
    if (${ids.length}) { document.getElementById('selbar').style.display = 'none'; const sb = document.getElementById('selbar2'); sb.style.display = 'block'; document.getElementById('selN').textContent = '${ids.length} selected'; }`;
  const RV = readFileSync(path.join(P, 'staging-snapshot/review.css'), 'utf8'), CH = readFileSync(path.join(P, 'staging-snapshot/chat.css'), 'utf8');
  const SPR = '.win{background:transparent!important}';
  const rail = on => SNAP('R-rail.html').replace(`id="rail_${on}" style="`, `id="rail_${on}" class="r2" style="`) + `<style>#rail_${on}~i.ic,#rail_${on}+i.ic{color:rgb(36,30,25)!important}</style>`;
  const head = run => { let h = SNAP('R-head.html'); if (!run) h = h.replace(/<!--RUN-->[\s\S]*?<!--\/RUN-->/, '').replace('class="r4 CRUMBREVIEW"', 'class="r4" style="color:rgb(36,30,25);font-weight:500"'); return h; };
  const rv = (body, run) => '<div class="r0" style="left:0;top:0;width:1470px;height:767px"></div>' + rail('table') + head(run) + body;
  const show = (ids, hide = []) => `for (const i of ${JSON.stringify(ids)}) document.getElementById(i).style.display='block'; for (const i of ${JSON.stringify(hide)}) document.getElementById(i).style.display='none';`;
  const runState = (n, pct) => `document.getElementById('runN').textContent='${n}/2'; document.getElementById('runCells').textContent='${n}/2 cells · ${pct}%'; document.getElementById('runFill').style.width='${pct * 1.2}px';`;
  const chatFrame = '<div class="r0" style="left:0;top:0;width:1470px;height:767px"></div>' + SNAP('M-frame.html');
  const thread = SNAP('M-thread.html');
  const cb = SNAP('M-cbox.html');
  const list = [
    // Case law page
    { name: 'clA', nav: 'caselaw', body: A },
    { name: 'clB', h: 68 + 1450, nav: 'caselaw', body: B },
    { name: 'clC', nav: 'caselaw', body: C },
    { name: 'clC1', nav: 'caselaw', body: C, prep: tick(['cb_bacon']) },
    { name: 'clC2', nav: 'caselaw', body: C, prep: tick(['cb_bacon', 'cb_ballerino']) },
    // floating pieces, captured alone on transparent (known-issues #1: shadows drawn on canvas)
    { name: 'spJur', nav: null, h: 133, body: SNAP('J-menu.html'), extraCss: SPR, clip: { x: 0, y: 0, width: 248, height: 133 } },
    { name: 'spExplore', nav: null, h: 336, body: SNAP('X-explore.html'), extraCss: CH + SPR, clip: { x: 0, y: 0, width: 674, height: 336 } },
    { name: 'spExploreHot', nav: null, h: 336, body: SNAP('X-explore.html'), extraCss: CH + SPR + '#exCase{background:rgb(235,231,223)}', clip: { x: 0, y: 0, width: 674, height: 336 } },
    { name: 'spDlg0', nav: null, h: 351, body: SNAP('E-dialog.html'), extraCss: SPR, clip: { x: 0, y: 0, width: 480, height: 351 } },
    { name: 'spDlg1', nav: null, h: 351, body: SNAP('E-dialog.html'), extraCss: SPR, clip: { x: 0, y: 0, width: 480, height: 351 }, prep: show(['dlgRowSel', 'dlgTick'], ['dlgRadio']) + "document.getElementById('dlgAdd').style.opacity='1';" },
    // review pages in the matter (nav: Explore, no tab underline)
    { name: 'rvBuilder', nav: 'explore', body: rv(SNAP('R-builder.html'), false), extraCss: RV },
    { name: 'rvPanel0', nav: 'explore', body: rv(SNAP('R-panel0.html'), false), extraCss: RV },
    { name: 'rvPanel1', nav: 'explore', body: rv(SNAP('R-panel1.html'), false), extraCss: RV },
    { name: 'rvPanel2', nav: 'explore', body: rv(SNAP('R-panel2.html'), false), extraCss: RV },
    { name: 'rvPanel3', nav: 'explore', body: rv(SNAP('R-panel3.html'), false), extraCss: RV },
    { name: 'rvReady', nav: 'explore', body: rv(SNAP('R-ready.html'), false), extraCss: RV },
    { name: 'rvRunQ', nav: 'explore', body: rv(SNAP('R-running.html'), true), extraCss: RV },
    { name: 'rvRunT', nav: 'explore', body: rv(SNAP('R-running.html'), true), extraCss: RV, prep: show(['cellT1', 'cellT2'], ['cellQ1', 'cellQ2']) },
    { name: 'rvRunA', nav: 'explore', body: rv(SNAP('R-running.html'), true), extraCss: RV, prep: show(['cellA1', 'cellT2'], ['cellQ1', 'cellQ2']) + runState(1, 50) },
    { name: 'rvDone', nav: 'explore', body: rv(SNAP('R-done.html'), true), extraCss: RV },
    // matter chat
    { name: 'chGreet', nav: 'explore', body: chatFrame + SNAP('M-greet.html'), extraCss: CH },
    { name: 'chConv', nav: 'explore', body: chatFrame, extraCss: CH },
    { name: 'spThread', nav: null, h: 1150, body: '<div style="left:0;top:0;width:1024px;height:1150px">' + thread + '</div>', extraCss: CH + SPR + '#it_w0,#it_wmem,#it_wthk,#it_wana{display:none}', clip: { x: 0, y: 0, width: 1024, height: 1150 } },
    { name: 'spThreadWork', nav: null, h: 1150, body: '<div style="left:0;top:0;width:1024px;height:1150px">' + thread + '</div>', extraCss: CH + SPR + '[id^=it_]:not(#it_w0):not(#it_wmem):not(#it_wthk):not(#it_wana){display:none}', clip: { x: 0, y: 0, width: 1024, height: 1150 } },
    { name: 'spCbMid', nav: null, h: 140, body: cb.replace('id="cbMid" style="left:371px;top:519.9px', 'id="cbMid" style="left:0px;top:0px'), extraCss: CH + SPR + '#cbDock{display:none}.m50{box-shadow:none!important}', clip: { x: 0, y: 0, width: 768, height: 140 } },
    { name: 'spCbMidOn', nav: null, h: 140, body: cb.replace('id="cbMid" style="left:371px;top:519.9px', 'id="cbMid" style="left:0px;top:0px'), extraCss: CH + SPR + '#cbDock{display:none}.m50{box-shadow:none!important}#cbMidTy{display:block!important}#cbMidGo{opacity:1}#cbMidPh{visibility:hidden}', clip: { x: 0, y: 0, width: 768, height: 140 } },
    { name: 'spCbDock', nav: null, h: 140, body: cb.replace('id="cbDock" style="left:395px;top:614.9px', 'id="cbDock" style="left:0px;top:0px'), extraCss: CH + SPR + '#cbMid{display:none}.m50{box-shadow:none!important}', clip: { x: 0, y: 0, width: 720, height: 140 } },
  ];
  const r = await render(list.filter(s => !which || s.name === which));
  const old = existsSync(path.join(P, 'plates/rects.json')) ? JSON.parse(readFileSync(path.join(P, 'plates/rects.json'))) : {};
  Object.assign(old, r); writeFileSync(path.join(P, 'plates/rects.json'), JSON.stringify(old, null, 1)); writeFileSync(path.join(P, 'plates/rects.js'), 'window.RECTS_DATA=' + JSON.stringify(old) + ';');
}
