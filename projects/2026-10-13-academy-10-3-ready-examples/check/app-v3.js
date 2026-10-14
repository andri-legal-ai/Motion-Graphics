// Andri Academy 10.3 · Start from a ready example: overnight redline, new client intake
// Everything is drawn on one <canvas> by renderFrame(t), a pure function of time t (seconds).
// App screens are plates of real Andri staging snapshots (plates/*.png, built by plates/capture.mjs; canvas plates at 3x so the
// camera can move in on the small step cards). The narration is one take cut by sentence (build/cues.js: durations and word
// times); every action below is timed from those words. Engine, camera, captions, cursor, mascot, title and end card follow
// 1.1, 1.2, 8.1 and 10.2.

const W = 1920, H = 1080, FPS = 60;
const c = document.getElementById('c'); c.width = W; c.height = H;
let ctx = c.getContext('2d');   // helpers draw on ctx; renderFrame points it at the window canvas while the app draws
const ROOT = '../';

// ------------------------------------------------------------------ easing
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const L = (a, b, k) => a + (b - a) * k;
const E = {
  lin: x => x,
  out: x => 1 - Math.pow(1 - x, 3),
  q: x => 1 - Math.pow(1 - x, 5),
  io: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  qio: x => x < .5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2,
  back: x => { const a = 1.4, k = a + 1; return 1 + k * Math.pow(x - 1, 3) + a * Math.pow(x - 1, 2); },
};
const P = (t, a, b, e = E.out) => e(cl((t - a) / (b - a)));
const V2 = (t, a, b, fi = .35, fo = .3) => Math.min(P(t, a, a + fi), 1 - P(t, b - fo, b, E.io));

// ------------------------------------------------------------------ timeline (video seconds), built from the narration
// Each sentence starts a gap after the one before; the gaps leave room for what the app does in between (8.1: ~1.25x calmer).
const SENT = window.SENT;
const GAPS = { S01: .6, S02: .55, S03: .55, S04: 1.5, S05: .6, S06: 1.1, S07: .35, S08: .9, S09: .7, S10: 1.3, S11: .7, S12: .9, S13: .9, S14: .4,
  S15: 1.0, S16: .7, S17: .5, S18: 1.0, S19: .6, S20: 1.3, S21: .5, S22: 1.0, S23: .5, S24: 1.0, S25: 1.0, S26: .5, S27: 1.3, S28: .55, S29: 1.9,
  S30: 3.0, S31: 2.3, S32: 3.2, S33: .6, S34: .7, S35: 0 };
