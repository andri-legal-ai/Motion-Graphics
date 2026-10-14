// Andri Academy 1.2 · In-Depth or Plan
// Everything is drawn on one <canvas> by renderFrame(t), a pure function of time t (seconds).
// App screens are still plates of the Andri rebuild (plates/*.png, 2x); all motion is drawn here.
// Engine, camera, captions, cursor, mascot and end card follow the approved 1.1 video.

const W = 1920, H = 1080, FPS = 60, DURATION = 64.5;
const c = document.getElementById('c'); c.width = W; c.height = H;
const ctx = c.getContext('2d');
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
const V2 = (t, a, b, fi = .35, fo = .3) => Math.min(P(t, a, a + fi), 1 - P(t, b - fo, b, E.io)); // visible window

// ------------------------------------------------------------------ assets
const IMG = {}, MASC = {};
let RECTS, MMETA, READY = null;
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(src); i.src = src; }); }
async function load() {
  RECTS = window.RECTS_DATA; MMETA = window.MASCOT_DATA;
  const plates = ['m1', 'chat', 'split', 'cboxMid', 'cboxMidOn', 'cboxDock', 'cboxDockPlan', 'cboxDockPlanOn', 'cboxSplit', 'disc', 'discSplit',
    'menu0', 'menuDeep', 'menuPlan', 'dq1', 'dq1hot', 'dq2', 'dq2hot', 'dbar', 'planDisc', 'planWork', 'planDone', 'ppFrame', 'ppin', 'ppinEmpty', 'thread'];
  const jobs = plates.map(n => loadImg(ROOT + 'plates/' + n + '.png').then(i => IMG[n] = i));
  jobs.push(loadImg(ROOT + 'assets/Andri-Logo-Ink.svg').then(i => IMG.logo = i));
  for (const pose of Object.keys(MMETA)) {
    MASC[pose] = [];
    for (let f = 0; f < MMETA[pose].frames; f++) jobs.push(loadImg(`${ROOT}assets/mascot/${pose}/f${String(f).padStart(3, '0')}.png`).then(i => MASC[pose][f] = i));
  }
  const fonts = [['Neco', 'Neco-400', '400'], ['Neco', 'Neco-500', '500'], ['Neco', 'Neco-700', '700'], ['Rethink', 'RethinkSans', '400 800']];
  for (const [fam, file, w] of fonts) { const f = new FontFace(fam, `url(${ROOT}assets/fonts/${file}.woff2)`, { weight: w }); jobs.push(f.load().then(ff => document.fonts.add(ff))); }
  await Promise.all(jobs);
  await document.fonts.ready;
}

// ------------------------------------------------------------------ helpers
const R = (set, id) => RECTS[set][id];                       // [x,y,w,h] in app px
const box = n => RECTS[n].box;
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function plate(name, x = 0, y = 0, w = 1440, h = 860) { ctx.drawImage(IMG[name], x, y, w, h); }
function sprite(name, alpha = 1, dx = 0, dy = 0, scale = 1) {
  if (alpha <= 0) return;
  const [x, y, w, h] = box(name); ctx.save(); ctx.globalAlpha *= alpha;
  ctx.translate(x + w / 2 + dx, y + h / 2 + dy); ctx.scale(scale, scale);
  ctx.drawImage(IMG[name], -w / 2, -h / 2, w, h); ctx.restore();
}
function font(w, s, fam = 'Rethink') { ctx.font = `${w} ${s}px ${fam}`; }
// gold ring around a rect (app px), fades in and out over [a, b]
function ring(t, a, b, r, rad = 10, pad = 5) {
  const v = V2(t, a, b, .25, .3); if (v <= 0) return;
  const g = P(t, a, a + .35, E.back);
  ctx.save(); ctx.globalAlpha *= v; ctx.strokeStyle = '#E9CD4F'; ctx.lineWidth = 3;
  const p = pad + (1 - g) * 6; rr(r[0] - p, r[1] - p, r[2] + p * 2, r[3] + p * 2, rad + p); ctx.stroke(); ctx.restore();
}
const C = r => [r[0] + r[2] / 2, r[1] + r[3] / 2];

