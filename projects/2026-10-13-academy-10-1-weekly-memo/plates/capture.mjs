// Captures the Andri screens for Academy 10.2 as 2x plates plus control rects (app px, window 1440 x 860).
// Source: DOM snapshots of Andri staging taken 12 Oct 2026 in my own tabs (staging-snapshot/raw), localised by
// staging-snapshot/localize.py (Aldridge Vine, AF / Adam Frith, "(Academy 10.2)" dropped, matter "Academy 10.2" shown as Nair).
//   node plates/capture.mjs [regex]
// Builder plates hide the React Flow canvas content (nodes, edges, dots): app.js draws those itself from the node sprites
// captured here, so nodes can be dropped, dragged and joined as in staging. Popovers are put back under their trigger
// (their position was frozen for staging's 1920 px window), CSS animations are finished, toasts are captured as sprites.
import { chromium } from './pw.mjs';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
const P = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SS = path.join(P, 'staging-snapshot'), OUT = path.join(P, 'plates');
const W = 1440, H = 860;
const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const RJ = path.join(OUT, 'rects.json');
const RECTS = existsSync(RJ) ? JSON.parse(readFileSync(RJ, 'utf8')) : {};

// plate name -> [snapshot, options]
//  canvas: 'hide' (default for b_*), 'keep'
//  fix: extra page script run before the shot
const PLATES = {
  aMat: ['a_matters', { fix: 'onlyNair' }], aExp: ['a_explore_wf', { fix: 'onlyNair' }],
  wEmpty: ['w_list', { fix: 'emptyState' }], wList: ['w_list', {}],
  bChoose: ['b_choose', {}], bChooseH: ['b_choose_hover', {}],
  lTop: ['b_trig_list', {}], lHovRA: ['b_list_hover_ra', {}], lMid: ['b_list_mid', {}], lHovPA: ['b_list_hover_pa', {}], lHovSE: ['b_list_hover_se', {}],
  tCfg: ['b_trig_cfg', {}], tInbox: ['b_trig_inbox', {}],
  rCfg: ['b_ra_cfg', {}], rDD: ['b_ra_dd', {}], rPick: ['b_ra_picked', {}],
  dType0: ['b_cd_typed', { fix: 'clearTA0' }], dTypeP: ['b_cd_typed', { fix: 'emptyTA0' }], dType: ['b_cd_typed', {}], dTplDD: ['b_cd_tpl_dd', {}], dTpl: ['b_cd_tpl', {}], dAttDD: ['b_cd_att_dd', {}], dAtt: ['b_cd_att', {}],
  pCfg: ['b_pa_cfg', {}], pWhoDD: ['b_pa_who_dd', {}], pWho: ['b_pa_who', {}], pApprDD: ['b_pa_appr_dd', {}], pAppr: ['b_pa_appr', {}], pAppr0: ['b_pa_typed', { fix: 'clearTA1' }], pTyped: ['b_pa_typed', {}],
  sCfg: ['b_se_cfg', {}], sOut: ['b_se_outlook', {}], sToDD: ['b_se_to_dd', {}], sTo: ['b_se_to', {}],
  sMidP: ['b_se_mid0', {}], sMid0: ['b_se_mid1', { fix: 'clearSubjBody' }], sMid1: ['b_se_mid1', {}], sAttDD: ['b_se_att_dd', {}], sAtt: ['b_se_att', {}],
  sDone: ['b_se_done', {}], sNoPanel: ['b_se_nopanel', {}],
  tEdit: ['b_title_edit', { fix: 'focusTitle' }], tEdit0: ['b_title_typed', { fix: 'clearTitle' }], tTyped: ['b_title_typed', { fix: 'focusTitle' }],
  pEdit: ['p_edit', { canvas: 'keep', fix: 'fit' }],
  pub1a: ['pub1_300', { canvas: 'keep' }], pub1: ['pub1_6000', { canvas: 'keep', fix: 'v1fit', wait: 6500 }], pub2: ['pub2_4500', { canvas: 'keep', fix: 'v1fit', wait: 5000 }],
  pFull: ['p_after', { canvas: 'keep', fix: 'v1fit' }], wListPub: ['w_list', {}],
  mList: ['m_list', {}], mListH: ['m_list_hover', {}], mCfg0: ['m_cfg0', {}], mCfg0H: ['m_cfg0_hover', {}], mCfg1: ['m_cfg1', {}],
  mCfg2_0: ['m_cfg2', { fix: 'clearFilter' }], mCfg2: ['m_cfg2', {}], mCfg3: ['m_cfg3', {}],
};

