// Captures the Andri screens for Academy 4.2 as 2x plates plus element rects (app px, window 1440 x 860).
// Source: video-1.1/build/s42.html (from src/s42.src.html, built by build42.py), matched to staging captures of 9 Oct 2026.
// Plates are whole-window pictures; sprites are pieces drawn over them (tall scrolling content, floating UI with transparent corners).
import { chromium, SRC } from './pw.mjs'; import { writeFileSync } from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const IDS = ['riTl', 'riSim', 'tip', 'btnKB', 'cbox', 'go', 'disc', 'tl', 'tlBd', 'dv', 'dvX', 'mcard', 'thread', 'btnGo', 'btnRst', 'rl0', 'rl1', 'rl2', 'turnN', 'jp', 'cards5', 'dlgOk', 'dlg5', 'toast5', 'qp1', 'qp2', 'op1', 'op2', 'strip'];
const rects = ids => { const o = {}; for (const id of ids) { const e = document.getElementById(id); if (!e || !e.getClientRects().length) continue; const r = e.getBoundingClientRect(); if (r.width) o[id] = [r.left, r.top, r.width, r.height]; } return o; };
const out = {};
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 860 }, deviceScaleFactor: 2 });
pg.on('pageerror', e => console.log('ERR', String(e)));
async function state(js = '', vh = 860) {
  await pg.setViewportSize({ width: 1440, height: vh });
  await pg.goto(SRC); await pg.waitForFunction(() => window.READY === true);
  await pg.evaluate(js => { const S = window.STATE; S.base(); eval(js); }, js);
  await pg.waitForTimeout(60);
}
async function plate(name, js = '') { await state(js); await pg.screenshot({ path: path.join(HERE, name + '.png'), clip: { x: 0, y: 0, width: 1440, height: 860 }, omitBackground: true }); out[name] = await pg.evaluate(rects, IDS); }
// floating UI with rounded corners: captured alone, own shadow off, every parent transparent (known-issues 1); the shadow is drawn on canvas
async function float(name, id, js = '') {
  js += `;(()=>{const el=document.getElementById('${id}');
    document.querySelectorAll('#win *').forEach(e=>{ if (e!==el && !el.contains(e) && !e.contains(el)) e.style.visibility='hidden'; });
    for (let e = el.parentElement; e; e = e.parentElement) { e.style.background='transparent'; e.style.boxShadow='none'; e.style.border='0'; }
    document.documentElement.style.background='transparent'; document.body.style.background='transparent'; el.style.boxShadow='none';})()`;
  await state(js); const el = pg.locator('#' + id); await el.screenshot({ path: path.join(HERE, name + '.png'), omitBackground: true });
  const bb = await el.boundingBox(); out[name] = { box: [bb.x, bb.y, bb.width, bb.height], ...(await pg.evaluate(rects, IDS)) };
}
// tall content, captured whole with its own items' rects (relative to the sprite's top-left)
async function tall(name, id, js, ITEMS, vh = 7000) {
  await state(js + `;(()=>{const w=document.getElementById('win'); w.style.height='${vh}px'; w.style.overflow='visible';
    for (const s of ['.app','#scrMatter','#scrSim']) { const e=document.querySelector(s); if(e){e.style.height='${vh}px';} }
    for (const s of ['#mcard','#thread','#tl','#tlBd','#jp','.jp .bd5']) { const e=document.querySelector(s); if(e){e.style.overflow='visible'; e.style.bottom='auto'; e.style.height='${vh - 200}px';} }
    for (const s of ['#cbox','#disc','#fadebot','.tl .hd','.jp .ph5','#qp1','#qp2']) { const e=document.querySelector(s); if(e) e.style.display='none'; }
    document.querySelectorAll('#win *').forEach(e=>{ const t=document.getElementById('${id}'); if (e!==t && !t.contains(e) && !e.contains(t)) e.style.visibility='hidden'; });
    for (let e = document.getElementById('${id}').parentElement; e; e = e.parentElement) { e.style.background='transparent'; e.style.boxShadow='none'; e.style.border='0'; }
    document.documentElement.style.background='transparent'; document.body.style.background='transparent';})()`, vh);
  const el = pg.locator('#' + id); await el.screenshot({ path: path.join(HERE, name + '.png'), omitBackground: true });
  const bb = await el.boundingBox();
  out[name] = { box: [bb.x, bb.y, bb.width, bb.height], items: await pg.evaluate(([id, ids]) => { const t = document.getElementById(id).getBoundingClientRect(); const o = {};
    for (const i of ids) { const e = document.getElementById(i); if (!e || !e.getClientRects().length) continue;
      let a = e.getBoundingClientRect(), x0 = a.left, y0 = a.top, x1 = a.right, y1 = a.bottom;   // union with children (known-issues 5)
      for (const c of e.querySelectorAll('*')) { const r = c.getBoundingClientRect(); if (!r.width) continue; x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); }
      o[i] = [x0 - t.left, y0 - t.top, x1 - x0, y1 - y0]; } return o; }, [id, ITEMS]),
    // every direct row, in order (steps and answer blocks appear one row at a time)
    rows: await pg.evaluate(id => { const t = document.getElementById(id).getBoundingClientRect(); const row = e => { const r = e.getBoundingClientRect(); return [r.left - t.left, r.top - t.top, r.width, r.height]; };
      const o = []; for (const c of document.getElementById(id).children) { if (!c.getClientRects().length) continue;
        if (c.classList.contains('ans4') || c.classList.contains('op5')) for (const k of c.children) o.push(row(k)); else o.push(row(c)); } return o; }, id) };
}
const SIM = o => `S.sim(${JSON.stringify(o)})`;
// ---- matter page
await plate('mGreet');
await plate('mGreetTl', "S.hotRail('riTl','Open Timeline')");
await plate('mSplit', "S.timeline();document.getElementById('tlBody').style.visibility='hidden'");
await plate('mSplitHot', "S.timeline();document.getElementById('tlBody').style.visibility='hidden';S.hotRail('riTl','Open Timeline')");
await plate('mView', 'S.viewer()');
const NOBOX = ";for(const i of ['tin4','cbox','disc','fadebot'])document.getElementById(i).style.visibility='hidden'";
await plate('mChat', "S.docked()" + NOBOX);
await float('discDock', 'disc', 'S.docked()');
await plate('mChatSim', "S.docked()" + NOBOX + ";S.hotRail('riSim','Simulate')");
// timeline body (tall): with the + Add event button, and with the (empty) form
const TLI = ['chipJ', 'chipP', 'hOverview', 'hCore', 'hIssues', 'hParties', 'hProc', 'evs', 'ev0', 'ev3', 'ev5', 'ev6', 'ev7', 'addw', 'addB', 'aform', 'fTitle', 'fDate', 'btnSave'];
await tall('tlBodyA', 'tlBody', 'S.timeline()', TLI);
await tall('tlBodyF', 'tlBody', 'S.timeline({form:1})', TLI);
// the form states, drawn over tlBodyF: title focused and typed; title and date set (Save on)
await float('formT', 'aform', "S.timeline({form:1,title:1})");
await float('formD', 'aform', "S.timeline({form:1,title:1,date:1})");
await float('picker', 'dp', "S.timeline({form:1,title:1,picker:1})");
await float('pickerOn', 'dp', "S.timeline({form:1,title:1,picker:1,pick:1})");
out.formAt = await (async () => { await state("S.timeline({form:1})"); return pg.evaluate(() => { const b = document.getElementById('tlBody').getBoundingClientRect(), f = document.getElementById('aform').getBoundingClientRect(), d = document.getElementById('dp');
  return { aform: [f.left - b.left, f.top - b.top, f.width, f.height] }; }); })();
