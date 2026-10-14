// Andri Academy 5.1 · Check many contracts at once, in one table
// Everything is drawn on one <canvas> by renderFrame(t), a pure function of time t (seconds).
// App screens are plates of real Andri staging snapshots (plates/*.png, 2x, built by plates/capture.mjs); all motion is drawn here.
// Engine, camera, captions, cursor, mascot, title and end card follow the approved 1.1, 1.2 and 3.1 videos.

const W = 1920, H = 1080, FPS = 60, LDUR = 109.2;
// time map (as in 2.1): the code below is written in logical seconds; CUTS removes idle stretches from the video
const CUTS = [[56.95, 4.0]];   // [logical start, seconds removed]: the still table before Try one cell
const logical = v => { let L = v; for (const [s, d] of CUTS) if (L >= s) L += d; return L; };
const videoT = L => { for (let i = CUTS.length - 1; i >= 0; i--) { const [s, d] = CUTS[i]; if (L >= s + d) L -= d; else if (L >= s) L = s; } return L; };
const DURATION = videoT(LDUR);
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
const V2 = (t, a, b, fi = .35, fo = .3) => Math.min(P(t, a, a + fi), 1 - P(t, b - fo, b, E.io));

// ------------------------------------------------------------------ assets
const PLATES = ['kb', 'kbTip', 'g0', 'gN', 'pRoot', 'pFolder', 'pAll', 'r6', 'q1a', 'q1N', 'pQ1a', 'menuFmt', 'q1b', 'q1c', 'q1d', 'pQ1d', 'q1done',
  'q2a', 'q2b', 'q2d', 'q2N', 'pQ2a', 'pQ2d', 'q2done', 'q3a', 'q3b', 'q3d', 'q3N', 'pQ3a', 'pQ3d', 'g3', 'tryRun', 'tryDone',
  'runQ', 'runT', 'runR1', 'runR2', 'runR3', 'runR4', 'runR5', 'runA00', 'runA18', 'done', 'cell', 'cellN', 'pCell', 'fOpen', 'menuFilter', 'fNo', 'fDone',
  'doneR', 'q4Nd', 'q4a', 'q4d', 'q4N', 'pQ4a', 'pQ4d', 'q4done', 'q4q', 'q4t', 'q4p', 'q4z', 'q4exp'];
