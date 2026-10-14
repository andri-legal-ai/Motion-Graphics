// Captures the Andri screens for Academy 2.2 as 2x plates plus element rects.
// Source: the 2.2 rebuild of real Andri staging (video-1.1/build/s22.html, from src/s22.src.html),
// built on the 1.1 rebuild. Every text is copied from the staging run of 8 Oct 2026 (thread "Reply to Bowater Sykes").
// Output: plates/*.png and plates/rects.js (app pixels, window = 1440 x 860).
import { chromium, SRC } from './pw.mjs';
import { writeFileSync } from 'node:fs';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const IDS = ['btnUp', 'upd', 'updCh', 'updBtn', 'kbNew', 'kbNewSt', 'kbNewTg', 'kbNewOk', 'kbNewTag', 'cbox', 'go', 'atb', 'disc', 'mp', 'mpRow', 'dcard', 'dopt0', 'dopt1', 'dother',
  'railJobs', 'dpanel', 'lp1', 'lp2', 'toast', 'jpanel', 'jRow', 'jDl', 'mcard', 'thread', 'tin4', 'convPill'];
const RECTS = `(ids => { const o = {}; for (const id of ids) { const e = document.getElementById(id); if (!e) continue; const r = e.getBoundingClientRect(); if (r.width) o[id] = [r.left, r.top, r.width, r.height]; } return o; })`;
const ITEMS = ['a_stamp', 'a_ub', 'a_s0', 'a_s1', 'a_t1', 'a_reply', 'a_acts', 'a_np', 'a_ol', 'a_p1', 'a_p2', 'a_p3', 'a_p4', 'a_b1', 'a_b2', 'a_b3', 'a_b4', 'a_ask',
  'm_stamp', 'm_ub', 'm_s0', 'm_s1', 'm_wait', 'm_banner', 'm_s2', 'm_firm', 'm_reply', 'm_acts',
  'p_stamp', 'p_ub', 'p_t1', 'p_s0', 'p_s1', 'p_s2', 'p_s3', 'p_t2', 'p_s4', 'p_s5', 'p_s6', 'p_t3', 'p_s7', 'p_wait', 'p_banner', 'p_t4', 'p_s8', 'p_s9', 'p_t5', 'p_doc', 'p_reply'];
const out = {};
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 860 }, deviceScaleFactor: 2 });
const FULL = { x: 0, y: 0, width: 1440, height: 860 };
async function state(js = '', vh = 860) {
  await pg.setViewportSize({ width: 1440, height: vh });
  await pg.goto(SRC); await pg.waitForFunction('window.READY===true');
  await pg.evaluate(`(()=>{const S=STATE;S.base();${js}})()`);
}
async function plate(name, js = '') { await state(js); await pg.screenshot({ path: path.join(HERE, name + '.png'), clip: FULL, omitBackground: true }); out[name] = await pg.evaluate(`${RECTS}(${JSON.stringify(IDS)})`); }
// Floating UI (popups, cards, dialogs, side panels, toasts) is captured ALONE: everything else hidden, backgrounds
// transparent, CSS shadow off. Its rounded corners then stay transparent, and the canvas draws the shadow (floatShadow).
// Captured in place instead, the corners keep whatever sat behind it, and a CSS shadow is cut off at the box edge.
const FLOAT = new Set(['mp0', 'mp1_4', 'mp1_5', 'mp1_6', 'fcard', 'fcardHot', 'q2', 'q2Hot', 'dpanel', 'jpanel', 'jpanelHot', 'toast', 'upd0', 'upd1', 'upd2']);
async function sprite(name, sel, js = '') {
  if (FLOAT.has(name)) { const id = sel.replace('#', '');
    js += `;document.querySelectorAll('#win *').forEach(e=>{ if (!e.closest('#${id}') && !e.contains(document.getElementById('${id}'))) e.style.visibility='hidden'; });
      for (const e of [document.documentElement, document.body, document.getElementById('stage'), document.getElementById('win'), document.querySelector('#win .app'), document.getElementById('scrKB'), document.getElementById('scrMatter')]) if (e) e.style.background='transparent';
      document.getElementById('${id}').style.boxShadow='none';
      for (let e = document.getElementById('${id}').parentElement; e; e = e.parentElement) { e.style.background = 'transparent'; e.style.boxShadow = 'none'; }`; }
  await state(js); const el = pg.locator(sel); await el.screenshot({ path: path.join(HERE, name + '.png'), omitBackground: true });
  const bb = await el.boundingBox(); out[name] = { box: [bb.x, bb.y, bb.width, bb.height], ...(await pg.evaluate(`${RECTS}(${JSON.stringify(IDS)})`)) };
}
const hideChat = "for (const id of ['thread','fadebot','cbox','disc']) document.getElementById(id).style.visibility='hidden';";
// knowledge base and the upload dialog
await plate('kb0', "S.kb('before',null)");
await plate('kbVal', "S.kb('val',null)");
await plate('kbDone', "S.kb('done',null)");
const ALONE = (id) => `document.querySelectorAll('#win *').forEach(e=>{ if (!e.closest('#${id}') && !e.contains(document.getElementById('${id}'))) e.style.visibility='hidden'; });
  for (const e of [document.getElementById('win'), document.querySelector('#win .app'), document.getElementById('scrKB')]) if (e) e.style.background='transparent';`;
