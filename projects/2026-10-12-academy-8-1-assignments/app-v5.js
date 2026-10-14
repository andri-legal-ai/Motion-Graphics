// Andri Academy 8.1 · Delegate it to Andri, and to your trainee
// Everything is drawn on one <canvas> by renderFrame(t), a pure function of time t (seconds).
// App screens are plates of real Andri staging snapshots (plates/*.png, 2x, built by plates/capture.mjs); all motion is drawn here.
// Engine, camera, captions, cursor, mascot, title and end card follow the approved 1.1, 1.2 and 5.1 videos.

const W = 1920, H = 1080, FPS = 60, LDUR = 120.3;
// [logical start, seconds]: removes still, silent stretches (time map as in 2.1 / 5.1). v5: the moments where picture and voice both stopped (Bennett: sudden pauses)
const CUTS = [[17.0, 1.8], [35.15, 1.35], [45.05, .8], [61.35, .9], [68.45, 1.2], [74.75, 1.0]];
// v4 (Bennett: tempo a bit too fast): after the title card the whole app part plays 1.25x slower (as 2.1); narration lines keep their natural speed
const logical = v => { const A = 7.2, B = 104.75, S = 1.25; let L = v <= A ? v : v <= A + (B - A) * S ? A + (v - A) / S : v - (B - A) * (S - 1); for (const [s, d] of CUTS) { if (d > 0) { if (L >= s) L += d; } else { const h = -d; if (L >= s + h) L -= h; else if (L >= s) L = s; } } return L; };
const videoT = L => { for (let i = CUTS.length - 1; i >= 0; i--) { const [s, d] = CUTS[i]; if (d > 0) { if (L >= s + d) L -= d; else if (L >= s) L = s; } else if (L > s) L += -d; } const A = 7.2, B = 104.75, S = 1.25; return L <= A ? L : L <= B ? A + (L - A) * S : A + (B - A) * S + (L - B); };
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
const PLATES = ['bE', 'n1', 'n3t', 'n3', 'n4', 'n5', 'n6', 'n9', 'mPri', 'mType', 'mMat', 'mCal', 'bC', 'lC', 'dN', 'pD1', 'd1', 'd2', 'wS', 'toast', 'wW', 'dF', 'dT',
  'c0', 'c1', 'c2', 'c3', 'i1', 'i2', 'k0', 'k1', 'k2', 'k2e', 'k3', 'mRole', 'k4', 'lD', 'bR', 'rN', 'pR1', 'r1', 'r2', 'r3', 'r5', 'bD'];
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
const PX = {};
function px(name, x, y) {
  const k = `${name}:${x}:${y}`; if (PX[k]) return PX[k];
  const cv = document.createElement('canvas'); cv.width = 1; cv.height = 1; const g = cv.getContext('2d');
  g.drawImage(IMG[name], Math.round(x * 2), Math.round(y * 2), 1, 1, 0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data;
  return (PX[k] = `rgb(${d[0]},${d[1]},${d[2]})`);
}

// ------------------------------------------------------------------ helpers
const R = (set, id) => RECTS[set][id];
const box = n => RECTS[n].box;
const C = r => [r[0] + r[2] / 2, r[1] + r[3] / 2];
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function font(w, s, fam = 'Rethink') { ctx.font = `${w} ${s}px ${fam}`; }
function plate(name, a = 1) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(IMG[name], 0, 0, 1440, 860); ctx.restore(); }
function region(name, r, a = 1, dx = 0, dy = 0) { if (a <= 0) return; const [x, y, w, h] = r; ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(IMG[name], x * 2, y * 2, w * 2, h * 2, x + dx, y + dy, w, h); ctx.restore(); }
// part of a sprite (its image is cropped to its own box), drawn in place
function sregion(name, r, a = 1, dx = 0, dy = 0) { if (a <= 0) return; const [bx, by] = box(name), [x, y, w, h] = r; ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(IMG[name], (x - bx) * 2, (y - by) * 2, w * 2, h * 2, x + dx, y + dy, w, h); ctx.restore(); }
function xf(a, b, t, t0, d = .3) { const k = P(t, t0, t0 + d, E.io); if (k < 1) plate(a); if (k > 0) plate(b, k); }
function sprite(name, a = 1, dx = 0, dy = 0, sc = 1) {
  if (a <= 0) return; const [x, y, w, h] = box(name); ctx.save(); ctx.globalAlpha *= a;
  ctx.translate(x + w / 2 + dx, y + h / 2 + dy); ctx.scale(sc, sc); ctx.drawImage(IMG[name], -w / 2, -h / 2, w, h); ctx.restore();
}
// shadow for a floating sprite captured without its own (known-issues #1)
function floatShadow(name, a = 1, dx = 0, dy = 0, r = 12, strong = false) {
  if (a <= 0) return; const [x, y, w, h] = box(name);
  ctx.save(); ctx.globalAlpha *= a; ctx.shadowColor = strong ? 'rgba(35,30,25,.20)' : 'rgba(35,30,25,.14)'; ctx.shadowBlur = strong ? 28 : 24; ctx.shadowOffsetY = strong ? 10 : 8;
  ctx.fillStyle = '#FFFFFF'; rr(x + dx + 2, y + dy + 2, w - 4, h - 4, r); ctx.fill(); ctx.restore();
}
// a popover menu opening under its chip (fade and a short drop, as radix does)
function pop(name, t, t0, t1, strong = true) {
  const m = P(t, t0 + .02, t0 + .2, E.out) * (1 - P(t, t1, t1 + .1)); if (m <= 0) return;
  floatShadow(name, m, 0, (1 - m) * -6, 10, strong); sprite(name, m, 0, (1 - m) * -6);
}
// gold ring around a small control (app px), only while the voice names it
function ring(t, a, b, r, rad = 10, pad = 5) {
  if (!r) return; const v = V2(t, a, b, .25, .3); if (v <= 0) return;
  const g = P(t, a, a + .35, E.back);
  ctx.save(); ctx.globalAlpha *= v; ctx.strokeStyle = '#E9CD4F'; ctx.lineWidth = 3;
  // the whole ring stays inside the app window, so no edge is ever cut off (known-issues #10)
  const p = pad + (1 - g) * 6, m = 3; let x0 = r[0] - p, y0 = r[1] - p, x1 = r[0] + r[2] + p, y1 = r[1] + r[3] + p;
  x0 = Math.max(m, x0); y0 = Math.max(m, y0); x1 = Math.min(1440 - m, x1); y1 = Math.min(860 - m, y1);
  rr(x0, y0, x1 - x0, y1 - y0, Math.min(rad + p, (y1 - y0) / 2)); ctx.stroke(); ctx.restore();
}
// the yellow highlight sweep over a phrase the voice names (4.2: #F8E37C, multiply, left to right)
function sweep(t, a, lines) {
  if (!lines || t < a) return;
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#F8E37C';
  lines.forEach(([x, y, w, h], i) => { const k = P(t, a + i * .5, a + i * .5 + .8, E.io); if (k > 0) { rr(x - 2, y - 1, (w + 4) * k, h + 2, 3); ctx.fill(); } });
  ctx.restore();
}
function caret(t, x, y, h = 18) { if (Math.floor(t * 2.2) % 2 === 0) { ctx.fillStyle = '#241E19'; ctx.fillRect(x + 1, y, 1.4, h); } }
// typing: the field shows the previous plate's content until typing starts, then the real typed text of the full plate is
// revealed letter by letter (widths measured in Rethink Sans at the field's own size)
function typeIn(t, prev, full, rect, lines, sz, wt, t0, t1, { lh = rect[3], ox = 0, caretH = sz + 4 } = {}) {
  const [x, y, w, h] = rect;
  if (t < t0) { region(prev, rect); return; }
  ctx.fillStyle = px(full, x + w - 3, y + 3); ctx.fillRect(x, y, w, h);
  const total = lines.join(' ').length; const n = Math.round(P(t, t0, t1, E.lin) * total); font(wt, sz);
  let used = 0, cx = x + ox, cy = y;
  lines.forEach((ln, i) => { const part = ln.slice(0, Math.max(0, Math.min(ln.length, n - used))); const tw = ctx.measureText(part).width;
    if (part.length) { region(full, [x, y + i * lh, part.length === ln.length ? w : ox + tw + 3, lh]); cx = x + ox + tw + 1; cy = y + i * lh; }
    used += ln.length + 1; });
  if (t < t1 + .3) caret(t, cx, cy + (lh - caretH) / 2, caretH);
}
// a panel sliding in from the right edge of the window (in) or out, over the list that narrows under it
function panelMove(t, t0, wide, narrow, spr, dir) {
  const k = P(t, t0, t0 + .5, E.qio); const s = dir === 'in' ? k : 1 - k;
  plate(wide); plate(narrow, s);
  const dx = (1 - s) * 580; floatShadow(spr, 1, dx, 0, 16); sprite(spr, 1, dx);
}
// a page change pushes across (1.1), clipped to the window
function push(t, t0, a, b) {
  const k = P(t, t0, t0 + .6, E.qio);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1440, 860); ctx.clip();
  if (k < 1) { ctx.save(); ctx.translate(-k * 1440, 0); plate(a); ctx.restore(); }
  ctx.save(); ctx.translate((1 - k) * 1440, 0); plate(b); ctx.restore();
  ctx.restore();
}
// the side panel scrolls: its body moves by dist while the next state fades in (header, list and comment box stay)
const PBODY = [875, 180, 558, 432];
function scrollPanel(t, t0, a, b, dist) {
  const k = P(t, t0, t0 + .6, E.io);
  plate(k < .5 ? a : b);
  ctx.save(); ctx.beginPath(); ctx.rect(...PBODY); ctx.clip();
  ctx.fillStyle = px(b, 1428, 200); ctx.fillRect(...PBODY);
  region(a, PBODY, 1 - k, 0, -k * dist); region(b, PBODY, k, 0, (1 - k) * dist);
  ctx.restore();
}
const actY = n => (R(n, 'activity') || [0, 0])[1];