for (let k = 0; k <= 18; k++) PLATES.push('st' + String(k).padStart(2, '0'));
const IMG = {}, MASC = {};
let RECTS, MMETA, READY = null;
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(src); i.src = src; }); }
async function load() {
  RECTS = window.RECTS_DATA; MMETA = window.MASCOT_DATA;
  const jobs = PLATES.map(n => loadImg(ROOT + 'plates/' + n + '.png').then(i => IMG[n] = i));
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
// colour of one pixel of a plate (app px), cached: used to clear a field before drawing typed text
const PX = {};
function px(name, x, y) {
  const k = `${name}:${x}:${y}`; if (PX[k]) return PX[k];
  const cv = document.createElement('canvas'); cv.width = 1; cv.height = 1; const g = cv.getContext('2d');
  g.drawImage(IMG[name], x * 2, y * 2, 1, 1, 0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data;
  return (PX[k] = `rgb(${d[0]},${d[1]},${d[2]})`);
}

// ------------------------------------------------------------------ helpers
const R = (set, id) => RECTS[set][id];
const box = n => RECTS[n].box;
const C = r => [r[0] + r[2] / 2, r[1] + r[3] / 2];
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function font(w, s, fam = 'Rethink') { ctx.font = `${w} ${s}px ${fam}`; }
function plate(name, a = 1) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(IMG[name], 0, 0, 1440, 860); ctx.restore(); }
// part of a plate, in place (or moved by dx, dy)
function region(name, r, a = 1, dx = 0, dy = 0) { if (a <= 0) return; const [x, y, w, h] = r; ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(IMG[name], x * 2, y * 2, w * 2, h * 2, x + dx, y + dy, w, h); ctx.restore(); }
// crossfade between two plates
function xf(a, b, t, t0, d = .3) { const k = P(t, t0, t0 + d, E.io); if (k < 1) plate(a); if (k > 0) plate(b, k); }
function sprite(name, a = 1, dx = 0, dy = 0, sc = 1) {
  if (a <= 0) return; const [x, y, w, h] = box(name); ctx.save(); ctx.globalAlpha *= a;
  ctx.translate(x + w / 2 + dx, y + h / 2 + dy); ctx.scale(sc, sc); ctx.drawImage(IMG[name], -w / 2, -h / 2, w, h); ctx.restore();
}
// shadow for a floating sprite captured without its own (known-issues #1); values from the live CSS
function floatShadow(name, a = 1, dx = 0, dy = 0, r = 16, strong = false) {
  if (a <= 0) return; const [x, y, w, h] = box(name);
  ctx.save(); ctx.globalAlpha *= a; ctx.shadowColor = strong ? 'rgba(35,30,25,.20)' : 'rgba(35,30,25,.16)'; ctx.shadowBlur = strong ? 30 : 26; ctx.shadowOffsetY = strong ? 10 : 9;
  ctx.fillStyle = '#FFFFFF'; rr(x + dx + 2, y + dy + 2, w - 4, h - 4, r); ctx.fill(); ctx.restore();
}
// gold ring around a small control (app px), only while the voice names it
function ring(t, a, b, r, rad = 10, pad = 5) {
  const v = V2(t, a, b, .25, .3); if (v <= 0) return;
  const g = P(t, a, a + .35, E.back);
  ctx.save(); ctx.globalAlpha *= v; ctx.strokeStyle = '#E9CD4F'; ctx.lineWidth = 3;
  const p = pad + (1 - g) * 6; rr(r[0] - p, r[1] - p, r[2] + p * 2, r[3] + p * 2, rad + p); ctx.stroke(); ctx.restore();
}
function caret(t, x, y, h = 18) { if (Math.floor(t * 2.2) % 2 === 0) { ctx.fillStyle = '#241E19'; ctx.fillRect(x + 1, y - h + 4, 1.4, h); } }

// ------------------------------------------------------------------ timeline (video seconds)
// narration lines (ElevenLabs "UK voice voice to use for ANDRI vids", one take, cut at its pauses: audio/uk/N*.wav)
const VO = { N1: 0.6, N2: 9.6, N3: 16.3, N4: 22.2, N5: 31.4, N6: 41.9, N7: 47.6, N8: 55.5, N9: 69.0, N10: 74.4, N11: 81.2, N12: 87.6, N13: 95.2, N14: 102.2 };
const T = {
  push: 8.85,                       // title card pushes up into the app
  revHover: 16.6, revClick: 17.4,   // sidebar Review
  addSrc: 22.7, folder: 27.8, selAll: 28.8, use: 30.1,
  q1: 32.0, fmt1: 33.7, yes: 40.9, h1: [42.4, 43.4], a1: [43.9, 46.0], done1: 47.0,
  q2: 48.7, fmt2: 49.6, date: 50.4, h2: [51.0, 51.6], a2: [51.85, 52.65], done2: 52.9,
  q3: 53.55, fmt3: 54.0, num: 54.35, h3: [54.85, 55.2], a3: [55.4, 56.05], done3: 56.3,
  tryC: 61.2, tryRes: 65.0,
  start: 69.5, runQ: 70.1, runT: 70.7, fill: [71.2, 73.6], runDone: 73.9,
  cite: 77.0, cellClose: 81.2, filt: 82.6, no: 83.9, esc: 85.0,
  clear: 86.9, addCol: 88.3, h4: [88.9, 89.6], a4: [89.8, 90.6], done4: 91.0, run4: 92.6, q4t: 93.3, q4p: 94.5, q4z: 95.3,
  exp: 96.2, sheet: 96.9,
  exit: 100.6,
};
const END = 101.75;
const TXT = { h1: 'Liability cap', a1: "Does the contract cap the supplier's liability?", h2: 'Expiry date', a2: 'When does the contract end?',
  h3: 'Notice (days)', a3: ["How many days' notice ends the contract for", 'convenience?'], h4: 'Governing law', a4: 'Which law governs the contract?' };

// captions (step number, text) in the pill under the window
const CAP = [[VO.N2, 1, 'Your contracts'], [VO.N3, 2, 'Open Review'], [VO.N4, 3, 'Add the contracts'], [VO.N5, 4, 'Ask a question'],
  [VO.N7, 5, 'Add more questions'], [T.done3 + .1, 6, 'Test one cell'], [VO.N9, 7, 'Run the review'], [VO.N10, 8, 'Check the source'],
  [VO.N11, 9, 'Filter a column'], [VO.N12, 10, 'Add a question later'], [VO.N13, 11, 'Export']];
const CAP_END = T.exit + .2;

// ------------------------------------------------------------------ camera
const POSE = { s: 1.08, cx: 960, cy: 503 };
function zoomOn(r, maxW, maxH, cx = 960, cy = 500) { const s = Math.min(maxW / r[2], maxH / r[3]); return { fx: r[0] + r[2] / 2, fy: r[1] + r[3] / 2, s, cx, cy, clip: r, r: 18, o: 1 }; }
function shot(name) {
  const full = [0, 0, 1440, 860];
  if (name === 'screen') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy, clip: full, r: 22, o: 1 };
  if (name === 'below') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy + 1100, clip: full, r: 22, o: 1 };
  if (name === 'menuZ') return zoomOn([600, 196, 830, 380], 1580, 760);    // the format menu: six formats
  if (name === 'typeZ') return zoomOn([404, 196, 1000, 380], 1580, 760);   // the column header filling in as the panel is typed
  if (name === 'tryZ') return zoomOn([96, 150, 900, 330], 1580, 760);      // the first cell's answer
  if (name === 'cellZ') return zoomOn([660, 200, 770, 420], 1580, 760);    // the passage, with the document and the page
  if (name === 'filtZ') return zoomOn([96, 150, 760, 420], 1580, 760);     // the filter menu and the two rows left
  if (name === 'gone') return { ...shot('screen'), o: 0 };                  // plain fade out, no zoom
}
const SHOTS = [[0, 'below', 0], [T.push, 'screen', .85],
  [T.fmt1 + .2, 'menuZ', .9], [T.yes + .25, 'typeZ', .8], [T.a1[1] + .15, 'screen', .75],
  [T.tryC + .3, 'tryZ', .9], [VO.N9 - .9, 'screen', .8],
  [T.cite + .65, 'cellZ', .9], [T.cellClose - .45, 'screen', .7], [T.filt + .1, 'filtZ', .8], [T.esc + 1.1, 'screen', .8],
  [T.exit, 'gone', 1.0]];
