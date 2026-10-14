// Andri Academy 2.1 · The whole letter, in one request
// Everything is drawn on one <canvas> by renderFrame(t), a pure function of time t (seconds).
// App screens are still plates of the Andri rebuild (plates/*.png, 2x); all motion is drawn here.
// Engine, camera, captions, cursor, mascot and end card follow the approved 1.1 and 1.2 videos.
// Every screen and every step follows the staging run of 8 Oct 2026 (see staging-captures/ and story.md).

const W = 1920, H = 1080, FPS = 60, DURATION = 97;
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
  const plates = ['m1', 'cboxG0', 'cboxG1', 'cboxG2', 'cboxG3', 'cboxG3at', 'disc', 'mp', 'chat', 'split', 'cboxDock', 'cboxSplit', 'cboxSplitOn', 'cboxSplit2', 'discSplit',
    'dq0', 'dq0hot', 'dq1', 'dq1hot', 'dq2', 'dq2hot', 'wideQ', 'wideA', 'narrow', 'bpanel', 'dpanel1', 'dpanel2', 'toast', 'inbox1', 'inbox2', 'inbox3', 'kbFrame', 'kbFrameIn', 'kbTopFull', 'kbIn'];
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
function img(name, x, y, alpha = 1, dy = 0) { if (alpha <= 0) return; const [, , w, h] = box(name); ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(IMG[name], x, y + dy, w, h); ctx.restore(); }
function sprite(name, alpha = 1, dx = 0, dy = 0, scale = 1) {
  if (alpha <= 0) return;
  const [x, y, w, h] = box(name); ctx.save(); ctx.globalAlpha *= alpha;
  ctx.translate(x + w / 2 + dx, y + h / 2 + dy); ctx.scale(scale, scale);
  ctx.drawImage(IMG[name], -w / 2, -h / 2, w, h); ctx.restore();
}
function font(w, s, fam = 'Rethink') { ctx.font = `${w} ${s}px ${fam}`; }
function ring(t, a, b, r, rad = 10, pad = 5) {
  const v = V2(t, a, b, .25, .3); if (v <= 0) return;
  const g = P(t, a, a + .35, E.back);
  ctx.save(); ctx.globalAlpha *= v; ctx.strokeStyle = '#E9CD4F'; ctx.lineWidth = 3;
  const p = pad + (1 - g) * 6; rr(r[0] - p, r[1] - p, r[2] + p * 2, r[3] + p * 2, rad + p); ctx.stroke(); ctx.restore();
}
const C = r => [r[0] + r[2] / 2, r[1] + r[3] / 2];
function eased(t, keys, d = .6) { let v = keys[0][1]; for (let i = 1; i < keys.length; i++) { const [a, x] = keys[i]; if (t < a) break; v = L(v, x, P(t, a, a + d, E.io)); } return v; }

// ------------------------------------------------------------------ timeline (video seconds)
// narration (ElevenLabs, "UK voice voice to use for ANDRI vids", one take, split at the pauses) start times
const VO = { L0: 0.6, L1: 7.2, L2: 14.3, L3: 22.6, L4: 31.7, L5: 38.3, L6: 47.9, L7: 56.9 };
const VO_SRC = { L0: [0.00, 3.67], L1: [4.29, 9.99], L2: [10.47, 14.42], L3: [14.95, 20.59], L4: [21.02, 25.78], L5: [26.34, 34.50], L6: [35.08, 40.83], L7: [41.49, 44.75] };
// calmer pace (Bennett, 8 Oct): slower typing, the @ step at full screen, more time between Andri's questions
const FOCUS = 7.6, TYPE1 = [8.1, 13.1], TYPE2 = [14.5, 15.8], PICK = 17.3, SEND1 = 19.3;
const QCLICK = [26.5, 27.8, 29.1], DOCK = SEND1 + .1;
const D = 2.1;  // everything after the questions moves by D against the first cut
const POST = 27.3 + D, PANEL_IN = 29.3 + D, NARROW = 29.75 + D;
const READY1 = 35.9 + D, FOCUS2 = 45.9 + D, TYPE3 = [46.1 + D, 47.6 + D], SEND2 = 48.0 + D, READY2 = 51.3 + D;