// ------------------------------------------------------------------ timeline (video seconds)
// narration (ElevenLabs, "UK voice voice to use for ANDRI vids") start times, matched to audio/mix-uk.wav
const VO = { L0b: 0.6, L1: 7.0, L2: 13.0, L3: 24.5, L4: 31.5, L5a: 37.5, L5b: 44.8, L6: 46.9, L7: 51.0, L8: 58.2 };
const SWOT = 'Provide a detailed SWOT analysis of Calderdale Logistics Limited’s position on the…';
const TASK = 'Prepare Ms Nair for the remedy hearing.';
const SEND1 = 14.9, SEND2 = 29.35, PICK1 = 36.1, PICK2 = 37.05, SPLIT = 38.2;

// cursor: [t0, t1, target]; targets in app px (resolved through the camera at draw time)
const MENU_DY = 190; // menu and label move down by this much when the chat box is docked
function cursorPath() {
  const lm = R('m1', 'modeLbl'), ld = R('chat', 'modeLbl'), md = R('menu0', 'miDeep'), mp = R('menu0', 'miPlan');
  const d1 = RECTS.dq1, d2 = RECTS.dq2, db = RECTS.dbar;
  return [
    [7.3, 7.31, 'enter'], [7.5, 8.3, C(lm)], [9.2, 9.7, C(md)], [10.2, 10.7, C(mp)], [11.3, 11.8, C(md)], [12.3, 12.9, 'exit'],
    [13.9, 13.91, 'exit'], [14.0, 14.6, C(R('m1', 'go'))], [15.0, 15.6, [1300, 830]],
    [23.5, 23.51, 'enter'], [23.6, 24.4, C(ld)], [25.2, 25.8, [C(mp)[0], C(mp)[1] + MENU_DY]], [26.6, 27.2, [1000, 830]], [28.6, 29.1, C(R('chat', 'go'))], [29.5, 30.0, 'exit'],
    [33.2, 33.21, 'exit'], [33.3, 34.1, [C(d1.dopt2)[0] - 120, C(d1.dopt2)[1]]], [34.8, 35.2, [C(d1.dother)[0] - 160, C(d1.dother)[1]]], [35.55, 35.95, [C(d1.dopt2)[0] - 120, C(d1.dopt2)[1]]],
    [36.35, 36.8, [C(d2.dopt0)[0] - 120, C(d2.dopt0)[1]]], [37.2, 37.8, 'exit'],
    [44.5, 44.51, 'exit'], [44.6, 45.2, C(db.btExec)], [46.8, 47.2, C(db.btEdit)], [48.4, 48.8, C(db.btCancel)], [49.7, 50.4, 'exit'],
  ];
}
const CLICKS = [8.55, 12.05, SEND1, 24.55, 26.15, SEND2, PICK1, PICK2];
const CURSOR_ON = [[7.3, 12.9], [13.9, 15.6], [23.5, 30.0], [33.2, 37.8], [44.5, 50.4]];

// captions (step number, text) shown in the pill under the window, as in the storyboard
const CAP = [[7.0, 1, 'The mode button'], [13.0, 2, 'In-Depth: research, one reply'], [24.5, 3, 'Plan: approve first']];
const CAP_END = 56.4;