const VO = {}; { let t = 0, prev = null; for (const k of Object.keys(GAPS)) { if (k === 'S35') break; t = (prev ? VO[prev] + SENT[prev].dur : 0) + GAPS[k]; VO[k] = +t.toFixed(2); prev = k; } }
const vEnd = k => VO[k] + SENT[k].dur;
// video time of a word in a sentence (first match; n: the n-th match)
const WT = (k, w, n = 1) => { const ws = SENT[k].words; let m = 0; for (const [x, a] of ws) if (x.toLowerCase().replace(/[^a-z0-9']/g, '') === w.toLowerCase() && ++m === n) return VO[k] + a; console.warn('word?', k, w); return VO[k]; };

const T = {};
T.push = vEnd('S03') + .5;
// 1 · find the examples
T.explore = VO.S04 + .35; T.wfItem = WT('S04', 'workflows') + .15; T.newWf = WT('S04', 'new') + .2;
T.tpl = WT('S05', 'template') + .1;
T.scrollList = WT('S07', 'full') - .5;
// 2 · the redline example
T.red = WT('S08', 'response') - .1;
T.zoomIn = VO.S09 - .1; T.zoomOut = vEnd('S09') + .35;
T.trig = VO.S10 + .25; T.trigScroll = WT('S10', 'word') - .9;
T.cond = VO.S11 + .2;
T.rev = VO.S12 + .15;
T.doc = VO.S13 + .2;
T.cmp = VO.S15 + .15; T.send = WT('S15', 'sends') - .05; T.sendScroll = vEnd('S15') + .1;
// 3 · the intake example
T.back = VO.S18 + .15; T.newWf2 = T.back + 1.25; T.tpl2 = T.newWf2 + 1.25; T.scroll2 = T.tpl2 + .75; T.intake = T.scroll2 + 1.0;
T.i1 = VO.S20 - 1.0; T.i2 = VO.S22 - .7; T.i3 = VO.S24 - .7; T.i4 = VO.S25 - .7; T.iOut = vEnd('S26') + .5;
// 4 · make it yours
T.scope = VO.S27 + .9 + .4; T.taScroll = VO.S28 + .1; T.selA = WT('S28', 'employment') - .55; T.selB = T.selA + .9;
T.typeA = T.selB + .35; T.typeB = T.typeA + 3.3; T.scopeSave = T.typeB + .7;
T.pa = VO.S29 + .35; T.who = T.pa + .9; T.whoPick = T.who + .75; T.appr = T.whoPick + .75; T.apprPick = T.appr + .75; T.paSave = T.apprPick + .8;
// 5 · publish
T.title = VO.S30 + .25; T.selAll = T.title + .45; T.nameA = T.selAll + .45; T.nameB = T.nameA + 1.35; T.enter = T.nameB + .3; T.publish = T.enter + .75;
T.next = vEnd('S31') + .5; T.gotIt = T.next + 1.9;
// 6 · switch it on
T.matters = T.gotIt + .9; T.wfIcon = T.matters + 1.6; T.activate = WT('S32', 'activate') - .1;
T.dlgScroll = VO.S34 - .1; T.exit = vEnd('S34') + 1.1;
const END = T.exit + 1.1;
VO.S35 = END + .45;
const DURATION = +(VO.S35 + SENT.S35.dur + 2.6).toFixed(2);

const CAP = [[VO.S04, 1, 'Find the examples'], [VO.S08, 2, 'Overnight redline'], [VO.S18, 3, 'New client intake'], [VO.S27, 4, 'Make it yours'],
  [VO.S30, 5, 'Publish'], [VO.S32, 6, 'Switch it on']];
const CAP_END = T.exit + .1;
const NAME = 'Employment intake to advice';

// ------------------------------------------------------------------ assets
const PLATES = ['aMat', 'aMatH', 'aExp', 'wEmpty', 'bChoose', 'bChooseH', 'tPick', 'tPickS', 'tPickSR', 'tPickI',
  'rCanvas', 'rTrig0', 'rTrig', 'rTrig0NM', 'rTrigNM', 'rCond', 'rRev', 'rDoc', 'rCmp', 'rSend', 'rSend3',
  'iCanvas', 'iScope', 'mScopeScr', 'mScopeSel', 'mScopeT', 'mScopeSaveH', 'mScopeSaved',
  'mPa', 'mPaWhoDD', 'mPaWhoDDH', 'mPaWho', 'mPaApprDD', 'mPaApprDDH', 'mPaAppr', 'mPaSaveH', 'mPaSaved',
  'mTitleH', 'mTitleE', 'mTitle0', 'mTitleT', 'mPub', 'mPubH', 'pAfter', 'mtList', 'mtListH', 'mtCfg0', 'mtCfg1', 'mtCfg0NM', 'mtCfg1NM'];
const SEQ = { pub1: 45, pub2: 45, scope: 40 };
const IMG = {}, MASC = {};
let RECTS, MMETA, READY = null;
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(src); i.src = src; }); }
async function load() {
  RECTS = window.RECTS_DATA; MMETA = window.MASCOT_DATA;
  const jobs = PLATES.map(n => loadImg(ROOT + 'plates/' + n + '.png').then(i => IMG[n] = i));
  for (const [s, n] of Object.entries(SEQ)) for (let f = 0; f < n; f++) { const k = `${s}_${String(f).padStart(2, '0')}`; jobs.push(loadImg(ROOT + 'plates/seq/' + k + '.png').then(i => IMG[k] = i)); }
  jobs.push(loadImg(ROOT + 'assets/Andri-Logo-Ink.svg').then(i => IMG.logo = i));
  for (const pose of ['wave', 'done', 'tick', 'disc']) {
    MASC[pose] = [];
    for (let f = 0; f < MMETA[pose].frames; f++) jobs.push(loadImg(`${ROOT}assets/mascot/${pose}/f${String(f).padStart(3, '0')}.png`).then(i => MASC[pose][f] = i));
  }
  const fonts = [['Neco', 'Neco-400', '400'], ['Neco', 'Neco-500', '500'], ['Neco', 'Neco-700', '700'], ['Rethink', 'RethinkSans', '400 800']];
  for (const [fam, file, w] of fonts) { const f = new FontFace(fam, `url(${ROOT}assets/fonts/${file}.woff2)`, { weight: w }); jobs.push(f.load().then(ff => document.fonts.add(ff))); }
  await Promise.all(jobs);
  await document.fonts.ready;
}

// ------------------------------------------------------------------ helpers
const R = (set, id) => { const r = RECTS[set] && RECTS[set][id]; if (!r) console.warn('rect?', set, id); return r; };
const C = r => [r[0] + r[2] / 2, r[1] + r[3] / 2];
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function font(w, s, fam = 'Rethink') { ctx.font = `${w} ${s}px ${fam}`; }
const dsf = name => IMG[name].width / 1440;
function plate(name, a = 1) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(IMG[name], 0, 0, 1440, 860); ctx.restore(); }
function region(name, r, a = 1, dx = 0, dy = 0) { if (a <= 0) return; const [x, y, w, h] = r, d = dsf(name); ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(IMG[name], x * d, y * d, w * d, h * d, x + dx, y + dy, w, h); ctx.restore(); }
function xf(a, b, t, t0, d = .14) { const k = P(t, t0, t0 + d, E.io); if (k < 1) plate(a); if (k > 0) plate(b, k); }
// a page change pushes across (1.1), clipped to the window
function push(t, t0, a, b) {
  const k = P(t, t0, t0 + .6, E.qio);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1440, 860); ctx.clip();
  if (k < 1) { ctx.save(); ctx.translate(-k * 1440, 0); typeof a === 'function' ? a() : plate(a); ctx.restore(); }
  ctx.save(); ctx.translate((1 - k) * 1440, 0); typeof b === 'function' ? b() : plate(b); ctx.restore();
  ctx.restore();
}
// gold ring around a small control (app px), only while the voice names it; always inside the window (known-issues #10)
function ring(t, a, b, r, rad = 10, pad = 5) {
  if (!r) return; const v = V2(t, a, b, .25, .3); if (v <= 0) return;
  const g = P(t, a, a + .35, E.back);
  ctx.save(); ctx.globalAlpha *= v; ctx.strokeStyle = '#E9CD4F'; ctx.lineWidth = 3 * POSE.s / CAM_S;
  const p = pad + (1 - g) * 6, m = 3; let x0 = r[0] - p, y0 = r[1] - p, x1 = r[0] + r[2] + p, y1 = r[1] + r[3] + p;
  x0 = Math.max(m, x0); y0 = Math.max(m, y0); x1 = Math.min(1440 - m, x1); y1 = Math.min(860 - m, y1);
  rr(x0, y0, x1 - x0, y1 - y0, Math.min(rad + p, (y1 - y0) / 2)); ctx.stroke(); ctx.restore();
}
// the yellow highlight sweep over a phrase the voice names (4.2: #F8E37C, multiply, left to right)
function sweep(t, a, lines, b = 1e9) {
  if (!lines || !lines.length || t < a || t > b + .4) return;
  const out = 1 - P(t, b, b + .4, E.io);
  ctx.save(); ctx.globalAlpha *= out; ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#F8E37C';
  lines.forEach(([x, y, w, h], i) => { const k = P(t, a + i * .5, a + i * .5 + .7, E.io); if (k > 0) { rr(x - 2, y - 1, (w + 4) * k, h + 2, 3); ctx.fill(); } });
  ctx.restore();
}
function caret(t, x, y, h = 18) { if (Math.floor(t * 2.2) % 2 === 0) { ctx.fillStyle = '#241E19'; ctx.fillRect(x + 1, y, 1.4, h); } }
// typing at the end of a field: the empty plate, then the full plate revealed letter by letter
function typeIn(t, empty, full, rect, text, sz, wt, t0, t1, { ox = 0, caretH = sz + 4 } = {}) {
  const [x, y, w, h] = rect;
  region(empty, rect);
  if (t < t0) return;
  const n = Math.round(P(t, t0, t1, E.lin) * text.length); font(wt, sz);
  const tw = ctx.measureText(text.slice(0, n)).width;
  if (n) region(full, [x, y, n === text.length ? w : ox + tw + 2, h]);
  if (t < t1 + .3) caret(t, x + ox + tw + 1, y + (h - caretH) / 2, caretH);
}
function seq(name, t, t0, from = 0, fps = 10) { const f = Math.min(SEQ[name] - 1, from + Math.max(0, Math.floor((t - t0) * fps))); plate(`${name}_${String(f).padStart(2, '0')}`); }
// a body that scrolls by d px inside clip: the two captures move as one strip
function scrollStrip(t, t0, a, b, d, clip, dur = .6) {
  const k = P(t, t0, t0 + dur, E.io), [x, y, w, h] = clip;
  plate(a); ctx.save(); ctx.beginPath(); ctx.rect(...clip); ctx.clip();
  region(a, clip, 1, 0, -k * d);
  const edge = y + h - k * d; ctx.beginPath(); ctx.rect(x, edge, w, y + h - edge); ctx.clip();
  region(b, clip, 1, 0, (1 - k) * d);
  ctx.restore();
}
// the same, from captures with the box's own edge fades off: the next capture fills the box and the first only the gap above it,
// and the 20 px fades are drawn here at the box edges (top fade comes in as the box scrolls, bottom fade goes as it reaches the end)
function scrollStripNM(t, t0, a, b, aNM, bNM, d, clip, { dur = .6, fade = 20, topEnd = 1, botEnd = 0 } = {}) {
  const k = P(t, t0, t0 + dur, E.io), [x, y, w, h] = clip, gap = (1 - k) * d;
  plate(a); ctx.save(); ctx.beginPath(); ctx.rect(...clip); ctx.clip();
  region(bNM, clip, 1, 0, gap);
  if (gap > 0) region(aNM, [x, y + k * d, w, gap], 1, 0, -k * d);
  const bg = px(aNM, x + 4, y + h / 2);
  const g = (y0, y1, al) => { if (al <= 0) return; const gr = ctx.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, bg); gr.addColorStop(1, bg.replace('rgb', 'rgba').replace(')', ',0)')); ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = gr; ctx.fillRect(x, Math.min(y0, y1), w, Math.abs(y1 - y0)); ctx.restore(); };
  g(y, y + fade, L(0, topEnd, k)); g(y + h, y + h - fade, L(1, botEnd, k));
  ctx.restore();
}
const PX = {};
function px(name, x, y) { const k = `${name}:${x}:${y}`; if (PX[k]) return PX[k]; const d = dsf(name), cv = document.createElement('canvas'); cv.width = 1; cv.height = 1; const g = cv.getContext('2d');
  g.drawImage(IMG[name], Math.round(x * d), Math.round(y * d), 1, 1, 0, 0, 1, 1); const v = g.getImageData(0, 0, 1, 1).data; return (PX[k] = `rgb(${v[0]},${v[1]},${v[2]})`); }