// cursor: [t0, t1, target]; targets in app px (resolved through the camera at draw time)
function cursorPath() {
  const g = cbG(16.5), row = mpRect(g), go = [g.x + g.w - 34, g.y + g.h - 27];
  const q = n => { const d = RECTS['dq' + n]; return [C(d.dopt0)[0] - 150, C(d.dopt0)[1]]; };
  const sp = box('cboxSplit'), sp2 = box('cboxSplit2');
  return [
    [7.0, 7.01, 'enter'], [7.05, 7.55, [g.x + 240, g.y + 40]], [7.9, 8.4, 'exit'],
    [16.0, 16.01, 'exit'], [16.1, 16.9, (() => { const m = RECTS.mp.mpRow, o = box('mp'); return [row[0] + m[0] - o[0] + 190, row[1] + m[1] - o[1] + m[3] / 2]; })()], [17.7, 18.3, [go[0] - 60, go[1] + 70]], [18.5, 19.1, go], [19.6, 20.2, 'exit'],
    [24.9, 24.91, 'exit'], [25.0, 25.9, q(0)], [26.85, 27.3, q(1)], [28.15, 28.6, q(2)], [29.4, 30.0, 'exit'],
    [45.2 + D, 45.21 + D, 'exit'], [45.25 + D, 45.75 + D, [sp[0] + 220, sp[1] + 40]], [46.0 + D, 46.6 + D, [sp[0] + 560, sp[1] + 130]], [47.2 + D, 47.8 + D, [sp2[0] + sp2[2] - 34, sp2[1] + sp2[3] - 27 - (sp2[3] - sp[3])]], [48.3 + D, 48.9 + D, 'exit'],
  ];
}
const CLICKS = [FOCUS, PICK, SEND1, ...QCLICK, FOCUS2, SEND2];
const CURSOR_ON = [[7.0, 8.4], [16.0, 20.2], [24.9, 30.0], [45.2 + D, 48.9 + D]];

const CAP = [[7.2, 1, 'One request'], [13.3, 2, 'Your letter template'], [22.6, 3, 'Andri asks first'], [31.7, 4, 'Written in the background'], [38.3, 5, 'Ready on your letterhead'], [47.9, 6, 'Ask for changes']];
const CAP_END = 53.3 + D;

// ------------------------------------------------------------------ camera
const POSE = { s: 1.08, cx: 960, cy: 503 };
function zoomOn(r, maxW, maxH, cx = 960, cy = 500) { const s = Math.min(maxW / r[2], maxH / r[3]); return { fx: r[0] + r[2] / 2, fy: r[1] + r[3] / 2, s, cx, cy, clip: r, r: 18, o: 1 }; }
function shot(name) {
  const full = [0, 0, 1440, 860];
  if (name === 'screen') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy, clip: full, r: 22, o: 1 };
  if (name === 'below') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy + 1100, clip: full, r: 22, o: 1 };
  if (name === 'gone') return { fx: 720, fy: 430, s: POSE.s * .94, cx: POSE.cx, cy: POSE.cy + 40, clip: full, r: 22, o: 0 };
  if (name === 'box') { const b = box('cboxG0'); return zoomOn([b[0] - 16, b[1] - 46, b[2] + 32, 192], 1500, 860); }        // the chat box while the request types
  if (name === 'boxmp') { const b = box('cboxG0'); return zoomOn([b[0] - 16, b[1] - 262, b[2] + 32, 410], 1500, 860); }      // the same, with the @ list above it
  if (name === 'letter') { const p = RECTS.dpanel1.page, b = box('dpanel1'); return zoomOn([b[0] + p[0], b[1] + p[1], p[2], 330], 1300, 800); }     // the top of the letter
}
const SHOTS = [[0, 'below', 0], [6.1, 'screen', 0.85], [7.95, 'box', 0.8], [13.4, 'screen', 0.8],
  [37.4 + D, 'letter', 0.9], [41.5 + D, 'screen', 0.8], [53.2 + D, 'gone', 1.0]];
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

