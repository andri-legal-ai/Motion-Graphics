// Captures the Andri screens for Academy 10.3 as plates plus control rects (app px, window 1440 x 860).
// Source: DOM snapshots of Andri staging taken 13 Oct 2026 in my own tab (staging-snapshot/raw), localised by
// staging-snapshot/localize103.py (Aldridge Vine, AF / Adam Frith, "(Academy 10.3)" dropped, my matter "Academy 10.3"
// shown as "New client enquiries"). Built on the 10.2 capture script.
//   node plates/capture.mjs [regex]
// Unlike 10.2 the workflow canvas is kept in the plates (the examples arrive complete; nothing is dragged), refitted to the
// 1440 x 860 pane as React Flow's fitView does. Canvas plates are 3x so the camera can move in on the small step cards.
import { chromium } from './pw.mjs';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
const P = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SS = path.join(P, 'staging-snapshot'), OUT = path.join(P, 'plates');
const W = 1440, H = 860;
const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const RJ = path.join(OUT, 'rects.json');
const RECTS = existsSync(RJ) ? JSON.parse(readFileSync(RJ, 'utf8')) : {};
const NAIR_ROW = readFileSync(path.join(SS, 'nair_row.html'), 'utf8');

// plate name -> [snapshot, options]   (x3: captured at 3x for camera moves on the canvas)
const PLATES = {
  aMat: ['a_matters', { fix: 'demoMatters' }], aMatH: ['a_matters', { fix: 'demoMatters', hover: `ROWWF('New client enquiries')` }], aExp: ['a_explore_wf', { fix: 'demoMatters' }],
  wEmpty: ['w_list', { fix: 'emptyState' }], wEmptyH: ['w_list', { fix: 'emptyState', hover: `BTN('New Workflow')` }],
  bChoose: ['b_choose', {}], bChooseH: ['b_choose', { hover: `ROW('Start from a template')` }],
  tPick: ['t_pick', {}], tPickR: ['t_pick', { hover: `ROW('Contract Redline Response (Example)')` }],
  // at 860 px the fourth example runs under the bottom edge: the list scrolls (as staging does in a window this height)
  tPickS: ['t_pick', { fix: 'scrollList' }], tPickSR: ['t_pick', { fix: 'scrollList', hover: `ROW('Contract Redline Response (Example)')` }], tPickI: ['t_pick', { fix: 'scrollList', hover: `ROW('Intake to Advice: Full Case Workup (Example)')` }],
  // the redline example
  rCanvas: ['r_canvas', { x3: 1 }],
  rTrig0: ['r_trigger1_s0', { x3: 1 }], rTrig: ['r_trigger1_s1', { x3: 1 }], rTrig0NM: ['r_trigger1_s0', { x3: 1, nm: 1 }], rTrigNM: ['r_trigger1_s1', { x3: 1, nm: 1 }], rCond: ['r_stepisredline_s0', { x3: 1 }], rRev: ['r_stepreview_s0', { x3: 1, ta: 'Review every tracked change' }], rRev1: ['r_stepreview_s1', { x3: 1 }],
  rDoc: ['r_stepdraftcounter_s0', { x3: 1 }], rCmp: ['r_stepcomposeemail_s0', { x3: 1 }], rSend: ['r_stepemaillawyer_s0', { x3: 1 }], rSend2: ['r_stepemaillawyer_s2', { x3: 1 }], rSend3: ['r_stepemaillawyer_s3', { x3: 1 }],
  // the intake example
  iCanvas: ['i_canvas', { x3: 1 }], iScope: ['i_stepinscope_s0', { x3: 1 }],
  mScopeScr: ['m_scope_sel', { x3: 1, fix: 'origTitle+scopeScroll' }], mScopeSel: ['m_scope_sel', { x3: 1, fix: 'origTitle+selectScope' }], mScope0: ['m_scope_typed', { x3: 1, fix: 'origTitle+scopeHole' }], mScopeT: ['m_scope_typed', { x3: 1, fix: 'origTitle+scopeFocus' }],
  mScopeSaved: ['m_scope_saved', { x3: 1, fix: 'origTitle' }],
  mPa: ['m_pa_s0', { x3: 1 }], mPaWhoDD: ['m_pa_who_dd', { x3: 1 }], mPaWhoDDH: ['m_pa_who_dd', { x3: 1, hover: `OPT('A specific person')` }], mPaWho: ['m_pa_who', { x3: 1 }],
  mPaApprDD: ['m_pa_appr_dd', { x3: 1 }], mPaApprDDH: ['m_pa_appr_dd', { x3: 1, hover: `OPT('adam.frith@aldridgevine.co.uk (Admin)')` }], mPaAppr: ['m_pa_appr', { x3: 1 }], mPaSaveH: ['m_pa_appr', { x3: 1, hover: `BTN('Save Draft', 1)` }], mScopeSaveH: ['m_scope_typed', { x3: 1, fix: 'origTitle+scopeFocus', hover: `BTN('Save Draft', 1)` }], mPaSaved: ['m_pa_saved', { x3: 1, fix: 'origTitle' }],
  // renaming: the page as it is after Save Draft (panel closed, m_pa_saved), the name field in its editing look
  mTitleH: ['m_pa_saved', { x3: 1, fix: 'origTitle', hover: `document.querySelector('[aria-label="Edit workflow name"]')` }], mTitleE: ['m_pa_saved', { x3: 1, fix: 'origTitle+focusTitle' }],
  mTitle0: ['m_pa_saved', { x3: 1, fix: 'clearTitle' }], mTitleT: ['m_pa_saved', { x3: 1, fix: 'newTitle+focusTitle' }],
  mPubH: ['m_nopanel_hover_pub', { x3: 1, hover: `BTN('Publish')` }], mPub: ['m_nopanel_hover_pub', { x3: 1 }],
  pAfter: ['p_after', { x3: 1 }],
  // switch it on, in my own matter
  mtList: ['mt_list', { fix: 'onlyMine' }], mtListH: ['mt_list', { fix: 'onlyMine', hover: `BTN('Activate')` }],
  mtCfg0: ['mt_cfg0', { fix: 'onlyMine' }], mtCfg1: ['mt_cfg_s1', { fix: 'onlyMine' }], mtCfg0NM: ['mt_cfg0', { fix: 'onlyMine', nm: 1 }], mtCfg1NM: ['mt_cfg_s1', { fix: 'onlyMine', nm: 1 }], mtCfg2: ['mt_cfg_s2', { fix: 'onlyMine' }], mtCfg3: ['mt_cfg_s3', { fix: 'onlyMine' }],
};

