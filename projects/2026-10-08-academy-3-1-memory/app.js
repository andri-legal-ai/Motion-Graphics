// Andri Academy 3.1 · Say it once. Andri remembers.
// Everything is drawn on one <canvas> by renderFrame(t), a pure function of time t (seconds).
// App screens are still plates of the Andri rebuild (plates/*.png, 2x); all motion is drawn here.
// Engine, camera, captions, cursor, mascot and end card follow the approved 1.1 and 1.2 videos.

const W = 1920, H = 1080, FPS = 60, DURATION = 72.0;
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
  const plates = ['m1', 'chat', 'cboxMidOn', 'cboxDock', 'cboxDockOn', 'disc', 'thread3', 'work3', 'pAns', 'pLoad', 'pMem', 'pJobs', 'pRem'];
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
// shadow for a floating sprite captured without its own (known-issues #1)
function floatShadow(name, alpha = 1, strong = false, r = 20) {
  if (alpha <= 0) return; const [x, y, w, h] = box(name);
  ctx.save(); ctx.globalAlpha *= alpha; ctx.shadowColor = strong ? 'rgba(35,30,25,.32)' : 'rgba(200,170,60,.16)'; ctx.shadowBlur = strong ? 60 : 18; ctx.shadowOffsetY = strong ? 22 : 4;
  ctx.fillStyle = '#FEFDFB'; rr(x + 2, y + 2, w - 4, h - 4, r); ctx.fill(); ctx.restore();
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
const VO = { N1: 0.6, N2: 7.6, N3: 13.95, N4: 18.7, N5: 24.4, N6: 29.75, N7: 37.2, N8: 45.9, N9: 53.2, N10: 56.5, N11: 65.2 };
const TXT = { a: 'Remember in this case that Ms Nair prefers email, not phone calls.', b: 'What do you remember about this case?', c: 'Forget that Ms Nair prefers email.' };
// per message: click into the box, typing window, send; then the rows arrive as in staging
const MSG = {
  a: { focus: 9.0, ty: [9.3, 12.0], send: 13.0, user: 13.15, work: 13.9, step: 15.0, ans: 15.5, acts: 16.2 },
  b: { focus: 19.1, ty: [19.3, 20.8], send: 21.35, user: 21.5, work: 22.1, step: 23.0, ans: 23.4, acts: 24.0 },
  c: { focus: 25.4, ty: [25.6, 26.9], send: 27.45, user: 27.6, work: 28.1, step: 28.9, ans: 29.3, acts: 29.9 },
};
const OPEN = 33.0, MEMCLICK = 35.95, LOADED = 36.55, JOBCLICK = 55.1, REMCLICK = 58.4;

// cursor: [t0, t1, target]; targets in app px (resolved through the camera at draw time)
function cursorPath() {
  const mid = R('m1', 'cbox'), dk = R('chat', 'cbox'), pm = RECTS.pMem;
  const goMid = C(R('m1', 'go')), goDk = [goMid[0], goMid[1] + (dk[1] - mid[1])];
  const inBox = r => [r[0] + 300, r[1] + 30];
  return [
    [7.9, 7.91, 'enter'], [8.0, 8.85, inBox(mid)], [12.1, 12.8, goMid], [13.5, 14.1, 'exit'],
    [18.7, 18.71, 'enter'], [18.8, 19.0, inBox(dk)], [20.8, 21.2, goDk], [21.8, 22.4, 'exit'],
    [24.9, 24.91, 'enter'], [25.0, 25.3, inBox(dk)], [26.9, 27.3, goDk], [27.9, 28.5, 'exit'],
    [30.6, 30.61, 'enter'], [31.4, 32.6, C(R('chat', 'sliders'))], [34.8, 35.7, C(pm.nv_brain)],
    [36.9, 37.5, [pm.g_pers[0] + 60, pm.g_pers[1] + 18]], [45.5, 46.1, [pm.g_firm[0] + 50, pm.g_firm[1] + 18]], [52.8, 53.4, [pm.g_nair[0] + 140, pm.g_nair[1] + 18]],
    [54.4, 54.9, [pm.g_jobs[0] + 110, pm.g_jobs[1] + 16]], [57.0, 57.8, C(RECTS.pRem.f_rem)], [58.8, 59.2, C(pm.btEdit3)], [59.7, 60.05, C(pm.btDel3)], [60.9, 61.5, C(pm.btnNewFile)], [63.2, 63.8, 'exit'],
  ];
}
const CLICKS = [MSG.a.focus, MSG.a.send, MSG.b.focus, MSG.b.send, MSG.c.focus, MSG.c.send, OPEN, MEMCLICK, JOBCLICK, REMCLICK];
const CURSOR_ON = [[7.9, 14.1], [18.7, 22.4], [24.9, 28.5], [30.6, 63.8]];

// captions (step number, text) shown in the pill under the window, as in the storyboard
const CAP = [[8.05, 1, 'Tell Andri once'], [18.6, 2, 'Ask what it knows'], [24.4, 3, 'Correct or forget'], [29.9, 4, 'See all memories']];
const CAP_END = 63.3;

// ------------------------------------------------------------------ camera
const POSE = { s: 1.08, cx: 960, cy: 503 };
function zoomOn(r, maxW, maxH, cx = 960, cy = 500) { const s = Math.min(maxW / r[2], maxH / r[3]); return { fx: r[0] + r[2] / 2, fy: r[1] + r[3] / 2, s, cx, cy, clip: r, r: 18, o: 1 }; }
function shot(name) {
  const full = [0, 0, 1440, 860];
  if (name === 'screen') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy, clip: full, r: 22, o: 1 };
  if (name === 'below') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy + 1100, clip: full, r: 22, o: 1 };
  if (name === 'chatZ') return zoomOn([288, 134, 1150, 250], 1580, 760);   // the newest message, its memory step and the reply
  if (name === 'tree') return zoomOn([360, 56, 940, 470], 1560, 800);   // Memories tree and the preview header: small text
  if (name === 'gone') return { ...shot('tree'), o: 0 };   // plain fade out from the last shot, no zoom
}
const SHOTS = [[0, 'below', 0], [7.2, 'screen', 0.85], [14.3, 'chatZ', 0.9], [18.3, 'screen', 0.8], [22.3, 'chatZ', 0.9], [24.4, 'screen', 0.8], [28.2, 'chatZ', 0.9], [29.6, 'screen', 0.8], [36.3, 'tree', 1.0], [63.5, 'gone', 1.0]];
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
    if (k > 0) { ctx.save(); ctx.globalAlpha *= k * (1 - out); ctx.fillText(w, cx, y + (1 - k) * 44 - out * 22); ctx.restore(); }
    cx += ctx.measureText(w + ' ').width;
  });
}
function caret(t, x, y) { if (Math.floor(t * 2.2) % 2 === 0) { ctx.fillStyle = '#241E19'; ctx.fillRect(x + 1, y - 17, 1.5, 21); } }
function typed(t, text, a, b, x, y, upto) {
  const s = text.slice(0, Math.round(P(t, a, b, E.lin) * text.length));
  font(400, 17); ctx.fillStyle = '#241E19'; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y);
  if (t < upto) caret(t, x + ctx.measureText(s).width, y);
}
function eased(t, keys, d = .6) { let v = keys[0][1]; for (let i = 1; i < keys.length; i++) { const [a, x] = keys[i]; if (t < a) break; v = L(v, x, P(t, a, a + d, E.io)); } return v; }
function fadeBottom(x, w, alpha = 1) {
  const g = ctx.createLinearGradient(0, 600, 0, 844); g.addColorStop(0, 'rgba(254,253,251,0)'); g.addColorStop(.38, '#FEFDFB'); g.addColorStop(1, '#FEFDFB');
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = g; ctx.fillRect(x, 600, w, 244); ctx.restore();
}

