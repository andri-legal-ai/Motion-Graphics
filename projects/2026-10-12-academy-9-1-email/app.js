// Andri Academy 9.1 · Email in Andri: three ways in
// Everything is drawn on one <canvas> by renderFrame(t), a pure function of time t (seconds).
// App screens are plates of real Andri staging snapshots (plates/*.png, 2x, built by plates/capture.mjs); the "How it works"
// scenes are the app's own CSS animations stepped frame by frame (plates/frames/h1..h5). All other motion is drawn here.
// Engine, camera, captions, cursor, mascot, title and end card follow the approved 1.1, 1.2 and 5.1 videos.

const W = 1920, H = 1080, FPS = 60;
const AW = 1470, AH = 835;   // the app window, as captured from staging
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
  // the Personalisation morph's own curve, cubic-bezier(0.32, 0.72, 0.24, 1), close enough as a strong ease-out
  morph: x => 1 - Math.pow(1 - x, 3.6),
};
const P = (t, a, b, e = E.out) => e(cl((t - a) / (b - a)));
const V2 = (t, a, b, fi = .35, fo = .3) => Math.min(P(t, a, a + fi), 1 - P(t, b - fo, b, E.io));

// ------------------------------------------------------------------ timeline (video seconds)
// narration lines (ElevenLabs "UK voice voice to use for ANDRI vids", one take, cut at its pauses: audio/uk/N*.wav)
const VO = { N1: 0.6, N2: 8.7, N3: 16.3, N4: 27.8, N5: 37.9, N6: 47.0, N7: 51.6, N8: 63.2, N9: 76.8, N10: 87.2 };
const T = {
  push: 7.6,                                   // title card pushes up into the app
  emailHover: 11.2, emailClick: 12.4,          // sidebar Matter Email
  copy: 14.6,                                  // copy the address
  inClick: 20.9, type: [21.3, 23.3], add: 24.2,
  watch: 29.0, next1: 32.0, next2: 37.2, next3: 37.85, next4: 43.2, close: 46.2,
  kbHover: 47.0, kbClick: 47.6, docs: 49.2, docsClose: 51.8,
  conn: 54.2, connClose: 62.5,
  pers: 66.0, conTab: 67.5, persClose: 76.9,
  inbox: 78.3, emailTab: 80.3,
  exit: 85.7,
};
const END = 86.85;
const DURATION = 94.0;
const TYPED = 'priya.nair@outlook.com';

// captions (step number, text) in the pill under the window
const CAP = [[VO.N2, 1, "The matter's address"], [VO.N7, 2, 'Files from elsewhere'], [VO.N8, 3, 'Your own mailbox']];   // the three ways in, as the voice says First, Second, Third
const CAP_END = T.exit + .2;