// ------------------------------------------------------------------ text
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
// text typed into the chat box, word by word at the positions the real box lays them out (plates/rects: typeA/B/C)
const lineCount = ws => { const ys = []; for (const w of ws) if (!ys.some(y => Math.abs(y - w.y) < 4)) ys.push(w.y); return Math.max(1, ys.length); };
function typedWords(set, nChars) {
  const out = []; let left = nChars;
  for (const w of RECTS[set].words) { if (left <= 0) break; const n = Math.min(w.t.length, left); out.push({ ...w, s: w.t.slice(0, n), done: n === w.t.length }); left -= n + 1; }
  return out;
}
function drawTyped(ws, ox, oy, t, showCaret) {
  font(400, 17); ctx.textBaseline = 'alphabetic';
  for (const w of ws) {
    if (w.chip) { ctx.fillStyle = '#E3EBE1'; rr(ox + w.x, oy + w.y + 1, w.w, w.h - 2, 4); ctx.fill(); ctx.fillStyle = '#5E7F5F'; ctx.fillText(w.s, ox + w.x + 3, oy + w.y + 18); }
    else { ctx.fillStyle = '#241E19'; ctx.fillText(w.s, ox + w.x, oy + w.y + 17); }
  }
  if (showCaret && ws.length) { const w = ws[ws.length - 1]; font(400, 17); caret(t, ox + w.x + (w.chip ? w.w : ctx.measureText(w.s).width), oy + w.y + 17); }
}
const chars = set => RECTS[set].words.reduce((a, w) => a + w.t.length + 1, 0);

// ------------------------------------------------------------------ the greeting chat box (grows while typing, stays centred)
function cbG(t) {
  let ws = [], lines = 1, set = null;
  if (t >= TYPE1[0] && t < TYPE2[0]) { set = 'typeA'; const n = Math.round(P(t, TYPE1[0], TYPE1[1], E.lin) * (chars('typeA') - 22)); ws = typedWords('typeA', n); }
  else if (t >= TYPE2[0] && t < PICK + .1) { set = 'typeA'; const base = chars('typeA') - 22; ws = typedWords('typeA', base + Math.round(P(t, TYPE2[0], TYPE2[1], E.lin) * 22)); }
  else if (t >= PICK + .1) { set = 'typeB'; ws = typedWords('typeB', 9999); }
  lines = Math.min(3, lineCount(ws));
  const b0 = box('cboxG0'), h = 98 + (lines - 1) * 24.65, y = b0[1] + (98 - h) / 2;
  return { x: b0[0], y, w: b0[2], h, lines, ws, set };
}
const mpRect = g => { const [, , w, h] = box('mp'); return [g.x + (g.w - w) / 2, g.y - 12 - h, w, h]; };
function drawGreetBox(t, alpha) {
  if (alpha <= 0) return;
  const g = cbG(t);
  const name = t >= PICK + .1 ? 'cboxG3at' : (g.ws.length ? 'cboxG' + g.lines : 'cboxG0');
  ctx.save(); ctx.globalAlpha *= alpha;
  const [, , bw, bh] = box(name); ctx.drawImage(IMG[name], g.x, g.y, bw, bh);
  drawTyped(g.ws, g.x, g.y, t, t >= FOCUS && t < SEND1);
  const d = box('disc'); ctx.drawImage(IMG.disc, d[0], g.y + g.h + 6, d[2], d[3]);
  // the @ list, from the moment the @ is typed until the template is picked
  const k = P(t, TYPE2[0] + .05, TYPE2[0] + .3, E.out) * (1 - P(t, PICK + .05, PICK + .2, E.io));
  if (k > 0) {
    const r = mpRect(g), y = r[1] + (1 - k) * 10; ctx.globalAlpha *= k;
    // the list's real shadow (staging: 0 18px 44px -18px rgba(35,30,25,.34), 0 2px 6px -2px rgba(35,30,25,.10)), drawn under the rounded plate
    ctx.save(); ctx.fillStyle = '#EBE5DB';
    ctx.shadowColor = 'rgba(35,30,25,.30)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 16; rr(r[0] + 10, y + 10, r[2] - 20, r[3] - 14, 16); ctx.fill();
    ctx.shadowColor = 'rgba(35,30,25,.10)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2; rr(r[0] + 1, y + 1, r[2] - 2, r[3] - 2, 16); ctx.fill(); ctx.restore();
    ctx.drawImage(IMG.mp, r[0], y, r[2], r[3]);
  }
  ctx.restore();
  ring(t, PICK + .4, PICK + 1.6, (() => { const ch = g.ws.find(w => w.chip); return ch ? [g.x + ch.x, g.y + ch.y, ch.w, ch.h] : [0, 0, 0, 0]; })(), 6, 4);
}