// ------------------------------------------------------------------ the conversation (memory steps)
const IT = () => RECTS.thread3.items, WK = () => RECTS.work3.items;
function events() {
  const ev = [];
  for (const k of ['a', 'b', 'c']) { const m = MSG[k];
    ev.push([m.user, 'm_' + k], [m.user, 'u_' + k], [m.ans, 'a_' + k], [m.acts, 'x_' + k]); }
  return ev;
}
// each new question scrolls to the top of the thread, as in staging
function scroll(t) { return eased(t, [[0, 0], [MSG.b.send + .05, IT().m_b[1] - 4], [MSG.c.send + .05, IT().m_c[1] - 4]], .55); }
function drawThread(t, dy, alpha) {
  if (alpha <= 0) return;
  const sc = scroll(t), it = IT(), wk = WK();
  ctx.save(); ctx.beginPath(); ctx.rect(56, 140, 1382, 704); ctx.clip(); ctx.globalAlpha *= alpha;
  const blit = (img, r, a) => { const k = P(t, a, a + .4); if (k <= 0) return; const [x, y, w, h] = r;
    ctx.save(); ctx.globalAlpha *= k; ctx.drawImage(IMG[img], x * 2, y * 2, w * 2, h * 2, 56 + x, 140 + y - sc + dy + (1 - k) * 12, w, h); ctx.restore(); };
  for (const [a, id] of events()) blit('thread3', it[id], a);
  // memory step: "Accessing memories" works, then the finished row takes its place
  for (const k of ['a', 'b', 'c']) {
    const m = MSG[k], sw = P(t, m.step, m.step + .3, E.io);
    if (t >= m.work && sw < 1) { ctx.save(); ctx.globalAlpha *= 1 - sw; blit('work3', wk['w_' + k], m.work); ctx.restore();
      // spinner turning on the working row
      const [x, y] = wk['w_' + k]; const cx = 56 + x + 16.5, cy = 140 + y - sc + dy + 16.5;
      ctx.save(); ctx.globalAlpha *= (1 - sw) * P(t, m.work, m.work + .4); ctx.strokeStyle = '#C9A733'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, 5.5, t * 7, t * 7 + 1.6); ctx.stroke(); ctx.restore(); }
    if (sw > 0) { ctx.save(); ctx.globalAlpha *= sw; blit('thread3', it['s_' + k], m.step); ctx.restore(); }
  }
  ctx.restore();
}