// node sprites: [name, snapshot, node index by text, keep selection?]
const NODES = [
  ['nTrig', 'b_se_done', 'Email received'], ['nTrigSel', 'b_trig_cfg', 'Email received'],
  ['nRun0', 'b_ra_joined', 'Run Action'], ['nRun0Sel', 'b_ra_cfg', 'Run Action'], ['nRun', 'b_se_done', 'Run Action'],
  ['nDoc0', 'b_cd_added', 'Create Document'], ['nDoc0Sel', 'b_cd_typed', 'Create Document'], ['nDoc', 'b_se_done', 'Create Document'],
  ['nPa0', 'b_pa_added', 'Pause / Approval'], ['nPa0Sel', 'b_pa_cfg', 'Pause / Approval'], ['nPa', 'b_se_done', 'Pause / Approval'],
  ['nSe0', 'b_se_added', 'Send Email'], ['nSe0Sel', 'b_se_cfg', 'Send Email'], ['nSe', 'b_se_nopanel', 'Send Email'],
];

const FIXES = {
  // the matters list shows only the demo matter (my own and other sessions' test matters are left out)
  // (my own "Academy 10.2" matter reads "Nair v Calderdale Logistics" after localising, created 12 Oct: removed too)
  onlyNair: () => { document.querySelectorAll('tbody tr').forEach(tr => { if (!/Nair v Calderdale/.test(tr.innerText) || /12 Oct 2026/.test(tr.innerText)) tr.remove(); }); },
  // the empty Workflows page as staging showed it before my workflow existed (12 Oct, first visit): text and layout from that page
  emptyState: () => {
    const bar = [...document.querySelectorAll('button')].find(b => /^All/.test((b.innerText || '').trim()));
    if (bar) bar.parentElement.style.opacity = '0';                       // the All / Personal / Company tabs
    const search = document.querySelector('input[placeholder="Search workflows..."]'); if (search) search.closest('label').style.opacity = '0';
    // the list card: the deepest white box holding my workflow's row
    const card = [...document.querySelectorAll('div')].filter(e => (e.innerText || '').includes('Check and reply') && e.getBoundingClientRect().height > 450).pop();
    if (!card) return;
    card.innerHTML = `<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Rethink Sans';color:#241e19">
      <div style="width:36px;height:36px;border-radius:10px;background:#f2efe9;display:flex;align-items:center;justify-content:center;margin-bottom:14px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#241e19" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg></div>
      <div style="font-size:13.5px;font-weight:600;margin-bottom:10px">Automate your legal workflows</div>
      <div style="font-size:13px;line-height:19px;color:#494746;text-align:center;width:300px;margin-bottom:16px">Build reusable automations with triggers, analysis, and document generation. Then activate them in any matter.</div>
      <div style="height:31px;padding:0 13px;border-radius:8px;background:#f8e37c;display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:500;margin-bottom:40px"><span style="font-size:15px;line-height:1">+</span> Create your first workflow</div>
      <div style="display:flex;border:1px solid rgba(204,193,178,.8);border-radius:10px;width:560px;margin-bottom:40px">
        ${[['Email Processing', 'Process incoming emails, extract attachments, run analysis, and send a summary back to you.'], ['Document Review', 'Run incoming documents through a review checklist and flag key findings for your attention.'], ['Deadline Tracking', 'Trigger on critical dates to generate preparation documents and keep your team aligned.']]
          .map(([a, b], i) => `<div style="flex:1;padding:16px;${i ? 'border-left:1px solid rgba(204,193,178,.8);' : ''}"><div style="font-size:12.5px;font-weight:600;margin-bottom:8px">${a}</div><div style="font-size:11.5px;line-height:17.5px;color:#494746">${b}</div></div>`).join('')}
      </div>
      <div style="font-size:11.5px;color:#494746">Workflows are templates. Build once, activate in any matter.</div></div>`;
  },
  clearTA0: () => { const t = [...document.querySelectorAll('aside textarea')][0]; t.value = ''; t.textContent = ''; t.placeholder = ''; },
  clearTA1: () => { const t = [...document.querySelectorAll('aside textarea')].find(x => x.value.startsWith('Please check')); t.value = ''; t.textContent = ''; t.placeholder = ''; },
  clearSubjBody: () => { const s = [...document.querySelectorAll('aside input')].find(x => x.value.startsWith('Re:')); s.value = ''; s.setAttribute('value', ''); s.placeholder = '';
    const b = [...document.querySelectorAll('aside textarea')].find(x => x.value.startsWith('Dear')); b.value = ''; b.textContent = ''; b.placeholder = ''; },
  // the name field is a contenteditable span; while editing it has its focus style (focus:border-foreground/50 focus:bg-card)
  focusTitle: () => { const e = document.querySelector('[aria-label="Edit workflow name"]'); e.style.borderColor = 'rgba(36,30,25,.5)'; e.style.background = getComputedStyle(document.querySelector('aside[data-pane=workflows]')).backgroundColor; },
  clearTitle: () => { const e = document.querySelector('[aria-label="Edit workflow name"]'); e.textContent = '\u200b'; const f = document.querySelector('[aria-label="Edit workflow name"]'); f.style.borderColor = 'rgba(36,30,25,.5)'; f.style.background = getComputedStyle(document.querySelector('aside[data-pane=workflows]')).backgroundColor; f.style.minWidth = '40px'; },
  clearFilter: () => { const i = [...document.querySelectorAll('[role=dialog] input')].find(x => x.value.includes('priya')); i.value = ''; i.setAttribute('value', ''); i.placeholder = '';
    [...document.querySelectorAll('[role=dialog] *')].forEach(e => { if (e.children.length === 0 && e.textContent.includes('priya.nair@outlook.com') && e.tagName !== 'INPUT') e.textContent = e.textContent.replace(/"?priya\.nair@outlook\.com"?/, ''); }); },
  // React Flow's fit view, redone for the 860 px window (padding 0.1 as React Flow's default)
  fit: () => { const vp = document.querySelector('.react-flow__viewport'), pane = document.querySelector('.react-flow').getBoundingClientRect();
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    document.querySelectorAll('.react-flow__node').forEach(n => { const m = n.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/); const x = +m[1], y = +m[2]; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + n.offsetWidth); y1 = Math.max(y1, y + n.offsetHeight); });
    const bw = x1 - x0, bh = y1 - y0, z = Math.min(pane.width / (bw * 1.2), pane.height / (bh * 1.2), 2);
    vp.style.transform = `translate(${pane.width / 2 - (x0 + bw / 2) * z}px, ${pane.height / 2 - (y0 + bh / 2) * z}px) scale(${z})`;
    window.__fitZ = z; },
  v1fit: 'v1+fit',
  // the field as it first opens: empty, with the app's own placeholder
  emptyTA0: () => { const t = [...document.querySelectorAll('aside textarea')][0]; t.value = ''; t.textContent = ''; },
  // I published twice (the second time to capture the explainer); the video's workflow is published once
  v1: () => { document.querySelectorAll('body *').forEach(e => { if (e.children.length === 0 && e.textContent.trim() === 'v2') e.textContent = 'v1'; }); },
};

