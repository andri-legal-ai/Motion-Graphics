// Andri Academy 1.1 · Your first matter, start to finish
// Everything is drawn on one <canvas> by renderFrame(t), a pure function of time t (seconds).
// App screens are still plates of the Andri rebuild (plates/*.png, 2x); all motion is drawn here.
// window.VARIANT: 'A' = window left of centre + Andri wheel in the corner, 'B' = larger, centred, no wheel.

const W = 1920, H = 1080, FPS = 60, INTRO = 3.0, DURATION = 78 + INTRO;
const V = 'B'; // centred layout, no wheel (approved 7 Oct)
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
  const plates = ['list', 'dlg0', 'dlgE', 'm0', 'kb0', 'pick0', 'pick1', 'kbProc', 'kbDone', 'm1', 'm1hot', 'eqp0', 'eqp1', 'chat',
    'cboxDock', 'cboxDockOn', 'cboxDockAt', 'cboxDock2', 'disc', 'cboxMid', 'cboxMidOn', 'thread', 'threadNarrow', 'split', 'cboxSplit',
    'src0', 'src1', 'mp0', 'mp1', 'mp2a', 'mp2b', 'jobs', 'letter0', 'letter1'];
  const jobs = plates.map(n => loadImg(ROOT + 'plates/' + n + '.png').then(i => IMG[n] = i));
  jobs.push(loadImg(ROOT + 'assets/Andri-Logo-Ink.svg').then(i => IMG.logo = i));
  jobs.push(loadImg(ROOT + 'assets/Andri-Logo-Icon-Andri-Yellow.svg').then(i => IMG.wheel = i));
  jobs.push(loadImg(ROOT + 'assets/Andri-Logo-Icon-Ink.svg').then(i => IMG.icon = i));
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
// draw part of a 2x plate at its own app position, optionally offset
function part(name, rect, dx = 0, dy = 0, alpha = 1) {
  if (alpha <= 0) return;
  const [x, y, w, h] = rect; ctx.save(); ctx.globalAlpha *= alpha;
  ctx.drawImage(IMG[name], x * 2, y * 2, w * 2, h * 2, x + dx, y + dy, w, h); ctx.restore();
}
function sprite(name, alpha = 1, dx = 0, dy = 0, scale = 1) {
  if (alpha <= 0) return;
  const [x, y, w, h] = box(name); ctx.save(); ctx.globalAlpha *= alpha;
  ctx.translate(x + w / 2 + dx, y + h / 2 + dy); ctx.scale(scale, scale);
  ctx.drawImage(IMG[name], -w / 2, -h / 2, w, h); ctx.restore();
}
function font(w, s, fam = 'Rethink') { ctx.font = `${w} ${s}px ${fam}`; }

// ------------------------------------------------------------------ timeline (video seconds)
const T = {
  // narration lines (ElevenLabs, voice 8ZKCv6VSOJZaPFcJkcky) start times
  vo: [0.5, 3.7, 7.9, 15.7, 25.4, 37.8, 46.6, 57.0, 71.2],
};
const NAME = 'Nair v Calderdale Logistics';
const SWOT = 'Provide a detailed SWOT analysis of Calderdale Logistics Limited’s position on the…';
const Q2 = 'List the respondent’s defences.';
const Q3 = 'Draft a short update letter to Priya Nair on where the claim stands.';

// screen sequence inside the window: [start of push, screen id, direction]
const SCREENS = [[0, 'list'], [13.0, 'matter', 1], [15.1, 'kb', 1], [23.8, 'chat', -1], [61.5, 'jobs', 1]];
const PUSH = 0.7;