// a long scroll (more than the body is tall): a short slide with a blend, as 10.2
function scrollBlend(t, t0, a, b, clip, dur = .55, slide = 140) {
  const k = P(t, t0, t0 + dur, E.io); plate(a); ctx.save(); ctx.beginPath(); ctx.rect(...clip); ctx.clip();
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(...clip); region(a, clip, 1 - k, 0, -k * slide); region(b, clip, k, 0, (1 - k) * slide); ctx.restore();
}
// a keyboard step, shown as a small keycap beside the field (8.1: keyboard steps need showing too)
function keycap(t, a, b, label, x, y) {
  const v = V2(t, a, b, .2, .25); if (v <= 0) return;
  font(600, 13); const w = ctx.measureText(label).width + 22;
  ctx.save(); ctx.globalAlpha *= v; ctx.translate(0, (1 - P(t, a, a + .25)) * 6);
  ctx.shadowColor = 'rgba(35,30,25,.18)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2; ctx.fillStyle = '#FFFFFF'; rr(x, y, w, 26, 7); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#D9CFBF'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#241E19'; ctx.textBaseline = 'middle'; ctx.fillText(label, x + 11, y + 13.5); ctx.restore();
}

// ------------------------------------------------------------------ camera
const POSE = { s: 1.08, cx: 960, cy: 503 };
function shot(name) {
  const full = [0, 0, 1440, 860];
  const base = { clip: full, r: 22, o: 1, cx: POSE.cx, cy: POSE.cy };
  if (name === 'screen') return { ...base, fx: 720, fy: 430, s: POSE.s };
  if (name === 'below') return { ...base, fx: 720, fy: 430, s: POSE.s, cy: POSE.cy + 1100 };
  if (name === 'rflow') return { ...base, fx: 720, fy: 480, s: 1.72, cy: 520 };          // the redline example's six steps
  if (name === 'i1') return { ...base, fx: 718, fy: 330, s: 2.45, cy: 440 };              // trigger, scope check, refer elsewhere
  if (name === 'i2') return { ...base, fx: 718, fy: 398, s: 2.45, cy: 520 };              // intake checks, complete?, ask for the missing pieces
  if (name === 'i3') return { ...base, fx: 718, fy: 478, s: 2.45, cy: 520 };              // triage, dossier
  if (name === 'i4') return { ...base, fx: 690, fy: 592, s: 2.3, cy: 520 };               // bottom of the view stays on the pane               // approval, advice report, next step, send
  if (name === 'dlg') return { ...base, fx: 700, fy: 470, s: 1.45, cy: 520 };             // the Activate dialog's Send from rows
  if (name === 'gone') return { ...shot('screen'), o: 0 };
}
const SHOTS = [[0, 'below', 0], [T.push, 'screen', .85],
  [T.zoomIn, 'rflow', 1.1], [T.zoomOut, 'screen', 1.0],
  [T.i1, 'i1', 1.3], [T.i2, 'i2', 1.0], [T.i3, 'i3', 1.0], [T.i4, 'i4', 1.0], [T.iOut, 'screen', 1.1],
  [T.dlgScroll + .7, 'dlg', 1.1], [T.exit - .9, 'screen', .8],
  [T.exit, 'gone', 1.0]];
function clampCam(o) {
  if (o.s * 1440 >= W) o.fx = cl(o.fx, o.cx / o.s, 1440 - (W - o.cx) / o.s);
  if (o.s * 860 >= H) o.fy = cl(o.fy, o.cy / o.s, 860 - (H - o.cy) / o.s);
  return o;
}
function camera(t) {
  let i = 0; while (i < SHOTS.length - 1 && SHOTS[i + 1][0] <= t) i++;
  const cur = shot(SHOTS[i][1]), d = SHOTS[i][2];
  if (i === 0 || d === 0) return clampCam({ ...cur });
  const prev = clampCam({ ...shot(SHOTS[i - 1][1]) }); clampCam(cur); const k = E.io(cl((t - SHOTS[i][0]) / d));
  const o = {}; for (const key of ['fx', 'fy', 'cx', 'cy', 'r', 'o']) o[key] = L(prev[key], cur[key], k);
  o.s = Math.exp(L(Math.log(prev.s), Math.log(cur.s), k));
  o.clip = [0, 0, 1440, 860];
  return o;
}
const toScreen = (cam, x, y) => [cam.cx + (x - cam.fx) * cam.s, cam.cy + (y - cam.fy) * cam.s];

