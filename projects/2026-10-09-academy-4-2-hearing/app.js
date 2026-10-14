// Andri Academy 4.2 · Prepare and rehearse the hearing
// Everything is drawn on one <canvas> by renderFrame(t), a pure function of time t (seconds).
// App screens are still plates of the Andri rebuild (plates/*.png, 2x); all motion is drawn here.
// Engine, camera, captions, cursor, mascot and end card follow the approved 1.1, 1.2 and 3.2 videos.

const W = 1920, H = 1080, FPS = 60, DURATION = 105.6;
const c = document.getElementById('c'); c.width = W; c.height = H;
const ctx0 = c.getContext('2d');
let ctx = ctx0;
// the window is drawn into its own layer, so its stacked plates fade as one picture
const lay = document.createElement('canvas'); lay.width = W; lay.height = H; const layCtx = lay.getContext('2d');
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
// a value that eases between keyframes [[t, v], ...] (each move takes `d` seconds, ending at its keyframe time)
function keys(t, K, d = .7, e = E.io) {
  let v = K[0][1];
  for (let i = 1; i < K.length; i++) { const [tk, vk] = K[i]; const dd = K[i][2] ?? d; if (t >= tk) v = vk; else if (t > tk - dd) { v = L(v, vk, e((t - (tk - dd)) / dd)); break; } else break; }
  return v;
}

// ------------------------------------------------------------------ assets
const IMG = {}, MASC = {};
let RECTS, MMETA, READY = null;
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(src); i.src = src; }); }
const PLATES = ['mGreet', 'mGreetTl', 'mSplit', 'mView', 'mChat', 'mChatSim', 'tlBodyA', 'tlBodyF', 'formT', 'formD', 'picker', 'pickerOn',
  'cboxQ1', 'cboxQ2', 'cboxMid', 'cboxDock', 'discDock', 'thread4', 'qp1', 'qp1hot', 'qp2', 'qp2hot',
  'sStart', 'sGen', 'sJudge', 'sJudgeDone', 'sClaim', 'sClaimDone', 'judgeTurn', 'claimTurn', 'dlg', 'toast1', 'toast2'];