function camera(t) {
  let i = 0; while (i < SHOTS.length - 1 && SHOTS[i + 1][0] <= t) i++;
  const cur = shot(SHOTS[i][1]), d = SHOTS[i][2];
  if (i === 0 || d === 0) return clampCam({ ...cur });
  const prev = shot(SHOTS[i - 1][1]); const k = E.qio(cl((t - SHOTS[i][0]) / d));
  const o = {}; for (const key of ['fx', 'fy', 'cx', 'cy', 'r', 'o']) o[key] = L(prev[key], cur[key], k);
  o.s = Math.exp(L(Math.log(prev.s), Math.log(cur.s), k));
  o.clip = [0, 0, 1440, 860];
  return clampCam(o);
}
function clampCam(o) {
  if (o.s * 1440 >= W) o.fx = cl(o.fx, o.cx / o.s, 1440 - (W - o.cx) / o.s);
  if (o.s * 860 >= H) o.fy = cl(o.fy, o.cy / o.s, 860 - (H - o.cy) / o.s);
  return o;
}
const toScreen = (cam, x, y) => [cam.cx + (x - cam.fx) * cam.s, cam.cy + (y - cam.fy) * cam.s];

// ------------------------------------------------------------------ background (cream to gold, as in 1.1)
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

// ------------------------------------------------------------------ text: per word rise (title)
let globalT = 0;
function words(text, x, y, t0, step, size, weight, color, fam = 'Neco') {
  font(weight, size, fam); ctx.fillStyle = color; ctx.textBaseline = 'alphabetic';
  let cx = x;
  text.split(' ').forEach((w, i) => {
    const k = P(globalT, t0 + i * step, t0 + i * step + .5, E.q);
    if (k > 0) { ctx.save(); ctx.globalAlpha *= k; ctx.fillText(w, cx, y + (1 - k) * 44); ctx.restore(); }
    cx += ctx.measureText(w + ' ').width;
  });
}

// ------------------------------------------------------------------ the question panel: typed text over the real empty fields
const FIELD = { input: [917, 397.8, 468, 36], area: [918, 450.8, 466, 296.3] };
// header field: Rethink 14px at x+13; question box: Rethink 16px, 24px lines, at x+17, first baseline y+34
function typeInput(t, base, text, a, b) {
  const [x, y, w, h] = FIELD.input; const k = P(t, a, b, E.lin); if (t < a - .4) return;
  ctx.fillStyle = px(base, x + w - 30, y + h / 2); ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
  const s = text.slice(0, Math.round(k * text.length)); font(400, 14); ctx.fillStyle = '#241E19'; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x + 13, y + 23);
  if (t < b + .25) caret(t, x + 13 + ctx.measureText(s).width, y + 24, 17);
}
function typeArea(t, base, text, a, b) {
  const [x, y, w] = FIELD.area; const lines = Array.isArray(text) ? text : [text]; if (t < a - .4) return;
  const all = lines.join(' '); const n = Math.round(P(t, a, b, E.lin) * all.length);
  ctx.fillStyle = px(base, x + w - 30, y + 120); ctx.fillRect(x + 8, y + 8, w - 16, 24 * lines.length + 22);
  font(400, 16); ctx.fillStyle = '#241E19'; ctx.textBaseline = 'alphabetic';
  let used = 0, cx = x + 17, cy = y + 34;
  lines.forEach((ln, i) => { const part = ln.slice(0, Math.max(0, n - used)); ctx.fillText(part, x + 17, y + 34 + i * 24); if (part.length) { cx = x + 17 + ctx.measureText(part).width; cy = y + 34 + i * 24; } used += ln.length + 1; });
  if (t < b + .25) caret(t, cx, cy + 1, 19);
}
// a panel sliding in from the right edge of the window (in) or out (out), over the grid that narrows / widens under it
function panelMove(t, t0, wide, narrow, spr, dir) {
  const k = P(t, t0, t0 + .5, E.qio); const s = dir === 'in' ? k : 1 - k;
  plate(wide); plate(narrow, s);
  const dx = (1 - s) * 560; floatShadow(spr, 1, dx); sprite(spr, 1, dx);
}

