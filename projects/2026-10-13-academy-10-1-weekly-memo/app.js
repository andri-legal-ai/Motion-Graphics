// Andri Academy 10.1 · Your weekly memo, and other ways to start a workflow
// Everything is drawn on one <canvas> by renderFrame(t), a pure function of time t (seconds).
// App screens are plates of real Andri staging snapshots (plates/*.png, 2x, built by plates/capture101.mjs). The workflow canvas
// (dots, nodes, edges) is drawn here from node sprites captured from the same snapshots, so steps land, get dragged and joined
// as in staging. Engine copied from the 10.2 project (which follows 1.1, 1.2 and 8.1); timeline, beats and plates are 10.1's own.

const W = 1920, H = 1080, FPS = 60;
const c = document.getElementById('c'); c.width = W; c.height = H;
let ctx = c.getContext('2d'); const MAIN = ctx;
const ROOT = '../';
// the whole window is drawn on its own canvas when it fades, so stacked layers never show through (known-issues #12)
const OFF = document.createElement('canvas'); OFF.width = W; OFF.height = H; const octx = OFF.getContext('2d');

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

// ------------------------------------------------------------------ timeline (video seconds)
// Narration: one ElevenLabs take, cut by sentence (audio/cuts.json → audio/uk/S*.wav), placed here (audio/mix.sh reads VO).
// Each action sits on the word that names it (word offsets from audio/words.json).
const VO = { S01: 0.6, S02: 3.5, S03: 8.6, S04: 13.6, S05: 16.0, S06: 22.0, S07: 25.6, S08: 29.2, S09: 31.7, S10: 38.4, S11: 43.4,
  S12: 50.2, S13: 53.8, S14: 59.2, S15: 61.8, S16: 67.6, S17: 71.2, S18: 77.8, S19: 80.6, S20: 89.3, S21: 96.0, S22: 99.6, S23: 103.6 };
const T = {
  push: 7.1,
  explore: 9.3, wfItem: 10.5, newWf: 12.1,
  choose: 24.2, trigClick: 25.95, ddOpen: 27.45, ddPick: 28.3,
  trigSave: 36.45, zo: [36.95, 37.25], pan1: [37.55, 38.25],
  rpAdd: 39.3, rpDrag: [40.1, 41.0], rpJoin: [41.45, 42.1], rpClick: 42.7, rpTA: 43.5, rpType: [43.8, 47.9], rpSave: 49.6,
  cdAdd: 50.45, cdDrag: [51.0, 51.8], cdJoin: [52.0, 52.6], cdClick: 53.3, cdTA: 54.0, cdType: [54.3, 58.0], cdSave: 58.7,
  titleC: 59.3, title: [59.6, 60.5], publish: 60.85, next: 66.0, gotIt: 67.35,
  matters: 68.1, wfIcon: 69.3, activate: 70.5, menu: 74.4, execs: 75.75,
  editTpl: 78.2, addNode: 79.6,
  exit: 101.6,
};
const END = 102.7, DURATION = 109.6;
const CAP = [[VO.S03, 1, 'A new workflow'], [VO.S04, 2, 'Choose how it starts'], [VO.S07, 3, 'Every Monday'], [VO.S10, 4, 'The instruction'],
  [VO.S12, 5, 'The memo'], [VO.S14, 6, 'Publish'], [VO.S16, 7, 'Switch it on'], [VO.S18, 8, 'Other ways to start']];
const CAP_END = T.exit + .1;
const TXT = {
  rp: ["Summarise this week's new documents and emails in this matter. List", 'what needs action.'],
  cd: ['Turn the summary into a one-page weekly memo for the partner, with', 'the actions as a list.'],
  title: ['Weekly matter memo'],
};

// ------------------------------------------------------------------ assets
const PLATES = ['aMat', 'aExp', 'wEmpty', 'bChoose', 'lTop', 'sCfg', 'sDD', 'sDDH', 'sWeek', 'rCfgP', 'rType0', 'rType', 'dCfgP', 'dType0', 'dType',
  'tEdit', 'tEdit0', 'tTyped', 'tSaved', 'mList', 'mActive', 'mMenu', 'mExec', 'eEdit', 'eList',
  'nTrig', 'nTrigSel', 'nRun0', 'nRun0Sel', 'nRun', 'nDoc0', 'nDoc0Sel', 'nDoc', 'toastTR', 'toastRA', 'toastCD', 'toastAct'];