for (const d of [0, 1, 2]) await sprite('upd' + d, '#upd', `S.kb('${d === 2 ? 'val' : 'before'}',${d})`);
// chat: greeting (chat box in the middle), docked frame, narrow frame
await plate('greet');
await plate('chat', 'S.docked();' + hideChat);
await plate('split', 'S.docked();S.narrow();' + hideChat);
await sprite('cboxMidOn', '#cbox', 'S.lines(1,true)');
await sprite('cboxMid2', '#cbox', 'S.lines(2,true);document.getElementById(\'disc\').style.visibility=\'hidden\';');
await sprite('cboxDock', '#cbox', 'S.docked()');
for (const n of [1, 2, 3, 4, 5, 6]) await sprite('cboxDock' + n, '#cbox', `S.docked();S.lines(${n},true);document.getElementById('disc').style.visibility='hidden';`);
await sprite('cboxSplit', '#cbox', 'S.docked();S.narrow()');
await sprite('disc', '#disc', 'S.docked()');
await sprite('discSplit', '#disc', 'S.docked();S.narrow()');
// @ lists (their letter over the middle box, our settlement letter over the docked box)
await sprite('mp0', '#mp', 'S.lines(1,true);S.mpAt(0)');
for (const n of [4, 5, 6]) await sprite('mp1_' + n, '#mp', `S.docked();S.lines(${n},true);S.mpAt(1)`);
// question cards: the firm memory confirmation, and the question about the offer (docked, wide)
await sprite('fcard', '#dcard', "S.docked();S.cardAt('f',-1)");
await sprite('fcardHot', '#dcard', "S.docked();S.cardAt('f',0)");
await sprite('q2', '#dcard', "S.docked();S.cardAt('q',-1)");
await sprite('q2Hot', '#dcard', "S.docked();S.cardAt('q',0)");
// side panels and the notification
await sprite('dpanel', '#dpanel', "S.docked();S.narrow();document.getElementById('dpanel').style.display='block'");
await sprite('jpanel', '#jpanel', "S.docked();S.narrow();document.getElementById('jpanel').style.display='block'");
await sprite('jpanelHot', '#jpanel', "S.docked();S.narrow();document.getElementById('jpanel').style.display='block';document.getElementById('jRow').classList.add('hot')");
await sprite('toast', '#toast', "S.docked();document.getElementById('toast').style.display='block'");
// the thread: tall sprites with item rects relative to the sprite, one per visible set
await state('S.docked()'); out.tinDock = await pg.evaluate(`${RECTS}(['tin4','thread','mcard'])`);
await state('S.docked();S.narrow()'); out.tinSplit = await pg.evaluate(`${RECTS}(['tin4','thread','mcard'])`);
const variants = {
  thA: ['', ['m_s2', 'm_reply', 'm_acts', ...ITEMS.filter(i => i.startsWith('p_'))]],
  thB: ['', ['m_wait', 'm_banner', 'p_t4', 'p_s8', 'p_s9', 'p_t5', 'p_doc', 'p_reply']],
  thC: ['', ['m_wait', 'm_banner', 'p_wait', 'p_banner']],
  thN: ['S.narrow();', ['m_wait', 'm_banner', 'p_wait', 'p_banner']],
};
for (const [nm, [pre, hidden]] of Object.entries(variants)) {
  await state('S.docked();' + pre + hidden.map(h => `document.getElementById('${h}').style.display='none';`).join('') +
    `for (const id of ['cbox','disc','fadebot']) document.getElementById(id).style.display='none';
     const win=document.getElementById('win'); win.style.overflow='visible'; win.style.height='6000px';
     const mc=document.getElementById('mcard'); mc.style.overflow='visible'; mc.style.bottom='auto'; mc.style.height='5900px';
     const th=document.getElementById('thread'); th.style.overflow='visible'; th.style.bottom='auto'; th.style.height='5800px';`, 6000);
  const el = pg.locator('#tin4'); await el.screenshot({ path: path.join(HERE, nm + '.png'), omitBackground: true });
  const bb = await el.boundingBox();
  out[nm] = { box: [bb.x, bb.y, bb.width, bb.height], items: await pg.evaluate(`(ids=>{const t=document.getElementById('tin4').getBoundingClientRect();const o={};
    for(const id of ids){const e=document.getElementById(id); if(!e||e.offsetParent===null) continue; const r=e.getBoundingClientRect(); o[id]=[r.left-t.left,r.top-t.top,r.width,r.height];} return o;})(${JSON.stringify(ITEMS)})`) };
}
await b.close();
writeFileSync(path.join(HERE, 'rects.json'), JSON.stringify(out, null, 1));
writeFileSync(path.join(HERE, 'rects.js'), 'window.RECTS_DATA = ' + JSON.stringify(out) + ';\n');
console.log('plates:', Object.keys(out).length);