// ------------------------------------------------------------------ assets
const PLATES = ['kb', 'kbTip', 'kbDocs', 'kbConn', 'me', 'meTipKB', 'meCopied', 'meTyped', 'meAdded', 'h1', 'h2', 'h3', 'h4', 'h5',
  'pz0', 'pz1', 'inbox', 'inboxEmail'];
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
// slide scene frames, loaded when needed and dropped once far behind (the renderer goes forward in time)
const FR = {};
function frameKey(s, i) { return s + ':' + i; }
async function ensureFrames(list) {
  await Promise.all(list.map(([s, i]) => { const k = frameKey(s, i); if (!FR[k]) FR[k] = loadImg(`${ROOT}plates/frames/${s}/f${String(i).padStart(3, '0')}.png`).then(img => (FR[k] = img)); return FR[k]; }));
}
// colour of one pixel of a plate (app px), cached
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
function plate(name, a = 1) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(IMG[name], 0, 0, AW, AH); ctx.restore(); }
function region(name, r, a = 1, dx = 0, dy = 0) { if (a <= 0) return; const [x, y, w, h] = r; ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(IMG[name], x * 2, y * 2, w * 2, h * 2, x + dx, y + dy, w, h); ctx.restore(); }
function xf(a, b, t, t0, d = .3) { const k = P(t, t0, t0 + d, E.io); if (k < 1) plate(a); if (k > 0) plate(b, k); }
function sprite(name, a = 1) { if (a <= 0) return; const [x, y, w, h] = box(name); ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(IMG[name], x, y, w, h); ctx.restore(); }
// gold ring around a small control (app px), only while the voice names it
function ring(t, a, b, r, rad = 10, pad = 5) {
  const v = V2(t, a, b, .25, .3); if (v <= 0) return;
  const g = P(t, a, a + .35, E.back);
  ctx.save(); ctx.globalAlpha *= v; ctx.strokeStyle = '#E9CD4F'; ctx.lineWidth = 3;
  const p = pad + (1 - g) * 6; rr(r[0] - p, r[1] - p, r[2] + p * 2, r[3] + p * 2, rad + p); ctx.stroke(); ctx.restore();
}
function caret(t, x, y, h = 18) { if (Math.floor(t * 2.2) % 2 === 0) { ctx.fillStyle = '#241E19'; ctx.fillRect(x + 1, y - h + 4, 1.4, h); } }
// page change: the old page pushes out to the left, the new one comes in from the right (as 1.1)
function push(t, t0, a, b, drawA, drawB) {
  const k = P(t, t0, t0 + .6, E.qio);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, AW, AH); ctx.clip();
  if (k < 1) { ctx.save(); ctx.translate(-k * AW, 0); plate(a); if (drawA) drawA(); ctx.restore(); }
  if (k > 0) { ctx.save(); ctx.translate((1 - k) * AW, 0); plate(b); if (drawB) drawB(); ctx.restore(); }
  ctx.restore();
}
// a sidebar tooltip (captured on its own plate), shown while hovering until the click
function tip(t, name, on, off) { const k = P(t, on, on + .2, E.out) * (1 - P(t, off, off + .1)); if (k <= 0) return; const r = R(name, 'tip'); region(name, [r[0] - 3, r[1] - 3, r[2] + 6, r[3] + 6], k, (1 - k) * -4, 0); }

// ------------------------------------------------------------------ camera
const POSE = { s: 1.1, cx: 960, cy: 492 };
function zoomOn(r, s, cx = 960, cy = 492) { return { fx: r[0] + r[2] / 2, fy: r[1] + r[3] / 2, s, cx, cy, r: 18, o: 1 }; }
function shot(name) {
  if (name === 'screen') return { fx: AW / 2, fy: AH / 2, s: POSE.s, cx: POSE.cx, cy: POSE.cy, r: 22, o: 1 };
  if (name === 'below') return { ...shot('screen'), cy: POSE.cy + 1100 };
  if (name === 'connZ') return zoomOn([447, 125.5, 576, 584], 1.47);      // the Connect list: files, then calendar and mail
  if (name === 'pzZ') return zoomOn([241, 70, 640, 360], 1.62);           // Connectors: the note on whose sign-in it is, and the three services
  if (name === 'inboxZ') return zoomOn([280, 290, 470, 320], 1.42);        // the Email tab: what Andri does once a mailbox is connected
  if (name === 'gone') return { ...shot('inboxZ'), o: 0 };                // plain fade out, from wherever the last shot is
}
const SHOTS = [[0, 'below', 0], [T.push, 'screen', .85],
  [T.conn + .5, 'connZ', 1.2], [T.connClose - 1.3, 'screen', 1.05],
  [71.6, 'pzZ', 1.2], [75.6, 'screen', 1.05],
  [T.emailTab + .9, 'inboxZ', 1.2],
  [T.exit, 'gone', 1.0]];