const FIXES = {
  // the matters list: my "New client enquiries" (created 13 Oct for this video) and the demo matter Nair v Calderdale Logistics
  // (its real row, from the 12 Oct snapshot); other sessions' test matters are left out
  demoMatters: nair => { const body = document.querySelector('tbody'); const rows = [...body.querySelectorAll('tr')];
    rows.forEach(tr => { const name = (tr.querySelector('td') || tr).innerText.trim(); if (name !== 'New client enquiries') tr.remove(); });
    body.insertAdjacentHTML('beforeend', nair); },
  // the empty Workflows page as staging showed it before any workflow existed (10.2, first visit): the other sessions'
  // workflows are left out and nothing of mine is saved yet (the examples open unsaved)
  emptyState: () => {
    const bar = [...document.querySelectorAll('button')].find(b => /^All/.test((b.innerText || '').trim()));
    if (bar) bar.parentElement.style.opacity = '0';
    const search = document.querySelector('input[placeholder="Search workflows..."]'); if (search) search.closest('label').style.opacity = '0';
    const card = [...document.querySelectorAll('div')].filter(e => (e.innerText || '').includes('Weekly matter memo') && e.getBoundingClientRect().height > 450).pop();
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
  // the matter's Workflows list and Activate dialog: only my own workflow (other sessions' published workflows left out)
  onlyMine: () => {
    document.querySelectorAll('body *').forEach(e => { if (e.children.length === 0 && /^(Check and reply to client documents|Weekly matter memo)/.test(e.textContent.trim())) {
      let r = e; while (r.parentElement && !(r.parentElement.innerText || '').includes('Employment intake to advice')) r = r.parentElement; r.remove(); } });
    document.querySelectorAll('body *').forEach(e => { if (e.children.length === 0 && e.textContent.trim() === '3') { const p = e.parentElement; if (/Available Workflow Templates/.test(p.innerText || '')) e.textContent = '1'; } });
  },
  scrollList: () => { const h = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.trim() === 'Create a Workflow');
    let e = h; while (e && !(e.scrollHeight > e.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(e).overflowY))) e = e.parentElement; if (e) e.scrollTop = e.scrollHeight; },
  // in staging I renamed the copy before redoing this edit; in the video the rename comes after it, so the name is still the example's
  newTitle: () => { const e = document.querySelector('[aria-label="Edit workflow name"]'); if (e) e.textContent = 'Employment intake to advice'; },
  origTitle: () => { const e = document.querySelector('[aria-label="Edit workflow name"]'); if (e) e.textContent = 'Intake to Advice: Full Case Workup (Example)'; },
  // the scope question with the practice-area words selected (as I selected them in staging before typing)
  selectScope: () => { const t = [...document.querySelectorAll('textarea')].find(x => x.value.includes('civil and commercial practice'));
    const a = t.value.indexOf("the firm's civil and commercial practice"), b = t.value.indexOf('landlord and tenant)') + 'landlord and tenant)'.length;
    t.focus(); t.setSelectionRange(a, b, 'forward'); TASHOW(t, a); },
  scopeScroll: () => { const t = [...document.querySelectorAll('textarea')].find(x => x.value.includes('civil and commercial practice')); TASHOW(t, t.value.indexOf("the firm's civil and commercial practice")); },
  // the typed state, focused (no selection); and the same field with the new words removed (typed in letter by letter)
  scopeFocus: () => { const t = [...document.querySelectorAll('textarea')].find(x => x.value.includes('employment practice')); const ins = "the firm's employment practice (for example: unfair dismissal, discrimination, redundancy and settlement agreements)", i = t.value.indexOf(ins); t.focus(); t.setSelectionRange(i + ins.length, i + ins.length); TASHOW(t, i); },
  scopeHole: () => { const t = [...document.querySelectorAll('textarea')].find(x => x.value.includes('employment practice'));
    const ins = "the firm's employment practice (for example: unfair dismissal, discrimination, redundancy and settlement agreements)"; const i = t.value.indexOf(ins); t.value = t.value.replace(ins, ''); t.textContent = t.value; t.focus(); t.setSelectionRange(i, i); TASHOW(t, i); },
  // the name field is a contenteditable span; while editing it has its focus style (focus:border-foreground/50 focus:bg-card)
  focusTitle: () => { const e = document.querySelector('[aria-label="Edit workflow name"]'); e.style.borderColor = 'rgba(36,30,25,.5)'; e.style.background = getComputedStyle(document.querySelector('aside[data-pane=workflows]')).backgroundColor; },
  clearTitle: () => { const e = document.querySelector('[aria-label="Edit workflow name"]'); e.textContent = '​'; e.style.borderColor = 'rgba(36,30,25,.5)'; e.style.background = getComputedStyle(document.querySelector('aside[data-pane=workflows]')).backgroundColor; e.style.minWidth = '40px'; },
  // the panel was still open when I renamed it in staging; in the video it is closed first (Close), so the canvas fills the pane
  noPanelSel: () => { const p = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /^Configure:/.test(e.textContent)); if (!p) return;
    let a = p; while (a && a.getBoundingClientRect().height < 500) a = a.parentElement; a.style.display = 'none'; window.__refit = true; },
};