async function prep(p, opt, name) {
  if (opt.wait) await p.waitForTimeout(opt.wait);   // let the app's own animation play to its end state
  await p.evaluate(({ canvas, isBuilder, wait }) => {
    if (!wait) document.getAnimations().forEach(a => { try { a.finish(); } catch (e) {} });
    document.querySelectorAll('[data-sonner-toaster]').forEach(e => e.style.display = 'none');
    document.querySelectorAll('[data-snap-focus]').forEach(e => e.removeAttribute('data-snap-focus'));
    // popovers back under (or over) their trigger, with the gap staging had
    document.querySelectorAll('[data-radix-popper-content-wrapper][data-snap-rect]').forEach(w => {
      const [px, py, pw, ph] = w.dataset.snapRect.split(',').map(Number);
      const trig = [...document.querySelectorAll('[aria-expanded=true][data-snap-rect]')].filter(e => !w.contains(e)).map(e => ({ e, r: e.dataset.snapRect.split(',').map(Number) }))
        .sort((a, b) => Math.hypot(a.r[0] - px, a.r[1] + a.r[3] - py) - Math.hypot(b.r[0] - px, b.r[1] + b.r[3] - py))[0];
      if (!trig) return;
      const now = trig.e.getBoundingClientRect(); const [tx, ty, tw, th] = trig.r;
      const below = py >= ty + th - 2, gap = below ? py - (ty + th) : ty - (py + ph);
      let ny = below ? now.bottom + gap : now.y - gap - ph;
      // the 860 px window is shorter than staging's: like radix, flip a list that would run off the bottom
      if (below && ny + ph > innerHeight - 8) ny = now.y - gap - ph;
      const nx = now.x + (px - tx);
      w.style.transform = `translate(${nx}px, ${ny}px)`;
    });
    if (isBuilder && canvas !== 'keep') {
      document.querySelectorAll('.react-flow__nodes, .react-flow__edges, .react-flow__edgelabel-renderer, .react-flow__background, .react-flow__connectionline').forEach(e => e.style.display = 'none');
    }
  }, { canvas: opt.canvas, wait: !!opt.wait, isBuilder: !!(await p.$('.react-flow')) });
  for (const f of (opt.fix ? (typeof FIXES[opt.fix] === 'string' ? FIXES[opt.fix].split('+') : [opt.fix]) : [])) await p.evaluate(FIXES[f]);
  await p.waitForTimeout(150);
}