async function load() {
  RECTS = window.RECTS_DATA; MMETA = window.MASCOT_DATA;
  const jobs = PLATES.map(n => loadImg(ROOT + 'plates/' + n + '.png').then(i => IMG[n] = i));
  jobs.push(loadImg(ROOT + 'assets/Andri-Logo-Ink.svg').then(i => IMG.logo = i));
  for (const pose of ['wave', 'done', 'disc', 'tick']) {
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
const item = (n, id) => RECTS[n].items[id];
const ROWS = n => RECTS[n].rows;
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function plate(name, alpha = 1) { if (alpha <= 0) return; ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(IMG[name], 0, 0, 1440, 860); ctx.restore(); }
function sprite(name, alpha = 1, dx = 0, dy = 0, scale = 1) {
  if (alpha <= 0) return;
  const [x, y, w, h] = box(name); ctx.save(); ctx.globalAlpha *= alpha;
  ctx.translate(x + w / 2 + dx, y + h / 2 + dy); ctx.scale(scale, scale);
  ctx.drawImage(IMG[name], -w / 2, -h / 2, w, h); ctx.restore();
}
// part of a tall sprite: source rows [sy, sy+sh) (sprite px) drawn at window (x, y)
function slice(name, sy, sh, x, y, alpha = 1) {
  if (alpha <= 0 || sh <= 0) return; const [, , w] = box(name), img = IMG[name], k = img.width / w;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(img, 0, sy * k, img.width, sh * k, x, y, w, sh); ctx.restore();
}
function font(w, s, fam = 'Rethink') { ctx.font = `${w} ${s}px ${fam}`; }
// gold ring around a small control (app px), fades in and out over [a, b]
function ring(t, a, b, r, rad = 10, pad = 5) {
  const v = V2(t, a, b, .25, .3); if (v <= 0) return;
  const g = P(t, a, a + .35, E.back);
  ctx.save(); ctx.globalAlpha *= v; ctx.strokeStyle = '#E9CD4F'; ctx.lineWidth = 3;
  const p = pad + (1 - g) * 6; rr(r[0] - p, r[1] - p, r[2] + p * 2, r[3] + p * 2, rad + p); ctx.stroke(); ctx.restore();
}
const C = r => [r[0] + r[2] / 2, r[1] + r[3] / 2];
// shadow under a floating piece of UI (its plate has no shadow and transparent corners: known-issues 1)
function floatShadow(r, rad, blur, offY, col, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.shadowColor = col; ctx.shadowBlur = blur; ctx.shadowOffsetY = offY; ctx.fillStyle = '#FFFFFF';
  rr(r[0], r[1], r[2], r[3], rad); ctx.fill(); ctx.restore();
}

// ------------------------------------------------------------------ timeline (video seconds)
// narration (ElevenLabs, "UK voice voice to use for ANDRI vids") start times, matched to audio/mix-uk.wav
const VO = { L0: 0.6, L1: 9.0, L2: 13.6, L3: 22.2, L4: 28.0, L5: 34.6, L6: 43.2, L7: 47.2, L8: 57.4, L9: 66.0, L10: 69.8, L11: 78.2, L12: 87.2, L13: 94.2, L14: 99.6 };
const T = {
  tlHover: 10.9, tlOpen: 12.25,                         // Open Timeline
  chipClick: 25.0,                                      // a source chip opens the judgment
  dvClose: 28.6, tlHover2: 29.4, tlOpen2: 30.05,        // close it, reopen the Timeline
  addClick: 36.6, titleClick: 37.9, typeA: 38.1, typeB: 39.4, dateClick: 39.6, pickClick: 40.3, tlClose: 42.6,
  q1A: 43.4, q1B: 45.6, send1: 46.0,                   // what each document proves
  q2A: 57.6, q2B: 59.0, send2: 59.3, pick1: 61.2, op1: 63.0, op2: 64.6,   // hearing notes
  simHover: 71.0, simClick: 71.6,                       // Simulate
  start: 79.3, genEnd: 80.0, judgeDone: 86.1, next: 88.5, rst: 95.6, dlgOk: 96.8, exit: 98.4,
};
const Q1 = 'Review the key documents: what does each one prove?';
const Q2 = 'Write my hearing notes from this.';
const TITLE_TXT = 'Phone call with Ms Nair about job applications';

// cursor: [t0, t1, target]; targets in app px (resolved through the camera at draw time)
function cursorPath() {
  const g = 'mGreet', ch = 'mChat';
  const tl = R(g, 'riTl'), kb = R('mSplit', 'btnKB');
  const bodyY = (n, id, s) => 276 - s + item(n, id)[1];
  const chip = item('tlBodyA', 'chipP'), cp = [882 + chip[0] + chip[2] / 2, bodyY('tlBodyA', 'chipP', 1732) + 9];
  const add = item('tlBodyA', 'addB'), ap = [882 + add[0] + add[2] / 2, bodyY('tlBodyA', 'addB', 3797) + 40];
  const ft = item('tlBodyF', 'fTitle'), fd = item('tlBodyF', 'fDate'), sv = item('tlBodyF', 'btnSave');
  const at = (it, dx = 0) => [882 + it[0] + it[2] / 2 + dx, 276 - 4043 + it[1] + it[3] / 2];
  const d9 = RECTS.pickerAt.d9, p9 = [882 + d9[0] + d9[2] / 2, 276 - 4043 + d9[1] + d9[3] / 2];
  const dvx = R('mView', 'dvX'), tlx = [1399, 120];
  const go1 = R(g, 'go'), goD = R(ch, 'go');
  const o1 = R('qp1', 'op1'), o2 = R('qp2', 'op2');
  const rs = R('mChatSim', 'riSim');
  const bs = R('sStart', 'btnGo'), bn = R('sJudgeDone', 'btnGo'), br = R('sClaimDone', 'btnRst'), ok = R('dlg', 'dlgOk');
  return [
    [9.2, 9.21, 'enter'], [9.3, 10.85, C(tl)], [12.6, 13.4, [C(tl)[0] + 140, C(tl)[1] + 250]], [13.4, 14.0, 'exit'],
    [22.6, 22.61, 'exit'], [22.7, 24.6, cp], [25.6, 26.6, [cp[0] + 120, cp[1] + 160]],
    [27.4, 28.3, C(dvx)], [28.7, 29.35, C(tl)], [30.4, 31.2, [C(tl)[0] + 180, C(tl)[1] + 260]],
    [35.0, 36.3, ap], [37.2, 37.75, at(ft)], [38.0, 38.8, [at(ft)[0] + 160, at(ft)[1] + 40]], [39.0, 39.5, at(fd, -120)], [39.75, 40.15, p9], [40.45, 41.0, at(sv, 40)],
    [41.6, 42.4, tlx], [42.8, 43.3, [900, 620]],
    [44.9, 45.75, C(go1)], [46.3, 47.0, [C(go1)[0] + 120, C(go1)[1] + 200]], [47.0, 47.4, 'exit'],
    [58.9, 58.91, 'exit'], [58.95, 59.15, C(goD)], [59.6, 60.2, [1300, 760]],
    [61.8, 62.5, C(o1)], [63.3, 63.9, C(o2)], [64.9, 65.5, [1280, 760]], [65.6, 66.0, 'exit'],
    [70.0, 70.01, 'exit'], [70.1, 70.95, C(rs)], [72.4, 73.2, [520, 520]],
    [78.3, 79.0, C(bs)], [79.6, 80.2, [1180, 420]], [80.2, 80.8, 'exit'],
    [87.3, 87.31, 'exit'], [87.4, 88.3, C(bn)], [88.8, 89.4, [1200, 450]],
    [94.3, 94.31, [1200, 450]], [94.6, 95.4, C(br)], [95.9, 96.6, C(ok)], [97.0, 97.8, [1300, 600]], [97.8, 98.3, 'exit'],
  ];
}
const CLICKS = [T.tlOpen, T.chipClick, T.dvClose, T.tlOpen2, T.addClick, T.titleClick, T.dateClick, T.pickClick, T.tlClose, T.send1 - .1, T.send2 - .1, T.op1, T.op2, T.simClick, T.start, T.next, T.rst, T.dlgOk];
const CURSOR_ON = [[9.2, 14.0], [22.6, 47.4], [58.9, 66.0], [70.0, 80.8], [87.3, 98.3]];

// captions (step number, text) shown in the pill under the window
const CAP = [[9.0, 1, 'Open the Timeline'], [22.2, 2, 'Every fact, sourced'], [28.0, 3, 'Key dates'], [34.6, 4, 'Add your own'], [43.2, 5, 'What each document proves'],
  [57.4, 6, 'Hearing notes'], [69.8, 7, 'Rehearse with Simulate'], [87.2, 8, 'Next Step'], [94.2, 9, 'Start again']];
const CAP_END = 98.2;

// ------------------------------------------------------------------ scroll positions (content px)
// Timeline body: 0 = top. Sections as they are named, then the events, then the bottom (+ Add event / the form)
const TL_SCROLL = [[0, 0], [19.2, 808, .8], [20.1, 1252, .7], [21.1, 1732, .8],
  [29.0, 0, .01], [31.6, 1938, 1.4], [34.0, 3300, 2.2], [35.9, 3797, 1.1], [37.3, 4043, .6]];
// chat thread (thread4 px). The "Waiting for your input" line and question card leave the thread once answered (staging)
const CUT_A = 1828, CUT_B = 1994, CUT = CUT_B - CUT_A;
const TH_SCROLL = [[0, 0], [49.0, 66, .5], [49.5, 353, .5], [50.6, 877, .9], [53.0, 524, .9], [57.2, 1101, .9],
  [59.8, 1192, .6], [61.4, 1694, .8], [64.72, 1475, .02], [66.4, 1958, .9]];
// row reveal times for thread4 rows (index = row)
const TH_REVEAL = [46.05, 46.05, 46.5, 46.9, 47.3, 47.8, 48.3, 48.7, 49.0, 49.25, 49.5, 49.75, 49.95, 50.4, 50.6, 50.9,
  59.35, 59.35, 59.8, 60.3, 60.7, 60.7, 64.75, 64.8, 65.1, 65.5, 65.7, 65.9, 66.1, 66.4, 66.55, 66.7, 66.85, 67.0];
// judge turn rows (judgeTurn px) and claimant turn rows
const J_REVEAL = (() => { const o = []; for (let i = 0; i < 17; i++) o.push(80.0 + i * .11); for (let i = 17; i < 27; i++) o.push(83.7 + (i - 17) * .09); return o; })();
const J_SCROLL = [[0, 0], [81.8, 231, 1.2], [85.0, 1004, 1.1]];
const C_REVEAL = [88.8, 89.1, 89.5, 89.9, 90.3, 90.6, 91.0, 91.3, 91.6];

// ------------------------------------------------------------------ camera
const POSE = { s: 1.08, cx: 960, cy: 503 };
function zoomOn(r, maxW, maxH, cx = 960, cy = 500) { const s = Math.min(maxW / r[2], maxH / r[3]); return { fx: r[0] + r[2] / 2, fy: r[1] + r[3] / 2, s, cx, cy, clip: r, r: 18, o: 1 }; }
const Z = {
  chip: [850, 320, 588, 330],                 // the Procedural status paragraph with its source chip
  form: [870, 232, 570, 548],                 // Add event form and the date picker above it
  q1: [347, 470, 800, 150], q2: [347, 662, 800, 150],    // typing in the chat box
  table: [270, 140, 920, 470], flag: [270, 140, 920, 380], // the answer's table; the flagged schedule of loss
  pick: [300, 290, 900, 550],                 // question card and picker
  rec: [97, 560, 994, 280], iss: [120, 300, 980, 400],   // judge: Record Issues, the issues
};
function shot(name) {
  const full = [0, 0, 1440, 860];
  if (name === 'screen') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy, clip: full, r: 22, o: 1 };
  if (name === 'below') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy + 1100, clip: full, r: 22, o: 1 };
  if (name === 'out') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy, clip: full, r: 22, o: 0 };   // plain fade, no zoom
  return zoomOn(Z[name], 1500, 800);
}
// Bennett, 8 Oct: zoom back out to the whole screen between close-ups, never pan from one zoom to the next.
const SHOTS = [[0, 'below', 0], [7.9, 'screen', 0.85],
  [22.5, 'chip', 1.0], [25.1, 'screen', 0.8],
  [36.9, 'form', 0.9], [41.7, 'screen', 0.8],
  [43.0, 'q1', 0.8], [46.1, 'screen', 0.8],
  [57.6, 'q2', 0.7], [59.4, 'screen', 0.7],
  [61.6, 'pick', 0.8], [64.75, 'screen', 0.7],
  [81.9, 'rec', 0.8], [83.6, 'screen', 0.7], [84.9, 'iss', 0.8], [86.6, 'screen', 0.8],
  [T.exit, 'out', 1.0]];