// ------------------------------------------------------------------ camera
const POSE = { s: 1.08, cx: 960, cy: 503 };
function zoomOn(r, maxW, maxH, cx = 960, cy = 500) { const s = Math.min(maxW / r[2], maxH / r[3]); return { fx: r[0] + r[2] / 2, fy: r[1] + r[3] / 2, s, cx, cy, clip: r, r: 18, o: 1 }; }
function shot(name) {
  const full = [0, 0, 1440, 860];
  if (name === 'screen') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy, clip: full, r: 22, o: 1 };
  if (name === 'below') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy + 1100, clip: full, r: 22, o: 1 };
  if (name === 'gone') return { fx: 720, fy: 430, s: POSE.s * .9, cx: POSE.cx - 520, cy: POSE.cy, clip: full, r: 22, o: 0 }; // same exit as 1.1
  if (name === 'menu') return zoomOn([440, 405, 620, 212], 1240, 720);
  if (name === 'dbar') return zoomOn([60, 612, 782, 200], 1560, 700);
  if (name === 'dbarOut') return { ...zoomOn([60, 612, 782, 200], 1560, 700), o: 0 }; // plain fade out, no zoom
}
const SHOTS = [[0, 'below', 0], [6.35, 'screen', 0.85], [8.75, 'menu', 0.75], [12.35, 'screen', 0.7], [43.6, 'dbar', 0.8], [56.3, 'dbarOut', 1.1]];
function camera(t) {
  let i = 0; while (i < SHOTS.length - 1 && SHOTS[i + 1][0] <= t) i++;
  const cur = shot(SHOTS[i][1]), d = SHOTS[i][2];
  if (i === 0 || d === 0) return cur;
  const prev = shot(SHOTS[i - 1][1]); const k = E.qio(cl((t - SHOTS[i][0]) / d));
  const o = {}; for (const key of ['fx', 'fy', 'cx', 'cy', 'r', 'o']) o[key] = L(prev[key], cur[key], k);
  o.s = Math.exp(L(Math.log(prev.s), Math.log(cur.s), k));
  o.clip = prev.clip.map((v, j) => L(v, cur.clip[j], k));
  return o;
}
const toScreen = (cam, x, y) => [cam.cx + (x - cam.fx) * cam.s, cam.cy + (y - cam.fy) * cam.s];

// ------------------------------------------------------------------ background
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

// ------------------------------------------------------------------ text: per word rise
let globalT = 0;
function words(text, x, y, t0, step, size, weight, color, tOut, fam = 'Neco') {
  font(weight, size, fam); ctx.fillStyle = color; ctx.textBaseline = 'alphabetic';
  const out = tOut == null ? 0 : P(globalT, tOut, tOut + .35, E.io);
  let cx = x; const parts = text.split(' ');
  parts.forEach((w, i) => {
    const k = P(globalT, t0 + i * step, t0 + i * step + .5, E.q);
    if (k > 0) { ctx.save(); ctx.globalAlpha = k * (1 - out); ctx.fillText(w, cx, y + (1 - k) * 44 - out * 22); ctx.restore(); }
    cx += ctx.measureText(w + ' ').width;
  });
}
function caret(t, x, y) { if (Math.floor(t * 2.2) % 2 === 0) { ctx.fillStyle = '#241E19'; ctx.fillRect(x + 1, y - 17, 1.5, 21); } }
function typed(t, text, a, b, x, y, upto) {
  const s = text.slice(0, Math.round(P(t, a, b, E.lin) * text.length));
  font(400, 17); ctx.fillStyle = '#241E19'; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y);
  if (t < upto) caret(t, x + ctx.measureText(s).width, y);
}
// scroll that eases between keyframes [time, value]
function eased(t, keys, d = .6) { let v = keys[0][1]; for (let i = 1; i < keys.length; i++) { const [a, x] = keys[i]; if (t < a) break; v = L(v, x, P(t, a, a + d, E.io)); } return v; }
function fadeBottom(x, w, alpha = 1) {
  const g = ctx.createLinearGradient(0, 644, 0, 844); g.addColorStop(0, 'rgba(254,253,251,0)'); g.addColorStop(.45, '#FEFDFB'); g.addColorStop(1, '#FEFDFB');
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = g; ctx.fillRect(x, 644, w, 200); ctx.restore();
}