// ------------------------------------------------------------------ the conversation (tall plates with item rects)
const IT = n => RECTS[n].items;
const REVEAL = (() => {
  const r = { w_ub: SEND1 + .3 };
  ['w_s0', 'w_s1', 'w_s2', 'w_s3', 'w_s4', 'w_t1', 'w_s5', 'w_s6', 'w_s7', 'w_t2', 'w_s8'].forEach((id, i) => r[id] = SEND1 + .8 + i * .22);
  r.w_wait = SEND1 + 3.15; r.w_banner = SEND1 + 3.3;
  r.w_t3 = POST + .2; r.w_s9 = POST + .45; r.w_t4 = POST + .7; r.w_doc = POST + 1.0; r.w_reply = POST + 1.4;
  r.c_ub = SEND2 + .25; r.c_s0 = SEND2 + .65; r.c_s1 = SEND2 + .9; r.c_t1 = SEND2 + 1.15; r.c_doc = SEND2 + 1.45; r.c_reply = SEND2 + 1.95;
  return r;
})();
const CARD_IN = SEND1 + 3.5, CARD_OUT = QCLICK[2] + .15;
function scrollFor(name, t) {
  const it = IT(name), top = id => 140 + it[id][1], bot = id => top(id) + it[id][3];
  if (name === 'wideQ') {
    const cardTop = box('dq0')[1];
    return eased(t, [[0, 0], [REVEAL.w_s5, Math.max(0, bot('w_s5') - 580)], [REVEAL.w_s8, Math.max(0, bot('w_s8') - 580)], [REVEAL.w_banner, Math.max(0, bot('w_wait') - (cardTop - 12))]], .55);
  }
  if (name === 'wideA') return eased(t, [[0, Math.max(0, bot('w_s8') - 580)], [REVEAL.w_t3, Math.max(0, bot('w_t4') - 580)], [REVEAL.w_doc, Math.max(0, top('w_doc') - 200)]], .6);
  // narrow, next to the side panel: the document card and the start of the reply, later the change request
  return eased(t, [[0, Math.max(0, top('w_doc') - 200)], [REVEAL.c_ub, Math.max(0, top('c_ub') - 170)], [REVEAL.c_reply, Math.max(0, top('c_doc') - 170)]], .6);
}
function drawThread(t, name, x0, w0, alpha) {
  if (alpha <= 0) return;
  const it = IT(name), sc = scrollFor(name, t);
  ctx.save(); ctx.beginPath(); ctx.rect(x0, 140, w0, 704); ctx.clip(); ctx.globalAlpha *= alpha;
  for (const [id, a] of Object.entries(REVEAL)) {
    if (!it[id]) continue;
    let k = P(t, a, a + .35);
    if ((id === 'w_wait' || id === 'w_banner') && name === 'wideQ') k *= 1 - P(t, POST, POST + .3, E.io);
    if (k <= 0) continue;
    const [x, y, w, h] = it[id]; ctx.save(); ctx.globalAlpha *= k;
    ctx.drawImage(IMG[name], x * 2, y * 2, w * 2, h * 2, x0 + x, 140 + y - sc + (1 - k) * 12, w, h); ctx.restore();
  }
  ctx.restore();
  return { sc, it };
}
function fadeBottom(x, w, alpha = 1) {
  const g = ctx.createLinearGradient(0, 644, 0, 844); g.addColorStop(0, 'rgba(254,253,251,0)'); g.addColorStop(.45, '#FEFDFB'); g.addColorStop(1, '#FEFDFB');
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = g; ctx.fillRect(x, 644, w, 200); ctx.restore();
}