await (async () => { await state("S.timeline({form:1,title:1,picker:1})"); out.pickerAt = await pg.evaluate(() => { const b = document.getElementById('tlBody').getBoundingClientRect(), p = document.getElementById('dp').getBoundingClientRect(), d = document.getElementById('d9').getBoundingClientRect();
  return { dp: [p.left - b.left, p.top - b.top, p.width, p.height], d9: [d.left - b.left, d.top - b.top, d.width, d.height] }; }); })();
// chat box: typed states (middle of the greeting, and docked)
await float('cboxQ1', 'cbox', "S.typed('Review the key documents: what does each one prove?')");
await float('cboxQ2', 'cbox', "S.docked();S.typed('Write my hearing notes from this.')");
await float('cboxMid', 'cbox', '');
await float('cboxDock', 'cbox', 'S.docked()');
// thread (tall)
const THI = ['m1', 'u1', 's1a', 's1b', 's1c', 's1d', 's1e', 's1f', 'a1', 'a1p', 'a1s', 'a1t', 'x1', 'm2', 'u2', 's2a', 's2b', 'w2', 'qc', 'gap2', 's2c', 's2d', 'a2'];
await tall('thread4', 'tin4', 'S.docked()', THI);
// question picker pages (they take the chat box's place), plain and with the hovered option
await float('qp1', 'qp1', "S.docked();for(const i of ['cbox','disc'])document.getElementById(i).style.display='none';const q=document.getElementById('qp1');q.style.display='block';q.style.left='331px';q.style.bottom='18px'");
await float('qp1hot', 'qp1', "S.docked();for(const i of ['cbox','disc'])document.getElementById(i).style.display='none';const q=document.getElementById('qp1');q.style.display='block';q.style.left='331px';q.style.bottom='18px';document.getElementById('op1').classList.add('hot')");
await float('qp2', 'qp2', "S.docked();for(const i of ['cbox','disc'])document.getElementById(i).style.display='none';const q=document.getElementById('qp2');q.style.display='block';q.style.left='331px';q.style.bottom='18px'");
await float('qp2hot', 'qp2', "S.docked();for(const i of ['cbox','disc'])document.getElementById(i).style.display='none';const q=document.getElementById('qp2');q.style.display='block';q.style.left='331px';q.style.bottom='18px';document.getElementById('op2').classList.add('hot')");
// ---- Simulate
const START = { turn: 1, go: 'start', now: 0, who: 'judge', panel: 'ready', cards: 'start' };
await plate('sStart', SIM(START));
await plate('sGen', SIM({ turn: 1, go: 'think', now: 0, who: 'judge', panel: 'gen', act: 1, cards: 'start' }));
await plate('sJudge', SIM({ turn: 1, go: 'think', now: 0, who: 'judge', panel: 'turn', act: 1, cards: 'start' }) + ";document.getElementById('simTurn').style.visibility='hidden'");
await plate('sJudgeDone', SIM({ turn: 2, go: 'next', now: 0, who: 'judge', panel: 'turn', act: 'off', cards: 'start' }) + ";document.getElementById('simTurn').style.visibility='hidden'");
await plate('sClaim', SIM({ turn: 2, go: 'think', now: 1, who: 'claimant', panel: 'turn', act: 1, cards: 'afterJudge' }) + ";document.getElementById('simTurn').style.visibility='hidden'");
await plate('sClaimDone', SIM({ turn: 3, go: 'next', now: 1, who: 'claimant', panel: 'turn', act: 'off', cards: 'afterJudge' }) + ";document.getElementById('simTurn').style.visibility='hidden'");
const JI = ['recIss', 'opening', 'hIss', 'issList'];
await tall('judgeTurn', 'simTurn', SIM({ turn: 1, go: 'think', now: 0, who: 'judge', panel: 'turn', act: 1, cards: 'start' }), JI);
await tall('claimTurn', 'simTurn', SIM({ turn: 2, go: 'think', now: 1, who: 'claimant', panel: 'turn', act: 1, cards: 'afterJudge' }), []);
await float('dlg', 'dlg5', SIM({ turn: 2, go: 'think', now: 1, who: 'claimant', panel: 'turn', act: 1, cards: 'afterJudge', dlg: 1 }));
await float('toast1', 'toast5', SIM({ ...START, toast: 1 }));
await float('toast2', 'toast5', SIM({ ...START, toast: 2 }));
await b.close();
writeFileSync(path.join(HERE, 'rects.json'), JSON.stringify(out, null, 1));
writeFileSync(path.join(HERE, 'rects.js'), 'window.RECTS_DATA=' + JSON.stringify(out) + ';\n');
console.log('plates ok');