// rects of every control a cursor or ring can aim at, keyed by its text (first match wins; '#n' suffix for repeats)
async function rects(p) {
  return p.evaluate(() => {
    const o = {}; const put = (k, r) => { k = k.replace(/\s+/g, ' ').trim().slice(0, 60); if (!k || r.width < 2 || r.height < 2) return; let key = k, i = 2; while (o[key]) key = k + '#' + i++; o[key] = [r.x, r.y, r.width, r.height].map(v => Math.round(v * 10) / 10); };
    const vis = e => { const s = getComputedStyle(e); return s.visibility !== 'hidden' && s.display !== 'none' && e.getClientRects().length; };
    document.querySelectorAll('button, a, [role=option], [role=menuitem], [role=radio], label, h1, h2, h3, [role=tab], th').forEach(e => { if (vis(e)) put(e.innerText || e.getAttribute('aria-label') || '', e.getBoundingClientRect()); });
    document.querySelectorAll('input, textarea').forEach(e => { if (!vis(e)) return; const s = getComputedStyle(e); const r = e.getBoundingClientRect();
      put('field:' + (e.placeholder || e.value || e.name || e.type), r); o['font:' + (e.placeholder || e.value || e.type).slice(0, 40)] = [parseFloat(s.fontSize), parseFloat(s.paddingLeft), parseFloat(s.paddingTop), parseFloat(s.lineHeight) || 0, s.fontWeight]; });
    // leaf texts (labels, list rows, chips)
    document.querySelectorAll('body *').forEach(e => { if (e.children.length === 0 && vis(e)) { const t = e.textContent.trim(); if (t && t.length < 70) put('t:' + t, e.getBoundingClientRect()); } });
    const pane = document.querySelector('.react-flow'); if (pane) { const r = pane.getBoundingClientRect(); o.pane = [r.x, r.y, r.width, r.height]; }
    const aside = document.querySelector('aside[data-pane=workflows] [role=complementary], aside[data-pane=workflows] aside'); if (aside) { const r = aside.getBoundingClientRect(); o.panel = [r.x, r.y, r.width, r.height]; }
    const dlg = document.querySelector('[role=dialog]'); if (dlg) { const r = dlg.getBoundingClientRect(); o.dialog = [r.x, r.y, r.width, r.height]; }
    // line boxes of phrases the voice reads (for the yellow highlight sweep)
    for (const ph of ['subject, sender, body text, and all attachments', 'If the trigger was an email with attachments, those files are bundled and passed to the action automatically.']) {
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
      while ((n = tw.nextNode())) { const i = n.textContent.indexOf(ph); if (i < 0) continue; const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + ph.length);
        const vis = n.parentElement.getClientRects().length && getComputedStyle(n.parentElement).visibility !== 'hidden'; if (!vis) continue;
        const lines = []; for (const b of r.getClientRects()) { const l = lines.find(x => Math.abs(x[1] - b.y) < 3); if (l) { const x1 = Math.max(l[0] + l[2], b.right); l[0] = Math.min(l[0], b.x); l[2] = x1 - l[0]; } else lines.push([b.x, b.y, b.width, b.height]); }
        o['phrase:' + ph.slice(0, 20)] = lines.map(l => l.map(v => Math.round(v * 10) / 10)); break; }
    }
    return o;
  });
}

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const url = s => 'file://' + path.join(SS, 'L_' + s + '.html');
for (const [name, [snap, opt]] of Object.entries(PLATES)) {
  if (only && !only.test(name)) continue;
  await p.goto(url(snap), { waitUntil: 'networkidle' }); await p.waitForTimeout(300);
  await prep(p, opt, name);
  await p.screenshot({ path: path.join(OUT, name + '.png') });
  RECTS[name] = await rects(p);
  console.log('plate', name);
}