// ------------------------------------------------------------------ side panels
function drawBuilt(t, off, alpha) {
  if (alpha <= 0) return;
  const [px, py, pw, ph] = box('bpanel'), it = RECTS.bpanel.items;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(off, 0);
  ctx.shadowColor = 'rgba(35,30,25,.12)'; ctx.shadowBlur = 30; ctx.fillStyle = '#FEFDFB'; rr(px, py, pw, ph, 16); ctx.fill(); ctx.shadowColor = 'transparent';
  const hd = it.head; ctx.drawImage(IMG.bpanel, 0, 0, pw * 2, (hd[1] + hd[3]) * 2, px, py, pw, hd[1] + hd[3]);
  // timeline line, then each event as it happens
  const tl = ['bp0', 'bp1', 'bp2', 'bp3', 'bp4', 'bp5', 'bp6', 'bp7'], at = [30.2, 30.6, 31.0, 31.6, 32.4, 32.9, 33.6, 34.0].map(x => x + D);
  tl.forEach((id, i) => {
    const k = P(t, at[i], at[i] + .4); if (k <= 0) return;
    const [x, y, w, h] = it[id]; ctx.save(); ctx.globalAlpha *= k;
    ctx.drawImage(IMG.bpanel, (x - 30) * 2, (y - 4) * 2, (w + 30) * 2, (h + 14) * 2, px + x - 30, py + y - 4 + (1 - k) * 10, w + 30, h + 14); ctx.restore();
  });
  ctx.restore();
}
function drawDoc(t, v, alpha, off = 0) {
  if (alpha <= 0) return;
  const n = 'dpanel' + v, [px, py, pw, ph] = box(n);
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(off, 0);
  ctx.shadowColor = 'rgba(35,30,25,.12)'; ctx.shadowBlur = 30; ctx.drawImage(IMG[n], px, py, pw, ph); ctx.shadowColor = 'transparent';
  ctx.restore();
}
function toast(t, a, b) {
  const k = P(t, a, a + .45, E.q) * (1 - P(t, b, b + .35, E.io)); if (k <= 0) return;
  const [x, y, w, h] = box('toast'); ctx.save(); ctx.globalAlpha *= k;
  ctx.drawImage(IMG.toast, x + (1 - k) * 40, y, w, h); ctx.restore();
}
function inbox(t) {
  const n = t >= READY2 + .05 ? 3 : t >= READY1 + .05 ? 2 : 1;
  if (n === 1) return; const [x, y, w, h] = box('inbox' + n);
  const a = n === 3 ? READY2 + .05 : READY1 + .05, k = P(t, a, a + .35, E.back);
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(.6 + .4 * k, .6 + .4 * k); ctx.drawImage(IMG['inbox' + n], -w / 2, -h / 2, w, h); ctx.restore();
}

// ------------------------------------------------------------------ the case file (Knowledge Base), real time
// Never leave it to assumption (Bennett, 8 Oct): before the request, show that the case file and the letter template
// are already in the matter's Knowledge Base, so the viewer knows how Andri knows the client and the case.
const KB = { FOLD: 16.9, CHAT: 24.2, END: 24.9 };
const kbName = r => [r[0] + 46, r[1] + 14, 300, 32];
function kbScroll(tr) { return eased(tr, [[0, 0], [17.8, 700]], 1.2); }
function drawKB(tr) {
  if (tr < KB.FOLD + .35) {
    ctx.save(); ctx.globalAlpha *= 1 - P(tr, KB.FOLD + .05, KB.FOLD + .35, E.io);
    plate('kbTopFull');
    ring(tr, 12.6, 14.5, R('kbFrame', 'kbFold'), 12, 5);              // "...the case documents are in this folder"
    ring(tr, 14.6, 16.4, kbName(R('kbTopFull', 'kt0')), 8, 4);       // "...your firm's letter template is here too"
    ctx.restore();
  }
  if (tr >= KB.FOLD + .05) {
    ctx.save(); ctx.globalAlpha *= P(tr, KB.FOLD + .05, KB.FOLD + .35, E.io);
    plate('kbFrameIn');
    const [bx, by, bw, bh] = box('kbIn'), sc = kbScroll(tr);
    ctx.save(); ctx.beginPath(); ctx.rect(bx - 2, by - 2, bw + 4, 860 - by + 2); ctx.clip();
    ctx.drawImage(IMG.kbIn, bx, by - sc, bw, bh);
    const row = id => { const r = RECTS.kbIn.rows[id]; return kbName([bx + r[0], by + r[1] - sc, r[2], r[3]]); };
    ring(tr, 18.9, 20.9, row('kf14'), 8, 4);       // 05_Tribunal_Judgment.pdf, "the judgment"
    ring(tr, 19.8, 21.9, row('kf16'), 8, 4);       // 13_Schedule_of_Loss.xlsx, "the schedule of loss"
    ctx.restore(); ctx.restore();
  }
}
function cursorKB(tr, cam) {
  if (tr < 15.5 || tr > KB.CHAT + .5) return;
  const fold = R('kbFrame', 'kbFold'), chat = R('kbFrame', 'kbRailChat');
  const path = [[15.5, 15.51, 'enter'], [15.7, 16.6, [fold[0] + 90, fold[1] + 24]], [23.1, 23.9, [chat[0] + 12, chat[1] + 12]]];
  let pos = null;
  const res = tg => tg === 'enter' ? [1980, 1140] : toScreen(cam, tg[0], tg[1]);
  for (const [a, b, tg] of path) { const p = res(tg); if (!pos) pos = p; if (tr >= b) { pos = p; continue; } if (tr > a) { const k = E.io((tr - a) / (b - a)); pos = [L(pos[0], p[0], k), L(pos[1], p[1], k)]; } break; }
  drawCursorAt(tr, pos, [KB.FOLD, KB.CHAT]);
}