const SEQ = { pub1: 45, pub2: 45 };
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
const PX = {};
function px(name, x, y) {
  const k = `${name}:${x}:${y}`; if (PX[k]) return PX[k];
  const cv = document.createElement('canvas'); cv.width = 1; cv.height = 1; const g = cv.getContext('2d');
  g.drawImage(IMG[name], Math.round(x * 2), Math.round(y * 2), 1, 1, 0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data;
  return (PX[k] = `rgb(${d[0]},${d[1]},${d[2]})`);
}

// ------------------------------------------------------------------ helpers
const R = (set, id) => { const r = RECTS[set] && RECTS[set][id]; if (!r) console.warn('rect?', set, id); return r; };
const C = r => [r[0] + r[2] / 2, r[1] + r[3] / 2];
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function font(w, s, fam = 'Rethink') { ctx.font = `${w} ${s}px ${fam}`; }
function plate(name, a = 1) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(IMG[name], 0, 0, 1440, 860); ctx.restore(); }
function region(name, r, a = 1, dx = 0, dy = 0) { if (a <= 0) return; const [x, y, w, h] = r; ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(IMG[name], x * 2, y * 2, w * 2, h * 2, x + dx, y + dy, w, h); ctx.restore(); }
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
  ctx.save(); ctx.globalAlpha *= v; ctx.strokeStyle = '#E9CD4F'; ctx.lineWidth = 3;
  const p = pad + (1 - g) * 6, m = 3; let x0 = r[0] - p, y0 = r[1] - p, x1 = r[0] + r[2] + p, y1 = r[1] + r[3] + p;
  x0 = Math.max(m, x0); y0 = Math.max(m, y0); x1 = Math.min(1440 - m, x1); y1 = Math.min(860 - m, y1);
  rr(x0, y0, x1 - x0, y1 - y0, Math.min(rad + p, (y1 - y0) / 2)); ctx.stroke(); ctx.restore();
}
// the yellow highlight sweep over a phrase the voice names (4.2: #F8E37C, multiply, left to right)
function sweep(t, a, lines, b = 1e9) {
  if (!lines || t < a || t > b + .4) return;
  const out = 1 - P(t, b, b + .4, E.io);
  ctx.save(); ctx.globalAlpha *= out; ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#F8E37C';
  lines.forEach(([x, y, w, h], i) => { const k = P(t, a + i * .6, a + i * .6 + .8, E.io); if (k > 0) { rr(x - 2, y - 1, (w + 4) * k, h + 2, 3); ctx.fill(); } });
  ctx.restore();
}
function caret(t, x, y, h = 18) { if (Math.floor(t * 2.2) % 2 === 0) { ctx.fillStyle = '#241E19'; ctx.fillRect(x + 1, y, 1.4, h); } }
// typing: the field shows the empty plate, then the real typed text of the full plate is revealed letter by letter
// (widths measured in Rethink Sans at the field's own size); lines: the plate's own line breaks
function typeIn(t, empty, full, rect, lines, sz, wt, t0, t1, { lh = rect[3], ox = 0, oy = 0, caretH = sz + 4 } = {}) {
  const [x, y, w, h] = rect;
  region(empty, rect);
  if (t < t0) return;
  const total = lines.join(' ').length; const n = Math.round(P(t, t0, t1, E.lin) * total); font(wt, sz);
  let used = 0, cx = x + ox, cy = y + oy;
  lines.forEach((ln, i) => {
    const part = ln.slice(0, Math.max(0, Math.min(ln.length, n - used))); const tw = ctx.measureText(part).width;
    const ly = y + oy + i * lh;
    if (part.length) { region(full, [x, ly, part.length === ln.length ? w : ox + tw + 2, lh]); cx = x + ox + tw + 1; cy = ly; }
    else if (n > used && ln.length === 0) { cx = x + ox; cy = ly; }
    used += ln.length + 1;
  });
  if (t < t1 + .3) caret(t, cx, cy + (lh - caretH) / 2, caretH);
}