// ------------------------------------------------------------------ timeline (video seconds)
// narration lines (ElevenLabs "UK voice voice to use for ANDRI vids", one take, cut at its pauses: audio/uk/N*.wav)
const VO = { N1: 0.6, N2: 6.9, N3: 20.34, N4: 24.98, N5: 31.89, N6a: 37.01, N6b: 41.68, N6c: 46.28, N7: 51.3, N8: 57.43, N9: 62.71, N10: 70.16, N11: 76.28, N12a: 81.58, N12b: 84.92, N13: 88.65, N14: 93.0, N15a: 99.6, N15b: 103.8, N16: 112.2 };
const T = {
  push: 6.25,                                     // title card pushes up into the app
  newC: 20.35, titleC: 21.0, title: [21.1, 22.0], descC: 22.25, desc: [22.35, 25.0],
  priC: 26.6, high: 27.25, typeC: 27.75, review: 28.4, matC: 28.95, nairT: [29.15, 29.55], nair: 30.0, dueC: 30.5, d16: 31.2,
  create: 32.75,
  listC: 37.3, rowC: 38.5, delC: 40.1, run: 50.5,
  scroll1: 56.8, done: 62.3,
  scroll2: 81.0, chkC: 82.0, chk: [82.2, 83.5], enter: 83.8, comC: 84.9, at: 85.4, esc: 88.0,
  inbox: 88.7, item: 91.3,
  firm: 92.6, members: 94.6, invite: 95.6, emailC: 96.0, email: [96.1, 97.2], roleC: 97.5, support: 98.3, x: 100.6,
  assign: 101.6, boardC: 104.0, reviewC: 105.4, tick: 107.0, scroll3: 107.6, markDone: 109.0, close: 109.9,
  exit: 110.7,
};
const END = 111.8;
const TXT = {
  title: ['Summarise the ET3'],
  desc: ['Summarise Calderdale Logistics’ ET3 response: the defences it raises and anything it leaves', 'out.'],
  chk: ['Check the 2013 Rules point'], email: ['rosalind.keane@aldridgevine.co.uk'], nair: ['Nair'],
};
const CAP = [[VO.N2, 1, 'Assignments'], [VO.N3, 2, 'A new task'], [VO.N6a, 3, 'Delegate to Andri'], [VO.N7, 4, 'Andri works'], [VO.N9, 5, 'Check the result'],
  [VO.N12a, 6, 'Checklist and comments'], [VO.N13, 7, 'Inbox'], [VO.N14, 8, 'Add your trainee'], [VO.N15a, 9, 'The board']];