function background(t) {
  ctx.fillStyle = '#F1EDE3'; ctx.fillRect(0, 0, W, H);
  const blob = (x, y, rx, ry, col, a) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, col + a); g.addColorStop(.55, col + Math.round(parseInt(a, 16) * .45).toString(16).padStart(2, '0')); g.addColorStop(1, col + '00');
    ctx.fillStyle = g; ctx.fillRect(-rx, -rx, rx * 2, rx * 2); ctx.restore();
  };
  blob(350 + Math.sin(t * .12) * 60, 350 + Math.cos(t * .1) * 40, 900, 760, '#F9EFC2', 'ff');
  blob(1700 + Math.cos(t * .1) * 50, 200 + Math.sin(t * .12) * 40, 800, 650, '#FFFFFF', 'ff');
  blob(1300 + Math.sin(t * .09 + 1) * 60, 1010 + Math.cos(t * .11) * 40, 950, 650, '#F3DD86', 'ee');
}

// ------------------------------------------------------------------ the app, beat by beat
// Panel bodies (app px) for scrolls, measured on the plates
const PANEL_BODY = [955, 190, 457, 586];     // the settings panel's scroll box (its own 20 px fades at the edges)
const LIST_BODY = [29, 139, 1382, 692];      // inside the pane's border, so cards never run past its edge
const DLG_BODY = [441, 106, 558, 636];
const hov = (t, a, b) => t >= a && t < b;   // the cursor rests on a control from a to b