// the publish explainer animates (dialog in, then a 4.5 s scripted illustration): frames every 100 ms, as staging plays it
if (!only || only.test('seq')) {
  mkdirSync(path.join(OUT, 'seq'), { recursive: true });
  for (const [nm, snap] of [['pub1', 'pub1_6000'], ['pub2', 'pub2_4500']]) {
    for (let t = 0; t <= 4400; t += 100) {
      await p.goto(url(snap), { waitUntil: 'networkidle' });
      for (const f of ['v1', 'fit']) await p.evaluate(FIXES[f]);
      await p.evaluate(t => { document.querySelectorAll('[data-sonner-toaster]').forEach(e => e.style.display = 'none'); document.getAnimations().forEach(a => { a.pause(); a.currentTime = t; }); }, t);
      await p.waitForTimeout(60);
      await p.screenshot({ path: path.join(OUT, 'seq', `${nm}_${String(t / 100).padStart(2, '0')}.png`) });
    }
    console.log('seq', nm);
  }
}

// node sprites, edge label and toasts: alone on a transparent page, React Flow zoom 1, shadows off (drawn in app.js)
const p3 = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 3 })).newPage();
RECTS.nodes = RECTS.nodes || {};
for (const [name, snap, text] of NODES) {
  if (only && !only.test(name)) continue;
  await p3.goto(url(snap), { waitUntil: 'networkidle' }); await p3.waitForTimeout(300);
  const info = await p3.evaluate(text => {
    document.getAnimations().forEach(a => { try { a.finish(); } catch (e) {} });
    const vp = document.querySelector('.react-flow__viewport'); vp.style.transform = 'translate(0px, 0px) scale(1)';
    const node = [...document.querySelectorAll('.react-flow__node')].find(n => n.innerText.split('\n').map(s => s.trim()).includes(text));
    document.querySelectorAll('.react-flow__node').forEach(n => { if (n !== node) n.style.visibility = 'hidden'; });
    node.style.transform = 'translate(60px, 60px)'; node.style.zIndex = 1000;
    // everything else transparent
    const keep = new Set(); let e = node; while (e) { keep.add(e); e = e.parentElement; }
    document.querySelectorAll('body *').forEach(x => { if (!keep.has(x) && !node.contains(x)) x.style.visibility = 'hidden'; else if (!node.contains(x) && x !== node) { x.style.background = 'transparent'; x.style.boxShadow = 'none'; x.style.border = '0'; } });
    document.documentElement.style.background = 'transparent'; document.body.style.background = 'transparent';
    const card = node.firstElementChild; const cs = getComputedStyle(card);
    const shadow = cs.boxShadow; card.style.boxShadow = 'none';
    // union of the node and everything sticking out of it (handles, delete button)
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; [node, ...node.querySelectorAll('*')].forEach(c => { const r = c.getBoundingClientRect(); if (!r.width) return; x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); });
    const nr = node.getBoundingClientRect(), cr = card.getBoundingClientRect();
    // everything relative to the node's own top-left (zoom 1)
    return { clip: [x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4], nodeXY: [nr.x, nr.y], node: [0, 0, nr.width, nr.height], card: [cr.x - nr.x, cr.y - nr.y, cr.width, cr.height], radius: cs.borderRadius, shadow,
      handles: [...node.querySelectorAll('.react-flow__handle')].map(h => { const r = h.getBoundingClientRect(); return [h.dataset.handlepos || h.className.match(/react-flow__handle-(top|bottom)/)?.[1], (h.dataset.handleid || ''), r.x + r.width / 2 - nr.x, r.y + r.height / 2 - nr.y]; }) };
  }, text);
  const [x, y, w, h] = info.clip;
  await p3.screenshot({ path: path.join(OUT, name + '.png'), clip: { x, y, width: w, height: h }, omitBackground: true });
  RECTS.nodes[name] = { ...info, origin: [x - info.nodeXY[0], y - info.nodeXY[1]] };   // origin: sprite top-left relative to the node's top-left
  console.log('node', name, info.node.slice(2), info.shadow.slice(0, 60));
}
// "Approved" edge label, toasts
if (!only || only.test('labels')) {
  await p3.goto(url('b_se_joined'), { waitUntil: 'networkidle' }); await p3.waitForTimeout(300);
  const lab = await p3.evaluate(() => { const l = document.querySelector('.react-flow__edgelabel-renderer > *'); const keep = new Set(); let e = l; while (e) { keep.add(e); e = e.parentElement; }
    document.querySelectorAll('body *').forEach(x => { if (!keep.has(x) && !l.contains(x)) x.style.visibility = 'hidden'; else if (!l.contains(x) && x !== l) { x.style.background = 'transparent'; } });
    document.documentElement.style.background = 'transparent'; document.body.style.background = 'transparent';
    const r = l.getBoundingClientRect(); const z = parseFloat((document.querySelector('.react-flow__viewport').style.transform.match(/scale\(([\d.]+)\)/) || [0, 1])[1]);
    return { r: [r.x, r.y, r.width, r.height], z, html: l.outerHTML.slice(0, 300) }; });
  await p3.screenshot({ path: path.join(OUT, 'lblApproved.png'), clip: { x: lab.r[0] - 2, y: lab.r[1] - 2, width: lab.r[2] + 4, height: lab.r[3] + 4 }, omitBackground: true });
  RECTS.lblApproved = lab; console.log('label', lab.r, lab.z);
  for (const [nm, snap] of [['toastRA', 'b_ra_added'], ['toastCD', 'b_cd_added'], ['toastPA', 'b_pa_added'], ['toastSE', 'b_se_added'], ['toastTR', 'b_trig_list']]) {
    await p3.goto(url(snap), { waitUntil: 'networkidle' }); await p3.waitForTimeout(300);
    const r = await p3.evaluate(() => { document.getAnimations().forEach(a => { try { a.finish(); } catch (e) {} });
      const t = [...document.querySelectorAll('[data-sonner-toast]')].pop(); if (!t) return null; const keep = new Set(); let e = t; while (e) { keep.add(e); e = e.parentElement; }
      document.querySelectorAll('body *').forEach(x => { if (!keep.has(x) && !t.contains(x)) x.style.visibility = 'hidden'; else if (!t.contains(x) && x !== t) x.style.background = 'transparent'; });
      document.documentElement.style.background = 'transparent'; document.body.style.background = 'transparent';
      const sh = getComputedStyle(t).boxShadow; t.style.boxShadow = 'none'; const b = t.getBoundingClientRect(); return { r: [b.x, b.y, b.width, b.height], sh, rad: getComputedStyle(t).borderRadius }; });
    if (!r) { console.log('no toast', nm); continue; }
    await p3.screenshot({ path: path.join(OUT, nm + '.png'), clip: { x: r.r[0], y: r.r[1], width: r.r[2], height: r.r[3] }, omitBackground: true });
    RECTS[nm] = r; console.log('toast', nm, r.r, r.sh);
  }
  // canvas colours (pane background and dots) for app.js
  await p3.goto(url('b_choose'), { waitUntil: 'networkidle' });
  RECTS.canvasColours = await p3.evaluate(() => { const pane = document.querySelector('.react-flow'); const dot = document.querySelector('.react-flow__background-pattern');
    return { pane: getComputedStyle(pane).backgroundColor, paneParent: getComputedStyle(pane.parentElement).backgroundColor, dot: dot ? getComputedStyle(dot).fill : null, edge: 'rgba(36,30,25,0.2)' }; });
  console.log('colours', RECTS.canvasColours);
}
writeFileSync(RJ, JSON.stringify(RECTS));
writeFileSync(path.join(OUT, 'rects.js'), 'window.RECTS_DATA=' + JSON.stringify(RECTS) + ';');
await b.close();