// ------------------------------------------------------------------ the In-Depth conversation (1.1 plates)
const TH = () => RECTS.thread.items;
function swotEvents() {
  const it = TH(); const s1 = it.steps1_children, a1 = it.ans1_children;
  return [[15.2, it.ub1], ...s1.map((r, i) => [15.75 + i * .5, r]), [18.3, a1[0]], [18.9, a1[1]], [19.6, a1[2]], [20.0, a1[3]]];
}
function swotScroll(t) {
  let s = 0, prev = 0;
  for (const [a, r] of swotEvents()) { const target = Math.max(prev, r[1] + r[3] - 455); if (t < a) break; s = L(prev, target, P(t, a, a + .6, E.io)); prev = target; }
  return s;
}
function drawSwot(t, dy, alpha) {
  if (alpha <= 0) return;
  const sc = swotScroll(t);
  ctx.save(); ctx.beginPath(); ctx.rect(56, 140, 1382, 704); ctx.clip(); ctx.globalAlpha *= alpha;
  for (const [a, r] of swotEvents()) {
    const k = P(t, a, a + .4); if (k <= 0) continue;
    const [x, y, w, h] = r; ctx.save(); ctx.globalAlpha *= k;
    ctx.drawImage(IMG.thread, x * 2, y * 2, w * 2, h * 2, 56 + x, 140 + y - sc + dy + (1 - k) * 14, w, h); ctx.restore();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ the Plan conversation
function planItems(name) { return RECTS[name].items; }
const STEP_T = i => 29.95 + i * .22;
function planEvents(name) {
  const it = planItems(name), ev = [[29.55, 'p_ub']];
  for (let i = 0; i < 7; i++) ev.push([STEP_T(i), 'p_s' + i]);
  if (name === 'planDisc') ev.push([31.45, 'p_wait'], [31.6, 'p_banner']);
  if (name === 'planWork') ev.push([37.45, 'p_work']);
  if (name === 'planDone') ev.push([0, 'p_done'], [0, 'p_wait']);
  return ev.filter(e => it[e[1]]).map(([a, id]) => [a, it[id]]);
}
// scroll: the newest item sits above the chat box, or above the question card once it is open
function planScroll(t) {
  const it = planItems('planDisc');
  const bottom = id => 140 + it[id][1] + it[id][3];
  return eased(t, [[0, 0], [31.6, Math.max(0, bottom('p_banner') - 660)], [31.8, Math.max(0, bottom('p_banner') - (RECTS.dq1.box[1] - 22))], [37.2, 0]], .55);
}
function drawPlanThread(t, name, x0, w0, dy, alpha, sc) {
  if (alpha <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.rect(x0, 140, w0, 704); ctx.clip(); ctx.globalAlpha *= alpha;
  for (const [a, r] of planEvents(name)) {
    const k = P(t, a, a + .35); if (k <= 0) continue;
    const [x, y, w, h] = r; ctx.save(); ctx.globalAlpha *= k;
    ctx.drawImage(IMG[name], x * 2, y * 2, w * 2, h * 2, x0 + x, 140 + y - sc + dy + (1 - k) * 12, w, h); ctx.restore();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ the plan panel
const PANEL = () => RECTS.ppFrame.box;               // [858, 84, 580, 760]
const BODY_TOP = () => RECTS.ppin.box[1];            // panel body starts under the title
function panelScroll(t) {
  const it = RECTS.ppin.items, maxS = RECTS.ppin.box[3] - (PANEL()[1] + PANEL()[3] - BODY_TOP());
  return eased(t, [[0, 0], [40.0, Math.min(maxS, it.fr1[1] - 70)], [41.2, maxS]], .7);
}
function drawPanel(t, off) {
  const [px, py, pw, ph] = PANEL(), it = RECTS.ppin.items, by = BODY_TOP(), sc = panelScroll(t);
  ctx.save(); ctx.translate(off, 0);
  ctx.shadowColor = 'rgba(35,30,25,.12)'; ctx.shadowBlur = 30; ctx.drawImage(IMG.ppFrame, px, py, pw, ph); ctx.shadowColor = 'transparent';
  ctx.beginPath(); ctx.roundRect(px, by, pw, py + ph - by, [0, 0, 16, 16]); ctx.clip();
  const ox = RECTS.ppin.box[0], oy = by - sc;
  // content without the flow, then the flow draws itself in tier by tier
  ctx.drawImage(IMG.ppinEmpty, 0, sc * 2, pw * 2, (py + ph - by) * 2, ox, by, pw, py + ph - by);
  const f = it.flow, tiers = [f[1], 219, 301, 383, 466, f[1] + f[3]];
  for (let i = 0; i < 5; i++) {
    const k = P(t, 39.05 + i * .3, 39.45 + i * .3, E.io); if (k <= 0) continue;
    const y0 = tiers[i], y1 = L(y0, tiers[i + 1], k);
    ctx.save(); ctx.beginPath(); ctx.rect(ox + f[0], oy + y0, f[2], y1 - y0); ctx.clip();
    ctx.drawImage(IMG.ppin, 0, 0, pw * 2, RECTS.ppin.box[3] * 2, ox, oy, pw, RECTS.ppin.box[3]); ctx.restore();
  }
  // what you'll get, and what it won't do
  const fr = id => { const r = it[id]; return [ox + r[0] - 4, oy + r[1] - 2, r[2] + 8, r[3] + 2]; };
  ring(t, 40.55, 41.5, fr('fr1'), 10, 3);
  ring(t, 41.75, 43.4, fr('fr3'), 10, 3);
  ctx.restore();
}

// ------------------------------------------------------------------ the app
function drawApp(t) {
  // 1 greeting with the chat box in the middle, until the In-Depth question is sent
  const conv = P(t, SEND1 + .1, SEND1 + .7, E.io);
  if (conv < 1) {
    ctx.save(); ctx.globalAlpha *= 1 - conv;
    plate('m1');
    if (t >= 13.15) { const cb = R('m1', 'cbox'); sprite('cboxMidOn'); typed(t, SWOT, 13.2, 14.6, cb[0] + 18, cb[1] + 35, 14.85); }
    ring(t, 7.85, 8.6, R('m1', 'modeLbl'), 8, 6);
    menu(t, 8.6, 12.1, 0, t >= 11.75 ? 'menuDeep' : t >= 10.65 ? 'menuPlan' : t >= 9.65 ? 'menuDeep' : 'menu0');
    ctx.restore();
  }
  if (conv <= 0) return;
  const split = P(t, SPLIT + .45, SPLIT + .7, E.io);                     // conversation re-flows next to the plan
  const slide = P(t, SPLIT, SPLIT + .6, E.qio);                          // plan panel slides in
  ctx.save(); ctx.globalAlpha *= conv;
  plate('chat');
  // conversation: the In-Depth answer, then the Plan task pushes it up
  const push = P(t, SEND2 + .1, SEND2 + .75, E.io);
  drawSwot(t, -push * 640, 1 - push * .9);
  if (t >= SEND2) {
    const name = t >= 37.35 ? 'planWork' : 'planDisc';
    drawPlanThread(t, name, 56, 1382, (1 - push) * 640, 1 - split, planScroll(t));
  }
  fadeBottom(56, 1382, 1 - split);
  if (split > 0) {
    ctx.save(); ctx.globalAlpha *= split; plate('split');
    drawPlanThread(t, 'planDone', 56, 790, 0, 1, 0); fadeBottom(56, 790); ctx.restore();
  }
  dock(t, split);
  if (slide > 0) drawPanel(t, (1 - slide) * (PANEL()[2] + 40));
  ctx.restore();
}
function menu(t, a, b, dy, name) {
  const k = P(t, a, a + .2, E.out) * (1 - P(t, b, b + .15, E.io));
  if (k > 0) sprite(name, k, 0, dy + (1 - k) * 10);
}
function dock(t, split) {
  // chat box moves down from the greeting as the conversation starts
  const mv = P(t, SEND1 + .1, SEND1 + .7, E.io), mid = R('m1', 'cbox'), dk = R('chat', 'cbox');
  const y = L(mid[1], dk[1], mv);
  // wide chat box: In-Depth, then Plan Mode (picked at 26.15), back to In-Depth once the questions are answered
  const card = P(t, 31.75, 32.05, E.io) * (1 - P(t, PICK2 + .15, PICK2 + .4, E.io));   // question card replaces the chat box
  let name = 'cboxDock';
  if (t >= 26.15 && t < 37.3) name = t >= 27.6 && t < SEND2 + .05 ? 'cboxDockPlanOn' : 'cboxDockPlan';
  ctx.save(); ctx.globalAlpha *= (1 - split) * (1 - card);
  ctx.drawImage(IMG[name], dk[0], y, dk[2], dk[3]);
  if (t >= 27.6 && t < SEND2 + .05) typed(t, TASK, 27.65, 28.75, dk[0] + 18, dk[1] + 35, SEND2);
  ctx.restore();
  const d = box('disc'); ctx.save(); ctx.globalAlpha *= (1 - split) * mv * (1 - card); ctx.drawImage(IMG.disc, d[0], d[1], d[2], d[3]); ctx.restore();
  ring(t, 26.45, 27.45, R('cboxDockPlan', 'modeLbl'), 8, 6);
  menu(t, 24.6, 26.15, MENU_DY, t >= 25.75 ? 'menuPlan' : 'menu0');
  // the Plan discovery questions
  if (card > 0) {
    const q2 = t >= PICK1 + .15;
    const nm = q2 ? (t >= 36.75 ? 'dq2hot' : 'dq2') : (t >= 34.05 && !(t >= 35.15 && t < 35.85) ? 'dq1hot' : 'dq1');
    const swap = q2 ? P(t, PICK1 + .15, PICK1 + .45, E.out) : 1;
    sprite(nm, card * swap, 0, (1 - P(t, 31.75, 32.2, E.back)) * 30);
    if (!q2) ring(t, 35.05, 35.95, RECTS.dq1.dother, 10, 4);
  }
  // split: narrow chat box, greyed under the decision bar
  if (split > 0) {
    const bar = P(t, SPLIT + .7, SPLIT + 1.05, E.out);
    ctx.save(); ctx.globalAlpha *= split;
    ctx.save(); ctx.globalAlpha *= L(1, .45, bar); sprite('cboxSplit'); ctx.restore();
    sprite('discSplit');
    sprite('dbar', bar, 0, (1 - bar) * 10);
    const db = RECTS.dbar;
    ring(t, 45.05, 46.7, db.btExec, 9, 4);
    ring(t, 46.9, 48.4, db.btEdit, 9, 4);
    ring(t, 48.55, 50.0, db.btCancel, 9, 4);
    ring(t, 54.3, 56.0, R('split', 'modeLbl'), 8, 7);
    ctx.restore();
  }
}

// ------------------------------------------------------------------ mascot
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

// ------------------------------------------------------------------ overlays
function cursor(t, cam) {
  if (!CURSOR_ON.some(([a, b]) => t >= a && t < b)) return;
  const path = cursorPath(); let pos = null;
  const resolve = tg => {
    if (tg === 'enter') return [1980, 1140];
    if (tg === 'exit') return [2000, 1150];
    return toScreen(cam, tg[0], tg[1]);
  };
  for (const [a, b, tg] of path) { const p = resolve(tg); if (!pos) { pos = p; } if (t >= b) { pos = p; continue; } if (t > a) { const k = E.io((t - a) / (b - a)); pos = [L(pos[0], p[0], k), L(pos[1], p[1], k)]; } break; }
  const press = CLICKS.some(cc => t >= cc - .07 && t < cc + .15);
  for (const cc of CLICKS) if (t >= cc && t < cc + .45) { const k = (t - cc) / .45; ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#C9A733'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(pos[0], pos[1], 9 + 26 * E.out(k), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  ctx.save(); ctx.translate(pos[0] - 7, pos[1] - 4); const s = 34 / 30 * (press ? .86 : 1); ctx.scale(s, s);
  const p = new Path2D('M6 3 L6 24 L11.2 19.3 L14.6 27 L18.2 25.4 L14.9 17.9 L22 17.6 Z');
  ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1;
  ctx.fillStyle = '#1d1813'; ctx.fill(p); ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round'; ctx.stroke(p); ctx.restore();
}
function caption(t) {
  const first = CAP[0][0];
  if (t < first || t > CAP_END + .1) return;
  let ci = 0; for (let i = 0; i < CAP.length; i++) if (t >= CAP[i][0]) ci = i;
  const [t0, n, text] = CAP[ci];
  const H = 62, R = 21, PAD = 90;
  font(500, 26, 'Neco'); const widthOf = s => ctx.measureText(s).width + PAD;
  const open = P(t, first + .12, first + .55, E.qio), close = P(t, CAP_END - .45, CAP_END - .05, E.qio);
  let w = widthOf(text);
  if (ci > 0) w = L(widthOf(CAP[ci - 1][2]), w, P(t, t0, t0 + .45, E.qio));
  w = L(H, w, open * (1 - close));
  const pop = (x => x <= 0 ? 0 : E.back(x))(cl((t - first) / .32)) * (1 - P(t, CAP_END - .1, CAP_END + .1, E.io));
  if (pop <= 0) return;
  const x = 960 - w / 2, y = 1022 - H / 2;
  ctx.save();
  ctx.translate(960, y + H / 2); ctx.scale(pop, pop); ctx.translate(-960, -(y + H / 2));
  ctx.shadowColor = 'rgba(35,30,25,.10)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4; ctx.fillStyle = '#FFFFFF'; rr(x, y, w, H, H / 2); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#DDD1BE'; ctx.lineWidth = 1; ctx.stroke();
  ctx.save(); rr(x, y, w, H, H / 2); ctx.clip();
  ctx.fillStyle = '#F7E17E'; ctx.beginPath(); ctx.arc(x + 31, y + H / 2, R, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(x + 31, y + H / 2, R, 0, Math.PI * 2); ctx.clip();
  font(700, 19); ctx.fillStyle = '#231E19'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const nk = ci > 0 ? P(t, t0, t0 + .35, E.qio) : 1;
  if (ci > 0 && nk < 1) { ctx.globalAlpha = 1 - nk; ctx.fillText(String(CAP[ci - 1][1]), x + 31, y + H / 2 + 1 - nk * 22); }
  ctx.globalAlpha = nk; ctx.fillText(String(n), x + 31, y + H / 2 + 1 + (1 - nk) * 22); ctx.restore();
  font(500, 26, 'Neco'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#231E19';
  const tin = ci === 0 ? P(t, first + .35, first + .7, E.q) : P(t, t0 + .12, t0 + .5, E.q);
  const tout = ci > 0 ? 1 - P(t, t0, t0 + .15, E.io) : 0;
  const fadeEnd = 1 - P(t, CAP_END - .5, CAP_END - .3, E.io);
  if (tout > 0) { ctx.globalAlpha = tout * fadeEnd; ctx.fillText(CAP[ci - 1][2], x + 64, y + H / 2 + 1 - (1 - tout) * 10); }
  ctx.globalAlpha = tin * fadeEnd; ctx.fillText(text, x + 64, y + H / 2 + 1 + (1 - tin) * 12);
  ctx.restore(); ctx.restore();
}

// ------------------------------------------------------------------ scenes
function title(t) {
  if (t > 7.2) return;
  const up = P(t, 6.3, 7.1, E.qio);
  ctx.save(); ctx.translate(0, -up * 1080);
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  ctx.fillStyle = '#F7E17E'; ctx.fillRect(0, 0, W, H);
  const e = P(t, 0.3, 0.75) * (1 - P(t, 6.1, 6.3)); font(600, 22); ctx.fillStyle = '#494746'; ctx.globalAlpha = e;
  ctx.letterSpacing = '3px'; ctx.fillText('ANDRI ACADEMY · 1.2', 122, 392); ctx.letterSpacing = '0px'; ctx.globalAlpha = 1;
  words('In-Depth or Plan', 120, 530, 0.5, .09, 128, 500, '#231E19', null);
  words('Choose how Andri works.', 120, 640, 1.15, .09, 84, 400, '#231E19', null);
  mascot('wave', t, .25, 7.2, 1180, 330, 640);   // the lightbulb pose has the left arm fused into a ray in its artwork
  ctx.restore();
}
function endCard(t) {
  if (t < 57.35) return;
  const a = P(t, 57.4, 58.0), dy = (1 - P(t, 57.4, 58.1, E.q)) * 24;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(0, dy);
  ctx.drawImage(IMG.logo, 512, 438, 520, 520 * 600 / 2299);
  font(500, 25); ctx.fillStyle = '#494746'; ctx.textBaseline = 'alphabetic'; ctx.fillText('Andri Academy · Next: The whole letter, in one request', 515, 635);
  ctx.restore();
  // mascot, then the tick springs in with a slight twist (as in 1.1)
  const m = mascot('done', t, 57.6, 65.0, 1105, 400, 420, { from: 'pop' });
  if (m) {
    const b = MMETA.done.badge, sc = m.sc;
    const bx = m.x + m.w / 2 + (b[0] * m.w + b[2] * m.w / 2 - m.w / 2) * sc, by = m.y + m.h + (b[1] * m.h + b[3] * m.h / 2 - m.h) * sc;
    const fi = Math.floor((t - 57.6) * MMETA.disc.fps) % MMETA.disc.frames, mw = m.w * m.sc, mh = m.h * m.sc;
    const ox = m.x + m.w / 2 - mw / 2, oy = m.y + m.h + m.dy - mh;
    const x = cl((t - 58.1) / .34), k = x <= 0 ? 0 : E.back(x);
    if (k > 0) {
      ctx.save(); ctx.globalAlpha *= cl(x * 4);
      ctx.translate(bx, by); ctx.rotate((1 - k) * -0.35); ctx.scale(k, k); ctx.translate(-bx, -by);
      ctx.drawImage(MASC.tick[fi], ox, oy, mw, mh); ctx.restore();
    }
  }
  // no Up next card in the video: the Academy website adds it
}

// ------------------------------------------------------------------ frame
async function renderFrame(t) {
  if (!READY) READY = load();
  await READY;
  globalT = t;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.textAlign = 'left';
  background(t);
  const cam = camera(t);
  if (cam.o > 0 && t > 6.3) {
    const [x, y, w, h] = cam.clip; const [sx, sy] = toScreen(cam, x, y); const sw = w * cam.s, sh = h * cam.s;
    ctx.save(); ctx.globalAlpha = cam.o;
    ctx.shadowColor = 'rgba(35,30,25,.16)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 26; ctx.fillStyle = '#F2EFE9'; rr(sx, sy, sw, sh, cam.r); ctx.fill();
    ctx.shadowColor = 'rgba(35,30,25,.22)'; ctx.shadowBlur = 1; ctx.shadowOffsetY = 0; ctx.fill(); ctx.shadowColor = 'transparent';
    rr(sx, sy, sw, sh, cam.r); ctx.clip();
    ctx.translate(cam.cx - cam.fx * cam.s, cam.cy - cam.fy * cam.s); ctx.scale(cam.s, cam.s);
    drawApp(t);
    ctx.restore();
  }
  endCard(t);
  title(t);
  caption(t);
  cursor(t, cam);
}

window.MG = { width: W, height: H, fps: FPS, duration: DURATION, renderFrame };
if (!navigator.webdriver) { const t0 = performance.now(); (function loop() { renderFrame(((performance.now() - t0) / 1000) % DURATION).then(() => requestAnimationFrame(loop)); })(); }