function drawApp(t) {
  // 1 · Matters → Explore → Workflows → New Workflow → chooser
  if (t < T.explore + .02) { plate('aMat'); return; }
  if (t < T.wfItem + .02) { plate('aMat'); plate('aExp', P(t, T.explore + .02, T.explore + .16)); return; }
  if (t < T.newWf + .02) { if (t < T.wfItem + .65) { push(t, T.wfItem + .02, 'aExp', 'wEmpty'); return; } plate('wEmpty'); return; }
  if (t < T.tpl + .02) { if (t < T.newWf + .65) { push(t, T.newWf + .02, 'wEmpty', 'bChoose'); return; } plate(hov(t, T.tpl - .75, T.tpl + .1) ? 'bChooseH' : 'bChoose'); return; }
  // the template list: Blank and the four examples; at 860 px the list scrolls to show the fourth
  if (t < T.red + .02) {
    if (t < T.scrollList) { xf('bChooseH', 'tPick', t, T.tpl + .02, .12); }
    else if (t < T.scrollList + .6) scrollStrip(t, T.scrollList, 'tPick', 'tPickS', 62, LIST_BODY);
    else plate(hov(t, T.red - .7, T.red + .1) ? 'tPickSR' : 'tPickS');
    const L1 = t < T.scrollList ? 'tPick' : 'tPickS';
    ring(t, WT('S06', 'blank') - .1, WT('S06', 'blank') + 1.2, R('tPick', 't:Blank Workflow'), 6, 5);
    ring(t, WT('S07', 'contract') - .1, WT('S07', 'contract') + 1.4, R(L1, 't:Contract Redline Response (Example)') && [353, R(L1, 't:Contract Redline Response (Example)')[1], 236, 20], 6, 5);
    ring(t, WT('S07', 'daily') - .1, WT('S07', 'daily') + 1.4, [353, R(L1, 't:Daily Morning Briefing (Example)')[1], 216, 20], 6, 5);
    ring(t, WT('S07', 'matter') - .1, WT('S07', 'matter') + 1.4, [353, R(L1, 't:Matter Status Memo (Example)')[1], 196, 20], 6, 5);
    if (t > T.scrollList + .5) ring(t, WT('S07', 'intake') - .3, vEnd('S07') + .5, [353, R('tPickS', 't:Intake to Advice: Full Case Workup (Example)')[1], 300, 20], 6, 5);
    return;
  }
  // 2 · the redline example: its canvas, then each step's settings
  if (t < T.trig + .02) { plate('rCanvas'); return; }
  if (t < T.cond + .02) {
    if (t < T.trigScroll) plate('rTrig0'); else if (t < T.trigScroll + .6) scrollStripNM(t, T.trigScroll, 'rTrig0', 'rTrig', 'rTrig0NM', 'rTrigNM', 226, PANEL_BODY); else plate('rTrig');
    if (t > T.trigScroll + .6) sweep(t, WT('S10', 'word') - .1, R('rTrig', 'phrase:Attachment filename ends'), T.cond - .3);
    return;
  }
  if (t < T.rev + .02) { plate('rCond'); sweep(t, WT('S11', 'really') - .2, R('rCond', 'phrase:Is it a contract or lega'), T.rev - .3); return; }
  if (t < T.doc + .02) { plate('rRev'); sweep(t, WT('S12', 'reviews') - .1, R('rRev', 'phrase:Review every tracked cha'), T.doc - .3); return; }
  if (t < T.cmp + .02) { plate('rDoc'); sweep(t, WT('S14', 'new') - .2, R('rDoc', "phrase:with the counterparty's "), T.cmp - .3); return; }
  if (t < T.send + .02) { plate('rCmp'); sweep(t, T.cmp + .45, R('rCmp', 'phrase:Write the body of the ha'), T.send - .25); return; }
  if (t < T.back + .02) {
    if (t < T.sendScroll) plate('rSend'); else scrollBlend(t, T.sendScroll, 'rSend', 'rSend3', PANEL_BODY);
    ring(t, WT('S15', 'own') - .2, T.sendScroll - .05, R('rSend', 'chip:{{context.userEmail}}'), 6, 3);
    ring(t, WT('S16', 'attachment') - .2, vEnd('S17') - .2, R('rSend3', 'chip:{{steps.counter-edit.files}}'), 6, 3);
    ring(t, WT('S16', 'counter') - .2, vEnd('S16') + .4, R('rSend3', 'node:step-draft-counter'), 9, 3);   // the step the file comes from
    return;
  }
  // 3 · back to the list, the intake example
  if (t < T.newWf2 + .02) { if (t < T.back + .65) { push(t, T.back + .02, 'rSend3', 'wEmpty'); return; } plate('wEmpty'); return; }
  if (t < T.tpl2 + .02) { if (t < T.newWf2 + .65) { push(t, T.newWf2 + .02, 'wEmpty', 'bChoose'); return; } plate(hov(t, T.tpl2 - .6, T.tpl2 + .1) ? 'bChooseH' : 'bChoose'); return; }
  if (t < T.intake + .02) {
    if (t < T.scroll2) xf('bChooseH', 'tPick', t, T.tpl2 + .02, .12);
    else if (t < T.scroll2 + .6) scrollStrip(t, T.scroll2, 'tPick', 'tPickS', 62, LIST_BODY);
    else plate(hov(t, T.intake - .55, T.intake + .1) ? 'tPickI' : 'tPickS');
    return;
  }
  if (t < T.scope + .02) {
    plate('iCanvas');
    const N = id => R('iCanvas', 'node:' + id);
    ring(t, WT('S20', 'checks') - .1, vEnd('S20') + .3, N('step-in-scope'), 9, 3);
    ring(t, WT('S21', 'politely') - .2, vEnd('S21') + .3, N('step-refer-out'), 9, 3);
    ring(t, WT('S22', 'checks') - .1, vEnd('S22') + .3, N('step-complete-check'), 9, 3);
    ring(t, WT('S23', 'asks') - .2, vEnd('S23') + .3, N('step-request-info'), 9, 3);
    ring(t, WT('S24', 'triages') - .1, WT('S24', 'builds') - .1, N('step-triage'), 9, 3);
    ring(t, WT('S24', 'builds') - .1, vEnd('S24') + .3, N('step-dossier'), 9, 3);
    ring(t, WT('S25', 'approves') - .3, VO.S26 + .2, N('step-lawyer-review'), 9, 3);
    ring(t, WT('S26', 'advice') - .1, WT('S26', 'next') - .1, N('step-advice-report'), 9, 3);
    ring(t, WT('S26', 'next') - .1, WT('S26', 'sends') - .1, N('step-draft-next-step'), 9, 3);
    ring(t, WT('S26', 'sends') - .1, vEnd('S26') + .4, N('step-send-advice'), 9, 3);
    return;
  }
  // 4 · make it yours: the scope question, then the approver
  if (t < T.scopeSave + .02) {
    if (t < T.taScroll) { plate('iScope'); return; }
    if (t < T.selA) { xf('iScope', 'mScopeScr', t, T.taScroll, .25); return; }
    if (t < T.typeA) {   // drag-select the practice-area words, line by line as the cursor moves
      plate('mScopeScr'); const lines = R('mScopeSel', "phrase:the firm's civil and com"); const k = P(t, T.selA, T.selB, E.io);
      const tot = lines.reduce((s, l) => s + l[2], 0); let left = k * tot;
      for (const [x, y, w, h] of lines) { const u = Math.min(w, left); if (u > 0) region('mScopeSel', [x - 1, y - 2, u + 2, h + 4]); left -= w; }
      return;
    }
    if (t < T.typeB + .1) { plate('mScopeT'); const b = RECTS.scopeType.box, f = Math.round(P(t, T.typeA, T.typeB, E.lin) * (SEQ.scope - 1));
      ctx.drawImage(IMG[`scope_${String(f).padStart(2, '0')}`], b[0], b[1], b[2], b[3]); return; }
    plate(hov(t, T.scopeSave - .55, T.scopeSave + .1) ? 'mScopeSaveH' : 'mScopeT'); return;
  }
  if (t < T.pa + .02) { plate('mScopeSaved'); return; }
  if (t < T.who + .02) { plate('mPa'); return; }
  if (t < T.whoPick + .02) { if (t < T.who + .16) xf('mPa', 'mPaWhoDD', t, T.who + .02, .12); else plate(hov(t, T.whoPick - .45, T.whoPick + .1) ? 'mPaWhoDDH' : 'mPaWhoDD'); return; }
  if (t < T.appr + .02) { plate('mPaWho'); return; }
  if (t < T.apprPick + .02) { if (t < T.appr + .16) xf('mPaWho', 'mPaApprDD', t, T.appr + .02, .12); else plate(hov(t, T.apprPick - .45, T.apprPick + .1) ? 'mPaApprDDH' : 'mPaApprDD'); return; }
  if (t < T.paSave + .02) { plate(hov(t, T.paSave - .5, T.paSave + .1) ? 'mPaSaveH' : 'mPaAppr'); return; }
  // 5 · name it, publish
  if (t < T.title + .02) { plate(hov(t, T.title - .45, T.title + .1) ? 'mTitleH' : 'mPaSaved'); return; }
  if (t < T.nameA) { plate('mTitleE'); if (t >= T.selAll) selectAllTitle(t); keycap(t, T.selAll - .05, T.nameA + .1, '⌘ A', 438, 98); return; }
  if (t < T.enter + .02) { plate('mTitleT'); typeIn(t, 'mTitle0', 'mTitleT', titleRect(), NAME, 13.5, 600, T.nameA, T.nameB, { ox: 8, caretH: 17 }); keycap(t, T.enter - .1, T.enter + .5, 'Return', 340, 98); return; }
  if (t < T.publish + .02) { plate(hov(t, T.publish - .45, T.publish + .1) ? 'mPubH' : 'mPub'); keycap(t, T.enter - .1, T.enter + .5, 'Return', 340, 98); return; }
  // the explainer's own frames (dialog in, then its looping illustration); the builder stays underneath while it fades in
  if (t < T.next + .02) { const k = P(t, T.publish + .02, T.publish + .3, E.io); if (k < 1) plate('mPubH'); ctx.save(); ctx.globalAlpha *= k; seq('pub1', t, T.publish + .02 - .4, 4); ctx.restore(); return; }
  if (t < T.gotIt + .02) { const k = P(t, T.next + .02, T.next + .3, E.io); seq('pub1', t, T.publish + .02 - .4, 4); ctx.save(); ctx.globalAlpha *= k; seq('pub2', t, T.next + .02 - .5, 5); ctx.restore(); return; }
  // 6 · switch it on in the matter
  if (t < T.matters + .02) { xf('pub2_44', 'pAfter', t, T.gotIt + .02, .2); return; }
  if (t < T.wfIcon + .02) { if (t < T.matters + .65) { push(t, T.matters + .02, 'pAfter', 'aMat'); return; } plate(hov(t, T.wfIcon - .5, T.wfIcon + .1) ? 'aMatH' : 'aMat'); return; }
  if (t < T.activate + .02) { if (t < T.wfIcon + .65) { push(t, T.wfIcon + .02, 'aMatH', 'mtList'); return; } plate(hov(t, T.activate - .55, T.activate + .1) ? 'mtListH' : 'mtList'); return; }
  if (t < T.dlgScroll) { xf('mtListH', 'mtCfg0', t, T.activate + .02, .2);
    ring(t, WT('S33', 'intake') - .25, vEnd('S33') + .3, R('mtCfg0', 'field:e.g. Contract Review'), 8, 3); return; }
  if (t < T.dlgScroll + .7) scrollStripNM(t, T.dlgScroll, 'mtCfg0', 'mtCfg1', 'mtCfg0NM', 'mtCfg1NM', 380, R('mtCfg0', 'scroller') || DLG_BODY, { dur: .7, fade: 0 }); else plate('mtCfg1');
  if (t > T.dlgScroll + .7) {
    ring(t, WT('S34', 'connect') - .2, WT('S34', 'sending') - .1, R('mtCfg1', 't:Not connected to this matter'), 6, 4);
    ring(t, WT('S34', 'sending') - .2, WT('S34', 'activate') - .2, R('mtCfg1', 't:Connect and turn on sending'), 8, 3);
    ring(t, WT('S34', 'activate') - .2, T.exit - .2, R('mtCfg1', 't:Activate'), 9, 3);
  }
}
const padR = (r, p) => r && [r[0] - p, r[1] - p, r[2] + 2 * p, r[3] + 2 * p];
// the attachment chip in the Send Email settings ({{steps.counter-edit.files}}), measured on its plate
function chipOf(pl) { const r = R(pl, 't:File attachments (optional)'); return r ? [r[0], r[1] + 26, 166, 22] : null; }
function titleRect() { const r = R('mTitleT', 't:' + NAME) || R('mTitleT', 'Edit workflow name'); return r ? [r[0] - 9, r[1] - 3, r[2] + 30, r[3] + 6] : [120, 95, 300, 32]; }
// ⌘A: the whole name selected (the browser's own selection colour) before the new one is typed over it
function selectAllTitle(t) { const r = R('mTitleE', 't:Intake to Advice: Full Case Workup (Example)'); if (!r) return; const k = P(t, T.selAll, T.selAll + .08);
  ctx.save(); ctx.globalAlpha *= k; ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgb(180,213,254)'; ctx.fillRect(r[0] + 1, r[1] + 3, r[2] - 2, r[3] - 6); ctx.restore(); }

// ------------------------------------------------------------------ cursor
// [moveStart, arrive, target]; targets in app px, or a [plate, rect key, dx, dy]
function cursorPath() {
  const at = (n, k, dx = 0, dy = 0) => { const r = R(n, k); return r ? [r[0] + r[2] / 2 + dx, r[1] + r[3] / 2 + dy] : [720, 430]; };
  // a step card is clicked on its upper right, clear of its name; afterwards the cursor rests off the card
  const node = (pl, id) => { const r = R(pl, 'node:' + id); return r ? [r[0] + r[2] * .8, r[1] + r[3] * .3] : [720, 430]; };
  const off = (pl, id) => { const r = R(pl, 'node:' + id); return r ? [r[0] + r[2] + 70, r[1] + r[3] * .5] : [760, 430]; };
  const lv = (k, n = 1) => ['tPickS', 't:' + k];
  return [
    [T.push + .2, T.push + .21, 'enter'], [T.push + .5, T.explore - .05, at('aMat', 't:Explore')],
    [T.explore + .25, T.wfItem - .05, at('aExp', 't:Workflows', -70)], [T.wfItem + .7, T.newWf - .05, at('wEmpty', 'New Workflow')],
    [T.newWf + .8, T.newWf + 1.5, [760, 330]], [T.tpl - 1.1, T.tpl - .75, at('bChoose', 't:Start from a template', -110)],
    [T.tpl + .4, T.tpl + 1.0, [1220, 470]],
    [T.red - 1.2, T.red - .7, at('tPickS', 't:Contract Redline Response (Example)', -250)],
    [T.red + .3, T.red + 1.0, [1150, 330]],
    [T.trig - .75, T.trig - .05, node('rCanvas', 'trigger-1')], [T.trig + .25, T.trig + .7, off('rTrig0', 'trigger-1')],
    [T.cond - .7, T.cond - .05, node('rTrig0', 'step-is-redline')], [T.cond + .2, T.cond + .65, off('rTrig0', 'step-is-redline')],
    [T.rev - .7, T.rev - .05, node('rTrig0', 'step-review')], [T.rev + .2, T.rev + .65, off('rTrig0', 'step-review')],
    [T.doc - .7, T.doc - .05, node('rTrig0', 'step-draft-counter')], [T.doc + .2, T.doc + .65, off('rTrig0', 'step-draft-counter')],
    [T.cmp - .7, T.cmp - .05, node('rTrig0', 'step-compose-email')], [T.cmp + .2, T.cmp + .65, off('rTrig0', 'step-compose-email')],
    [T.send - .55, T.send - .05, node('rTrig0', 'step-email-lawyer')],
    [T.send + .4, T.send + 1.0, [880, 640]],
    [T.back - .75, T.back - .05, at('rSend', 'Workflows#2')],
    [T.back + .7, T.newWf2 - .05, at('wEmpty', 'New Workflow')],
    [T.newWf2 + .7, T.tpl2 - .6, at('bChoose', 't:Start from a template', -110)],
    [T.tpl2 + .2, T.scroll2, [1220, 560]],
    [T.intake - 1.0, T.intake - .55, at('tPickS', 't:Intake to Advice: Full Case Workup (Example)', -200)],
    [T.intake + .3, T.intake + 1.0, [1060, 480]],
    [T.scope - .8, T.scope - .05, node('iCanvas', 'step-in-scope')],
    [T.taScroll + .1, T.selA - .05, selPt(0)], [T.selA, T.selB, selPt(1)],
    [T.selB + .1, T.typeA + .2, [1290, 660]],   // off the field while typing
    [T.typeB + .05, T.scopeSave - .55, at('iScope', 'Save Draft#2')],
    [T.pa - .75, T.pa - .05, node('mScopeSaved', 'step-lawyer-review')],
    [T.who - .6, T.who - .05, at('mPa', 'Any team member with matter access', -80)],
    [T.who + .2, T.whoPick - .45, at('mPaWhoDD', 't:A specific person', -10)],
    [T.whoPick + .15, T.appr - .05, at('mPaWho', 'Select a team member...', -80)],
    [T.appr + .2, T.apprPick - .45, at('mPaApprDD', 't:adam.frith@aldridgevine.co.uk (Admin)', -40)],
    [T.apprPick + .15, T.paSave - .5, at('mPaAppr', 'Save Draft#2')],
    [T.paSave + .2, T.title - .45, at('mTitleE', 't:Intake to Advice: Full Case Workup (Example)', 20)],
    [T.title + .1, T.selAll - .1, at('mTitleE', 't:Intake to Advice: Full Case Workup (Example)', 30, 26)],
    [T.enter + .05, T.publish - .45, at('mPub', 'Publish')],
    [T.publish + .5, T.next - .5, at('pub1', 'Next')],
    [T.next + .4, T.gotIt - .4, at('pub2', 'Got it')],
    [T.gotIt + .25, T.matters - .05, at('pAfter', 't:Matters')],
    [T.matters + .7, T.wfIcon - .5, at('aMat', 'Workflows')],
    [T.wfIcon + .7, T.activate - .55, at('mtList', 'Activate')],
    [T.activate + .3, T.activate + 1.0, [1110, 600]],
    [T.dlgScroll + .9, T.dlgScroll + 1.6, [880, 690]],
    [T.exit - .9, T.exit - .2, 'exit'],
  ];
}
// the selection drag: from the first letter of the practice-area words to the end of the last line
function selPt(end) { const l = RECTS.mScopeSel && RECTS.mScopeSel["phrase:the firm's civil and com"]; if (!l) return [1180, 500];
  if (!end) return [l[0][0] + 1, l[0][1] + l[0][3] / 2]; const z = l[l.length - 1]; return [z[0] + z[2] - 1, z[1] + z[3] / 2]; }
const CLICKS = [T.explore, T.wfItem, T.newWf, T.tpl, T.red, T.trig, T.cond, T.rev, T.doc, T.cmp, T.send, T.back, T.newWf2, T.tpl2, T.intake,
  T.scope, T.scopeSave, T.pa, T.who, T.whoPick, T.appr, T.apprPick, T.paSave, T.title, T.publish, T.next, T.gotIt, T.matters, T.wfIcon, T.activate];
const KEYS = [T.selAll, T.enter];
const DRAGS = [[T.selA - .06, T.selB + .04]];
const SCROLLS = [T.scrollList, T.scroll2, T.trigScroll, T.sendScroll, T.dlgScroll];
const CURSOR_ON = [[T.push + .2, T.exit - .2]];
function cursorAt(t) {
  if (!CURSOR_ON.some(([a, b]) => t >= a && t < b)) return null;
  const path = cursorPath(); let pos = null;
  for (const [a, b, tg] of path) {
    const p = tg === 'enter' ? 'S:1980,1140' : tg === 'exit' ? 'S:2000,1150' : tg;
    if (!pos) pos = p;
    if (t >= b) { pos = p; continue; }
    if (t > a) { const k = DRAGS.some(([d0, d1]) => a >= d0 - .01 && b <= d1 + .01) ? E.io((t - a) / (b - a)) : E.io((t - a) / (b - a)); pos = typeof pos === 'string' || typeof p === 'string' ? p : [L(pos[0], p[0], k), L(pos[1], p[1], k)]; }
    break;
  }
  return { app: pos };
}
function cursor(t, cam) {
  const cu = cursorAt(t); if (!cu) return;
  let pos = cu.app; if (typeof pos === 'string') pos = pos.slice(2).split(',').map(Number); else pos = toScreen(cam, pos[0], pos[1]);
  const press = CLICKS.some(cc => t >= cc - .07 && t < cc + .15) || DRAGS.some(([a, b]) => t >= a && t < b);
  for (const cc of CLICKS) if (t >= cc && t < cc + .45) { const k = (t - cc) / .45; ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#C9A733'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(pos[0], pos[1], 9 + 26 * E.out(k), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  ctx.save(); ctx.translate(pos[0] - 7, pos[1] - 4); const s = 34 / 30 * (press ? .86 : 1); ctx.scale(s, s);
  const p = new Path2D('M6 3 L6 24 L11.2 19.3 L14.6 27 L18.2 25.4 L14.9 17.9 L22 17.6 Z');
  ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1;
  ctx.fillStyle = '#1d1813'; ctx.fill(p); ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round'; ctx.stroke(p); ctx.restore();
}

// ------------------------------------------------------------------ caption pill, title, end card (as 1.1, 1.2, 8.1, 10.2)
let globalT = 0, CAM_S = 1.08;
function words(text, x, y, t0, step, size, weight, color, fam = 'Neco') {
  font(weight, size, fam); ctx.fillStyle = color; ctx.textBaseline = 'alphabetic';
  let cx = x;
  text.split(' ').forEach((w, i) => {
    const k = P(globalT, t0 + i * step, t0 + i * step + .5, E.q);
    if (k > 0) { ctx.save(); ctx.globalAlpha *= k; ctx.fillText(w, cx, y + (1 - k) * 44); ctx.restore(); }
    cx += ctx.measureText(w + ' ').width;
  });
}
function caption(t) {
  const first = CAP[0][0];
  if (t < first || t > CAP_END + .1) return;
  let ci = 0; for (let i = 0; i < CAP.length; i++) if (t >= CAP[i][0]) ci = i;
  const [t0, n, text] = CAP[ci];
  const Hh = 62, Rr = 21, PAD = 90;
  font(500, 26, 'Neco'); const widthOf = s => ctx.measureText(s).width + PAD;
  const open = P(t, first + .12, first + .55, E.qio), close = P(t, CAP_END - .45, CAP_END - .05, E.qio);
  let w = widthOf(text);
  if (ci > 0) w = L(widthOf(CAP[ci - 1][2]), w, P(t, t0, t0 + .45, E.qio));
  w = L(Hh, w, open * (1 - close));
  const pop = (x => x <= 0 ? 0 : E.back(x))(cl((t - first) / .32)) * (1 - P(t, CAP_END - .1, CAP_END + .1, E.io));
  if (pop <= 0) return;
  const x = 960 - w / 2, y = 1022 - Hh / 2;
  ctx.save();
  ctx.translate(960, y + Hh / 2); ctx.scale(pop, pop); ctx.translate(-960, -(y + Hh / 2));
  ctx.shadowColor = 'rgba(35,30,25,.10)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4; ctx.fillStyle = '#FFFFFF'; rr(x, y, w, Hh, Hh / 2); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#DDD1BE'; ctx.lineWidth = 1; ctx.stroke();
  ctx.save(); rr(x, y, w, Hh, Hh / 2); ctx.clip();
  ctx.fillStyle = '#F7E17E'; ctx.beginPath(); ctx.arc(x + 31, y + Hh / 2, Rr, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(x + 31, y + Hh / 2, Rr, 0, Math.PI * 2); ctx.clip();
  font(700, n >= 10 ? 17 : 19); ctx.fillStyle = '#231E19'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const nk = ci > 0 ? P(t, t0, t0 + .35, E.qio) : 1;
  if (ci > 0 && nk < 1) { ctx.globalAlpha = 1 - nk; ctx.fillText(String(CAP[ci - 1][1]), x + 31, y + Hh / 2 + 1 - nk * 22); }
  ctx.globalAlpha = nk; ctx.fillText(String(n), x + 31, y + Hh / 2 + 1 + (1 - nk) * 22); ctx.restore();
  font(500, 26, 'Neco'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#231E19';
  const tin = ci === 0 ? P(t, first + .35, first + .7, E.q) : P(t, t0 + .12, t0 + .5, E.q);
  const tout = ci > 0 ? 1 - P(t, t0, t0 + .15, E.io) : 0;
  const fadeEnd = 1 - P(t, CAP_END - .5, CAP_END - .3, E.io);
  if (tout > 0) { ctx.globalAlpha = tout * fadeEnd; ctx.fillText(CAP[ci - 1][2], x + 64, y + Hh / 2 + 1 - (1 - tout) * 10); }
  ctx.globalAlpha = tin * fadeEnd; ctx.fillText(text, x + 64, y + Hh / 2 + 1 + (1 - tin) * 12);
  ctx.restore(); ctx.restore();
}
function mascot(pose, t, start, end, x, y, w, { from = 'bottom', flip = false } = {}) {
  if (t < start || t > end) return;
  const m = MMETA[pose], fr = MASC[pose][Math.floor((t - start) * m.fps) % m.frames];
  const h = w * m.size[1] / m.size[0];
  const vin = P(t, start, start + .6, E.back), vout = P(t, end - .4, end, E.io);
  let dy = 0, sc = 1;
  if (from === 'bottom') dy = (1 - vin) * 600 + vout * 600; else sc = Math.max(.001, P(t, start, start + .5, E.back) * (1 - vout));
  const land = P(t, start + .45, start + .7) * (1 - P(t, start + .7, start + 1));
  ctx.save(); ctx.translate(x + w / 2, y + h + dy); ctx.scale((flip ? -1 : 1) * sc * (1 + .04 * land), sc * (1 - .06 * land));
  ctx.drawImage(fr, -w / 2, -h, w, h); ctx.restore();
  return { x, y, w, h, dy, sc };
}
const TITLE = { tag: 'ANDRI ACADEMY · 10.3', l1: 'Start from a ready example', l2: 'overnight redline, new client intake.' };
function title(t) {
  if (t > T.push + .9) return;
  const up = P(t, T.push, T.push + .8, E.qio);
  ctx.save(); ctx.translate(0, -up * 1080);
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  ctx.fillStyle = '#F7E17E'; ctx.fillRect(0, 0, W, H);
  const e = P(t, 0.3, 0.75); font(600, 22); ctx.fillStyle = '#494746'; ctx.globalAlpha = e;
  ctx.letterSpacing = '3px'; ctx.fillText(TITLE.tag, 122, 392); ctx.letterSpacing = '0px'; ctx.globalAlpha = 1;
  font(500, 128, 'Neco'); const s1 = Math.min(128, Math.floor(128 * 1040 / ctx.measureText(TITLE.l1).width));
  words(TITLE.l1, 120, 530, 0.5, .09, s1, 500, '#231E19');
  font(400, 84, 'Neco'); const s2 = Math.min(84, Math.floor(84 * 1000 / ctx.measureText(TITLE.l2).width));
  words(TITLE.l2, 120, 640, 1.15, .09, s2, 400, '#231E19');
  mascot('wave', t, .25, T.push + .9, 1180, 330, 640);
  ctx.restore();
}
const NEXT = 'Andri Academy · Next: Before you invite a colleague';
function endCard(t) {
  if (t < END) return;
  font(500, 25); const tw = ctx.measureText(NEXT).width, bw = Math.max(520, tw), gx = Math.round((1920 - (bw + 30 + 330)) / 2), mx = gx + bw + 30 - 45;
  const a = P(t, END + .05, END + .65), dy = (1 - P(t, END + .05, END + .75, E.q)) * 24;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(0, dy);
  ctx.drawImage(IMG.logo, gx - 3, 438, 520, 520 * 600 / 2299);
  ctx.fillStyle = '#494746'; ctx.textBaseline = 'alphabetic'; ctx.fillText(NEXT, gx, 635);
  ctx.restore();
  const m = mascot('done', t, END + .25, DURATION + 2, mx, 400, 420, { from: 'pop' });
  if (m) {
    const b = MMETA.done.badge, sc = m.sc;
    const bx = m.x + m.w / 2 + (b[0] * m.w + b[2] * m.w / 2 - m.w / 2) * sc, by = m.y + m.h + (b[1] * m.h + b[3] * m.h / 2 - m.h) * sc;
    const fi = Math.floor((t - END - .25) * MMETA.disc.fps) % MMETA.disc.frames, mw = m.w * m.sc, mh = m.h * m.sc;
    const ox = m.x + m.w / 2 - mw / 2, oy = m.y + m.h + m.dy - mh;
    const x = cl((t - END - .75) / .34), k = x <= 0 ? 0 : E.back(x);
    if (k > 0) {
      ctx.save(); ctx.globalAlpha *= cl(x * 4);
      ctx.translate(bx, by); ctx.rotate((1 - k) * -0.35); ctx.scale(k, k); ctx.translate(-bx, -by);
      ctx.drawImage(MASC.tick[fi], ox, oy, mw, mh); ctx.restore();
    }
  }
}

// the window is drawn on its own canvas and faded as one picture (known-issues #12)
const OFF = document.createElement('canvas'); OFF.width = W; OFF.height = H; const octx = OFF.getContext('2d');
async function renderFrame(t) {
  if (!READY) READY = load();
  await READY;
  globalT = t;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.textAlign = 'left';
  background(t);
  const cam = camera(t); CAM_S = cam.s;
  if (cam.o > 0 && t > T.push - .1) {
    const [x, y, w, h] = cam.clip; const [sx, sy] = toScreen(cam, x, y); const sw = w * cam.s, sh = h * cam.s;
    const main = ctx, g = octx; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.globalAlpha = 1;
    g.save();
    g.shadowColor = 'rgba(35,30,25,.16)'; g.shadowBlur = 44; g.shadowOffsetY = 26; g.fillStyle = '#F2EFE9'; g.beginPath(); g.roundRect(sx, sy, sw, sh, cam.r); g.fill();
    g.shadowColor = 'rgba(35,30,25,.22)'; g.shadowBlur = 1; g.shadowOffsetY = 0; g.fill(); g.shadowColor = 'transparent';
    g.beginPath(); g.roundRect(sx, sy, sw, sh, cam.r); g.clip();
    g.translate(cam.cx - cam.fx * cam.s, cam.cy - cam.fy * cam.s); g.scale(cam.s, cam.s);
    CTX_SWAP(g, () => drawApp(t));
    g.restore();
    main.save(); main.globalAlpha = cam.o; main.drawImage(OFF, 0, 0); main.restore();
  }
  endCard(t);
  title(t);
  caption(t);
  cursor(t, cam);
}
// the drawing helpers use the global ctx: point it at another context while a block draws
function CTX_SWAP(g, fn) { const keep = ctx; ctx = g; try { fn(); } finally { ctx = keep; } }

// cue times for the sound mix (audio/clicks.mjs reads them from the page)
window.CUES = { CAP, VO, CLICKS: [...CLICKS, ...KEYS, ...DRAGS.map(d => d[0])].map(x => +x.toFixed(2)), WH: [T.push, T.wfItem, T.newWf, T.back, T.newWf2, T.matters, T.wfIcon], DUR: DURATION, T, END };
window.MG = { width: W, height: H, fps: FPS, duration: DURATION, renderFrame };
if (!navigator.webdriver) { const t0 = performance.now(); (function loop() { renderFrame(((performance.now() - t0) / 1000) % DURATION).then(() => requestAnimationFrame(loop)); })(); }