// cursor: [t0, t1, target], targets in app px (resolved through the camera at draw time)
const C = id => { const [x, y, w, h] = id; return [x + w / 2, y + h / 2]; };
function cursorPath() {
  return [
    [7.7, 8.0, 'enter'],
    [8.2, 8.9, C(R('list', 'btnNew'))],
    [9.6, 10.1, [R('dlgE', 'dlgIn')[0] + 340, R('dlgE', 'dlgIn')[1] + 26]],
    [12.0, 12.5, C(R('dlgE', 'btnCreate'))],
    [14.2, 14.9, C(R('m0', 'btnKB'))],
    [16.0, 16.7, C(R('kb0', 'btnUp'))],
    [18.0, 18.5, C(R('kbDone', 'pickUp'))],
    [19.0, 19.6, [1300, 760]],
    [23.0, 23.6, C(R('kbDone', 'railChatKB'))],
    [26.2, 26.9, C(R('m1', 'eqBtn'))],
    [28.2, 28.8, C(R('m1hot', 'eqPick'))],
    [29.7, 30.2, C(R('m1', 'go'))],
    [30.6, 31.2, [1300, 820]],
    [37.2, 37.9, 'cite1'],
    [38.6, 39.3, [1200, 820]],
    [44.9, 45.4, 'srcClose'],
    [45.9, 46.5, [1300, 830]],
    [52.0, 52.4, C(R('chatDock', 'go'))],
    [59.2, 59.6, C(R('chatDock', 'go'))],
    [60.6, 61.2, C(R('chatDock', 'railJobs'))],
    [62.4, 63.0, C(R('jobsR', 'btnOpen'))],
    [63.4, 63.9, 'exit'],
  ];
}
const CLICKS = [9.0, 12.6, 15.0, 16.8, 18.6, 23.7, 27.0, 29.0, 30.3, 38.0, 45.5, 52.5, 59.7, 61.4, 63.1];
const CURSOR_ON = [[7.7, 19.7], [22.9, 31.3], [37.1, 39.4], [44.8, 46.6], [51.9, 52.8], [59.1, 63.9]];

// captions (step number, text) shown in the pill under the window
const CAP = [[7.85, 1, 'Create a matter'], [15.65, 2, 'Add the file'], [25.35, 3, 'Ask a first question'],
  [37.75, 4, 'Click a source'], [46.55, 5, 'Point at one document with @'], [56.95, 6, 'Ask for a first letter']];
const CAP_END = 69.6;

// ------------------------------------------------------------------ camera
const POSE = V === 'B' ? { s: 1.08, cx: 960, cy: 503 } : { s: 1.0, cx: 880, cy: 515 };
function shot(name) {
  const full = [0, 0, 1440, 860];
  if (name === 'screen') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy, clip: full, r: 22, o: 1 };
  if (name === 'below') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy + 1100, clip: full, r: 22, o: 1 };
  if (name === 'gone') return { fx: 720, fy: 430, s: POSE.s * .9, cx: POSE.cx - 520, cy: POSE.cy, clip: full, r: 22, o: 0 };
  if (name === 'dlg') { const d = R('dlgE', 'dlg'); const s = Math.min(1050 / d[2], 780 / d[3]); return { fx: d[0] + d[2] / 2, fy: d[1] + d[3] / 2, s, cx: 960, cy: 520, clip: d, r: 18 * s, o: 1 }; }
  if (name === 'para') {
    const p = RECTS.src.panel, q = RECTS.src.para; const r = [p[0] + q[0] - 26, p[1] + q[1] - 26, q[2] + 52, q[3] + 52];
    const s = Math.min(1100 / r[2], 600 / r[3]); return { fx: r[0] + r[2] / 2, fy: r[1] + r[3] / 2, s, cx: 900, cy: 500, clip: r, r: 18, o: 1 };
  }
}
const SHOTS = [[0, 'below', 0], [6.7, 'screen', 0.85], [9.2, 'dlg', 0.75], [12.7, 'screen', 0.7], [40.0, 'para', 0.8], [44.1, 'screen', 0.7], [63.3, 'gone', 0.65]];
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
function wheel(t, cam) {
  if (V !== 'A') return;
  const zoomed = 1 - Math.max(V2(t, 9.2, 13.4, .5, .6), V2(t, 40.0, 44.8, .5, .6));
  const a = Math.min(P(t, 7.2, 8.0, E.io) * (1 - P(t, 63.0, 63.6, E.io)), zoomed);
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(1960, 1120); ctx.rotate(t * 3 * Math.PI / 180);
  ctx.drawImage(IMG.wheel, -575, -575, 1150, 1150 * 600 / 597); ctx.restore();
}

// ------------------------------------------------------------------ text: per word rise (drawn at sub-pixel positions, no jitter)
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
let globalT = 0;

// ------------------------------------------------------------------ app screens
function nav(alpha = 1) { part(SCREEN_PLATE, [0, 0, 1440, 67], 0, 0, alpha); }
let SCREEN_PLATE = 'list';