// ------------------------------------------------------------------ camera
const POSE = { s: 1.08, cx: 960, cy: 503 };
function shot(name) {
  const full = [0, 0, 1440, 860];
  if (name === 'screen') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy, clip: full, r: 22, o: 1 };
  if (name === 'below') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy + 1100, clip: full, r: 22, o: 1 };
  if (name === 'panel') return { fx: 1183, fy: 520, s: 1.5, cx: 960, cy: 520, clip: full, r: 22, o: 1 };   // the schedule's fields (small text)
  if (name === 'list') return { fx: 1183, fy: 380, s: 1.45, cx: 960, cy: 520, clip: full, r: 22, o: 1 };   // the Triggers in + Add Node
  if (name === 'gone') return { ...shot('screen'), o: 0 };
}
// zooms start and end on still moments (5.1 lesson): the panel is open and nothing moves while the camera travels
const SHOTS = [[0, 'below', 0], [T.push, 'screen', .85],
  [26.15, 'panel', 1.2], [34.8, 'screen', 1.2],
  [VO.S19 - .5, 'list', 1.2], [T.exit - .05, 'list', 0],
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
  const o = {}; for (const key of ['fx', 'fy', 'cx', 'cy', 'r']) o[key] = L(prev[key], cur[key], k);
  o.s = Math.exp(L(Math.log(prev.s), Math.log(cur.s), k));
  // the exit fades from wherever the last shot is (no zoom-out): only the opacity changes
  if (SHOTS[i][1] === 'gone') { Object.assign(o, prev); o.o = 1 - k; } else o.o = L(prev.o, cur.o, k);
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

// ------------------------------------------------------------------ the workflow canvas
// World = React Flow's flow units (zoom 1). Screen = pane origin + view.px/py + world * view.z.
// Staging opens on the trigger at zoom 2 (same transform as 10.2 saw); the zoom-out button divides by 1.2 around the pane centre.
const PANE = [28, 138, 916, 694];
const NODE_W = 220;
const POS = { trig: [0, 0], run: [0, 150], doc: [0, 300] };
function zoomAbout(v, k) { const cx = PANE[2] / 2, cy = PANE[3] / 2; return { z: v.z * k, px: cx + (v.px - cx) * k, py: cy + (v.py - cy) * k }; }
const V0 = { z: 2, px: 447, py: 299 };
const VZ = [V0, zoomAbout(V0, 1 / 1.2), zoomAbout(zoomAbout(V0, 1 / 1.2), 1 / 1.2)];
const PAN1 = 175;            // the canvas dragged up before Run Prompt, so the three steps fit
function view(t) {
  let v = VZ[0];
  T.zo.forEach((tz, i) => { if (t >= tz) { const k = P(t, tz, tz + .22, E.out); v = { z: L(VZ[i].z, VZ[i + 1].z, k), px: L(VZ[i].px, VZ[i + 1].px, k), py: L(VZ[i].py, VZ[i + 1].py, k) }; } });
  return { ...v, py: v.py - PAN1 * E.io(cl((t - T.pan1[0]) / (T.pan1[1] - T.pan1[0]))) };
}
const w2s = (v, wx, wy) => [PANE[0] + v.px + wx * v.z, PANE[1] + v.py + wy * v.z];

// each step: sprite names (unconfigured, selected, configured), when it is added, dragged, joined, opened and saved
const STEPS = {
  trig: { un: 'nTrig', sel: 'nTrigSel', cfg: 'nTrig', add: T.choose, open: T.trigClick, save: T.trigSave },
  run: { un: 'nRun0', sel: 'nRun0Sel', cfg: 'nRun', add: T.rpAdd, drag: T.rpDrag, join: T.rpJoin, open: T.rpClick, save: T.rpSave, from: 'trig' },
  doc: { un: 'nDoc0', sel: 'nDoc0Sel', cfg: 'nDoc', add: T.cdAdd, drag: T.cdDrag, join: T.cdJoin, open: T.cdClick, save: T.cdSave, from: 'run' },
};
// staging drops a new step over the one before it, a little down and to the right (rp_added: +34, +27.5 from the trigger)
function landing(id) { const prev = { run: 'trig', doc: 'run' }[id]; return [POS[prev][0] + 34, POS[prev][1] + 28]; }
function nodePos(id, t) {
  const s = STEPS[id]; if (!s.drag) return POS[id];
  const a = landing(id), k = E.io(cl((t - s.drag[0]) / (s.drag[1] - s.drag[0])));
  return [L(a[0], POS[id][0], k), L(a[1], POS[id][1], k)];
}
function spriteOf(id, t) { const s = STEPS[id]; if (t >= s.save) return s.cfg; if (t >= s.open) return s.sel; return s.un; }
const NM = n => RECTS.nodes[n];
function handle(sprite, which) {   // handle centre relative to the node's top-left (zoom 1)
  const hs = NM(sprite).handles;
  if (which === 'in') return hs.find(h => h[0] === 'top') ? hs.find(h => h[0] === 'top').slice(2) : [NODE_W / 2, 0];
  const bottoms = hs.filter(h => h[0] === 'bottom').sort((a, b) => a[2] - b[2]);
  if (which === 'approved') return bottoms[0].slice(2);
  return bottoms[bottoms.length - 1].slice(2);
}
function drawNode(v, sprite, wx, wy, a = 1, sc = 1) {
  if (a <= 0) return; const n = NM(sprite), img = IMG[sprite], z = v.z * sc;
  const [sx, sy] = w2s(v, wx, wy); const [cx, cy, cw, ch] = n.card;
  ctx.save(); ctx.globalAlpha *= a;
  // the card's own shadow (captured without it, known-issues #1), measured: 0 1px 2px .06, 0 12px 32px -12px .18; selected: 0 4px 6px -1px .1 + 2px ring .15
  const sel = /Sel$/.test(sprite);
  ctx.save(); ctx.fillStyle = '#FFFFFF';
  if (sel) { ctx.shadowColor = 'rgba(0,0,0,.10)'; ctx.shadowBlur = 6 * z; ctx.shadowOffsetY = 4 * z; rr(sx + (cx + 1) * z, sy + (cy + 1) * z, (cw - 2) * z, (ch - 2) * z, 16 * z); ctx.fill(); }
  else { ctx.shadowColor = 'rgba(35,30,25,.18)'; ctx.shadowBlur = 32 * z; ctx.shadowOffsetY = 12 * z; rr(sx + (cx + 12) * z, sy + (cy + 12) * z, (cw - 24) * z, (ch - 24) * z, 12 * z); ctx.fill();
    ctx.shadowColor = 'rgba(35,30,25,.06)'; ctx.shadowBlur = 2 * z; ctx.shadowOffsetY = 1 * z; rr(sx + cx * z, sy + cy * z, cw * z, ch * z, 16 * z); ctx.fill(); }
  ctx.restore();
  if (sel) { ctx.save(); ctx.strokeStyle = 'rgba(36,30,25,.15)'; ctx.lineWidth = 2 * z; rr(sx + (cx - 1) * z, sy + (cy - 1) * z, (cw + 2) * z, (ch + 2) * z, 17 * z); ctx.stroke(); ctx.restore(); }
  const [ox, oy] = n.origin;
  ctx.drawImage(img, sx + ox * z, sy + oy * z, img.width / 3 * z, img.height / 3 * z);
  ctx.restore();
}
// React Flow smoothstep edge (radius 8), stroke rgba(36,30,25,.2) 2px in flow units
function edgePath(v, a, b) {
  const [ax, ay] = w2s(v, ...a), [bx, by] = w2s(v, ...b);
  ctx.beginPath(); ctx.moveTo(ax, ay);
  if (Math.abs(ax - bx) < 1) { ctx.lineTo(bx, by); return [(ax + bx) / 2, (ay + by) / 2]; }
  const my = (ay + by) / 2, r = Math.min(8 * v.z, Math.abs(bx - ax) / 2, Math.abs(my - ay)), dir = Math.sign(bx - ax);
  ctx.lineTo(ax, my - r); ctx.quadraticCurveTo(ax, my, ax + dir * r, my); ctx.lineTo(bx - dir * r, my); ctx.quadraticCurveTo(bx, my, bx, my + r); ctx.lineTo(bx, by);
  return [(ax + bx) / 2, my];
}
function strokeEdge(v) { ctx.strokeStyle = 'rgba(36,30,25,.2)'; ctx.lineWidth = 2 * v.z; ctx.lineCap = 'round'; ctx.stroke(); }
function drawCanvas(t, { selOff = false } = {}) {
  const v = view(t), p = PANE;
  ctx.save(); ctx.beginPath(); ctx.rect(...p); ctx.clip();
  ctx.fillStyle = 'rgb(242,239,233)'; ctx.fillRect(...p);
  // dots: React Flow background, gap 20, size 1 (scaled with the zoom), measured colour #AAA9AD (10.2)
  const gap = 20 * v.z, r = Math.max(.55, v.z / 2); ctx.fillStyle = '#AAA9AD';
  const ox = ((v.px % gap) + gap) % gap, oy = ((v.py % gap) + gap) % gap;
  for (let x = p[0] + ox; x < p[0] + p[2]; x += gap) for (let y = p[1] + oy; y < p[1] + p[3]; y += gap) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  const order = ['trig', 'run', 'doc'].filter(id => t >= STEPS[id].add);
  // edges (joined) and the line that follows the cursor while joining
  for (const id of order) {
    const s = STEPS[id]; if (!s.join) continue;
    const fs = spriteOf(s.from, t), fp = nodePos(s.from, t), h = handle(fs, 'out');
    const a = [fp[0] + h[0], fp[1] + h[1]];
    if (t >= s.join[1]) { const ts = spriteOf(id, t), tp = nodePos(id, t), th = handle(ts, 'in'); edgePath(v, a, [tp[0] + th[0], tp[1] + th[1]]); strokeEdge(v); }
    else if (t >= s.join[0]) { const cur = cursorAt(t); if (cur) { const [ax, ay] = w2s(v, ...a); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(cur.app[0], cur.app[1]); strokeEdge(v); } }
  }
  for (const id of order) {
    const s = STEPS[id], [wx, wy] = nodePos(id, t), a = P(t, s.add, s.add + .25), sc = .94 + .06 * P(t, s.add, s.add + .3, E.out);
    let spr = spriteOf(id, t); if (selOff && /Sel$/.test(spr)) spr = s.un;
    drawNode(v, spr, wx, wy, a, sc);
  }
  ctx.restore();
  // the pane's own buttons stay on top of the nodes
  region('lTop', [36, 146, 196, 36]); region('lTop', [36, 720, 38, 72 + 34]);
}
// the publish explainer: staging's scrim (rgba(36,30,25,.78), measured) with the dialog sprite and its own shadow on top
const DLG = [440, 134.3, 560, 591.4];
const TROWS = [[969, 230.5, 429, 52.6], [969, 289.1, 429, 52.6], [969, 406.4, 429, 52.6], [969, 465, 429, 52.6]];   // Email received, Manual Trigger, Deadline Approaching, Assignment Updated
function explainer(t, name, t0, from, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgba(36,30,25,.78)'; ctx.fillRect(0, 0, 1440, 860);
  ctx.shadowColor = 'rgba(0,0,0,.10)'; ctx.shadowBlur = 15; ctx.shadowOffsetY = 10; ctx.fillStyle = '#F2EFE9'; rr(DLG[0] + 2, DLG[1] + 2, DLG[2] - 4, DLG[3] - 4, 16); ctx.fill();
  ctx.shadowColor = 'transparent'; rr(...DLG, 16); ctx.clip(); seq(name, t, t0, from); ctx.restore();
}

// ------------------------------------------------------------------ the app, beat by beat
function panelFor(t) {
  if (t < T.trigClick + .02) return 'lTop';
  if (t < T.ddOpen + .02) return 'sCfg';
  if (t < 27.95) return 'sDD';
  if (t < T.ddPick + .02) return 'sDDH';
  if (t < T.trigSave + .02) return 'sWeek';
  if (t < T.rpClick + .02) return 'lTop';
  if (t < T.rpType[0]) return 'rCfgP';
  if (t < T.rpSave + .02) return 'rType';
  if (t < T.cdClick + .02) return 'lTop';
  if (t < T.cdType[0]) return 'dCfgP';
  if (t < T.cdSave + .02) return 'dType';
  return 'lTop';
}
function drawApp(t) {
  // 1 · Explore → Workflows → New Workflow
  if (t < T.explore + .02) { plate('aMat'); return; }
  if (t < T.wfItem + .02) { plate('aMat'); plate('aExp', P(t, T.explore + .02, T.explore + .18)); return; }
  if (t < T.newWf + .02) { if (t < T.wfItem + .65) { push(t, T.wfItem + .02, 'aExp', 'wEmpty'); return; } plate('wEmpty'); return; }
  if (t < T.choose + .02) {
    if (t < T.newWf + .65) { push(t, T.newWf + .02, 'wEmpty', 'bChoose'); return; }
    plate('bChoose');
    // the four ways the voice names, then the one picked
    ring(t, 16.75, 18.3, R('bChoose', 't:When an email arrives'), 6, 4); ring(t, 18.25, 19.25, R('bChoose', 't:When I click Run'), 6, 4);
    ring(t, 19.2, 20.5, R('bChoose', 't:On a schedule'), 6, 4); ring(t, 20.45, 21.7, R('bChoose', 't:Before a deadline'), 6, 4);
    ring(t, 23.3, 24.25, R('bChoose', 't:On a schedule'), 6, 4);
    return;
  }
  // 2–5 · building, panel on the right
  if (t < T.titleC + .02) {
    if (t < T.choose + .3) { plate('bChoose', 1); plate('lTop', P(t, T.choose + .02, T.choose + .3, E.io)); drawCanvas(t); toast(t, 'toastTR', T.choose + .05); return; }
    const pl = panelFor(t);
    if (pl === 'sDD' && t < T.ddOpen + .16) xf('sCfg', 'sDD', t, T.ddOpen + .02, .12); else plate(pl);
    drawCanvas(t);
    if (pl === 'rType' && t < T.rpType[1] + .4) typeIn(t, 'rType0', 'rType', [969, 465, 429, 50], TXT.rp, 12, 400, T.rpType[0], T.rpType[1], { lh: 18.6, ox: 10, oy: 10, caretH: 15 });
    if (pl === 'dType' && t < T.cdType[1] + .4) typeIn(t, 'dType0', 'dType', [969, 465, 429, 50], TXT.cd, 12, 400, T.cdType[0], T.cdType[1], { lh: 18.6, ox: 10, oy: 10, caretH: 15 });
    toast(t, 'toastTR', T.choose + .05); toast(t, 'toastRA', T.rpAdd + .05); toast(t, 'toastCD', T.cdAdd + .05);
    // rings and highlights, timed to the voice
    ring(t, 29.25, 31.2, R('sWeek', 'Monday'), 8, 3);
    ring(t, 29.95, 31.2, [969, 558.5, 171, 36], 8, 3);   // 09 : 00
    if (t > T.ddPick) sweep(t, 32.85, R('sWeek', 'phrase:It has access to all'), 34.6);
    return;
  }
  // 6 · name it, publish
  if (t < T.publish + .02) {
    if (t < T.title[0]) { plate('tEdit'); drawCanvas(t, { selOff: true }); return; }
    plate('tTyped'); drawCanvas(t, { selOff: true });
    typeIn(t, 'tEdit0', 'tTyped', [128, 97, 260, 28], TXT.title, 13.5, 600, T.title[0], T.title[1], { lh: 28, ox: 8, caretH: 17 });
    return;
  }
  if (t < T.gotIt + .02) {
    plate('tSaved'); drawCanvas(t, { selOff: true });
    if (t < T.next + .02) { explainer(t, 'pub1', T.publish + .02 - .3, 3, P(t, T.publish + .02, T.publish + .3, E.io));
      sweep(t, 62.9, [[540.6, 557.8, 358.8, 21], [689, 579, 62, 21]], 65.6); return; }
    explainer(t, 'pub1', T.publish + .02, 0); const k = P(t, T.next + .02, T.next + .3, E.io);
    if (k > 0) { ctx.save(); ctx.globalAlpha *= k; rr(...DLG, 16); ctx.clip(); seq('pub2', t, T.next + .02 - .5, 5); ctx.restore(); }
    return;
  }
  // 7 · switch it on in the matter
  if (t < T.matters + .02) { plate('tSaved'); drawCanvas(t, { selOff: true }); explainer(t, 'pub2', T.next + .02, 0, 1 - P(t, T.gotIt + .02, T.gotIt + .22, E.io)); return; }
  const builderDone = () => { plate('tSaved'); drawCanvas(T.gotIt, { selOff: true }); };
  if (t < T.wfIcon + .02) { if (t < T.matters + .65) { push(t, T.matters + .02, builderDone, 'aMat'); return; } plate('aMat'); return; }
  if (t < T.activate + .02) { if (t < T.wfIcon + .65) { push(t, T.wfIcon + .02, 'aMat', 'mList'); return; } plate('mList'); return; }
  if (t < T.menu + .02) { plate('mActive'); toast(t, 'toastAct', T.activate + .05);
    ring(t, 73.2, 74.4, R('mActive', 't:Active · v1 · Scheduled · 3 nodes') && [169, 296.6, 196, 16.3], 6, 4); return; }
  if (t < T.execs + .02) { plate('mMenu'); toast(t, 'toastAct', T.activate + .05); return; }
  if (t < T.editTpl + .02) { plate('mExec'); return; }
  // 8 · the other triggers, in the builder's + Add Node
  if (t < T.addNode + .02) { if (t < T.editTpl + .65) { push(t, T.editTpl + .02, 'mExec', 'eEdit'); return; } plate('eEdit'); return; }
  plate('eList');
  // the row under the cursor gets staging's hover tint (a light grey behind the row, as seen on the step list)
  const cu = cursorAt(t); if (cu && Array.isArray(cu.app)) for (const r of TROWS) if (cu.app[0] >= r[0] && cu.app[0] <= r[0] + r[2] && cu.app[1] >= r[1] && cu.app[1] <= r[1] + r[3]) {
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#F2F0EC'; rr(...r, 8); ctx.fill(); ctx.restore(); }
  // rings hug the label text (the captured leaf box spans the whole row)
  const Lr = k => { const r = R('eList', k); if (!r || !k.startsWith('t:')) return r; font(500, 13); return [r[0], r[1], ctx.measureText(k.slice(2)).width + 2, r[3]]; };
  ring(t, VO.S19 - .05, VO.S19 + 2.2, Lr('t:Deadline Approaching'), 6, 4); sweep(t, VO.S19 + .5, Lr('phrase:Fires on a specific '), VO.S20 - .6);
  ring(t, VO.S20 - .05, VO.S20 + 2.2, Lr('t:Assignment Updated'), 6, 4); sweep(t, VO.S20 + .5, Lr('phrase:Fires when an assign'), VO.S21 - .6);
  ring(t, VO.S21 - .05, VO.S21 + 1.6, Lr('t:Manual Trigger'), 6, 4); sweep(t, VO.S21 + .5, Lr('phrase:Started by clicking '), VO.S22 - .3);
  ring(t, VO.S22 - .05, T.exit - .1, Lr('t:Email received'), 6, 4);
}

// ------------------------------------------------------------------ cursor
// targets in app px; ['node', id, dx, dy] follows a node; ['handle', id, which] a node's handle; ['world', x, y]
function cursorPath() {
  const g = (n, k) => C(R(n, k));
  const at = (n, k, dx = 0, dy = 0) => { const r = R(n, k); return [r[0] + r[2] / 2 + dx, r[1] + r[3] / 2 + dy]; };
  return [
    [7.9, 7.91, 'enter'], [8.6, 9.2, g('aMat', 't:Explore')],
    [9.7, 10.4, at('aExp', 't:Workflows', -60)], [11.3, 12.0, g('wEmpty', 'New Workflow')],
    [12.8, 13.5, [760, 280]], [22.6, 23.4, at('bChoose', 't:On a schedule', -40)], [23.4, 24.1, at('bChoose', 't:On a schedule', -40)],
    [25.1, 25.85, ['node', 'trig', 0, 40]],
    [26.3, 27.35, g('sCfg', 'Every day')], [27.6, 28.2, at('sDD', 't:Every week', -10)],
    [28.6, 29.2, [1220, 700]],
    [35.6, 36.35, g('sWeek', 'Save Draft#2')], [36.5, 36.85, g('lTop', 'Zoom out')],
    [37.3, 37.5, ['world', 300, 120]], [37.55, 38.25, ['worldpan', 300, 120]],
    [38.5, 39.2, at('lTop', 't:Run Prompt', -40)],
    [39.5, 40.0, ['node', 'run', 0, 22]], [40.1, 41.0, ['node', 'run', 0, 22]],
    [41.05, 41.4, ['handle', 'trig', 'out']], [41.45, 42.1, ['handle', 'run', 'in']],
    [42.25, 42.6, ['node', 'run', 0, 40]], [43.0, 43.4, [1180, 520]], [48.0, 48.6, [1250, 700]], [49.0, 49.5, g('rType', 'Save Draft#2')],
    [49.75, 50.35, at('lTop', 't:Create Document', -40)],
    [50.6, 50.95, ['node', 'doc', 0, 22]], [51.0, 51.8, ['node', 'doc', 0, 22]],
    [51.85, 51.97, ['handle', 'run', 'out']], [52.0, 52.6, ['handle', 'doc', 'in']],
    [52.8, 53.2, ['node', 'doc', 0, 40]], [53.5, 53.9, [1180, 520]], [58.1, 58.6, g('dType', 'Save Draft#2')],
    [58.8, 59.2, g('tEdit', 't:Untitled Workflow')], [60.3, 60.75, g('tEdit', 't:Publish')],
    [65.3, 65.9, g('pub1', 'Next')], [66.8, 67.25, g('pub2', 'Got it')],
    [67.5, 68.0, g('tSaved', 'Matters')], [68.6, 69.2, g('aMat', 'Workflows')],
    [69.8, 70.4, g('mList', 'Activate#2')], [71.2, 71.9, [980, 470]],
    [73.6, 74.3, [1360, 296]], [75.0, 75.65, g('mMenu', 'Executions')],
    [76.3, 76.9, [1180, 300]], [77.4, 78.1, g('mExec', 'Edit template')],
    [78.8, 79.5, g('eEdit', '+ Add Node')], [79.9, 80.7, [1340, 422]],
    [VO.S20 - .7, VO.S20 + .1, [1340, 481]], [VO.S21 - .7, VO.S21 + .1, [1340, 305]], [VO.S22 - .6, VO.S22 + .1, [1340, 246]],
    [100.6, 101.5, 'exit'],
  ];
}
const CLICKS = [T.explore, T.wfItem, T.newWf, T.choose, T.trigClick, T.ddOpen, T.ddPick, T.trigSave, ...T.zo, T.rpAdd, T.rpClick, T.rpTA, T.rpSave,
  T.cdAdd, T.cdClick, T.cdTA, T.cdSave, T.titleC, T.publish, T.next, T.gotIt, T.matters, T.wfIcon, T.activate, T.menu, T.execs, T.editTpl, T.addNode];
const DRAGS = [T.pan1, T.rpDrag, T.rpJoin, T.cdDrag, T.cdJoin].map(([a, b]) => [a - .06, b + .04]);
const CURSOR_ON = [[7.9, 101.5]];
function resolveTarget(tg, t) {
  if (tg === 'enter') return 'S:' + [1980, 1140];
  if (tg === 'exit') return 'S:' + [2000, 1150];
  if (!Array.isArray(tg) || typeof tg[0] === 'number') return tg;
  const v = view(t);
  if (tg[0] === 'node') { const s = spriteOf(tg[1], t), n = NM(s), p = nodePos(tg[1], t); return w2s(v, p[0] + n.card[2] / 2 + tg[2], p[1] + tg[3]); }
  if (tg[0] === 'handle') { const s = spriteOf(tg[1], t), p = nodePos(tg[1], t), h = handle(s, tg[2]); return w2s(v, p[0] + h[0], p[1] + h[1]); }
  if (tg[0] === 'world' || tg[0] === 'worldpan') return w2s(v, tg[1], tg[2]);
}
// the cursor, in app px (app) and on screen (scr)
function cursorAt(t) {
  if (!CURSOR_ON.some(([a, b]) => t >= a && t < b)) return null;
  const path = cursorPath(); let pos = null;
  for (const [a, b, tg] of path) {
    let p = resolveTarget(tg, Math.min(t, b));
    // a canvas pan drag keeps the cursor on the same world point while the view moves (so it travels with the canvas)
    if (Array.isArray(tg) && tg[0] === 'worldpan') { const s0 = w2s(view(a), tg[1], tg[2]), s1 = w2s(view(b), tg[1], tg[2]); const k = E.io(cl((t - a) / (b - a))); p = t >= b ? s1 : [s0[0], L(s0[1], s1[1], k)]; }
    if (!pos) pos = p;
    if (t >= b) { pos = p; continue; }
    if (t > a) { if (Array.isArray(tg) && (tg[0] === 'node' && DRAGS.some(([d0, d1]) => a >= d0 - .01 && b <= d1 + .01))) { pos = p; } else { const k = E.io((t - a) / (b - a)); pos = typeof pos === 'string' || typeof p === 'string' ? p : [L(pos[0], p[0], k), L(pos[1], p[1], k)]; } }
    break;
  }
  return { app: pos };
}
function toast(t, name, t0) {
  const k = P(t, t0, t0 + .35, E.out) * (1 - P(t, t0 + 3.0, t0 + 3.35, E.io)); if (k <= 0) return;
  const [x, y, w, h] = RECTS[name].r, dy = (1 - k) * 16;
  ctx.save(); ctx.globalAlpha *= k; ctx.shadowColor = 'rgba(0,0,0,.10)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4; ctx.fillStyle = '#FFFFFF'; rr(x + 1.5, y + 1.5 + dy, w - 3, h - 3, 12); ctx.fill(); ctx.restore();
  ctx.save(); ctx.globalAlpha *= k; ctx.drawImage(IMG[name], x, y + dy, w, h); ctx.restore();
}
// a panel body scrolls by d px: the two captures are one long strip (b is a scrolled d further), moved as one
function scrollStrip(t, t0, a, b, d, clip) {
  const k = P(t, t0, t0 + .6, E.io), [x, y, w, h] = clip;
  plate(a); ctx.save(); ctx.beginPath(); ctx.rect(...clip); ctx.clip();
  region(a, clip, 1, 0, -k * d);
  const edge = y + h - k * d; ctx.beginPath(); ctx.rect(x, edge, w, y + h - edge); ctx.clip();
  region(b, clip, 1, 0, (1 - k) * d);
  ctx.restore();
}
function seq(name, t, t0, from = 0) { const f = Math.min(SEQ[name] - 1, from + Math.max(0, Math.floor((t - t0) * 10))); plate(`${name}_${String(f).padStart(2, '0')}`); }

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

// ------------------------------------------------------------------ caption pill, title, end card (as 1.1, 1.2, 8.1)
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
const TITLE = { tag: 'ANDRI ACADEMY · 10.1', l1: 'Your weekly memo,', l2: 'and other ways to start a workflow.' };
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
const NEXT = 'Andri Academy · Next: Workflows: answer incoming emails automatically';
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

async function renderFrame(t) {
  if (!READY) READY = load();
  await READY;
  globalT = t;
  ctx = MAIN; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.textAlign = 'left';
  background(t);
  const cam = camera(t);
  if (cam.o > 0 && t > T.push - .1) {
    // the window (shadow, frame, app) is drawn on OFF and composited once, so a fade never shows stacked layers through
    const fading = cam.o < 1, g = fading ? octx : MAIN;
    if (fading) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.globalAlpha = 1; }
    ctx = g;
    const [x, y, w, h] = cam.clip; const [sx, sy] = toScreen(cam, x, y); const sw = w * cam.s, sh = h * cam.s;
    ctx.save();
    ctx.shadowColor = 'rgba(35,30,25,.16)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 26; ctx.fillStyle = '#F2EFE9'; rr(sx, sy, sw, sh, cam.r); ctx.fill();
    ctx.shadowColor = 'rgba(35,30,25,.22)'; ctx.shadowBlur = 1; ctx.shadowOffsetY = 0; ctx.fill(); ctx.shadowColor = 'transparent';
    rr(sx, sy, sw, sh, cam.r); ctx.clip();
    ctx.translate(cam.cx - cam.fx * cam.s, cam.cy - cam.fy * cam.s); ctx.scale(cam.s, cam.s);
    drawApp(t);
    ctx.restore();
    ctx = MAIN;
    if (fading) { ctx.save(); ctx.globalAlpha = cam.o; ctx.drawImage(OFF, 0, 0); ctx.restore(); }
  }
  endCard(t);
  title(t);
  caption(t);
  if (cam.o > .02 || t < T.exit) cursor(t, cam);
}

window.MG = { width: W, height: H, fps: FPS, duration: DURATION, renderFrame };
if (!navigator.webdriver) { const t0 = performance.now(); (function loop() { renderFrame(((performance.now() - t0) / 1000) % DURATION).then(() => requestAnimationFrame(loop)); })(); }
