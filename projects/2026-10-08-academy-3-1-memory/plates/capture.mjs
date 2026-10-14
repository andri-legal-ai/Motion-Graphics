// Captures the Andri screens for Academy 3.1 as 2x plates plus element rects (app px, window 1440 x 860).
// Source: video-1.1/build/s31.html (from src/s31.src.html, built by build31.py), matched to staging captures of 8 Oct 2026.
import { chromium, SRC } from './pw.mjs'; import { writeFileSync } from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const IDS = ['cbox', 'modeLbl', 'go', 'disc', 'hBrain', 'sliders', 'nv_brain', 'nv_msg', 'g_pers', 'g_firm', 'g_mat', 'g_nair', 'f_rem', 'f_house', 'f_work', 'btEdit3', 'btDel3', 'btnNewFile', 'pmod', 'g_jobs'];
const rects = ids => { const o = {}; for (const id of ids) { const e = document.getElementById(id); if (!e) continue; const r = e.getBoundingClientRect(); if (r.width) o[id] = [r.left, r.top, r.width, r.height]; } return o; };
const out = {};
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 860 }, deviceScaleFactor: 2 });
pg.on('pageerror', e => console.log('ERR', String(e)));
async function state(js = '', vh = 860) {
  await pg.setViewportSize({ width: 1440, height: vh });
  await pg.goto(SRC); await pg.waitForFunction(() => window.READY === true);
  await pg.evaluate(js => { const S = window.STATE; S.base(); document.querySelector('.nav .rt > .ic').id = 'sliders'; eval(js); }, js);
}
async function plate(name, js = '') { await state(js); await pg.screenshot({ path: path.join(HERE, name + '.png'), clip: { x: 0, y: 0, width: 1440, height: 860 }, omitBackground: true }); out[name] = await pg.evaluate(rects, IDS); }
// floating UI with rounded corners: captured alone, own shadow off, so the corners come out transparent (known-issues #1); the shadow is drawn on canvas
const FLOAT = new Set(['cboxMidOn', 'cboxDock', 'cboxDockOn', 'pAns', 'pLoad', 'pMem', 'pJobs', 'pRem']);
async function sprite(name, sel, js = '') {
  if (FLOAT.has(name)) { const id = sel.replace('#', '');
    js += `;document.querySelectorAll('#win *').forEach(e=>{ if (!e.closest('#${id}') && !e.contains(document.getElementById('${id}'))) e.style.visibility='hidden'; });
      for (const e of [document.documentElement, document.body, document.getElementById('stage'), document.getElementById('win'), document.querySelector('#win .app'), document.getElementById('scrMatter')]) if (e) e.style.background='transparent';
      document.getElementById('${id}').style.boxShadow='none';
      for (let e = document.getElementById('${id}').parentElement; e; e = e.parentElement) { e.style.background = 'transparent'; e.style.boxShadow = 'none'; }`; }
  await state(js); const el = pg.locator(sel); await el.screenshot({ path: path.join(HERE, name + '.png'), omitBackground: true }); const bb = await el.boundingBox(); out[name] = { box: [bb.x, bb.y, bb.width, bb.height], ...(await pg.evaluate(rects, IDS)) }; }
const hide = "for (const id of ['thread','fadebot','cbox','disc']) document.getElementById(id).style.visibility='hidden';";
await plate('m1');                                         // greeting, chat box in the middle
await plate('chat', 'S.docked();' + hide);                // conversation frame, empty
await sprite('cboxMidOn', '#cbox', 'S.typed()');
await sprite('cboxDock', '#cbox', 'S.docked()');
await sprite('cboxDockOn', '#cbox', 'S.docked();S.typed()');
await sprite('disc', '#disc', 'S.docked()');
// the conversation: tall sprite, finished rows; the "Accessing memories" working rows separately
const ITEMS = ['m_a', 'u_a', 's_a', 'a_a', 'x_a', 'm_b', 'u_b', 's_b', 'a_b', 'x_b', 'm_c', 'u_c', 's_c', 'a_c', 'x_c', 'w_a'];
for (const [nm, pre] of [['thread3', "for (const i of ['w_a','w_b','w_c']) document.getElementById(i).style.display='none';"],
  ['work3', "for (const i of ['s_a','s_b','s_c']) document.getElementById(i).style.display='none';"]]) {
  await state('S.thread3();' + pre + `for (const id of ['cbox','disc','fadebot']) document.getElementById(id).style.display='none';
    const win=document.getElementById('win'); win.style.overflow='visible'; win.style.height='1700px';
    const mc=document.getElementById('mcard'); mc.style.overflow='visible'; mc.style.bottom='auto'; mc.style.height='1600px';
    const th=document.getElementById('thread'); th.style.overflow='visible'; th.style.bottom='auto'; th.style.height='1500px';`, 1700);
  const el = pg.locator('#tin3'); await el.screenshot({ path: path.join(HERE, nm + '.png'), omitBackground: true });
  const bb = await el.boundingBox();
  out[nm] = { box: [bb.x, bb.y, bb.width, bb.height], items: await pg.evaluate(ids => { const t = document.getElementById('tin3').getBoundingClientRect(); const o = {};
    for (const id of ids.concat(['w_b', 'w_c'])) { const e = document.getElementById(id); if (!e || e.style.display === 'none') continue; // union with every child: the expand button and the bookmark/x circles stick out of their row
    let a = e.getBoundingClientRect(), x0 = a.left, y0 = a.top, x1 = a.right, y1 = a.bottom;
    for (const c of e.querySelectorAll('*')) { const r = c.getBoundingClientRect(); if (!r.width) continue; x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); }
    x0 -= 2; y0 -= 2; x1 += 2; y1 += 2; o[id] = [x0 - t.left, y0 - t.top, x1 - x0, y1 - y0]; } return o; }, ITEMS) };
}
// Personalisation panel (sprites of the panel only; the dimmed backdrop is drawn on canvas)
await sprite('pAns', '#pmod', "S.modal('ans')");
await sprite('pLoad', '#pmod', "S.modal('mem',{loading:true})");
await sprite('pMem', '#pmod', "S.modal('mem')");
await sprite('pJobs', '#pmod', "S.modal('mem',{jobs:true})");
await sprite('pRem', '#pmod', "S.modal('mem',{file:'rem',jobs:true})");
await b.close();
writeFileSync(path.join(HERE, 'rects.json'), JSON.stringify(out, null, 1));
writeFileSync(path.join(HERE, 'rects.js'), 'window.RECTS_DATA=' + JSON.stringify(out) + ';\n');
console.log('plates ok');