function drawList(t) {
  plate('list');
  // the dialog: rises in after the click, typed name, closes after Create
  const open = P(t, 9.05, 9.35, E.out) * (1 - P(t, 12.65, 12.85, E.io));
  if (open > 0) {
    const d = R('dlgE', 'dlg'); const typing = t >= 10.2;
    ctx.save(); ctx.globalAlpha = open; ctx.translate(d[0] + d[2] / 2, d[1] + d[3] / 2 + (1 - open) * 14); ctx.scale(.97 + .03 * open, .97 + .03 * open);
    ctx.shadowColor = 'rgba(35,30,25,.18)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
    ctx.drawImage(IMG[typing ? 'dlgE' : 'dlg0'], d[0] * 2, d[1] * 2, d[2] * 2, d[3] * 2, -d[2] / 2, -d[3] / 2, d[2], d[3]);
    ctx.restore();
    if (typing) {
      const f = R('dlgE', 'dlgIn'); const n = Math.round(P(t, 10.3, 11.9, E.lin) * NAME.length);
      font(400, 15); ctx.fillStyle = '#241E19'; ctx.textBaseline = 'middle'; ctx.globalAlpha = open;
      const s = NAME.slice(0, n); ctx.fillText(s, f[0] + 13, f[1] + f[3] / 2 + 1);
      if (t < 12.6 && Math.floor(t * 2.2) % 2 === 0) { const cw = ctx.measureText(s).width; ctx.fillRect(f[0] + 13 + cw + 1, f[1] + 11, 1.5, 20); }
      ctx.globalAlpha = 1;
    }
  }
}
function drawMatter(t) { plate('m0'); }

function drawKB(t) {
  plate('kb0');
  // Email Documents: the other way in, pointed out while the voice says it
  const em = V2(t, 18.3, 19.9, .3, .4);
  if (em > 0) { const b = R('kb0', 'btnEmail'); ctx.save(); ctx.globalAlpha = em; ctx.strokeStyle = '#E9CD4F'; ctx.lineWidth = 3; rr(b[0] - 4, b[1] - 4, b[2] + 8, b[3] + 8, 13); ctx.stroke(); ctx.restore(); }
  // rows slide in, process, then show summary, status and tags
  RECTS.kbRows.forEach((r, i) => {
    const a = 18.9 + i * .25, k = P(t, a, a + .45, E.back), al = P(t, a, a + .2);
    if (al <= 0) return;
    const done = P(t, 20.6 + i * .35, 20.95 + i * .35, E.io);
    part('kbProc', r.row, (1 - k) * -50, 0, al * (1 - done));
    part('kbDone', r.row, (1 - k) * -50, 0, al * done);
    if (done < 1) { // spinner
      const [sx, sy, , sh] = r.status; ctx.save(); ctx.globalAlpha = al * (1 - done); ctx.translate(sx + 7 + (1 - k) * -50, sy + sh / 2);
      ctx.lineWidth = 2; ctx.strokeStyle = '#E3DCCF'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#96732C'; ctx.beginPath(); ctx.arc(0, 0, 6, t * 9, t * 9 + 1.6); ctx.stroke(); ctx.restore();
    }
  });
  // the file picker
  const pk = P(t, 16.9, 17.15, E.out) * (1 - P(t, 18.65, 18.8, E.io));
  if (pk > 0) {
    const [x, y, w, h] = box('pick0'); ctx.save(); ctx.globalAlpha = pk; ctx.translate(0, (1 - pk) * 10);
    ctx.drawImage(IMG.pick0, x, y, w, h);
    const wipe = P(t, 17.3, 17.9, E.io); if (wipe > 0) { ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h * wipe); ctx.clip(); ctx.drawImage(IMG.pick1, x, y, w, h); ctx.restore(); }
    const u = R('kbDone', 'pickUp'); if (t > 18.45 && t < 18.75) { ctx.strokeStyle = 'rgba(233,205,79,.7)'; ctx.lineWidth = 3; rr(u[0] - 3, u[1] - 3, u[2] + 6, u[3] + 6, 12); ctx.stroke(); }
    ctx.restore();
  }
}