// ------------------------------------------------------------------ the app
function drawApp(t) {
  // 1 greeting with the chat box in the middle, until the request is sent
  const conv = P(t, DOCK, DOCK + .6, E.io);
  if (conv < 1) {
    ctx.save(); ctx.globalAlpha *= 1 - conv;
    plate('m1'); drawGreetBox(t, 1);
    ctx.restore();
  }
  inbox(t);
  if (conv <= 0) return;
  const split = P(t, NARROW, NARROW + .3, E.io);                         // conversation re-flows next to the panel
  const slide = P(t, PANEL_IN, PANEL_IN + .6, E.qio);                    // side panel slides in
  ctx.save(); ctx.globalAlpha *= conv;
  plate('chat');
  const push = (1 - conv) * 300;
  ctx.save(); ctx.translate(0, push);
  if (t < POST + .3) drawThread(t, 'wideQ', 56, 1382, 1);
  if (t >= POST) drawThread(t, 'wideA', 56, 1382, P(t, POST, POST + .3, E.io) * (1 - split));
  ctx.restore();
  fadeBottom(56, 1382, 1 - split);
  if (split > 0) { ctx.save(); ctx.globalAlpha *= split; plate('split'); drawThread(t, 'narrow', 56, 790, 1); fadeBottom(56, 790); ctx.restore(); }
  dock(t, split);
  inbox(t);
  // side panel: How Andri built this, then the finished letter, then the edited letter
  const doc1 = P(t, READY1 + .2, READY1 + .6, E.io), doc2 = P(t, READY2 + .1, READY2 + .5, E.io);
  if (slide > 0) {
    const off = (1 - slide) * (box('bpanel')[2] + 40);
    drawBuilt(t, off, 1 - doc1);
    drawDoc(t, 1, doc1 * (1 - doc2), off);
    drawDoc(t, 2, doc2, off);
    // the page count of the edited letter
  }
  toast(t, READY1, 40.5 + D); toast(t, READY2, 52.9 + D);
  // Jobs in the matter sidebar
  ring(t, 42.9 + D, 44.6 + D, R('chat', 'railJobs'), 10, 6);
  ctx.restore();
}
function dock(t, split) {
  // chat box moves down from the greeting as the conversation starts
  const mv = P(t, DOCK, DOCK + .6, E.io), g = cbG(SEND1 - .01), dk = box('cboxDock');
  const y = L(g.y + g.h - dk[3], dk[1], mv);
  const card = P(t, CARD_IN, CARD_IN + .3, E.io) * (1 - P(t, CARD_OUT, CARD_OUT + .25, E.io));   // question card replaces the chat box
  ctx.save(); ctx.globalAlpha *= (1 - split) * (1 - card);
  ctx.drawImage(IMG.cboxDock, dk[0], y, dk[2], dk[3]);
  ctx.restore();
  const d = box('disc'); ctx.save(); ctx.globalAlpha *= (1 - split) * mv * (1 - card); ctx.drawImage(IMG.disc, d[0], y + dk[3] + 6, d[2], d[3]); ctx.restore();
  // Andri's questions, one after the other
  if (card > 0) {
    const n = t >= QCLICK[1] + .15 ? 2 : t >= QCLICK[0] + .15 ? 1 : 0;
    const hot = (n === 0 && t >= 25.9) || (n === 1 && t >= 27.3) || (n === 2 && t >= 28.6);
    const swap = n ? P(t, QCLICK[n - 1] + .15, QCLICK[n - 1] + .45, E.out) : 1;
    sprite('dq' + n + (hot ? 'hot' : ''), card * swap, 0, (1 - P(t, CARD_IN, CARD_IN + .45, E.back)) * 30);
    if (n === 0) ring(t, 25.1, 26.0, RECTS.dq0.dother, 10, 4);
  }
  // narrow chat box next to the panel; the change request types in and the box grows upwards
  if (split > 0) {
    ctx.save(); ctx.globalAlpha *= split;
    const sp = box('cboxSplit');
    let name = 'cboxSplit', ws = [];
    if (t >= TYPE3[0] && t < SEND2 + .05) { ws = typedWords('typeC', Math.round(P(t, TYPE3[0], TYPE3[1], E.lin) * chars('typeC'))); name = lineCount(ws) > 1 ? 'cboxSplit2' : 'cboxSplitOn'; }
    const b = box(name), by = sp[1] + sp[3] - b[3];
    ctx.drawImage(IMG[name], b[0], by, b[2], b[3]);
    drawTyped(ws, b[0], by, t, t >= FOCUS2 && t < SEND2);
    sprite('discSplit');
    ring(t, REVEAL.c_doc + .25, REVEAL.c_doc + 1.8, cEdit(t), 6, 4);
    ctx.restore();
  }
}
// the "edit" tag on the second Creating Word document step, in screen position (follows the scroll)
function cEdit(t) { const it = IT('narrow'), r = it.c_edit, sc = scrollFor('narrow', t); return r ? [56 + r[0], 140 + r[1] - sc, r[2], r[3]] : [0, 0, 0, 0]; }

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
  drawCursorAt(t, pos, CLICKS);
}
function drawCursorAt(t, pos, clicks) {
  const press = clicks.some(cc => t >= cc - .07 && t < cc + .15);
  for (const cc of clicks) if (t >= cc && t < cc + .45) { const k = (t - cc) / .45; ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#C9A733'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(pos[0], pos[1], 9 + 26 * E.out(k), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  ctx.save(); ctx.translate(pos[0] - 7, pos[1] - 4); const s = 34 / 30 * (press ? .86 : 1); ctx.scale(s, s);
  const p = new Path2D('M6 3 L6 24 L11.2 19.3 L14.6 27 L18.2 25.4 L14.9 17.9 L22 17.6 Z');
  ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1;
  ctx.fillStyle = '#1d1813'; ctx.fill(p); ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round'; ctx.stroke(p); ctx.restore();
}
function caption(t) {
  const CAP = CAP_R, CAP_END = CAP_END_R;
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
  if (t > 6.9) return;
  const up = P(t, 6.05, 6.85, E.qio);
  ctx.save(); ctx.translate(0, -up * 1080);
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  ctx.fillStyle = '#F7E17E'; ctx.fillRect(0, 0, W, H);
  const e = P(t, 0.3, 0.75) * (1 - P(t, 5.85, 6.05)); font(600, 22); ctx.fillStyle = '#494746'; ctx.globalAlpha = e;
  ctx.letterSpacing = '3px'; ctx.fillText('ANDRI ACADEMY · 2.1', 122, 392); ctx.letterSpacing = '0px'; ctx.globalAlpha = 1;
  words('The whole letter', 120, 530, 0.5, .09, 128, 500, '#231E19', null);
  words('In one request.', 120, 640, 1.15, .09, 84, 400, '#231E19', null);
  mascot('idea', t, .25, 6.9, 1180, 330, 640);
  ctx.restore();
}
function endCard(t) {
  const T = t - D;
  if (T < 54.35) return;
  const a = P(T, 54.4, 54.95), dy = (1 - P(T, 54.4, 55.05, E.q)) * 24;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(0, dy);
  ctx.drawImage(IMG.logo, 512, 438, 520, 520 * 600 / 2299);
  font(500, 25); ctx.fillStyle = '#494746'; ctx.textBaseline = 'alphabetic'; ctx.fillText('Andri Academy · Next: Reply to a letter from the other side', 515, 635);
  ctx.restore();
  const m = mascot('done', T, 54.55, 61.5, 1105, 400, 420, { from: 'pop' });
  if (m) {
    const b = MMETA.done.badge;
    const bx = m.x + m.w / 2 + (b[0] * m.w + b[2] * m.w / 2 - m.w / 2) * m.sc, by = m.y + m.h + (b[1] * m.h + b[3] * m.h / 2 - m.h) * m.sc;
    const fi = Math.floor((T - 54.55) * MMETA.disc.fps) % MMETA.disc.frames, mw = m.w * m.sc, mh = m.h * m.sc;
    const ox = m.x + m.w / 2 - mw / 2, oy = m.y + m.h + m.dy - mh;
    const x = cl((T - 55.05) / .34), k = x <= 0 ? 0 : E.back(x);
    if (k > 0) {
      ctx.save(); ctx.globalAlpha *= cl(x * 4);
      ctx.translate(bx, by); ctx.rotate((1 - k) * -0.35); ctx.scale(k, k); ctx.translate(-bx, -by);
      ctx.drawImage(MASC.tick[fi], ox, oy, mw, mh); ctx.restore();
    }
  }
  // no Up next card in the video: the Academy website adds it
}

// ------------------------------------------------------------------ frame
// calmer pace (Bennett, 8 Oct): after the intro, the whole app part plays 1.3x slower; narration lines keep their speed
const WARP = { T0: 7.0, S: 1.3, P: KB.END - 7.0 };   // P: the Knowledge Base beat, inserted before the request
const toLogical = t => t <= WARP.T0 ? t : t <= WARP.T0 + WARP.P ? WARP.T0 : WARP.T0 + (t - WARP.T0 - WARP.P) / WARP.S;
const toReal = x => x <= WARP.T0 ? x : WARP.T0 + WARP.P + (x - WARP.T0) * WARP.S;
const END_L = 54.35 + D, END_R = toReal(END_L);   // end card start, logical and real
const CAP_R = [[7.2, 1, 'The case file'], ...CAP.map(([a, n, s]) => [toReal(a), n + 1, s])], CAP_END_R = toReal(CAP_END);
async function renderFrame(tReal) {
  if (!READY) READY = load();
  await READY;
  const t = toLogical(tReal);
  globalT = t;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.textAlign = 'left';
  background(tReal);
  const cam = camera(t);
  if (cam.o > 0 && t > 6.05) {
    const [x, y, w, h] = cam.clip; const [sx, sy] = toScreen(cam, x, y); const sw = w * cam.s, sh = h * cam.s;
    ctx.save(); ctx.globalAlpha = cam.o;
    ctx.shadowColor = 'rgba(35,30,25,.16)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 26; ctx.fillStyle = '#F2EFE9'; rr(sx, sy, sw, sh, cam.r * cam.s / POSE.s); ctx.fill();
    ctx.shadowColor = 'rgba(35,30,25,.22)'; ctx.shadowBlur = 1; ctx.shadowOffsetY = 0; ctx.fill(); ctx.shadowColor = 'transparent';
    rr(sx, sy, sw, sh, cam.r * cam.s / POSE.s); ctx.clip();
    ctx.translate(cam.cx - cam.fx * cam.s, cam.cy - cam.fy * cam.s); ctx.scale(cam.s, cam.s);
    if (tReal < KB.END) {
      const push = P(tReal, KB.CHAT + .1, KB.END, E.qio);
      ctx.save(); ctx.translate(-1440 * push, 0); drawKB(tReal); ctx.restore();
      if (push > 0) { ctx.save(); ctx.translate(1440 * (1 - push), 0); drawApp(WARP.T0); ctx.restore(); }
    } else drawApp(t);
    ctx.restore();
  }
  endCard(tReal - END_R + END_L);
  title(tReal);
  caption(tReal);
  if (tReal < KB.END + .5) cursorKB(tReal, cam);
  cursor(t, cam);
}

window.MG = { width: W, height: H, fps: FPS, duration: DURATION, renderFrame };
if (!navigator.webdriver) { const t0 = performance.now(); (function loop() { renderFrame(((performance.now() - t0) / 1000) % DURATION).then(() => requestAnimationFrame(loop)); })(); }