// React Flow's fitView, redone for the 860 px window (padding 0.1 as React Flow's default)
const FIT = () => { const vp = document.querySelector('.react-flow__viewport'), rf = document.querySelector('.react-flow'); if (!vp || !rf) return null; const pane = rf.getBoundingClientRect();
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  document.querySelectorAll('.react-flow__node').forEach(n => { const m = n.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/); const x = +m[1], y = +m[2]; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + n.offsetWidth); y1 = Math.max(y1, y + n.offsetHeight); });
  const bw = x1 - x0, bh = y1 - y0, z = Math.min(pane.width / (bw * 1.2), pane.height / (bh * 1.2), 2);
  vp.style.transform = `translate(${pane.width / 2 - (x0 + bw / 2) * z}px, ${pane.height / 2 - (y0 + bh / 2) * z}px) scale(${z})`; return z; };

// page helpers: find controls by text; scroll a textarea so a character offset sits on its second line (mirror div)
const HELPERS = () => {
  const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
  window.BTN = (t, last) => { const a = [...document.querySelectorAll('button,a,[role=button]')].filter(e => vis(e) && e.innerText.trim() === t); return last ? a.pop() : a[0]; };
  window.OPT = t => [...document.querySelectorAll('[role=option],[role=menuitem],[role=menuitemradio]')].find(e => vis(e) && e.innerText.trim() === t);
  window.ROW = t => { const l = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && vis(e) && e.textContent.trim() === t); return l && (l.closest('button,a,[role=button]') || l.parentElement.parentElement); };
  window.ROWWF = t => { const tr = [...document.querySelectorAll('tr')].find(r => r.innerText.includes(t)); return tr && [...tr.querySelectorAll('button,a')].find(b => (b.getAttribute('aria-label') || b.title || b.innerText).trim() === 'Workflows'); };
  window.TASHOW = (ta, idx) => { const s = getComputedStyle(ta), m = document.createElement('div');
    for (const k of ['font', 'fontSize', 'fontFamily', 'fontWeight', 'lineHeight', 'letterSpacing', 'padding', 'border', 'boxSizing', 'textIndent']) m.style[k] = s[k];
    Object.assign(m.style, { position: 'absolute', left: '-9999px', top: '0', width: ta.getBoundingClientRect().width + 'px', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' });
    m.textContent = ta.value.slice(0, idx); const sp = document.createElement('span'); sp.textContent = '|'; m.appendChild(sp); document.body.appendChild(m);
    const y = sp.offsetTop; m.remove(); ta.scrollTop = Math.max(0, y - parseFloat(s.paddingTop) - parseFloat(s.lineHeight)); window.__taScroll = ta.scrollTop; };
};
async function prep(p, opt) {
  await p.evaluate(HELPERS);
  if (opt.ta) await p.evaluate(ph => { const t = [...document.querySelectorAll('textarea')].find(x => x.value.includes(ph)); if (t) TASHOW(t, t.value.indexOf(ph)); }, opt.ta);
  await p.evaluate(() => {
    document.getAnimations().forEach(a => { try { a.finish(); } catch (e) {} });
    document.querySelectorAll('[data-sonner-toaster]').forEach(e => e.style.display = 'none');
    document.querySelectorAll('[data-snap-focus]').forEach(e => { if (e.getAttribute('role') === 'option') e.focus(); e.removeAttribute('data-snap-focus'); });
    // popovers back under (or over) their trigger, with the gap staging had
    document.querySelectorAll('[data-radix-popper-content-wrapper][data-snap-rect]').forEach(w => {
      const [px, py, pw, ph] = w.dataset.snapRect.split(',').map(Number);
      const trig = [...document.querySelectorAll('[aria-expanded=true][data-snap-rect]')].filter(e => !w.contains(e)).map(e => ({ e, r: e.dataset.snapRect.split(',').map(Number) }))
        .sort((a, b) => Math.hypot(a.r[0] - px, a.r[1] + a.r[3] - py) - Math.hypot(b.r[0] - px, b.r[1] + b.r[3] - py))[0];
      if (!trig) return;
      const now = trig.e.getBoundingClientRect(); const [tx, ty, tw, th] = trig.r;
      const below = py >= ty + th - 2, gap = below ? py - (ty + th) : ty - (py + ph);
      let ny = below ? now.bottom + gap : now.y - gap - ph;
      if (below && ny + ph > innerHeight - 8) ny = now.y - gap - ph;
      const nx = now.x + (px - tx);
      w.style.transform = `translate(${nx}px, ${ny}px)`;
    });
  });
  for (const f of (opt.fix ? opt.fix.split('+') : [])) await p.evaluate(FIXES[f], f === 'demoMatters' ? NAIR_ROW : undefined);
  await p.evaluate(FIT);
  // nm: the scroll containers' own top/bottom fades off (app.js draws them while a body scrolls, so the faded edge never travels)
  if (opt.nm) await p.addStyleTag({ content: '*{mask-image:none!important;-webkit-mask-image:none!important}' });
  if (opt.hover) { const h = await p.evaluateHandle(opt.hover); const el = h.asElement(); const bb = el ? await el.boundingBox() : null;
    if (!bb) console.log('HOVER MISS', opt.hover); else { await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await h.evaluate(e => { if (e.getAttribute('role') === 'option') e.focus(); }); await p.waitForTimeout(350); } }
  await p.waitForTimeout(150);
}

// rects of every control a cursor or ring can aim at, keyed by its text (first match wins; '#n' suffix for repeats)
const PHRASES = ['Attachment filename ends with ".docx"', 'Is it a contract or legal agreement returned with tracked changes', 'Risk rating: High, Medium, Low.',
  "with the counterparty's tracked changes either countered with new tracked changes or annotated with inline comments",
  'Email subject contains "intake"', "the firm's civil and commercial practice", "the firm's employment practice", 'Review every tracked change, inline edit, and deletion in the attached .docx against the facts and position of this case', 'Write the body of the handoff email to the lawyer on this case.'];
async function rects(p) {
  return p.evaluate(PHRASES => {
    const o = {}; const put = (k, r) => { k = k.replace(/\s+/g, ' ').trim().slice(0, 60); if (!k || r.width < 2 || r.height < 2) return; let key = k, i = 2; while (o[key]) key = k + '#' + i++; o[key] = [r.x, r.y, r.width, r.height].map(v => Math.round(v * 10) / 10); };
    const vis = e => { const s = getComputedStyle(e); return s.visibility !== 'hidden' && s.display !== 'none' && e.getClientRects().length; };
    document.querySelectorAll('button, a, [role=option], [role=menuitem], [role=radio], label, h1, h2, h3, [role=tab], th, [role=combobox]').forEach(e => { if (vis(e)) put(e.innerText || e.getAttribute('aria-label') || '', e.getBoundingClientRect()); });
    document.querySelectorAll('input, textarea').forEach(e => { if (!vis(e)) return; const s = getComputedStyle(e); const r = e.getBoundingClientRect();
      put('field:' + (e.placeholder || e.value || e.name || e.type), r); o['font:' + (e.placeholder || e.value || e.type).slice(0, 40)] = [parseFloat(s.fontSize), parseFloat(s.paddingLeft), parseFloat(s.paddingTop), parseFloat(s.lineHeight) || 0, s.fontWeight]; });
    document.querySelectorAll('body *').forEach(e => { if (e.children.length === 0 && vis(e)) { const t = e.textContent.trim(); if (t && t.length < 70) put('t:' + t, e.getBoundingClientRect()); } });
    document.querySelectorAll('.react-flow__node').forEach(n => { const r = n.getBoundingClientRect(); o['node:' + n.dataset.id] = [r.x, r.y, r.width, r.height].map(v => Math.round(v * 10) / 10); });
    const pane = document.querySelector('.react-flow'); if (pane) { const r = pane.getBoundingClientRect(); o.pane = [r.x, r.y, r.width, r.height]; }
    const vp = document.querySelector('.react-flow__viewport'); if (vp) o.viewport = vp.style.transform;
    document.querySelectorAll('body *').forEach(e => { if (!vis(e) || e.scrollHeight <= e.clientHeight + 4) return; const cs = getComputedStyle(e); if (!/auto|scroll/.test(cs.overflowY)) return;
      const r = e.getBoundingClientRect(); if (r.height < 200) return; put('scroller', r); o['scrollerMask#' + Object.keys(o).filter(k => k.startsWith('scroller')).length] = cs.maskImage || cs.webkitMaskImage || 'none'; });
    { const best = {}; document.querySelectorAll('body *').forEach(e => { const t = (e.innerText || '').trim().replace(/\s*×$/, ''); if (!vis(e) || !/^\{\{[^}]+\}\}$/.test(t)) return; const cs = getComputedStyle(e);
      if (cs.borderTopWidth === '0px' && cs.backgroundColor === 'rgba(0, 0, 0, 0)') return; const r = e.getBoundingClientRect(); if (!best[t] || r.width * r.height < best[t][2] * best[t][3]) best[t] = [r.x, r.y, r.width, r.height]; });
      for (const [t, r] of Object.entries(best)) o['chip:' + t] = r.map(v => Math.round(v * 10) / 10); }
    const dlg = [...document.querySelectorAll('[role=dialog]')].pop(); if (dlg) { const r = dlg.getBoundingClientRect(); o.dialog = [r.x, r.y, r.width, r.height]; }
    const lineBoxes = rs => { const lines = []; for (const b of rs) { if (b.width < 1) continue; const l = lines.find(x => Math.abs(x[1] - b.y) < 3); if (l) { const x1 = Math.max(l[0] + l[2], b.right); l[0] = Math.min(l[0], b.x); l[2] = x1 - l[0]; } else lines.push([b.x, b.y, b.width, b.height]); } return lines.map(l => l.map(v => Math.round(v * 10) / 10)); };
    for (const ph of PHRASES) {
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n, done = false;
      while ((n = tw.nextNode())) { const i = n.textContent.indexOf(ph); if (i < 0 || n.parentElement.tagName === 'TEXTAREA' || !vis(n.parentElement)) continue; const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + ph.length);
        o['phrase:' + ph.slice(0, 24)] = lineBoxes(r.getClientRects()); done = true; break; }
      if (done) continue;
      // inside a textarea: measure with a mirror div laid over it (same box, font, padding, wrapping, scroll)
      for (const ta of document.querySelectorAll('textarea')) { const i = ta.value.indexOf(ph); if (i < 0 || !vis(ta)) continue;
        const s = getComputedStyle(ta), r = ta.getBoundingClientRect(), m = document.createElement('div');
        for (const k of ['font', 'fontSize', 'fontFamily', 'fontWeight', 'lineHeight', 'letterSpacing', 'padding', 'border', 'boxSizing', 'whiteSpace', 'wordWrap', 'overflowWrap', 'textIndent']) m.style[k] = s[k];
        Object.assign(m.style, { position: 'fixed', left: r.x + 'px', top: (r.y - ta.scrollTop) + 'px', width: r.width + 'px', whiteSpace: 'pre-wrap', visibility: 'hidden' });
        m.textContent = ta.value.slice(0, i); const sp = document.createElement('span'); sp.textContent = ta.value.slice(i, i + ph.length); m.appendChild(sp); m.appendChild(document.createTextNode(ta.value.slice(i + ph.length)));
        document.body.appendChild(m); const lines = lineBoxes(sp.getClientRects()).filter(l => l[1] >= r.y - 2 && l[1] + l[3] <= r.bottom + 2); m.remove();
        o['phrase:' + ph.slice(0, 24)] = lines; break; }
    }
    return o;
  }, PHRASES);
}