// thread: items revealed in order, scrolled so the newest sits above the chat box
const TH = () => RECTS.thread.items;
function threadEvents() {
  const it = TH(); const s1 = it.steps1_children, a1 = it.ans1_children, s3 = it.steps3_children;
  return [
    [31.0, it.ub1], ...s1.map((r, i) => [31.5 + i * .55, r]), [34.3, a1[0]], [34.9, a1[1]], [35.6, a1[2]], [36.0, a1[3]],
    [52.6, it.ub2], [52.95, it.steps2], [53.4, it.ans2], [59.8, it.ub3], [60.05, s3[0]], [60.45, s3[1]],
  ];
}
function threadScroll(t) {
  const ev = threadEvents(); let s = 0, prev = 0;
  for (const [a, r] of ev) {
    const target = Math.max(prev, r[1] + r[3] - 455);
    if (t < a) break;
    s = L(prev, target, P(t, a, a + .6, E.io)); prev = target;
  }
  return s;
}
function drawThread(t, alpha = 1) {
  const ev = threadEvents(), sc = threadScroll(t), ox = 56, oy = 140;
  ctx.save(); ctx.beginPath(); ctx.rect(56, 140, 1382, 704); ctx.clip(); ctx.globalAlpha = alpha;
  for (const [a, r] of ev) {
    const k = P(t, a, a + .4); if (k <= 0) continue;
    const [x, y, w, h] = r; ctx.save(); ctx.globalAlpha *= k;
    ctx.drawImage(IMG.thread, x * 2, y * 2, w * 2, h * 2, ox + x, oy + y - sc + (1 - k) * 14, w, h); ctx.restore();
  }
  ctx.restore();
  // fade into the chat box area
  const g = ctx.createLinearGradient(0, 644, 0, 844); g.addColorStop(0, 'rgba(254,253,251,0)'); g.addColorStop(.45, '#FEFDFB'); g.addColorStop(1, '#FEFDFB');
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.fillRect(56, 644, 1382, 200); ctx.restore();
}
function chip(text, x, y) { // @ mention chip inside the chat box
  font(400, 17); const w = ctx.measureText(text).width;
  ctx.fillStyle = '#EDE6D8'; rr(x - 3, y - 18, w + 6, 25, 4); ctx.fill(); ctx.fillStyle = '#96732C'; ctx.fillText(text, x, y); return w + 6;
}
function caret(t, x, y) { if (Math.floor(t * 2.2) % 2 === 0) { ctx.fillStyle = '#241E19'; ctx.fillRect(x + 1, y - 17, 1.5, 21); } }