function camera(t) {
  let i = 0; while (i < SHOTS.length - 1 && SHOTS[i + 1][0] <= t) i++;
  const cur = clampCam(shot(SHOTS[i][1])), d = SHOTS[i][2];
  if (i === 0 || d === 0) return cur;
  const prev = clampCam(shot(SHOTS[i - 1][1])); const k = E.io(cl((t - SHOTS[i][0]) / d));
  const o = {}; for (const key of ['fx', 'fy', 'cx', 'cy', 'r', 'o']) o[key] = L(prev[key], cur[key], k);
  o.s = Math.exp(L(Math.log(prev.s), Math.log(cur.s), k));
  return o;
}
// only the shot endpoints are clamped (memory: academy-zoom-smoothness), never the move between them
function clampCam(o) {
  if (o.s * AW >= W) o.fx = cl(o.fx, o.cx / o.s, AW - (W - o.cx) / o.s);
  if (o.s * AH >= H) o.fy = cl(o.fy, o.cy / o.s, AH - (H - o.cy) / o.s);
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

// ------------------------------------------------------------------ "How it works": which slide, and which frame of its scene
// [slide, shown from]; each scene plays at the app's speed from its start and then holds its settled frame (4.3 s)
const SLIDES = [['h1', T.watch + .05], ['h2', T.next1 + .05], ['h3', T.next2 + .05], ['h4', T.next3 + .05], ['h5', T.next4 + .05]];
const SCENE_HOLD = 4.3, SWAP = .25;
function slideAt(t) { let i = -1; for (let k = 0; k < SLIDES.length; k++) if (t >= SLIDES[k][1]) i = k; return i; }
function sceneIdx(s, t0, t) { const m = RECTS['frames-' + s]; return Math.round(cl(t - t0, 0, SCENE_HOLD) * m.fps); }
function neededFrames(t) {
  if (t < T.watch || t > T.close + .5) return [];
  const i = slideAt(t); if (i < 0) return [];
  const out = [[SLIDES[i][0], sceneIdx(SLIDES[i][0], SLIDES[i][1], t)]];
  if (i > 0 && t < SLIDES[i][1] + SWAP) out.push([SLIDES[i - 1][0], sceneIdx(SLIDES[i - 1][0], SLIDES[i - 1][1], t)]);
  return out;
}
function drawSlide(s, t0, t, a = 1) {
  if (a <= 0) return; plate(s, a);
  const m = RECTS['frames-' + s], img = FR[frameKey(s, sceneIdx(s, t0, t))];
  if (img && img.width) { const [x, y, w, h] = m.stage; ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(img, x, y, w, h); ctx.restore(); }
}
function howItWorks(t) {
  const i = slideAt(t); const [s, t0] = SLIDES[i];
  if (i > 0 && t < t0 + SWAP) drawSlide(SLIDES[i - 1][0], SLIDES[i - 1][1], t);
  drawSlide(s, t0, t, i > 0 ? P(t, t0, t0 + SWAP, E.io) : 1);
}

// ------------------------------------------------------------------ typing into Who may send: the field is cleared, then the
// real typed text (meTyped) is revealed letter by letter (Rethink Sans 14px, 12px padding + 1px border, as measured in staging)
function typing(t) {
  const [x, y, w, h] = R('me', 'input'); const x0 = x + 13;
  plate('meTyped');
  ctx.fillStyle = px('meTyped', Math.round(x + w - 40), Math.round(y + h / 2)); ctx.fillRect(x + 4, y + 5, w - 8, h - 10);
  font(400, 14); const n = Math.round(P(t, T.type[0], T.type[1], E.lin) * TYPED.length), s = TYPED.slice(0, n), tw = ctx.measureText(s).width;
  if (n === 0) region('me', [x + 4, y + 5, 160, h - 10]);               // the placeholder stays until the first letter
  else region('meTyped', [x + 4, y + 5, (n === TYPED.length ? 240 : 9 + tw), h - 10]);
  if (t < T.add) caret(t, x0 + tw, y + 26, 18);
}
// the "Copied" toast slides up at the bottom right and leaves after about four seconds (sonner's default)
function toast(t) {
  const a = P(t, T.copy + .05, T.copy + .4, E.q) * (1 - P(t, T.copy + 4, T.copy + 4.3, E.io)); if (a <= 0) return;
  const r = R('meCopied', 'toast'); region('meCopied', [r[0] - 2, r[1] - 2, r[2] + 4, r[3] + 4], a, 0, (1 - a) * 18);
}

// ------------------------------------------------------------------ Personalisation: the top-bar icon grows into the panel
const VEIL = 'rgba(30,24,18,0.32)';   // .pz-veil, light theme
function personalisation(t, base) {
  plate(base);
  const open = t < T.persClose;
  const k = open ? P(t, T.pers + .12, T.pers + .46, E.morph) : 1 - P(t, T.persClose, T.persClose + .34, E.morph);
  const content = open ? P(t, T.pers + .3, T.pers + .5, E.out) : 1 - P(t, T.persClose, T.persClose + .14, E.out);
  const ic = R('kb', 'pers'), bx = box('pz0');
  const r = [L(ic[0], bx[0], k), L(ic[1], bx[1], k), L(ic[2], bx[2], k), L(ic[3], bx[3], k)];
  ctx.save(); ctx.globalAlpha *= k; ctx.fillStyle = VEIL; ctx.fillRect(0, 0, AW, AH); ctx.restore();
  ctx.save(); ctx.globalAlpha *= cl(k * 3);
  ctx.shadowColor = 'rgba(35,30,25,.30)'; ctx.shadowBlur = 50 * k; ctx.shadowOffsetY = 22 * k; ctx.fillStyle = px('pz0', 900, 700); rr(r[0], r[1], r[2], r[3], L(12, 16, k)); ctx.fill(); ctx.restore();
  ctx.save(); rr(r[0], r[1], r[2], r[3], L(12, 16, k)); ctx.clip();
  const tab = t >= T.conTab + .05 ? P(t, T.conTab + .05, T.conTab + .25, E.io) : 0;
  if (tab < 1) sprite('pz0', content); if (tab > 0) sprite('pz1', content * tab);
  ctx.restore();
}

// ------------------------------------------------------------------ the app, by time
function drawApp(t) {
  // 1 the Knowledge Base, then Matter Email from the sidebar
  if (t < T.emailClick + .05) { plate('kb'); tip(t, 'kbTip', T.emailHover, T.emailClick); return; }
  if (t < T.emailClick + .7) { push(t, T.emailClick + .05, 'kb', 'me', () => tip(t, 'kbTip', T.emailHover, T.emailClick)); return; }
  if (t < T.inClick + .05) { plate('me'); toast(t); { const r = R('me', 'row'); ring(t, 18.2, 20.4, [r[0] + 6, r[1] + 8, 222, r[3] - 16], 8, 4); }; return; }
  // 2 Who may send: type the client's address, Add
  if (t < T.add + .05) { typing(t); toast(t); return; }
  if (t < T.watch + .05) { xf('meTyped', 'meAdded', t, T.add + .05, .2); return; }
  // 3 How it works: the panel opens beside the page; each slide's scene is the app's own animation
  if (t < T.close + .05) {
    const k = P(t, T.watch + .05, T.watch + .45, E.io);
    if (k < 1) plate('meAdded');
    ctx.save(); ctx.globalAlpha *= k; howItWorks(t); ctx.restore();
    return;
  }
  if (t < T.kbClick + .05) { xf('h5', 'meAdded', t, T.close + .05, .3); tip(t, 'meTipKB', T.kbHover, T.kbClick); return; }
  // 4 the Knowledge Base: Email Documents, the same address
  if (t < T.kbClick + .7) { push(t, T.kbClick + .05, 'meAdded', 'kb', () => tip(t, 'meTipKB', T.kbHover, T.kbClick)); return; }
  if (t < T.docs + .05) { plate('kb'); return; }
  if (t < T.docsClose + .05) { xf('kb', 'kbDocs', t, T.docs + .05, .2); ring(t, 49.7, 51.4, R('kbDocs', 'addr'), 8, 6); return; }
  // 5 Connect: files and tools from elsewhere
  if (t < T.conn + .05) { xf('kbDocs', 'kb', t, T.docsClose + .05, .16); return; }
  if (t < T.connClose + .05) { xf('kb', 'kbConn', t, T.conn + .05, .2); return; }
  if (t < T.pers) { xf('kbConn', 'kb', t, T.connClose + .05, .16); return; }
  // 6 Personalisation → Connectors
  if (t < T.persClose + .4) {
    personalisation(t, 'kb');
    ring(t, 68.4, 69.4, R('pz1', 'c1'), 8, 4); ring(t, 69.3, 70.2, R('pz1', 'c2'), 8, 4); ring(t, 70.1, 71.2, R('pz1', 'c3'), 8, 4);
    return;
  }
  // 7 the Inbox and its Email tab
  if (t < T.inbox + .05) { plate('kb'); return; }
  if (t < T.inbox + .7) { push(t, T.inbox + .05, 'kb', 'inbox'); return; }
  if (t < T.emailTab + .05) { plate('inbox'); return; }
  xf('inbox', 'inboxEmail', t, T.emailTab + .05, .2);
  ring(t, 80.6, 81.9, R('inboxEmail', 'emailTab'), 8, 3);
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
  const kb = RECTS.kb, me = RECTS.me;
  return [
    [9.0, 9.01, 'enter'], [9.6, 11.1, C(kb.sbEmail)],
    [13.4, 14.35, C(me.copy)], [16.0, 16.8, [1000, 600]],
    [20.1, 20.75, [me.input[0] + 300, me.input[1] + me.input[3] / 2]], [23.4, 24.0, C(me.add)], [25.0, 25.8, [900, 640]],
    [27.9, 28.8, C(me.watch)], [30.6, 31.8, C(R('h1', 'next'))], [33.0, 33.8, [1180, 640]],
    [36.4, 37.05, C(R('h2', 'next'))], [37.4, 37.7, C(R('h3', 'next'))], [38.3, 39.2, [1180, 640]],
    [42.3, 43.05, C(R('h4', 'next'))], [43.7, 44.5, [1180, 640]], [45.3, 46.05, C(R('h5', 'close'))],
    [46.4, 46.95, C(kb.sbKB)], [48.3, 49.05, C(kb.emailDocs)], [50.0, 50.6, [820, 520]], [51.1, 51.65, C(R('kbDocs', 'close'))],
    [52.5, 53.5, C(kb.connect)], [55.0, 55.6, [700, 760]], [61.6, 62.35, C(R('kbConn', 'close'))],
    [64.3, 65.4, C(kb.pers)], [66.4, 67.35, C(R('pz0', 'connectors'))], [68.0, 68.7, [700, 600]],
    [76.0, 76.75, C(R('pz1', 'glyph'))], [77.2, 78.15, C(kb.inbox)], [79.3, 80.15, C(R('inbox', 'emailTab'))], [81.0, 81.9, [600, 700]],
    [84.0, 85.0, 'exit'],
  ];
}
const CLICKS = [T.emailClick, T.copy, T.inClick, T.add, T.watch, T.next1, T.next2, T.next3, T.next4, T.close, T.kbClick, T.docs, T.docsClose,
  T.conn, T.connClose, T.pers, T.conTab, T.persClose, T.inbox, T.emailTab];
const CURSOR_ON = [[9.0, 85.0]];
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
const TITLE = { tag: 'ANDRI ACADEMY · 9.1', l1: 'Email in Andri:', l2: 'three ways in.' };
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
const NEXT = 'Andri Academy · Next: Your BaseNet dossier, linked once';
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
    const b = MMETA.done.badge;
    const bx = m.x + m.w / 2 + (b[0] * m.w + b[2] * m.w / 2 - m.w / 2) * m.sc, by = m.y + m.h + (b[1] * m.h + b[3] * m.h / 2 - m.h) * m.sc;
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
async function renderFrame(t) {
  if (!READY) READY = load();
  await READY;
  const need = neededFrames(t); if (need.length) await ensureFrames(need);
  for (const k of Object.keys(FR)) { const [s, i] = k.split(':'); if (!need.some(([a, b]) => a === s && Math.abs(b - i) < 8)) delete FR[k]; }
  globalT = t;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.textAlign = 'left';
  background(t);
  const cam = camera(t);
  if (cam.o > 0 && t > T.push - .1) {
    const [sx, sy] = toScreen(cam, 0, 0); const sw = AW * cam.s, sh = AH * cam.s;
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