// ------------------------------------------------------------------ the app
function drawApp(t) {
  const A = MSG.a;
  // 1 greeting with the chat box in the middle, until the first message is sent
  const conv = P(t, A.send + .1, A.send + .7, E.io);
  if (conv < 1) {
    ctx.save(); ctx.globalAlpha *= 1 - conv;
    plate('m1');
    if (t >= A.focus) { const cb = R('m1', 'cbox'); floatShadow('cboxMidOn'); sprite('cboxMidOn'); typed(t, TXT.a, A.ty[0], A.ty[1], cb[0] + 18, cb[1] + 35, A.send); }
    ctx.restore();
  }
  if (conv > 0) {
    ctx.save(); ctx.globalAlpha *= conv;
    plate('chat');
    drawThread(t, 0, 1);
    fadeBottom(56, 1382);
    dock(t);
    ctx.restore();
  }
  modal(t);
}
function dock(t) {
  const mv = P(t, MSG.a.send + .1, MSG.a.send + .7, E.io), mid = R('m1', 'cbox'), dk = R('chat', 'cbox');
  const y = L(mid[1], dk[1], mv);
  let name = 'cboxDock', msg = null;
  for (const k of ['b', 'c']) { const m = MSG[k]; if (t >= m.focus && t < m.send + .05) { name = 'cboxDockOn'; msg = k; } }
  ctx.save(); ctx.shadowColor = 'rgba(200,170,60,.16)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4; ctx.fillStyle = '#FFFEFA'; rr(dk[0] + 2, y + 2, dk[2] - 4, dk[3] - 4, 20); ctx.fill(); ctx.restore();
  ctx.drawImage(IMG[name], dk[0], y, dk[2], dk[3]);
  if (msg) { const m = MSG[msg]; typed(t, TXT[msg], m.ty[0], m.ty[1], dk[0] + 18, dk[1] + 35, m.send); }
  const d = box('disc'); ctx.save(); ctx.globalAlpha *= mv; ctx.drawImage(IMG.disc, d[0], d[1], d[2], d[3]); ctx.restore();
}
// Personalisation: opens from the sliders icon on Andri's answers, then Memories
function modal(t) {
  ring(t, 31.95, OPEN + .1, R('chat', 'sliders'), 8, 7);   // "click the sliders icon"; the open panel then covers it
  const k = P(t, OPEN + .05, OPEN + .4, E.out);
  if (k <= 0) return;
  ctx.save(); ctx.globalAlpha *= k; ctx.fillStyle = 'rgba(30,26,22,.42)'; ctx.fillRect(0, 0, 1440, 860); ctx.restore();
  const name = t >= REMCLICK + .08 ? 'pRem' : t >= JOBCLICK + .05 ? 'pJobs' : t >= LOADED ? 'pMem' : t >= MEMCLICK + .05 ? 'pLoad' : 'pAns';
  { const [x, y, w, h] = box(name), sc = L(.96, 1, k); ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(sc, sc); ctx.translate(-x - w / 2, -y - h / 2); floatShadow(name, k, true, 16); ctx.restore(); }
  sprite(name, k, 0, 0, L(.96, 1, k));
  const pm = RECTS.pMem, lbl = (r, w) => [r[0] + 6, r[1] + 5, w, r[3] - 10];
    ring(t, 37.5, 45.1, lbl(pm.g_pers, 78), 8, 3);                       // "Personal is about how you work"
  ring(t, 45.95, 52.6, lbl(pm.g_firm, 54), 8, 3);                       // "Firm holds rules for everyone"
  ring(t, 53.25, 54.9, [pm.g_nair[0] + 26, pm.g_nair[1] + 5, 196, 22], 8, 3);   // "each matter has its own folder"
  ring(t, 59.1, 60.0, pm.btEdit3, 9, 3);                                // "edit it"
  ring(t, 59.9, 60.9, pm.btDel3, 9, 3);                                 // "or delete it"
  ring(t, 61.2, 63.0, pm.btnNewFile, 9, 3);                             // "with New file"
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
  if (t > 8.2) return;
  const up = P(t, 7.25, 8.05, E.qio);
  ctx.save(); ctx.translate(0, -up * 1080);
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  ctx.fillStyle = '#F7E17E'; ctx.fillRect(0, 0, W, H);
  const e = P(t, 0.3, 0.75); font(600, 22); ctx.fillStyle = '#494746'; ctx.globalAlpha = e;
  ctx.letterSpacing = '3px'; ctx.fillText('ANDRI ACADEMY · 3.1', 122, 392); ctx.letterSpacing = '0px'; ctx.globalAlpha = 1;
  words('Say it once.', 120, 530, 0.5, .09, 128, 500, '#231E19', null);
  words('Andri remembers.', 120, 640, 1.15, .09, 84, 400, '#231E19', null);
  mascot('wave', t, .25, 8.2, 1180, 330, 640);
  ctx.restore();
}
const END = 64.55;
function endCard(t) {
  if (t < END) return;
  const a = P(t, END + .05, END + .65), dy = (1 - P(t, END + .05, END + .75, E.q)) * 24;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(0, dy);
  ctx.drawImage(IMG.logo, 512, 438, 520, 520 * 600 / 2299);
  font(500, 25); ctx.fillStyle = '#494746'; ctx.textBaseline = 'alphabetic'; ctx.fillText('Andri Academy · Next: Andri works while you sleep', 515, 635);
  ctx.restore();
  // mascot, then the tick springs in with a slight twist (as in 1.1)
  const m = mascot('done', t, END + .25, DURATION + 2, 1105, 400, 420, { from: 'pop' });
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
  if (cam.o > 0 && t > 7.15) {
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