function drawChat(t) {
  // greeting with example questions, until the SWOT question is sent
  const conv = P(t, 30.4, 31.0, E.io);
  if (conv < 1) {
    ctx.save(); ctx.globalAlpha *= 1 - conv;
    plate(t >= 27.0 && t < 29.05 ? 'm1hot' : 'm1');
    const swot = t >= 29.1;
    if (swot) {
      const cb = R('m1', 'cbox'); ctx.drawImage(IMG.cboxMidOn, cb[0], cb[1], cb[2], cb[3]);
      font(400, 17); ctx.fillStyle = '#241E19'; ctx.textBaseline = 'alphabetic'; ctx.fillText(SWOT, cb[0] + 18, cb[1] + 35);
    }
    const eq = P(t, 27.1, 27.35, E.out) * (1 - P(t, 29.05, 29.25, E.io));
    if (eq > 0) sprite(t >= 28.85 ? 'eqp1' : 'eqp0', eq, 0, (1 - eq) * 12);
    ctx.restore();
  }
  if (conv <= 0) return;
  // the conversation (wide) and the source view (narrow card + source panel)
  const slide = P(t, 38.1, 38.65, E.qio) * (1 - P(t, 45.85, 46.4, E.qio));          // panel position
  const split = P(t, 38.6, 38.85, E.io) * (1 - P(t, 45.6, 45.85, E.io));            // chat re-flow under the panel
  ctx.save(); ctx.globalAlpha *= conv;
  plate('chat'); drawThread(t, 1 - split);
  if (split > 0) { ctx.save(); ctx.globalAlpha *= split; plate('split'); drawNarrow(t); ctx.restore(); }
  dock(t, split);
  if (slide > 0) { // source panel slides in from the right, highlight sweeps across the passage
    const [px, py, pw, ph] = RECTS.src.panel; const off = (1 - slide) * (pw + 40);
    ctx.save(); ctx.shadowColor = 'rgba(35,30,25,.12)'; ctx.shadowBlur = 30; ctx.drawImage(IMG.src0, px + off, py, pw, ph); ctx.restore();
    const hw = P(t, 40.9, 41.8, E.io);
    if (hw > 0) { const q = RECTS.src.para; ctx.save(); ctx.beginPath(); ctx.rect(px + off + q[0] - 4, py + q[1] - 4, (q[2] + 8) * hw, q[3] + 8); ctx.clip(); ctx.drawImage(IMG.src1, px + off, py, pw, ph); ctx.restore(); }
  }
  // Jobs tooltip before the click
  const tip = V2(t, 60.95, 61.55, .15, .15);
  if (tip > 0) { const j = R('chatDock', 'railJobs'); ctx.save(); ctx.globalAlpha *= tip; ctx.fillStyle = '#231E19'; rr(j[0] + 40, j[1] - 2, 50, 28, 8); ctx.fill(); font(500, 13); ctx.fillStyle = '#F0EDE6'; ctx.textBaseline = 'middle'; ctx.fillText('Jobs', j[0] + 50, j[1] + 12); ctx.restore(); }
  ctx.restore();
}
function drawNarrow(t) {
  const it = RECTS.threadNarrow.items; const sc = Math.max(0, it.ansP[1] - 170);
  const ox = 56, oy = 140; ctx.save(); ctx.beginPath(); ctx.rect(56, 140, 790, 704); ctx.clip();
  ctx.drawImage(IMG.threadNarrow, 0, sc * 2, 1580, 1408, ox, oy, 790, 704); ctx.restore();
  const g = ctx.createLinearGradient(0, 644, 0, 844); g.addColorStop(0, 'rgba(254,253,251,0)'); g.addColorStop(.45, '#FEFDFB'); g.addColorStop(1, '#FEFDFB');
  ctx.fillStyle = g; ctx.fillRect(56, 644, 790, 200);
}
function dock(t, split) {
  // chat box docked at the bottom: moves down from the greeting position as the conversation starts
  const mv = P(t, 30.4, 31.0, E.io); const mid = R('m1', 'cbox'), dk = R('chatDock', 'cbox');
  const y = L(mid[1], dk[1], mv);
  let name = 'cboxDock', h = 98, txt = null;
  if (t >= 48.85 && t < 52.6) name = t >= 50.4 ? 'cboxDockAt' : 'cboxDockOn';
  if (t >= 56.85 && t < 59.8) { name = t >= 59.2 ? 'cboxDock2' : 'cboxDockOn'; }
  if (name === 'cboxDock2') h = 120;
  ctx.save(); ctx.globalAlpha *= 1 - split; ctx.drawImage(IMG[name], dk[0], y - (h - 98), dk[2], h);
  const tx = dk[0] + 18, ty = y - (h - 98) + 35; font(400, 17); ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#241E19';
  if (t >= 48.85 && t < 50.4) { const s = '@ET3'.slice(0, Math.round(P(t, 48.9, 49.3, E.lin) * 4)); ctx.fillText(s, tx, ty); caret(t, tx + ctx.measureText(s).width, ty); }
  if (t >= 50.4 && t < 52.6) { const w = chip('@[03_ET3_Response.pdf]', tx, ty); font(400, 17); ctx.fillStyle = '#241E19'; const s = ' ' + Q2.slice(0, Math.round(P(t, 50.5, 51.9, E.lin) * Q2.length)); ctx.fillText(s, tx + w, ty); if (t < 52.5) caret(t, tx + w + ctx.measureText(s).width, ty); }
  if (t >= 56.85 && t < 59.2) {
    const s = Q3.slice(0, Math.round(P(t, 56.9, 58.3, E.lin) * Q3.length)); ctx.fillText(s, tx, ty);
    let cx = tx + ctx.measureText(s).width;
    if (t >= 58.35) { const at = ' @Ald'.slice(0, Math.round(P(t, 58.35, 58.6, E.lin) * 5)); ctx.fillText(at, cx, ty); cx += ctx.measureText(at).width; }
    caret(t, cx, ty);
  }
  if (t >= 59.2 && t < 59.8) { ctx.fillText(Q3, tx, ty); chip('@[Aldridge_Vine_Letter_Template.docx]', tx, ty + 24.6); }
  ctx.restore();
  // disclaimer
  const d = box('disc'); ctx.save(); ctx.globalAlpha *= (1 - split) * mv; ctx.drawImage(IMG.disc, d[0], d[1], d[2], d[3]); ctx.restore();
  // @ menus
  const m1 = P(t, 49.2, 49.4, E.out) * (1 - P(t, 50.35, 50.5, E.io)); if (m1 > 0) sprite(t >= 49.9 ? 'mp1' : 'mp0', m1, 0, (1 - m1) * 10);
  const m2 = P(t, 58.6, 58.8, E.out) * (1 - P(t, 59.15, 59.3, E.io)); if (m2 > 0) sprite(t >= 58.95 ? 'mp2b' : 'mp2a', m2, 0, (1 - m2) * 10);
}
function drawJobs(t) { plate('jobs'); }