// zoomed shots push in slowly (3%) while they hold, so a long narration line never sits on a still frame
const DRIFT = { chip: .03, form: .025, table: .03, flag: .03, pick: .025, rec: .03, iss: .03 };
function shotAt(i, t) {
  const o = shot(SHOTS[i][1]), dr = DRIFT[SHOTS[i][1]] || 0;
  if (dr) { const a = SHOTS[i][0], b = i + 1 < SHOTS.length ? SHOTS[i + 1][0] : DURATION; o.s *= 1 + dr * E.io(cl((t - a) / (b - a))); }
  return o;
}
function camera(t) {
  let i = 0; while (i < SHOTS.length - 1 && SHOTS[i + 1][0] <= t) i++;
  const cur = shotAt(i, t), d = SHOTS[i][2];
  if (i === 0 || d === 0) return cur;
  const prev = shotAt(i - 1, t); const k = E.qio(cl((t - SHOTS[i][0]) / d));
  if (SHOTS[i][1] === 'out') { const o = { ...prev }; o.o = 1 - E.io(cl((t - SHOTS[i][0]) / d)); return o; }   // the exit: the window simply fades from wherever it is
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

// ------------------------------------------------------------------ the app: pieces
// typing into a field drawn from a "typed" sprite: everything right of the typed part is painted over with the field's own colour
function typedSprite(name, t, a, b, text, fx, fy, fw, fh, fontPx, bg, alpha = 1) {
  sprite(name, alpha);
  const n = Math.round(text.length * cl((t - a) / (b - a)));
  font(400, fontPx); const w = ctx.measureText(text.slice(0, n)).width;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = bg; ctx.fillRect(fx + w + 1, fy, fw - w - 1, fh);
  if (t < b + .6 && Math.floor(t * 2.2) % 2 === 0) { ctx.fillStyle = '#241E19'; ctx.fillRect(fx + w + 1, fy + 2, 1.5, fh - 4); }   // caret
  ctx.restore();
}
// Timeline panel body (tall sprite), clipped to the panel's body below its header
function tlBody(t, name, alpha = 1) {
  const s = keys(t, TL_SCROLL);
  ctx.save(); rr(850, 204, 588, 640, [0, 0, 16, 16]); ctx.clip();
  const [x, , w, h] = box(name); const y0 = 276 - s;
  const sy = Math.max(0, 204 - y0), sh = Math.min(h, 844 - y0) - sy;
  slice(name, sy, sh, x, y0 + sy, alpha);
  ctx.restore();
  return s;
}
// the chat thread: rows appear as Andri writes them; once the question is answered its card leaves and the rest moves up
function thread(t, alpha = 1) {
  const rows = ROWS('thread4'); let bottom = 0;
  for (let i = 0; i < rows.length; i++) if (t >= TH_REVEAL[i]) bottom = rows[i][1] + rows[i][3];
  if (bottom <= 0) return;
  const cut = t >= T.op2 + .1, s = keys(t, TH_SCROLL);
  const [x, y] = box('thread4'), top = 140, bot = 844;
  ctx.save(); rr(56, top, 1382, bot - top, [0, 0, 16, 16]); ctx.clip();
  // newest row fades in (and rises 6 px)
  let last = -1; for (let i = 0; i < rows.length; i++) if (t >= TH_REVEAL[i]) last = i;
  const k = P(t, TH_REVEAL[last], TH_REVEAL[last] + .3);
  const yOf = sy => y - s + (cut && sy >= CUT_B ? sy - CUT : sy);
  const seg = (a, b) => { if (b <= a) return; const ya = yOf(a); const lo = Math.max(a, a + (top - ya)), hi = Math.min(b, a + (bot - ya)); if (hi > lo) slice('thread4', lo, hi - lo, x, yOf(lo)); };
  const lastTop = rows[last][1], lastBot = rows[last][1] + rows[last][3];
  const parts = cut ? [[0, CUT_A], [CUT_B, bottom]] : [[0, bottom]];
  for (const [a, b] of parts) {
    // everything above the newest row at full strength, the newest row fading in
    seg(a, Math.min(b, lastTop));
    if (lastTop < b && lastBot > a) { ctx.save(); ctx.globalAlpha *= k; ctx.translate(0, (1 - k) * 6); seg(Math.max(a, lastTop), Math.min(b, lastBot)); ctx.restore(); }
  }
  ctx.restore();
}
function chatBottom(t) {
  // fade over the thread's lower edge (as .fadebot in the app), then the docked chat box and the line under it
  const g = ctx.createLinearGradient(0, 654, 0, 844); g.addColorStop(0, 'rgba(254,253,251,0)'); g.addColorStop(.45, '#FEFDFB'); g.addColorStop(1, '#FEFDFB');
  ctx.save(); rr(56, 654, 1382, 190, [0, 0, 16, 16]); ctx.fillStyle = g; ctx.fill(); ctx.restore();
}
function cboxShadow(r, a = 1) { floatShadow(r, 20, 18, 4, 'rgba(200,170,60,.16)', a); }
function judgeBody(t, name, REV, SCR) {
  const rows = ROWS(name); let bottom = 0, last = -1;
  for (let i = 0; i < rows.length; i++) if (t >= REV[i]) { bottom = rows[i][1] + rows[i][3]; last = i; }
  if (last < 0) return;
  const s = keys(t, SCR), [x, y] = box(name), top = 257, bot = 844;
  ctx.save(); rr(97, top, 994, bot - top, [0, 0, 14, 14]); ctx.clip();
  const lastTop = rows[last][1], k = P(t, REV[last], REV[last] + .25);
  const seg = (a, b) => { const ya = y - s + a; const lo = Math.max(a, a + (top - ya)), hi = Math.min(b, a + (bot - ya)); if (hi > lo) slice(name, lo, hi - lo, x, y - s + lo); };
  seg(0, lastTop);
  ctx.save(); ctx.globalAlpha *= k; ctx.translate(0, (1 - k) * 5); seg(lastTop, bottom); ctx.restore();
  ctx.restore();
}

// ------------------------------------------------------------------ the app
function drawMatter(t) {
  // which full screen is showing, with short blends where the app switches (opening/closing panels is instant in the app)
  const bl = (a, d = 0) => d ? P(t, a, a + d, E.io) : (t >= a ? 1 : 0);   // panels open and close instantly in the app
  if (t < T.tlOpen) {
    plate('mGreet'); plate('mGreetTl', V2(t, T.tlHover, T.tlOpen + .05, .12, .1));
    return;
  }
  if (t < T.chipClick + .05) {                                   // Timeline open (first time)
    plate('mGreet'); const k = bl(T.tlOpen);
    // the panel slides in from the right while the chat narrows (a 0.3 s push, as the app's panel)
    ctx.save(); ctx.globalAlpha *= k; plate('mSplit'); tlBody(t, 'tlBodyA'); ctx.restore();
    ring(t, 15.4, 17.0, R('mSplit', 'btnKB'), 12, 4);
    const ch = item('tlBodyA', 'chipP'), s = keys(t, TL_SCROLL);
    ring(t, 23.2, 24.8, [882 + ch[0], 276 - s + ch[1], ch[2], ch[3]], 6, 4);
    return;
  }
  if (t < T.dvClose + .05) {                                      // the judgment, opened from its chip
    plate('mSplit'); tlBody(t, 'tlBodyA'); plate('mView', bl(T.chipClick + .05));
    return;
  }
  if (t < T.tlOpen2) {                                            // closed, back to the chat; hover Open Timeline again
    plate('mView'); plate('mGreet', bl(T.dvClose + .05)); plate('mGreetTl', V2(t, T.tlHover2, T.tlOpen2 + .05, .12, .1));
    return;
  }
  if (t < T.tlClose + .05) {                                      // Timeline again: key dates, + Add event
    plate('mGreet'); const k = bl(T.tlOpen2);
    ctx.save(); ctx.globalAlpha *= k; plate('mSplit');
    const formOn = t >= T.addClick + .05;
    const s = tlBody(t, formOn ? 'tlBodyF' : 'tlBodyA');
    if (formOn) {
      const f = RECTS.formAt.aform, fx = 882 + f[0], fy = 276 - s + f[1];
      ctx.save(); rr(850, 204, 588, 640, [0, 0, 16, 16]); ctx.clip();
      ctx.translate(fx - box('formT')[0], fy - box('formT')[1]);
      // the title is typed, then the date is picked
      if (t >= T.titleClick) {
        const ft = item('tlBodyF', 'fTitle'); const tx = box('formT')[0] + (ft[0] - f[0]) + 13, ty = box('formT')[1] + (ft[1] - f[1]) + 6;
        if (t < T.pickClick + .05) typedSprite('formT', t, T.typeA, T.typeB, TITLE_TXT, tx, ty, ft[2] - 26, ft[3] - 12, 14, '#FFFFFF');
        else sprite('formD');
      }
      ctx.restore();
      ctx.save(); rr(850, 204, 588, 640, [0, 0, 16, 16]); ctx.clip();
      const pv = V2(t, T.dateClick + .05, T.pickClick + .2, .14, .14);
      if (pv > 0) { const d = RECTS.pickerAt.dp, px = 882 + d[0], py = 276 - s + d[1], b = box('picker');
        floatShadow([px, py, d[2], d[3]], 10, 24, 8, 'rgba(60,45,20,.12)', pv);
        ctx.save(); ctx.translate(px - b[0], py - b[1]); sprite(t >= T.pickClick ? 'pickerOn' : 'picker', pv); ctx.restore(); }
      ctx.restore();
      const sv = item('tlBodyF', 'btnSave'); ring(t, 40.5, 41.9, [882 + sv[0], 276 - s + sv[1], sv[2], sv[3]], 9, 4);
    }
    ctx.restore();
    return;
  }
  if (t < T.send1) {                                              // chat: ask what each document proves
    plate('mSplit'); plate('mGreet', bl(T.tlClose + .05));
    if (t >= T.q1A) { const b = box('cboxQ1'); typedSprite('cboxQ1', t, T.q1A, T.q1B, Q1, b[0] + 20, b[1] + 19, 600, 24, 17, '#FFFEFA'); }
    return;
  }
  // the conversation
  plate('mGreet'); plate(t >= T.simHover ? 'mChatSim' : 'mChat', bl(T.send1, .25));
  thread(t);
  // the flagged point gets the yellow highlight sweep (as 1.1's source passage) while the voice names it
  { const v = V2(t, 53.35, 56.4, .05, .3); if (v > 0) { const it = item('thread4', 'a1s'), [bx, by] = box('thread4');
      font(600, 16.5); const w = ctx.measureText('Schedule of loss does not add up.').width;
      const x = bx + it[0] - 3, y = by - keys(t, TH_SCROLL) + it[1] + 1, k = P(t, 53.35, 54.15, E.io);
      ctx.save(); rr(56, 140, 1382, 704, [0, 0, 16, 16]); ctx.clip(); ctx.globalAlpha *= v; ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = '#F8E37C'; rr(x, y, (w + 6) * k, 25, 3); ctx.fill(); ctx.restore(); } }
  chatBottom(t);
  // chat box: from the middle of the greeting down to its docked place, then typing; the question picker takes its place
  const dock = P(t, T.send1, T.send1 + .45, E.qio), bm = box('cboxMid'), bd = box('cboxDock');
  const pk = t >= T.pick1 && t < T.op2 + .1;
  const by = L(bm[1], bd[1], dock), ba = pk ? 1 - P(t, T.pick1, T.pick1 + .15) : (t >= T.op2 ? P(t, T.op2 + .1, T.op2 + .3) : 1);
  if (ba > 0) {
    cboxShadow([bd[0], by, bd[2], bd[3]], ba);
    if (t >= T.q2A && t < T.send2) typedSprite('cboxQ2', t, T.q2A, T.q2B, Q2, bd[0] + 20, bd[1] + 19, 600, 24, 17, '#FFFEFA', ba);
    else sprite('cboxDock', ba, 0, by - bd[1]);
    sprite('discDock', ba * dock);
  }
  if (pk) {                                                       // question picker, page 1 then page 2 (it rises into place)
    const p2 = t >= T.op1 + .05, nm = p2 ? 'qp2' : 'qp1', b = box(nm);
    const k = P(t, T.pick1, T.pick1 + .35, E.q), out = P(t, T.op2 + .05, T.op2 + .1);
    const hot = p2 ? (t >= 63.95) : (t >= 62.45);
    floatShadow(b, 16, 24, 6, 'rgba(60,45,20,.12)', k * (1 - out));
    sprite(hot ? nm + 'hot' : nm, k * (1 - out), 0, (1 - k) * 30);
  }
  // Simulate in the rail: tooltip shown by the mChatSim plate
}
function drawSim(t) {
  if (t < T.start + .05) { plate('sStart');
    ring(t, 72.4, 73.7, R('sStart', 'rl0'), 12, 3); ring(t, 73.8, 75.1, R('sStart', 'rl1'), 12, 3); ring(t, 75.4, 76.7, R('sStart', 'rl2'), 12, 3); ring(t, 76.6, 77.9, R('sStart', 'turnN'), 6, 4);
    return; }
  if (t < T.genEnd) { plate('sGen'); return; }
  if (t < T.judgeDone) { plate('sJudge'); judgeBody(t, 'judgeTurn', J_REVEAL, J_SCROLL); return; }
  if (t < T.next + .05) { plate('sJudgeDone'); judgeBody(t, 'judgeTurn', J_REVEAL, J_SCROLL); return; }
  if (t < T.dlgOk + .05) {
    plate(t < 91.9 ? 'sClaim' : 'sClaimDone'); judgeBody(t, 'claimTurn', C_REVEAL, [[0, 0]]);
    ring(t, 90.0, 91.3, R('sClaim', 'rl2'), 12, 3);
    const rw = ROWS('claimTurn')[4]; ring(t, 91.7, 93.3, [97 + rw[0] + 30, 257 + rw[1] + 6, 134, 20], 7, 3);
    ring(t, 94.3, 95.45, R('sClaimDone', 'btnRst'), 8, 6);
    const dk = P(t, T.rst + .05, T.rst + .25);
    if (dk > 0) { ctx.save(); ctx.globalAlpha *= dk; ctx.fillStyle = 'rgba(30,26,22,.42)'; ctx.fillRect(0, 0, 1440, 860); ctx.restore();
      const b = box('dlg'), sc = .96 + .04 * E.out(dk); floatShadow(b, 14, 50, 20, 'rgba(30,24,18,.28)', dk); sprite('dlg', dk, 0, 0, sc); }
    return;
  }
  plate('sStart');                                                // started again: Turn 1/6, with the app's two toasts
  const a = V2(t, T.dlgOk + .1, 97.75, .2, .15), b2 = V2(t, 97.7, 99.6, .15, .3);
  if (a > 0) { floatShadow(box('toast1'), 10, 18, 6, 'rgba(60,45,20,.12)', a); sprite('toast1', a, 0, (1 - P(t, T.dlgOk + .1, T.dlgOk + .4)) * 12); }
  if (b2 > 0) { floatShadow(box('toast2'), 10, 18, 6, 'rgba(60,45,20,.12)', b2); sprite('toast2', b2); }
}
function drawApp(t) {
  // pushing across from the chat into Simulate (like opening a page)
  const push = P(t, T.simClick + .05, T.simClick + .6, E.qio);
  if (push <= 0) return drawMatter(t);
  if (push >= 1) return drawSim(t);
  ctx.save(); ctx.translate(-1440 * push, 0); drawMatter(t); ctx.restore();
  ctx.save(); ctx.translate(1440 * (1 - push), 0); drawSim(t); ctx.restore();
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
    // while the screens push across, a target belongs to the page it sits on
    const push = P(t, T.simClick + .05, T.simClick + .6, E.qio);
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
  if (t > 8.8) return;
  const up = P(t, 7.9, 8.7, E.qio);
  ctx.save(); ctx.translate(0, -up * 1080);
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  ctx.fillStyle = '#F7E17E'; ctx.fillRect(0, 0, W, H);
  const e = P(t, 0.3, 0.75); font(600, 22); ctx.fillStyle = '#494746'; ctx.globalAlpha = e;
  ctx.letterSpacing = '3px'; ctx.fillText('ANDRI ACADEMY · 4.2', 122, 392); ctx.letterSpacing = '0px'; ctx.globalAlpha = 1;
  words('Prepare and rehearse', 120, 530, 0.5, .09, 112, 500, '#231E19', null);
  words('the hearing.', 120, 640, 1.0, .09, 84, 400, '#231E19', null);
  mascot('wave', t, .25, 8.8, 1180, 330, 640);
  ctx.restore();
}
const END = 98.4 + 1.0;
function endCard(t) {
  if (t < END - .05) return;
  const a = P(t, END, END + .6), dy = (1 - P(t, END, END + .7, E.q)) * 24;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(0, dy);
  ctx.drawImage(IMG.logo, 452, 438, 520, 520 * 600 / 2299);
  font(500, 25); ctx.fillStyle = '#494746'; ctx.textBaseline = 'alphabetic'; ctx.fillText('Andri Academy · Next: Check many contracts at once, in one table', 455, 635);
  ctx.restore();
  // mascot, then the tick springs in with a slight twist (as in 1.1)
  const m = mascot('done', t, END + .2, DURATION + 8, 1185, 400, 420, { from: 'pop' });
  if (m) {
    const b = MMETA.done.badge, sc = m.sc;
    const bx = m.x + m.w / 2 + (b[0] * m.w + b[2] * m.w / 2 - m.w / 2) * sc, by = m.y + m.h + (b[1] * m.h + b[3] * m.h / 2 - m.h) * sc;
    const fi = Math.floor((t - END - .2) * MMETA.disc.fps) % MMETA.disc.frames, mw = m.w * m.sc, mh = m.h * m.sc;
    const ox = m.x + m.w / 2 - mw / 2, oy = m.y + m.h + m.dy - mh;
    const x = cl((t - END - .7) / .34), k = x <= 0 ? 0 : E.back(x);
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
  if (cam.o > 0 && t > 7.8) {
    // the app is drawn unclipped into its own layer, then the layer is clipped to the window once:
    // stacked plates never bleed at the antialiased edge, and the whole window fades as one picture
    const [x, y, w, h] = cam.clip; const [sx, sy] = toScreen(cam, x, y); const sw = w * cam.s, sh = h * cam.s;
    ctx = layCtx; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#F2EFE9'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(cam.cx - cam.fx * cam.s, cam.cy - cam.fy * cam.s); ctx.scale(cam.s, cam.s); drawApp(t); ctx.restore();
    ctx = ctx0;
    ctx.save(); ctx.globalAlpha *= cam.o;
    ctx.shadowColor = 'rgba(35,30,25,.16)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 26; ctx.fillStyle = '#F2EFE9'; rr(sx, sy, sw, sh, cam.r); ctx.fill();
    ctx.shadowColor = 'rgba(35,30,25,.22)'; ctx.shadowBlur = 1; ctx.shadowOffsetY = 0; ctx.fill(); ctx.shadowColor = 'transparent';
    rr(sx, sy, sw, sh, cam.r); ctx.clip(); ctx.drawImage(lay, 0, 0);
    ctx.restore();
  }
  endCard(t);
  title(t);
  caption(t);
  if (cam.o > 0) cursor(t, cam);
}

window.MG = { width: W, height: H, fps: FPS, duration: DURATION, renderFrame };
if (!navigator.webdriver) { const t0 = performance.now(); (function loop() { renderFrame(((performance.now() - t0) / 1000) % DURATION).then(() => requestAnimationFrame(loop)); })(); }