const b = await chromium.launch();
const pages = {};
// a desktop with a mouse: Tailwind's hover styles sit inside @media (hover: hover), which headless Chromium reports as none
const pageAt = async dsf => { if (pages[dsf]) return pages[dsf]; const pg = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: dsf })).newPage();
  const cdp = await pg.context().newCDPSession(pg); await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'hover', value: 'hover' }, { name: 'any-hover', value: 'hover' }, { name: 'pointer', value: 'fine' }, { name: 'any-pointer', value: 'fine' }] });
  return (pages[dsf] = pg); };
const url = s => 'file://' + path.join(SS, 'L_' + s + '.html');
for (const [name, [snap, opt]] of Object.entries(PLATES)) {
  if (only && !only.test(name)) continue;
  const p = await pageAt(opt.x3 ? 3 : 2);
  await p.mouse.move(1, 1);
  await p.goto(url(snap), { waitUntil: 'networkidle' }); await p.waitForTimeout(300);
  await prep(p, opt);
  await p.screenshot({ path: path.join(OUT, name + '.png') });
  RECTS[name] = { ...(await rects(p)), dsf: opt.x3 ? 3 : 2 };
  console.log('plate', name);
}

// the publish explainer animates (dialog in, then a 4.5 s scripted illustration): frames every 100 ms, as staging plays it
if (!only || only.test('seq')) {
  mkdirSync(path.join(OUT, 'seq'), { recursive: true });
  const p = await pageAt(2);
  for (const [nm, snap] of [['pub1', 'pub1_6000'], ['pub2', 'pub2_5000']]) {
    for (let t = 0; t <= 4400; t += 100) {
      await p.goto(url(snap), { waitUntil: 'networkidle' });
      await p.evaluate(FIT);
      await p.evaluate(t => { document.querySelectorAll('[data-sonner-toaster]').forEach(e => e.style.display = 'none'); document.getAnimations().forEach(a => { a.pause(); a.currentTime = t; }); }, t);
      await p.waitForTimeout(60);
      await p.screenshot({ path: path.join(OUT, 'seq', `${nm}_${String(t / 100).padStart(2, '0')}.png`) });
    }
    RECTS[nm] = await rects(p);
    console.log('seq', nm);
  }
}
// typing the new practice area into the middle of the scope question: the text after it reflows, so every few letters is a
// frame of the field itself (3x crop), at the scroll the field keeps while typing
if (!only || only.test('scopeType')) {
  mkdirSync(path.join(OUT, 'seq'), { recursive: true });
  const p = await pageAt(3); await p.mouse.move(1, 1);
  await p.goto(url('m_scope_typed'), { waitUntil: 'networkidle' }); await p.waitForTimeout(300); await prep(p, { fix: 'origTitle+scopeFocus' });
  const box = await p.evaluate(() => { const t = [...document.querySelectorAll('textarea')].find(x => x.value.includes('employment practice')); window.__ST = t.scrollTop; window.__FULL = t.value; const r = t.getBoundingClientRect(); return [r.x - 3, r.y - 3, r.width + 6, r.height + 6]; });
  const INS = "the firm's employment practice (for example: unfair dismissal, discrimination, redundancy and settlement agreements)";
  let f = 0; const hl = [];
  for (let k = 0; ; k += 3) {
    const n = Math.min(k, INS.length);
    await p.evaluate(({ INS, n }) => { const t = [...document.querySelectorAll('textarea')][0].value.includes('Read the incoming') ? [...document.querySelectorAll('textarea')][0] : document.querySelector('textarea');
      const full = window.__FULL, i = full.indexOf(INS); t.value = full.slice(0, i) + INS.slice(0, n) + full.slice(i + INS.length); t.focus(); t.setSelectionRange(i + n, i + n); t.scrollTop = window.__ST; }, { INS, n });
    await p.waitForTimeout(40);
    await p.screenshot({ path: path.join(OUT, 'seq', `scope_${String(f).padStart(2, '0')}.png`), clip: { x: box[0], y: box[1], width: box[2], height: box[3] } });
    // the line boxes of what has been typed so far (mirror div over the field), for the highlight on the new words
    hl.push(await p.evaluate(({ INS, n }) => { const ta = [...document.querySelectorAll('textarea')].find(x => x.value.startsWith(window.__FULL.slice(0, window.__FULL.indexOf(INS))));
      const i = window.__FULL.indexOf(INS), s = getComputedStyle(ta), r = ta.getBoundingClientRect(), m = document.createElement('div');
      for (const k of ['font', 'fontSize', 'fontFamily', 'fontWeight', 'lineHeight', 'letterSpacing', 'padding', 'border', 'boxSizing', 'whiteSpace', 'wordWrap', 'overflowWrap', 'textIndent']) m.style[k] = s[k];
      Object.assign(m.style, { position: 'fixed', left: r.x + 'px', top: (r.y - ta.scrollTop) + 'px', width: r.width + 'px', whiteSpace: 'pre-wrap', visibility: 'hidden' });
      m.textContent = ta.value.slice(0, i); const sp = document.createElement('span'); sp.textContent = ta.value.slice(i, i + n); m.appendChild(sp); m.appendChild(document.createTextNode(ta.value.slice(i + n)));
      document.body.appendChild(m); const lines = []; for (const b of sp.getClientRects()) { if (b.width < 1) continue; const l = lines.find(x => Math.abs(x[1] - b.y) < 3); if (l) { const x1 = Math.max(l[0] + l[2], b.right); l[0] = Math.min(l[0], b.x); l[2] = x1 - l[0]; } else lines.push([b.x, b.y, b.width, b.height]); }
      m.remove(); return lines.filter(l => l[1] >= r.y - 2 && l[1] + l[3] <= r.bottom + 2).map(l => l.map(v => Math.round(v * 10) / 10)); }, { INS, n }));
    f++; if (n === INS.length) break;
  }
  RECTS.scopeType = { box, frames: f, len: INS.length, hl }; console.log('scopeType', f, box);
}
writeFileSync(RJ, JSON.stringify(RECTS));
writeFileSync(path.join(OUT, 'rects.js'), 'window.RECTS_DATA=' + JSON.stringify(RECTS) + ';');
await b.close();