const DRAW = { list: drawList, matter: drawMatter, kb: drawKB, chat: drawChat, jobs: drawJobs };
const NAV = { list: 'list', matter: 'm0', kb: 'kb0', chat: 'chat', jobs: 'jobs' };
function app(t) {
  let i = 0; while (i < SCREENS.length - 1 && SCREENS[i + 1][0] <= t) i++;
  const [t0, id, dir] = SCREENS[i]; const k = i === 0 ? 1 : E.qio(cl((t - t0) / PUSH));
  if (k >= 1) { DRAW[id](t); return; }
  const prev = SCREENS[i - 1][1];
  // push: the content area slides, the top bar stays put
  ctx.save(); ctx.beginPath(); ctx.rect(0, 67, 1440, 793); ctx.clip();
  ctx.save(); ctx.translate(-dir * 1440 * .3 * k, 0); DRAW[prev](t); ctx.fillStyle = `rgba(35,30,25,${.06 * k})`; ctx.fillRect(0, 0, 1440, 860); ctx.restore();
  ctx.save(); ctx.translate(dir * 1440 * (1 - k), 0); ctx.shadowColor = 'rgba(35,30,25,.18)'; ctx.shadowBlur = 30; ctx.fillStyle = '#F2EFE9'; ctx.fillRect(0, 67, 1440, 793); ctx.shadowColor = 'transparent'; DRAW[id](t); ctx.restore();
  ctx.restore();
  part(NAV[k < .5 ? prev : id], [0, 0, 1440, 67]);
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
    if (tg === 'cite1') { const r = TH().cite1; return toScreen(cam, 56 + r[0] + r[2] / 2, 140 + r[1] + r[3] / 2 - threadScroll(t)); }
    if (tg === 'srcClose') { const p = RECTS.src.panel, q = RECTS.src.close; return toScreen(cam, p[0] + q[0] + 9, p[1] + q[1] + 9); }
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
  // pill width: opens from the circle at the start, morphs between steps, closes at the end
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
  // number circle
  ctx.fillStyle = '#F7E17E'; ctx.beginPath(); ctx.arc(x + 31, y + H / 2, R, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(x + 31, y + H / 2, R, 0, Math.PI * 2); ctx.clip();
  font(700, 19); ctx.fillStyle = '#231E19'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const nk = ci > 0 ? P(t, t0, t0 + .35, E.qio) : 1;
  if (ci > 0 && nk < 1) { ctx.globalAlpha = 1 - nk; ctx.fillText(String(CAP[ci - 1][1]), x + 31, y + H / 2 + 1 - nk * 22); }
  ctx.globalAlpha = nk; ctx.fillText(String(n), x + 31, y + H / 2 + 1 + (1 - nk) * 22); ctx.restore();
  // text: old fades out, new rises in
  font(500, 26, 'Neco'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#231E19';
  const tin = ci === 0 ? P(t, first + .35, first + .7, E.q) : P(t, t0 + .12, t0 + .5, E.q);
  const tout = ci > 0 ? 1 - P(t, t0, t0 + .15, E.io) : 0;
  const fadeEnd = 1 - P(t, CAP_END - .5, CAP_END - .3, E.io);
  if (tout > 0) { ctx.globalAlpha = tout * fadeEnd; ctx.fillText(CAP[ci - 1][2], x + 64, y + H / 2 + 1 - (1 - tout) * 10); }
  ctx.globalAlpha = tin * fadeEnd; ctx.fillText(text, x + 64, y + H / 2 + 1 + (1 - tin) * 12);
  ctx.restore(); ctx.restore();
}
function callout(t, a, b, anchor, x, y, title, file, kind) {
  const v = V2(t, a, b, .35, .3); if (v <= 0) return;
  font(500, 25, 'Neco'); const tw = ctx.measureText(title).width; font(500, 14); const fw = ctx.measureText(file).width;
  const w = Math.max(tw, fw + 20) + 32, h = 62, dy = (1 - P(t, a, a + .4, E.back)) * 14;
  const k = P(t, a + .05, a + .55, E.io), sx = x, sy = y + h / 2 + dy, [ax, ay] = anchor, mx = L(ax, sx, .5);
  ctx.save(); ctx.globalAlpha = v; ctx.strokeStyle = '#C9A733'; ctx.fillStyle = '#C9A733'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(ax, ay, 5, 0, Math.PI * 2); ctx.fill();
  ctx.setLineDash([1600]); ctx.lineDashOffset = (1 - k) * 1600; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.bezierCurveTo(mx, ay, mx, sy, sx, sy); ctx.stroke(); ctx.setLineDash([]);
  ctx.translate(0, dy); ctx.shadowColor = 'rgba(120,95,20,.18)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6; ctx.fillStyle = '#F7E17E'; rr(x, y, w, h, 14); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#231E19'; font(500, 25, 'Neco'); ctx.textBaseline = 'alphabetic'; ctx.fillText(title, x + 16, y + 30);
  ctx.fillStyle = kind === 'doc' ? '#2B5BC4' : '#C23A3F'; rr(x + 16, y + 39, 11, 14, 2); ctx.fill();
  ctx.fillStyle = '#231E19'; font(500, 14); ctx.fillText(file, x + 33, y + 51); ctx.restore();
}

// ------------------------------------------------------------------ scenes
function title(t) {
  if (t > 7.6) return;
  const up = P(t, 6.6, 7.4, E.qio);
  ctx.save(); ctx.translate(0, -up * 1080);
  ctx.fillStyle = '#F7E17E'; ctx.fillRect(0, 0, W, H);
  const e = P(t, 0.3, 0.75) * (1 - P(t, 6.4, 6.6)); font(600, 22); ctx.fillStyle = '#494746'; ctx.globalAlpha = e;
  ctx.letterSpacing = '3px'; ctx.fillText('ANDRI ACADEMY · 1.1', 122, 392); ctx.letterSpacing = '0px'; ctx.globalAlpha = 1;
  words('Your first matter,', 120, 530, 0.5, .09, 128, 500, '#231E19', null);
  words('start to finish.', 120, 668, 1.15, .09, 128, 400, '#231E19', null);
  mascot('wave', t, .25, 3.8, 1180, 330, 640);
  mascot('idea', t, 3.95, 7.6, 1180, 330, 640, { from: 'pop' });
  ctx.restore();
}
function letterScene(t) {
  if (t < 63.1 || t > 70.4) return;
  const k = P(t, 63.2, 64.05, E.qio), out = P(t, 69.6, 70.2, E.io);
  const lb = RECTS.letter.box, sc = L(.42, .74, k), lw = lb[2] * sc, lh = lb[3] * sc;
  const x = L(1120, 900, k), y = L(300, (1080 - lh) / 2 - 10, k) + out * 60;
  ctx.save(); ctx.globalAlpha = k * (1 - out); ctx.translate(x, y); ctx.rotate(L(6, 0, k) * Math.PI / 180);
  ctx.shadowColor = 'rgba(60,45,20,.28)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 24; ctx.fillStyle = '#fff'; rr(0, 0, lw, lh, 20); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); rr(0, 0, lw, lh, 20); ctx.clip(); ctx.drawImage(IMG.letter0, 0, 0, lw, lh);
  const marks = [['lm1', 64.7], ['lm2', 65.3], ['lm3', 65.9]];
  for (const [m, a] of marks) { const r = RECTS.letter[m], w = P(t, a, a + .45, E.io); if (w > 0) { ctx.save(); ctx.beginPath(); ctx.rect(r[0] * sc - 3, r[1] * sc - 3, (r[2] + 6) * sc * w, (r[3] + 6) * sc); ctx.clip(); ctx.drawImage(IMG.letter1, 0, 0, lw, lh); ctx.restore(); } }
  ctx.restore(); ctx.restore();
  const A = m => { const r = RECTS.letter[m]; return [x + (r[0] + r[2]) * sc + 10, y + (r[1] + r[3] / 2) * sc]; };
  const cx = x + lw + 40, ca = (t < 69.6) ? 1 : 1 - out;
  ctx.save(); ctx.globalAlpha = ca;
  callout(t, 64.8, 69.9, A('lm1'), cx, y + RECTS.letter.lm1[1] * sc - 40, 'Firm template', 'Aldridge_Vine_Letter_Template.docx', 'doc');
  callout(t, 65.4, 69.9, A('lm2'), cx, y + RECTS.letter.lm2[1] * sc - 10, 'Case number', '01_ET1_Grounds_of_Claim.pdf', 'pdf');
  callout(t, 66.0, 69.9, A('lm3'), cx, y + RECTS.letter.lm3[1] * sc + 70, 'The judgment', '05_Tribunal_Judgment.pdf', 'pdf');
  ctx.restore();
  words('On your template.', 120, 520, 64.2, .08, 78, 500, '#231E19', 69.5);
  words('Every fact sourced.', 120, 610, 64.8, .08, 78, 400, '#231E19', 69.55);
}
function endCard(t) {
  if (t < 70.2) return;
  const a = P(t, 70.3, 70.9), dy = (1 - P(t, 70.3, 71.0, E.q)) * 24;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(0, dy);
  ctx.drawImage(IMG.logo, 512, 438, 520, 520 * 600 / 2299);
  font(500, 25); ctx.fillStyle = '#494746'; ctx.textBaseline = 'alphabetic'; ctx.fillText('Andri Academy · Next: In-Depth or Plan', 515, 635);
  ctx.restore();
  // mascot holding the empty ring; the disc fills with a pop, then the tick draws itself
  const m = mascot('done', t, 70.6, 78.5, 1105, 400, 420, { from: 'pop' });
  if (m) {
    const b = MMETA.done.badge, sc = m.sc;
    const bx = m.x + m.w / 2 + (b[0] * m.w + b[2] * m.w / 2 - m.w / 2) * sc, by = m.y + m.h + (b[1] * m.h + b[3] * m.h / 2 - m.h) * sc, rad = b[2] * m.w / 2 * .9 * sc;
    // original artwork: the disc pops in, then the tick wipes in left to right
    const fi = Math.floor((t - 70.6) * MMETA.disc.fps) % MMETA.disc.frames, mw = m.w * m.sc, mh = m.h * m.sc;
    const ox = m.x + m.w / 2 - mw / 2, oy = m.y + m.h + m.dy - mh;
    // tick only (no disc): springs in with a slight twist, settles
    const x = cl((t - 71.1) / .34), k = x <= 0 ? 0 : E.back(x);
    if (k > 0) {
      ctx.save(); ctx.globalAlpha *= cl(x * 4);
      ctx.translate(bx, by); ctx.rotate((1 - k) * -0.35); ctx.scale(k, k); ctx.translate(-bx, -by);
      ctx.drawImage(MASC.tick[fi], ox, oy, mw, mh); ctx.restore();
    }
  }
  // no Up next card in the video: the Academy website adds it (it must be clickable)
}

// ------------------------------------------------------------------ frame
function centredWords(text, cy, t0, size, weight, T, outK) {
  font(weight, size, 'Neco'); ctx.fillStyle = '#231E19'; ctx.textBaseline = 'alphabetic';
  const parts = text.split(' '), sp = ctx.measureText(' ').width, ws = parts.map(w => ctx.measureText(w).width);
  let x = 960 - (ws.reduce((a, b) => a + b, 0) + sp * (parts.length - 1)) / 2;
  parts.forEach((w, i) => { const k = P(T, t0 + i * .08, t0 + i * .08 + .5, E.q);
    if (k > 0) { ctx.save(); ctx.globalAlpha = k * (1 - outK); ctx.fillText(w, x, cy + (1 - k) * 40 - outK * 30); ctx.restore(); }
    x += ws[i] + sp; });
}
function intro(T) {
  ctx.fillStyle = '#F7E17E'; ctx.fillRect(0, 0, W, H);
  const out = P(T, 2.55, 3.0, E.io);
  const ik = (x => x <= 0 ? 0 : E.back(x))(cl((T - .15) / .45));
  if (ik > 0) { const s = 150 * ik; ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(960, 330 - out * 30); ctx.rotate((1 - ik) * -.5);
    ctx.drawImage(IMG.icon, -s / 2, -s / 2, s, s * 600 / 597); ctx.restore(); }
  centredWords('Welcome to the', 520, .45, 64, 400, T, out);
  centredWords('Andri Academy', 650, .75, 128, 500, T, out);
}
async function renderFrame(T) {
  if (!READY) READY = load();
  await READY;
  if (T < INTRO) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.textAlign = 'left'; intro(T); return; }
  const t = T - INTRO;
  globalT = t;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.textAlign = 'left';
  background(t);
  const cam = camera(t);
  wheel(t, cam);
  // the Andri window
  if (cam.o > 0 && t > 6.5) {
    const [x, y, w, h] = cam.clip; const [sx, sy] = toScreen(cam, x, y); const sw = w * cam.s, sh = h * cam.s;
    ctx.save(); ctx.globalAlpha = cam.o;
    ctx.shadowColor = 'rgba(35,30,25,.16)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 26; ctx.fillStyle = '#F2EFE9'; rr(sx, sy, sw, sh, cam.r); ctx.fill();
    ctx.shadowColor = 'rgba(35,30,25,.22)'; ctx.shadowBlur = 1; ctx.shadowOffsetY = 0; ctx.fill(); ctx.shadowColor = 'transparent';
    rr(sx, sy, sw, sh, cam.r); ctx.clip();
    ctx.translate(cam.cx - cam.fx * cam.s, cam.cy - cam.fy * cam.s); ctx.scale(cam.s, cam.s);
    app(t);
    ctx.restore();
  }
  // mascot points at the exact passage during the zoom
  mascot('point', t, 41.0, 44.0, 1500, 560, 340, { flip: true });
  letterScene(t);
  endCard(t);
  title(t);
  caption(t);
  cursor(t, cam);
}

window.MG = { width: W, height: H, fps: FPS, duration: DURATION, renderFrame };
if (!navigator.webdriver) { const t0 = performance.now(); (function loop() { renderFrame(((performance.now() - t0) / 1000) % DURATION).then(() => requestAnimationFrame(loop)); })(); }