const CAP_END = T.exit + .2;

// ------------------------------------------------------------------ camera
const POSE = { s: 1.08, cx: 960, cy: 503 };
function shot(name) {
  const full = [0, 0, 1440, 860];
  if (name === 'screen') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy, clip: full, r: 22, o: 1 };
  if (name === 'below') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy + 1100, clip: full, r: 22, o: 1 };
  if (name === 'dlgZ') return { fx: 720, fy: 400, s: 1.55, cx: 960, cy: 500, clip: full, r: 22, o: 1 };   // the New assignment dialog and its menus
  if (name === 'delZ') return { fx: 1154, fy: 470, s: 1.6, cx: 960, cy: 500, clip: full, r: 22, o: 1 };   // the two Delegate choices
  if (name === 'gone') return { ...shot('screen'), o: 0 };                                               // plain fade out, no zoom
}
const SHOTS = [[0, 'below', 0], [T.push, 'screen', .85],
  [25.05, 'dlgZ', 1.2], [31.4, 'screen', 1.2],
  [40.5, 'delZ', 1.2], [49.0, 'screen', 1.2],
  [T.exit, 'gone', 1.0]];
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

// ------------------------------------------------------------------ the app, by time
function drawApp(t) {
  // 1 the board, before anything exists
  if (t < T.newC + .02) {
    plate('bE');
    ring(t, 7.2, 8.6, [157, 20, 93, 28], 8, 3);   // the label in the top bar (the tab itself touches the window top)
    ring(t, 10.3, 12.0, R('bE', 'myWork'), 8, 3);
    ring(t, 12.2, 14.9, R('bE', 'filters'), 10, 4);
    const lv = R('bE', 'listV'), bv = R('bE', 'boardV');
    ring(t, 15.2, 16.9, [lv[0], lv[1], bv[0] + bv[2] - lv[0], lv[3]], 8, 4);
    return;
  }
  // 2 New assignment: the dialog opens over the board (fade, as the app's dialog does), title and description typed
  if (t < T.priC + .02) {
    if (t < T.newC + .25) { plate('bE'); plate('n1', P(t, T.newC + .02, T.newC + .25, E.out)); return; }
    plate('n3t');
    typeIn(t, 'n1', 'n3t', [421, 216, 598, 36], TXT.title, 18, 600, T.title[0], T.title[1], { caretH: 22 });
    if (t >= T.desc[0]) { plate('n3'); region('n3t', [421, 216, 598, 36]); }   // title stays as typed
    typeIn(t, 'n3t', 'n3', [421, 264, 598, 42], TXT.desc, 14, 400, T.desc[0], T.desc[1], { lh: 21, caretH: 17 });
    return;
  }
  // 3 the chips: priority, type, matter (search typed), due date
  if (t < T.create + .02) {
    const base = t < T.high + .02 ? 'n3' : t < T.review + .02 ? 'n4' : t < T.nair + .02 ? 'n5' : t < T.d16 + .02 ? 'n6' : 'n9';
    plate(base);
    pop('mPri', t, T.priC, T.high + .02);
    pop('mType', t, T.typeC, T.review + .02);
    if (t >= T.matC && t < T.nair + .14) {   // the matter menu: the search is typed, then the one matching matter shows
      pop('mMat', t, T.matC, T.nair + .02);
      if (t < T.nair + .02) {
        const s = R('mMat', 'search'), nr = R('mMat', 'nair'), bx = box('mMat');
        const m = P(t, T.matC + .02, T.matC + .2, E.out), dm = (1 - m) * -6;
        // while the menu fades in, the hidden parts show the plate behind at full strength, then white at the menu's own alpha (nothing shows through)
        font(400, 14); const covers = [[s[0] - 1, s[1] + 8, ctx.measureText('Nair').width + 14, s[3] - 16]]; if (t < T.nairT[1] + .05) covers.push([bx[0] + 2.5, nr[1] - 2, bx[2] - 5, nr[3] + 4]);
        for (const [cx0, cy0, cw, ch] of covers) { region('n5', [cx0, cy0 + dm, cw, ch]); ctx.save(); ctx.globalAlpha *= m; ctx.fillStyle = '#FFFFFF'; ctx.fillRect(cx0, cy0 + dm, cw, ch); ctx.restore(); }
        ctx.save(); ctx.globalAlpha *= m; ctx.translate(0, dm);
        const k = P(t, T.nairT[0], T.nairT[1], E.lin), str = 'Nair'.slice(0, Math.round(k * 4));
        font(400, 14); const tw = str ? ctx.measureText(str).width : 0; if (str) sregion('mMat', [s[0], s[1] + 6, tw + 9, s[3] - 12]);
        if (t < T.nairT[1] + .3) caret(t, s[0] + (str ? tw + 9 : 1), s[1] + 9, 18);
        ctx.restore();
      }
    }
    pop('mCal', t, T.dueC, T.d16 + .02);
    return;
  }
  // 4 created: the dialog closes, the card is on the board under To do
  if (t < T.listC + .02) { xf('n9', 'bC', t, T.create + .02, .22); ring(t, 33.4, 35.0, R('bC', 'card'), 14, 4); return; }
  // 5 the list, the task opened, Delegate to Andri
  if (t < T.rowC + .02) { plate('lC'); return; }
  if (t < T.rowC + .55) { panelMove(t, T.rowC + .02, 'lC', 'dN', 'pD1', 'in'); return; }
  if (t < T.delC + .02) { plate('d1'); return; }
  if (t < T.run + .02) { xf('d1', 'd2', t, T.delC + .02, .18); ring(t, 41.8, 45.0, R('d2', 'runBg'), 12, 3); ring(t, 46.0, 49.7, R('d2', 'together'), 12, 3); return; }
  // 6 Andri working: In progress, Andri the assignee, the toast; then the activity log
  if (t < T.scroll1 + .02) {
    plate('wS');
    const tk = P(t, T.run + .1, T.run + .45, E.out) * (1 - P(t, 55.0, 55.35, E.io));
    if (tk > 0) { const [x, y, w, h] = box('toast'), dy = (1 - tk) * 16; ctx.save(); ctx.globalAlpha *= tk; ctx.shadowColor = 'rgba(0,0,0,.10)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4; ctx.fillStyle = '#FFFFFF'; rr(x + 1.5, y + 1.5 + dy, w - 3, h - 3, 12); ctx.fill(); ctx.restore(); sprite('toast', tk, 0, dy); }
    ring(t, 52.3, 53.8, R('wS', 'status'), 12, 3); ring(t, 53.9, 55.6, R('wS', 'who'), 12, 3);
    return;
  }
  if (t < T.done + .02) {
    if (t < T.scroll1 + .62) { scrollPanel(t, T.scroll1 + .02, 'wS', 'wW', actY('wS') - actY('wW')); return; }
    plate('wW'); ring(t, 57.5, 58.9, R('wW', 'activity') && [897, actY('wW') - 2, 66, 21], 6, 4); ring(t, 59.6, 61.3, R('wW', 'stop'), 10, 4);
    return;
  }
  // 7 Andri done: In review, the report, the three buttons
  if (t < T.scroll2 + .02) {
    xf('wW', 'dF', t, T.done + .02, .6);
    ring(t, 65.0, 67.6, R('dF', 'status'), 12, 3);
    ring(t, 70.0, 71.6, R('dF', 'mention'), 8, 3);
    if (t >= T.done + .6) sweep(t, 72.6, R('dF', 'report'));
    ring(t, 75.9, 77.0, R('dF', 'change'), 10, 4); ring(t, 77.1, 79.2, R('dF', 'thread'), 10, 4); ring(t, 79.3, 80.8, R('dF', 'markDone'), 10, 4);
    return;
  }
  // 8 checklist and comments (the panel scrolls back up)
  if (t < T.inbox + .02) {
    if (t < T.scroll2 + .62) { scrollPanel(t, T.scroll2 + .02, 'dF', 'dT', actY('dF') - actY('dT')); return; }
    if (t < T.chkC + .02) { plate('dT'); return; }
    if (t < T.enter + .02) { plate('c1'); typeIn(t, 'c0', 'c1', R('c1', 'addCheck'), TXT.chk, 13.5, 400, T.chk[0], T.chk[1], { caretH: 17 }); return; }
    if (t < T.at + .02 || t >= T.esc + .02) { plate('c2'); return; }
    plate('c3'); return;
  }
  // 9 Inbox
  if (t < T.firm + .02) {
    if (t < T.inbox + .65) { push(t, T.inbox + .02, 'c2', 'i1'); return; }
    if (t < T.item + .02) { plate('i1'); ring(t, 89.6, 91.0, R('i1', 'item'), 12, 2); return; }
    plate('i2'); return;
  }
  // 10 the trainee: Company, Members, Invite with a Support seat (never sent)
  if (t < T.assign + .02) {
    if (t < T.firm + .65) { push(t, T.firm + .02, 'i2', 'k0'); return; }
    if (t < T.members + .02) { plate('k0'); return; }
    if (t < T.invite + .02) { plate('k1'); return; }
    if (t < T.roleC + .02) { if (t < T.invite + .25) { plate('k1'); plate('k2', P(t, T.invite + .02, T.invite + .25, E.out)); return; }
      plate('k2e'); typeIn(t, 'k2', 'k2e', [490, 423, 460, 34], TXT.email, 14, 400, T.email[0], T.email[1], { ox: 12, caretH: 18 }); return; }
    if (t < T.support + .02) { plate('k3'); pop('mRole', t, T.roleC, T.support + .02); return; }
    if (t < T.x + .02) { plate('k4'); ring(t, 98.6, 100.3, R('k4', 'role'), 10, 3); return; }
    xf('k4', 'k1', t, T.x + .02, .2); return;
  }
  // 11 back to Assignments (the list), then the board: review, tick the checklist, mark it done
  if (t < T.boardC + .02) { if (t < T.assign + .65) { push(t, T.assign + .02, 'k1', 'lD'); return; } plate('lD'); return; }
  if (t < T.reviewC + .02) { plate('bR'); return; }
  if (t < T.reviewC + .55) { panelMove(t, T.reviewC + .02, 'bR', 'rN', 'pR1', 'in'); return; }
  if (t < T.tick + .02) { plate('r1'); return; }
  if (t < T.scroll3 + .02) { plate('r2'); return; }
  if (t < T.markDone + .02) { if (t < T.scroll3 + .62) { scrollPanel(t, T.scroll3 + .02, 'r2', 'r3', actY('r2') - actY('r3')); return; } plate('r3'); return; }
  if (t < T.close + .02) { plate('r5'); return; }
  if (t < T.close + .55) { panelMove(t, T.close + .02, 'bD', 'rN', 'pR1', 'out'); return; }
  plate('bD');
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
function cursorPath() {
  const g = (n, k) => C(R(n, k));
  const at = (n, k, dx = 0, dy = 0) => { const r = R(n, k); return [r[0] + r[2] / 2 + dx, r[1] + r[3] / 2 + dy]; };
  const dlgIn = (r, dx = 120) => [r[0] + dx, r[1] + r[3] / 2];
  return [
    [18.9, 18.91, 'enter'], [19.3, 20.2, g('bE', 'newBtn')],
    [20.6, 20.95, dlgIn(R('n1', 'title'), 230)], [21.95, 22.2, dlgIn(R('n1', 'desc'), 240)],
    [25.2, 25.6, [760, 470]],
    [26.0, 26.5, g('n3', 'cPri')], [26.8, 27.15, at('mPri', 'high')], [27.35, 27.65, g('n4', 'cType')], [27.95, 28.3, at('mType', 'review')],
    [28.5, 28.85, g('n5', 'cMatter')], [29.6, 29.9, at('mMat', 'nair', -40)], [30.1, 30.4, g('n6', 'cDue')], [30.75, 31.1, at('mCal', 'd16')],
    [31.35, 31.7, [800, 560]], [32.2, 32.65, g('n9', 'create')],
    [33.2, 33.8, [640, 520]], [36.7, 37.2, g('bC', 'listV')], [37.8, 38.4, at('lC', 'row', -380)], [39.3, 40.0, g('d1', 'delegate')],
    [40.4, 40.8, [1180, 640]],
    [49.6, 50.35, at('d2', 'runBg', -60)], [51.0, 51.7, [700, 560]],
    [81.4, 81.9, at('dT', 'addCheck', -100)], [84.3, 84.8, at('c2', 'comment', -100)],
    [86.3, 86.9, [1100, 610]], [88.1, 88.6, g('i1', 'inbox')], [90.6, 91.2, at('i1', 'item', -60)],
    [91.8, 92.5, g('k0', 'firm')], [93.8, 94.5, at('k0', 'members', -40)], [95.0, 95.5, g('k1', 'invite')], [95.7, 95.95, at('k2', 'email', -60)],
    [97.15, 97.45, at('k2', 'role', -60)], [97.8, 98.2, at('mRole', 'support')], [98.6, 99.2, [1100, 640]], [100.0, 100.5, g('k4', 'x')],
    [100.9, 101.5, g('lD', 'tabAssign')], [102.6, 103.9, g('lD', 'boardV')], [104.4, 105.3, g('bR', 'reviewLink')], [105.9, 106.9, g('r1', 'checkbox')],
    [107.4, 107.9, [1180, 600]], [108.3, 108.9, g('r3', 'markDone')], [109.35, 109.8, g('r5', 'close')], [110.2, 110.7, 'exit'],
  ];
}
const CLICKS = [T.newC, T.titleC, T.descC, T.priC, T.high, T.typeC, T.review, T.matC, T.nair, T.dueC, T.d16, T.create, T.listC, T.rowC, T.delC, T.run,
  T.chkC, T.comC, T.inbox, T.item, T.firm, T.members, T.invite, T.emailC, T.roleC, T.support, T.x, T.assign, T.boardC, T.reviewC, T.tick, T.markDone, T.close];
const CURSOR_ON = [[18.9, 110.7]];
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
const TITLE = { tag: 'ANDRI ACADEMY · 8.1', l1: 'Delegate it to Andri,', l2: 'and to your trainee.' };
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
  words(TITLE.l2, 120, 640, 1.15, .09, 84, 400, '#231E19');
  mascot('wave', t, .25, T.push + .9, 1180, 330, 640);
  ctx.restore();
}
const NEXT = 'Andri Academy · Next: Email in Andri: three ways in';
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
  }
  endCard(t);
  title(t);
  caption(t);
  cursor(t, cam);
}

window.MG = { width: W, height: H, fps: FPS, duration: DURATION, renderFrame };
if (!navigator.webdriver) { const t0 = performance.now(); (function loop() { renderFrame(((performance.now() - t0) / 1000) % DURATION).then(() => requestAnimationFrame(loop)); })(); }