// ------------------------------------------------------------------ the app, by time
const ORDER = (() => { const o = []; for (let r = 1; r <= 6; r++) for (let q = 1; q <= 3; q++) o.push([r, q]); let s = 7; for (let i = o.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor(s / 233280 * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; })();
function drawApp(t) {
  // 1 the Knowledge Base folder, then Review from the sidebar (the page pushes across)
  if (t < T.revClick + .7) {
    const k = P(t, T.revClick + .05, T.revClick + .65, E.qio);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1440, 860); ctx.clip();
    if (k < 1) { ctx.save(); ctx.translate(-k * 1440, 0); plate('kb');
      const tip = R('kbTip', 'tip'); const tk = P(t, T.revHover, T.revHover + .28, E.out) * (1 - P(t, T.revClick + .02, T.revClick + .12));
      if (tk > 0) region('kbTip', [tip[0] - 2, tip[1] - 2, tip[2] + 4, tip[3] + 4], tk, (1 - tk) * -4, 0);
      ring(t, 12.4, 15.4, R('kb', 'crumb'), 8, 4);
      ctx.restore(); }
    if (k > 0) { ctx.save(); ctx.translate((1 - k) * 1440, 0); plate('g0'); ctx.restore(); }
    ctx.restore();
    return;
  }
  // 2 the empty grid, then Add sources
  if (t < T.addSrc + .05) { plate('g0'); ring(t, 18.5, 19.9, [97, 214, 120, 52], 10, 2); ring(t, 19.9, 21.5, R('g0', 'addq'), 8, 6); return; }
  if (t < T.use + .05) {
    if (t < T.addSrc + .55) { panelMove(t, T.addSrc + .05, 'g0', 'gN', 'pRoot', 'in'); return; }
    plate('gN');
    const name = t >= T.selAll + .05 ? 'pAll' : t >= T.folder + .05 ? 'pFolder' : 'pRoot';
    floatShadow(name); sprite(name);
    ring(t, 23.9, 26.5, R('pRoot', 'tabs'), 12, 4);
    return;
  }
  if (t < T.use + .6) { panelMove(t, T.use + .05, 'r6', 'gN', 'pAll', 'out'); return; }
  // 4 question 1
  if (t < T.q1 + .05) { plate('r6'); return; }
  if (t < T.q1 + .55) { panelMove(t, T.q1 + .05, 'r6', 'q1N', 'pQ1a', 'in'); return; }
  if (t < T.yes + .05) {
    plate('q1a');
    const m = P(t, T.fmt1 + .05, T.fmt1 + .25, E.out) * (1 - P(t, T.yes + .02, T.yes + .14));
    if (m > 0) { floatShadow('menuFmt', m, 0, (1 - m) * -6, 8, true); sprite('menuFmt', m, 0, (1 - m) * -6); }
    return;
  }
  if (t < T.h1[0]) { plate('q1b'); return; }
  if (t < T.a1[0]) {   // header typed: the column shows it at once (q1c), the field gets the letters
    plate('q1c'); const h1 = R('q1c', 'h1'); const k = P(t, T.h1[0], T.h1[1], E.lin);
    ctx.fillStyle = px('q1c', 690, 222); ctx.fillRect(h1[0] + h1[2] * k, h1[1] - 1, 150 - h1[2] * k + h1[2] * 0, h1[3] + 2);
    if (k <= 0) ctx.fillRect(h1[0] - 2, h1[1] - 1, 160, h1[3] + 2);
    typeInput(t, 'q1c', TXT.h1, T.h1[0], T.h1[1]);
    return;
  }
  if (t < T.done1 + .05) {
    plate('q1d'); const q = R('q1d', 'h1q'); const k = P(t, T.a1[0], T.a1[1], E.lin);
    if (k < 1) { ctx.fillStyle = px('q1d', 690, 250); ctx.fillRect(q[0] + q[2] * k, q[1] - 1, q[2] * (1 - k) + 2, q[3] + 2); }
    if (t < T.a1[1] + .3) { ctx.fillStyle = px('q1d', 1370, 540); const [x, y, w] = FIELD.area; ctx.fillRect(x + 8, y + 8, w - 16, 44); typeArea(t, 'q1d', TXT.a1, T.a1[0], T.a1[1]); }
    return;
  }
  if (t < T.done1 + .6) { panelMove(t, T.done1 + .05, 'q1done', 'q1N', 'pQ1d', 'out'); return; }
  // 5 questions 2 and 3: the same panel, a date and a number
  const another = (q, done, N, pa, pd, wideBefore, wideAfter, a, b, d, fmtT, pickT, h, aT, txt) => {
    if (t < q + .05) { plate(wideBefore); return true; }
    if (t < q + .55) { panelMove(t, q + .05, wideBefore, N, pa, 'in'); return true; }
    if (t < pickT + .05) { plate(a); const m = P(t, fmtT + .05, fmtT + .25, E.out) * (1 - P(t, pickT + .02, pickT + .14));
      if (m > 0) { floatShadow('menuFmt', m, 0, (1 - m) * -6, 8, true); sprite('menuFmt', m, 0, (1 - m) * -6); } return true; }
    if (t < done + .05) {
      const hk = P(t, h[0], aT[1], E.io);   // the column header fills in while the panel is typed
      plate(b); if (hk > 0) region(d, [417 + (q === T.q2 ? 280 : 560), 210, 280, 74], hk);
      typeInput(t, b, txt.h, h[0], h[1]);
      if (t >= h[1]) { typeArea(t, b, txt.a, aT[0], aT[1]); }
      return true;
    }
    if (t < done + .6) { panelMove(t, done + .05, wideAfter, N, pd, 'out'); return true; }
    return false;
  };
  if (t < T.q2 + .05 + (T.done2 - T.q2) + .6) { if (another(T.q2, T.done2, 'q2N', 'pQ2a', 'pQ2d', 'q1done', 'q2done', 'q2a', 'q2b', 'q2d', T.fmt2, T.date, T.h2, T.a2, { h: TXT.h2, a: TXT.a2 })) return; }
  if (t < T.done3 + .6) { if (another(T.q3, T.done3, 'q3N', 'pQ3a', 'pQ3d', 'q2done', 'g3', 'q3a', 'q3b', 'q3d', T.fmt3, T.num, T.h3, T.a3, { h: TXT.h3, a: TXT.a3 })) return; }
  // 6 try one cell
  if (t < T.tryC + .05) { plate('g3'); return; }
  if (t < T.start + .05) { xf('tryRun', 'tryDone', t, T.tryRes, .3); spins('tryRun', t, 1 - P(t, T.tryRes, T.tryRes + .3, E.io)); ring(t, 65.6, 67.9, R('tryDone', 'yes'), 8, 4); return; }
  // 7 the run: a new page; every cell queued, then thinking, then filled one by one
  if (t < T.runDone + .4) {
    const k = P(t, T.start + .1, T.start + .7, E.qio);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1440, 860); ctx.clip();
    if (k < 1) { ctx.save(); ctx.translate(-k * 1440, 0); plate('tryDone'); ctx.restore(); }
    ctx.save(); ctx.translate((1 - k) * 1440, 0);
    // rows finish top to bottom; each row grows as its answers land (real layouts: runR1..runR5, then all answered)
    const seq = ['runT', 'runR1', 'runR2', 'runR3', 'runR4', 'runR5', 'runA18'];
    const step = (T.fill[1] - T.fill[0]) / 6;
    let cur = 'runQ', prev = null, t0 = T.runT, done = 0;
    if (t >= T.runT) { cur = 'runT'; prev = 'runQ'; }
    for (let i = 1; i <= 6; i++) { const ti = T.fill[0] + (i - 1) * step; if (t >= ti) { prev = cur; cur = seq[i]; t0 = ti; done = i; } }
    if (prev && t < t0 + .28) plate(prev);
    plate(cur, prev ? P(t, t0, t0 + .28, E.io) : 1);
    if (cur !== 'runA18') spins(cur, t, prev ? P(t, t0, t0 + .28, E.io) : 1);
    const st = box('st00'); ctx.fillStyle = px('runQ', 700, 179); ctx.fillRect(st[0], st[1], st[2], st[3]); sprite('st' + String(done * 3).padStart(2, '0'));
    ctx.restore();
    if (t >= T.runDone) plate('done', P(t, T.runDone, T.runDone + .35, E.io));
    ctx.restore();
    return;
  }
  // 8 the source of one answer
  if (t < T.cite + .05) { plate('done'); return; }
  if (t < T.cite + .55) { panelMove(t, T.cite + .05, 'done', 'cellN', 'pCell', 'in'); return; }
  if (t < T.cellClose + .05) { plate('cell'); ring(t, 78.9, 80.7, R('cell', 'page1'), 6, 4); return; }
  if (t < T.cellClose + .55) { panelMove(t, T.cellClose + .05, 'done', 'cellN', 'pCell', 'out'); return; }
  // 9 filter
  if (t < T.filt + .05) { plate('done'); return; }
  if (t < T.no + .05) { plate('fOpen'); const m = P(t, T.filt + .05, T.filt + .25, E.out); floatShadow('menuFilter', m, 0, (1 - m) * -6, 10, true); sprite('menuFilter', m, 0, (1 - m) * -6); return; }
  if (t < T.esc + .05) { plate('fNo'); return; }
  if (t < T.clear + .05) { xf('fNo', 'fDone', t, T.esc + .05, .2); ring(t, 85.3, 86.7, R('fDone', 'of6'), 8, 4); return; }
  // 10 a question added later: only the new cells run
  if (t < T.addCol + .05) { xf('fDone', 'done', t, T.clear + .05, .25); return; }
  // clicking the half-hidden "Add another question" scrolls the table to its end (138 px), as in staging
  const COLS = [417, 196, 983, 557];   // the scrolling part of the table (the document column and the bar stay put)
  const slideCols = (a, b, k, dist) => { plate(a); ctx.save(); ctx.beginPath(); ctx.rect(...COLS); ctx.clip(); region(a, [0, 0, 1440, 860], 1, -k * dist); region(b, [0, 0, 1440, 860], 1, (1 - k) * dist); ctx.restore(); };
  if (t < T.addCol + .3) { slideCols('done', 'doneR', P(t, T.addCol + .02, T.addCol + .27, E.out), 138); return; }
  if (t < T.addCol + .85) { const k = P(t, T.addCol + .3, T.addCol + .8, E.qio); plate('doneR'); plate('q4N', k); const dx = (1 - k) * 560; floatShadow('pQ4a', 1, dx); sprite('pQ4a', 1, dx); return; }
  if (t < T.done4 + .05) {   // the new column is off to the right while the panel is open; the panel is typed
    const typedQ = t >= T.a4[0];
    plate(typedQ ? 'q4d' : 'q4a');
    typeInput(t, typedQ ? 'q4d' : 'q4a', TXT.h4, T.h4[0], T.h4[1]);
    if (typedQ && t < T.a4[1] + .3) typeArea(t, 'q4d', TXT.a4, T.a4[0], T.a4[1]);
    return;
  }
  // Done: the panel slides out, the table widens and shows the new column at its end (scrolled 280 px further)
  if (t < T.done4 + .6) {
    const k = P(t, T.done4 + .05, T.done4 + .55, E.qio);
    plate('q4Nd'); ctx.save(); ctx.beginPath(); ctx.rect(...COLS); ctx.clip(); region('q4done', [0, 0, 1440, 860], 1, (1 - k) * 280); ctx.restore();
    region('q4done', [96, 753, 1304, 68], k); region('q4done', [1100, 196, 300, 557], k);
    const dx = k * 560; floatShadow('pQ4d', 1, dx); sprite('pQ4d', 1, dx); return;
  }
  if (t < T.run4 + .05) { plate('q4done'); ring(t, 91.3, 92.5, [111, 770, 150, 20], 8, 5); return; }
  if (t < T.q4t) { xf('q4done', 'q4q', t, T.run4 + .05, .2); spins('q4q', t, P(t, T.run4 + .05, T.run4 + .25)); return; }
  if (t < T.q4p) { xf('q4q', 'q4t', t, T.q4t, .2); spins(P(t, T.q4t, T.q4t + .2) < .5 ? 'q4q' : 'q4t', t); return; }
  if (t < T.q4z) { xf('q4t', 'q4p', t, T.q4p, .25); spins('q4p', t); return; }
  // 11 export
  if (t < T.exp + .05) { xf('q4p', 'q4z', t, T.q4z, .25); return; }
  plate(t < T.exp + .8 ? 'q4exp' : 'q4z');
  if (t < T.exp + .8) spins('q4exp', t);
}
// the spinners turn (lucide loader-circle, 1 turn per second as in the app's animate-spin): the still icon on the plate is
// covered with the background at its centre and redrawn at the current angle
function spins(name, t, a = 1) {
  const S = RECTS[name] && RECTS[name].spins; if (!S || a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  for (const [x, y, , col] of S) {
    const green = col.indexOf('99, 131') > -1, size = green ? 12 : 14, r = size * 9 / 24;
    ctx.fillStyle = px(name, Math.round(x), Math.round(y)); ctx.beginPath(); ctx.arc(x, y, size * .62, 0, Math.PI * 2); ctx.fill();
    const ang = (t % 1) * Math.PI * 2; ctx.strokeStyle = col; ctx.lineWidth = size / 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, r, ang, ang + Math.PI * 1.55); ctx.stroke();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ the exported sheet (real values from the .xlsx)
const SHEET = {
  name: 'Review – 6 documents × 3 questions.xlsx',
  head: ['Document', "Does the contract cap the supplier's liability?", "Does the contract cap the supplier's liability? (reasoning)", 'When does the contract end?'],
  rows: [['Cleaning_Services_Contract_Ashby_Facilities.pdf', 'TRUE', "Clause 5.2 caps the Supplier's total liability at £100,000 in aggregate.", '31-10-2027'],
    ['Design_Services_Agreement_Holt_Creative.pdf', 'TRUE', "Clause 5.2 caps the Supplier's total liability at £50,000, with death, personal injury and fraud carved out", '14-11-2026'],
    ['Ingredient_Supply_Agreement_Corran_Mills.pdf', 'FALSE', 'Clause 5 contains no monetary or other cap; clause 5.2 makes each party liable for all losses from breach', '30-06-2027'],
    ['Logistics_Services_Agreement_Brightmoor_Haulage.pdf', 'FALSE', "Clause 5.2 makes the Supplier liable for all losses and states nothing in the Agreement limits or excludes", '31-01-2027'],
    ['Software_Licence_Larchfield_Systems.pdf', 'TRUE', "Clause 5.2 caps the Supplier's total annual liability at licence fees paid in the preceding twelve months.", '31-12-2026'],
    ['Supply_Agreement_Northvale_Packaging.pdf', 'TRUE', "Clause 5.2 caps the Supplier's total liability at £250,000 in aggregate, with clause 5.1 carving out", '31-03-2028']],
  cols: [250, 150, 330, 120],
};
function sheet(t, alpha) {
  const k = P(t, T.sheet, T.sheet + .75, E.q); if (k <= 0 || alpha <= 0) return;
  const w = 960, h = 380, x = 480, y = L(560, 330, k);
  ctx.save(); ctx.globalAlpha *= k * alpha;
  ctx.shadowColor = 'rgba(35,30,25,.22)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20; ctx.fillStyle = '#FFFFFF'; rr(x, y, w, h, 16); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#DDD1BE'; ctx.lineWidth = 1; ctx.stroke();
  // file name with a plain sheet icon
  ctx.save(); ctx.translate(x + 28, y + 26); ctx.strokeStyle = '#638363'; ctx.lineWidth = 2; rr(0, 0, 22, 26, 3); ctx.stroke();
  ctx.beginPath(); for (const yy of [9, 16]) { ctx.moveTo(0, yy); ctx.lineTo(22, yy); } ctx.moveTo(8, 2); ctx.lineTo(8, 26); ctx.stroke(); ctx.restore();
  font(600, 20); ctx.fillStyle = '#241E19'; ctx.textBaseline = 'middle'; ctx.fillText(SHEET.name, x + 64, y + 40);
  // the grid
  const gx = x + 28, gy = y + 78, rh = 40;
  ctx.save(); rr(gx, gy, w - 56, rh * 7, 8); ctx.clip();
  ctx.fillStyle = '#F4F1EA'; ctx.fillRect(gx, gy, w - 56, rh);
  let cx = gx; SHEET.cols.forEach((cw, i) => {
    const draw = (txt, row, bold) => { font(bold ? 600 : 400, 14); ctx.fillStyle = bold ? '#241E19' : '#3B3632'; let s = txt; while (ctx.measureText(s).width > cw - 20 && s.length > 3) s = s.slice(0, -2); if (s !== txt) s = s.replace(/\s*\S?$/, '') + '…'; ctx.fillText(s, cx + 10, gy + rh * row + rh / 2 + 1); };
    draw(SHEET.head[i], 0, true); SHEET.rows.forEach((r, j) => draw(r[i], j + 1, false));
    cx += cw;
  });
  ctx.strokeStyle = '#E4DCCD'; ctx.lineWidth = 1; ctx.beginPath();
  for (let j = 1; j < 7; j++) { ctx.moveTo(gx, gy + rh * j + .5); ctx.lineTo(gx + w - 56, gy + rh * j + .5); }
  cx = gx; for (const cw of SHEET.cols.slice(0, -1)) { cx += cw; ctx.moveTo(cx + .5, gy); ctx.lineTo(cx + .5, gy + rh * 7); }
  ctx.stroke(); ctx.restore();
  ctx.strokeStyle = '#E4DCCD'; rr(gx, gy, w - 56, rh * 7, 8); ctx.stroke();
  ctx.restore();
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

// ------------------------------------------------------------------ cursor
// path: [t0, t1, target in app px | 'enter' | 'exit']
function cursorPath() {
  const g0 = RECTS.g0, q1 = RECTS.q1a, m = RECTS.menuFmt, d = RECTS.done, t3 = RECTS.g3;
  const inField = r => [r[0] + 160, r[1] + r[3] / 2];
  const areaPt = [1100, 520];
  return [
    [15.3, 15.31, 'enter'], [15.5, 16.5, C(R('kb', 'review'))],
    [21.6, 22.5, C(g0.addSrc)], [26.9, 27.65, C(R('pRoot', 'folder'))], [28.15, 28.65, C(R('pFolder', 'selAll'))], [29.3, 29.95, C(R('pAll', 'use'))],
    [31.1, 31.85, C(g0.addq)], [32.9, 33.55, [q1.fmt[0] + 120, q1.fmt[1] + 18]],
    [34.3, 34.75, [1060, 360]], [35.3, 35.75, C(m.yesNo).map((v, i) => i ? v : 1060)], [36.3, 36.7, [1060, C(m.extract)[1]]], [37.7, 38.05, [1060, C(m.date)[1]]], [38.45, 38.8, [1060, C(m.number)[1]]], [39.25, 39.6, [1060, C(m.choice)[1]]], [40.2, 40.75, [1060, C(m.yesNo)[1]]],
    [41.6, 42.25, inField(q1.input)], [43.45, 43.8, areaPt], [46.35, 46.85, C(q1.done)],
    [47.9, 48.55, C(R('q1done', 'addAnother'))], [49.0, 49.5, [q1.fmt[0] + 120, q1.fmt[1] + 18]], [49.85, 50.25, [1060, C(m.date)[1]]], [50.55, 50.85, inField(q1.input)], [51.6, 51.8, areaPt], [52.45, 52.85, C(q1.done)],
    [53.0, 53.5, C(R('q2done', 'addAnother'))], [53.65, 53.95, [q1.fmt[0] + 120, q1.fmt[1] + 18]], [54.05, 54.3, [1060, C(m.number)[1]]], [54.4, 54.6, inField(q1.input)], [55.12, 55.25, areaPt], [55.95, 56.25, C(q1.done)],
    [56.4, 56.9, C(t3.tryBtn)], [62.0, 62.8, [760, 520]],
    [68.4, 69.35, C(t3.start)], [70.2, 71.0, [760, 600]],
    [75.6, 76.9, [d.cite31[0] + 30, d.cite31[1] + 8]], [77.8, 78.6, [1180, 640]], [80.6, 81.1, C(R('cell', 'close'))],
    [81.7, 82.5, C(d.filter1)], [83.0, 83.8, [R('menuFilter', 'no')[0] + 20, C(R('menuFilter', 'no'))[1]]], [84.3, 84.9, [560, 470]],
    [86.0, 86.8, C(R('fDone', 'clear'))], [87.4, 88.2, [1330, 246]], [88.45, 88.8, inField(q1.input)], [89.62, 89.75, areaPt], [90.6, 90.95, C(q1.done)],
    [91.6, 92.5, C(R('q4done', 'run'))], [93.2, 94.0, [700, 620]],
    [95.3, 96.1, C(R('q4z', 'exportBtn'))], [96.7, 97.4, 'exit'],
  ];
}
const CLICKS = [T.revClick, T.addSrc, T.folder, T.selAll, T.use, T.q1, T.fmt1, T.yes, T.h1[0] - .25, T.a1[0] - .2, T.done1,
  T.q2, T.fmt2, T.date, T.h2[0] - .2, T.a2[0] - .1, T.done2, T.q3, T.fmt3, T.num, T.h3[0] - .2, T.a3[0] - .1, T.done3,
  T.tryC, T.start, T.cite, T.cellClose, T.filt, T.no, T.clear, T.addCol, T.h4[0] - .2, T.a4[0] - .1, T.done4, T.run4, T.exp];
const CURSOR_ON = [[15.3, 97.4]];
function cursor(t, cam) {
  if (!CURSOR_ON.some(([a, b]) => t >= a && t < b)) return;
  const path = cursorPath(); let pos = null;
  const resolve = tg => tg === 'enter' ? [1980, 1140] : tg === 'exit' ? [2000, 1150] : toScreen(cam, tg[0], tg[1]);
  for (const [a, b, tg] of path) { const p = resolve(tg); if (!pos) pos = p; if (t >= b) { pos = p; continue; } if (t > a) { const k = E.io((t - a) / (b - a)); pos = [L(pos[0], p[0], k), L(pos[1], p[1], k)]; } break; }
  const press = CLICKS.some(cc => t >= cc - .07 && t < cc + .15);
  for (const cc of CLICKS) if (t >= cc && t < cc + .45) { const k = (t - cc) / .45; ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#C9A733'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(pos[0], pos[1], 9 + 26 * E.out(k), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  ctx.save(); ctx.translate(pos[0] - 7, pos[1] - 4); const s = 34 / 30 * (press ? .86 : 1); ctx.scale(s, s);
  const p = new Path2D('M6 3 L6 24 L11.2 19.3 L14.6 27 L18.2 25.4 L14.9 17.9 L22 17.6 Z');
  ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1;
  ctx.fillStyle = '#1d1813'; ctx.fill(p); ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round'; ctx.stroke(p); ctx.restore();
}

// ------------------------------------------------------------------ caption pill (exactly as 1.1 and 1.2)
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
  font(700, n >= 10 ? 17 : 19); ctx.fillStyle = '#231E19'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
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

// ------------------------------------------------------------------ title card (1.2 layout) and end card
const TITLE = { tag: 'ANDRI ACADEMY · 5.1', l1: 'Check many contracts', l2: 'at once, in one table.' };
function title(t) {
  if (t > T.push + .9) return;
  const up = P(t, T.push, T.push + .8, E.qio);
  ctx.save(); ctx.translate(0, -up * 1080);
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  ctx.fillStyle = '#F7E17E'; ctx.fillRect(0, 0, W, H);
  const e = P(t, 0.3, 0.75); font(600, 22); ctx.fillStyle = '#494746'; ctx.globalAlpha = e;
  ctx.letterSpacing = '3px'; ctx.fillText(TITLE.tag, 122, 392); ctx.letterSpacing = '0px'; ctx.globalAlpha = 1;
  // 1.2 sizes (128 / 84); the first line is longer than earlier titles, so it is fitted to end before the mascot
  font(500, 128, 'Neco'); const s1 = Math.min(128, Math.floor(128 * 1040 / ctx.measureText(TITLE.l1).width));
  words(TITLE.l1, 120, 530, 0.5, .09, s1, 500, '#231E19');
  words(TITLE.l2, 120, 640, 1.15, .09, 84, 400, '#231E19');
  mascot('wave', t, .25, T.push + .9, 1180, 330, 640);
  ctx.restore();
}
const NEXT = 'Andri Academy · Next: Your draft and their contract, finished in Word';
function endCard(t) {
  if (t < END) return;
  // logo and line on the left, mascot on the right, centred as one group (the next title is longer than in 1.1)
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

// ------------------------------------------------------------------ frame
async function renderFrame(v) {
  if (!READY) READY = load();
  await READY;
  const t = logical(v);
  globalT = t;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.textAlign = 'left';
  background(t);
  const cam = camera(t);
  if (cam.o > 0 && t > T.push - .1) {
    const [x, y, w, h] = cam.clip; const [sx, sy] = toScreen(cam, x, y); const sw = w * cam.s, sh = h * cam.s;
    ctx.save(); ctx.globalAlpha = cam.o;
    ctx.shadowColor = 'rgba(35,30,25,.16)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 26; ctx.fillStyle = '#F2EFE9'; rr(sx, sy, sw, sh, cam.r); ctx.fill();
    ctx.shadowColor = 'rgba(35,30,25,.22)'; ctx.shadowBlur = 1; ctx.shadowOffsetY = 0; ctx.fill(); ctx.shadowColor = 'transparent';
    rr(sx, sy, sw, sh, cam.r); ctx.clip();
    ctx.translate(cam.cx - cam.fx * cam.s, cam.cy - cam.fy * cam.s); ctx.scale(cam.s, cam.s);
    drawApp(t);
    ctx.restore();
    sheet(t, cam.o);
  }
  endCard(t);
  title(t);
  caption(t);
  cursor(t, cam);
}

window.MG = { width: W, height: H, fps: FPS, duration: DURATION, renderFrame };
if (!navigator.webdriver) { const t0 = performance.now(); (function loop() { renderFrame(((performance.now() - t0) / 1000) % DURATION).then(() => requestAnimationFrame(loop)); })(); }
