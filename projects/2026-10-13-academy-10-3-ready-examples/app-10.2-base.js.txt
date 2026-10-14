// Andri Academy 10.2 · Workflows: answer incoming emails automatically
// Everything is drawn on one <canvas> by renderFrame(t), a pure function of time t (seconds).
// App screens are plates of real Andri staging snapshots (plates/*.png, 2x, built by plates/capture.mjs). The workflow canvas
// (dots, nodes, edges, the Approved label) is drawn here from node sprites captured from the same snapshots, so steps can be
// added, dragged and joined as in staging. Engine, camera, captions, cursor, mascot, title and end card follow 1.1, 1.2 and 8.1.

const W = 1920, H = 1080, FPS = 60;
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

// ------------------------------------------------------------------ timeline (video seconds)
// Narration: one ElevenLabs take, placed sentence by sentence (audio/sentences.json, audio/mix.sh reads VO from here).
const VO = { S01: 0.6, S02: 6.0, S03: 9.6, S04: 14.0, S05: 16.2, S06: 18.9, S07: 29.0, S08: 30.8, S09: 33.4, S10: 36.6, S11: 38.8, S12: 42.9,
  S13: 46.3, S14: 52.3, S15: 57.9, S16: 59.9, S17: 64.6, S18: 71.1, S19: 72.9, S20: 76.0, S21: 83.4, S22: 86.5, S23: 88.6,
  S24: 90.6, S25: 95.5, S26: 98.9, S27: 104.8, S28: 108.6 };
const T = {
  push: 8.8,
  explore: 10.05, wfItem: 11.1, newWf: 12.8,
  choose: 17.6, trigClick: 18.8, inboxDD: 22.15, inboxPick: 24.45, trigSave: 28.5,
  zo: [29.4, 29.75, 30.1], pan1: [30.35, 31.05], raAdd: 32.6,
  raDrag: [33.5, 34.45], raJoin: [35.1, 35.8],
  raClick: 36.75, raDD: 37.75, raPick: 39.6, raSave: 45.7,
  cdAdd: 46.95, cdDrag: [47.9, 48.95], cdJoin: [49.55, 50.25], cdClick: 50.95, cdTA: 51.4, cdType: [51.55, 53.95], tplDD: 54.65, tplPick: 55.5, cdSave: 56.7,
  listScroll: 57.2, pan2: [58.45, 59.35], paAdd: 60.6, paDrag: [61.55, 62.6], paJoin: [63.25, 63.95],
  paClick: 64.55, whoDD: 65.25, whoPick: 65.95, apprDD: 66.55, apprPick: 67.15, paTA: 67.7, paType: [67.85, 69.5], paSave: 70.3,
  seAdd: 71.7, seDrag: [72.5, 73.45], seJoin: [73.95, 74.65],
  seClick: 75.35, outlook: 76.1, toDD: 76.85, toPick: 77.5, seScroll: 77.65, subjC: 78.35, subj: [78.45, 78.95], bodyC: 79.2, body: [79.3, 80.9],
  attDD: 81.25, attPick: 81.85, seSave: 82.5,
  close: 83.1, titleC: 83.75, title: [83.95, 84.75], publish: 85.4, next: 90.0, gotIt: 91.3,
  matters: 91.95, wfIcon: 93.25, activate: 94.7, sender: 95.75, valC: 96.35, val: [96.5, 97.6],
  dlgScroll: 98.4, exit: 107.0,
};
const END = 108.1, DURATION = 116.6;
const CAP = [[VO.S03, 1, 'A new workflow'], [VO.S06, 2, 'The trigger'], [VO.S07, 3, 'Check it'], [VO.S13, 4, 'Write the memo'], [VO.S15, 5, 'Approve it'],
  [VO.S18, 6, 'Reply'], [VO.S21, 7, 'Publish'], [VO.S24, 8, 'Switch it on']];
const CAP_END = T.exit + .1;
const TXT = {
  cd: ['Write a short memo for the client on the document she sent: what it is,', 'how it affects her claim for compensation, and what happens next.'],
  pa: ['Please check the memo before Andri replies to the client.'],
  subj: ['Re: your new document'],
  body: ['Dear Ms Nair,', '', 'Thank you for sending this. Our short memo on what it means for your', 'claim is attached.', '', 'Kind regards,', 'Adam Frith'],
  title: ['Check and reply to client documents'], val: ['priya.nair@outlook.com'],
};

// ------------------------------------------------------------------ assets
const PLATES = ['aMat', 'aExp', 'wEmpty', 'bChoose', 'bChooseH', 'lTop', 'lHovRA', 'lMid', 'lHovPA', 'lHovSE', 'tCfg', 'tInbox', 'rCfg', 'rDD', 'rPick',
  'dTypeP', 'dType0', 'dType', 'dTplDD', 'dTpl', 'pCfg', 'pWhoDD', 'pWho', 'pApprDD', 'pAppr', 'pAppr0', 'pTyped',
  'sCfg', 'sOut', 'sToDD', 'sTo', 'sMidP', 'sMid0', 'sMid1', 'sAttDD', 'sAtt', 'sDone', 'sNoPanel', 'tEdit', 'tEdit0', 'tTyped',
  'pFull', 'mList', 'mListH', 'mCfg0', 'mCfg0H', 'mCfg1', 'mCfg2_0', 'mCfg2', 'mCfg3',
  'nTrig', 'nTrigSel', 'nRun0', 'nRun0Sel', 'nRun', 'nDoc0', 'nDoc0Sel', 'nDoc', 'nPa0', 'nPa0Sel', 'nPa', 'nSe0', 'nSe0Sel', 'nSe',
  'lblApproved', 'toastTR', 'toastRA', 'toastCD', 'toastPA', 'toastSE'];
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
  if (name === 'panel') return { fx: 1150, fy: 420, s: 1.55, cx: 960, cy: 500, clip: full, r: 22, o: 1 };   // the trigger's settings: the matter-inbox note and Inbox source
  if (name === 'dlg') return { fx: 720, fy: 590, s: 1.55, cx: 960, cy: 500, clip: full, r: 22, o: 1 };     // the Activate dialog's Send from rows
  if (name === 'gone') return { ...shot('screen'), o: 0 };
}
const SHOTS = [[0, 'below', 0], [T.push, 'screen', .85],
  [19.4, 'panel', 1.2], [26.95, 'screen', 1.2],
  [98.95, 'dlg', 1.2], [104.2, 'screen', 1.2],
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

// ------------------------------------------------------------------ the workflow canvas
// World = React Flow's flow units (zoom 1). Screen = pane origin + view.px/py + world * view.z.
// Staging opens on one node at zoom 2; the zoom-out button divides by 1.2 around the pane centre.
const PANE = [28, 138, 916, 694], PANE_FULL = [28, 138, 1384, 694];
const NODE_W = 220;
const POS = { trig: [0, 0], run: [0, 150], doc: [0, 300], pa: [0, 450], se: [0, 662] };
// where a new step lands (near the middle of the view, over the others, as in staging), relative to the view centre
const LAND = [-76, -20];
function zoomAbout(v, k) { const cx = PANE[2] / 2, cy = PANE[3] / 2; return { z: v.z * k, px: cx + (v.px - cx) * k, py: cy + (v.py - cy) * k }; }
const V0 = { z: 2, px: 447, py: 299 };
const VZ = [V0, zoomAbout(V0, 1 / 1.2), zoomAbout(zoomAbout(V0, 1 / 1.2), 1 / 1.2), zoomAbout(zoomAbout(zoomAbout(V0, 1 / 1.2), 1 / 1.2), 1 / 1.2)];
const PAN1 = 255, PAN2 = 330;            // canvas dragged up before Run Action, and again before Pause / Approval
function fitView() {   // React Flow fitView (padding .1) on the whole flow, panel closed
  const x0 = -30, y0 = 0, x1 = NODE_W + 30, y1 = POS.se[1] + 112; const bw = x1 - x0, bh = y1 - y0, [, , pw, ph] = PANE_FULL;
  const z = Math.min(pw / (bw * 1.2), ph / (bh * 1.2), 2); return { z, px: pw / 2 - (x0 + bw / 2) * z, py: ph / 2 - (y0 + bh / 2) * z, full: true };
}
function view(t) {
  let v = VZ[0];
  T.zo.forEach((tz, i) => { if (t >= tz) { const k = P(t, tz, tz + .22, E.out); v = { z: L(VZ[i].z, VZ[i + 1].z, k), px: L(VZ[i].px, VZ[i + 1].px, k), py: L(VZ[i].py, VZ[i + 1].py, k) }; } });
  let py = v.py - PAN1 * E.io(cl((t - T.pan1[0]) / (T.pan1[1] - T.pan1[0]))) - PAN2 * E.io(cl((t - T.pan2[0]) / (T.pan2[1] - T.pan2[0])));
  v = { ...v, py };
  if (t >= T.close) { const f = fitView(), k = P(t, T.close + .05, T.close + .55, E.io); v = { z: L(v.z, f.z, k), px: L(v.px, f.px, k), py: L(v.py, f.py, k), full: true }; }
  return v;
}
const paneOf = v => v.full ? PANE_FULL : PANE;
const w2s = (v, wx, wy) => { const p = paneOf(v); return [p[0] + v.px + wx * v.z, p[1] + v.py + wy * v.z]; };
const s2w = (v, sx, sy) => { const p = paneOf(v); return [(sx - p[0] - v.px) / v.z, (sy - p[1] - v.py) / v.z]; };

// each step: sprite names (unconfigured, selected, configured), when it is added, dragged, joined, opened and saved
const STEPS = {
  trig: { un: 'nTrig', sel: 'nTrigSel', cfg: 'nTrig', add: T.choose, open: T.trigClick, save: T.trigSave },
  run: { un: 'nRun0', sel: 'nRun0Sel', cfg: 'nRun', add: T.raAdd, drag: T.raDrag, join: T.raJoin, open: T.raClick, save: T.raSave, from: 'trig' },
  doc: { un: 'nDoc0', sel: 'nDoc0Sel', cfg: 'nDoc', add: T.cdAdd, drag: T.cdDrag, join: T.cdJoin, open: T.cdClick, save: T.cdSave, from: 'run' },
  pa: { un: 'nPa0', sel: 'nPa0Sel', cfg: 'nPa', add: T.paAdd, drag: T.paDrag, join: T.paJoin, open: T.paClick, save: T.paSave, from: 'doc' },
  se: { un: 'nSe0', sel: 'nSe0Sel', cfg: 'nSe', add: T.seAdd, drag: T.seDrag, join: T.seJoin, open: T.seClick, save: T.seSave, from: 'pa', fromHandle: 'approved' },
};
// staging drops a new step over the one before it, a little down and to the right (b_ra_added: +34, +27.5 from the trigger)
function landing(id) { const prev = { run: 'trig', doc: 'run', pa: 'doc', se: 'pa' }[id]; return [POS[prev][0] + 34, POS[prev][1] + 28]; }
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
  const v = view(t), p = paneOf(v);
  ctx.save(); ctx.beginPath(); ctx.rect(...p); ctx.clip();
  ctx.fillStyle = 'rgb(242,239,233)'; ctx.fillRect(...p);
  // dots: React Flow background, gap 20, size 1 (scaled with the zoom), measured colour #AAA9AD
  const gap = 20 * v.z, r = Math.max(.55, v.z / 2); ctx.fillStyle = '#AAA9AD';
  const ox = ((v.px % gap) + gap) % gap, oy = ((v.py % gap) + gap) % gap;
  for (let x = p[0] + ox; x < p[0] + p[2]; x += gap) for (let y = p[1] + oy; y < p[1] + p[3]; y += gap) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  const order = ['trig', 'run', 'doc', 'pa', 'se'].filter(id => t >= STEPS[id].add);
  // edges (joined) and the line that follows the cursor while joining
  for (const id of order) {
    const s = STEPS[id]; if (!s.join) continue;
    const fromId = s.from, fs = spriteOf(fromId, t), fp = nodePos(fromId, t), h = handle(fs, s.fromHandle || 'out');
    const a = [fp[0] + h[0], fp[1] + h[1]];
    if (t >= s.join[1]) {
      const ts = spriteOf(id, t), tp = nodePos(id, t), th = handle(ts, 'in');
      const mid = edgePath(v, a, [tp[0] + th[0], tp[1] + th[1]]); strokeEdge(v);
      if (s.fromHandle === 'approved') { const lb = RECTS.lblApproved.r, lw = lb[2] / 2 * v.z, lh = lb[3] / 2 * v.z; ctx.drawImage(IMG.lblApproved, mid[0] - lw / 2 - v.z, mid[1] - lh / 2 - v.z, lw + 2 * v.z, lh + 2 * v.z); }
    } else if (t >= s.join[0]) {
      const cur = cursorAt(t); if (cur) { const [ax, ay] = w2s(v, ...a); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(cur.app[0], cur.app[1]); strokeEdge(v); }
    }
  }
  for (const id of order) {
    const s = STEPS[id], [wx, wy] = nodePos(id, t), a = P(t, s.add, s.add + .25), sc = .94 + .06 * P(t, s.add, s.add + .3, E.out);
    let spr = spriteOf(id, t); if (selOff && /Sel$/.test(spr)) spr = s.un;
    drawNode(v, spr, wx, wy, a, sc);
  }
  ctx.restore();
  // the pane's own buttons stay on top of the nodes
  const base = v.full ? 'sNoPanel' : 'lTop'; region(base, [36, 146, 196, 36]); region(base, [36, 720, 38, 72 + 34]);
}
// the step list and settings panel take the right side while building
function builder(t, panelPlate, { selOff } = {}) { plate(panelPlate); drawCanvas(t, { selOff }); }
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

// ------------------------------------------------------------------ the app, beat by beat
function panelFor(t) {
  // which right-hand panel plate shows while building (the canvas is drawn over the left)
  if (t < T.trigClick + .02) return 'lTop';
  if (t < T.inboxDD + .02) return 'tCfg';
  if (t < T.inboxPick + .02) return 'tInbox';
  if (t < T.trigSave + .02) return 'tCfg';
  if (t < 31.4) return 'lTop';
  if (t < T.raClick + .02) return 'lHovRA';
  if (t < T.raDD + .02) return 'rCfg';
  if (t < T.raPick + .02) return 'rDD';
  if (t < T.raSave + .02) return 'rPick';
  if (t < T.cdClick + .02) return 'lTop';
  if (t < T.cdType[0]) return 'dTypeP';
  if (t < T.tplDD + .02) return 'dType';
  if (t < T.tplPick + .02) return 'dTplDD';
  if (t < T.cdSave + .02) return 'dTpl';
  if (t < T.listScroll) return 'lTop';
  if (t < 59.95) return 'lMid';
  if (t < T.paClick + .02) return 'lHovPA';
  if (t < T.whoDD + .02) return 'pCfg';
  if (t < T.whoPick + .02) return 'pWhoDD';
  if (t < T.apprDD + .02) return 'pWho';
  if (t < T.apprPick + .02) return 'pApprDD';
  if (t < T.paType[0]) return 'pAppr';
  if (t < T.paSave + .02) return 'pTyped';
  if (t < 70.9) return 'lMid';
  if (t < T.seClick + .02) return 'lHovSE';
  if (t < T.outlook + .02) return 'sCfg';
  if (t < T.toDD + .02) return 'sOut';
  if (t < T.toPick + .02) return 'sToDD';
  if (t < T.seScroll) return 'sTo';
  if (t < T.subj[0]) return 'sMidP';
  if (t < T.attDD + .02) return 'sMid1';
  if (t < T.attPick + .02) return 'sAttDD';
  if (t < T.seSave + .02) return 'sAtt';
  return 'sDone';
}
const DROPS = { tInbox: T.inboxDD, rDD: T.raDD, dTplDD: T.tplDD, pWhoDD: T.whoDD, pApprDD: T.apprDD, sToDD: T.toDD, sAttDD: T.attDD };
const PANEL = [954, 138, 458, 694];
function drawApp(t) {
  // 1 · Explore → Workflows → New Workflow
  if (t < T.explore + .02) { plate('aMat'); return; }
  if (t < T.wfItem + .02) { plate('aMat'); plate('aExp', P(t, T.explore + .02, T.explore + .18)); return; }
  if (t < T.newWf + .02) { if (t < T.wfItem + .65) { push(t, T.wfItem + .02, 'aExp', 'wEmpty'); return; } plate('wEmpty'); return; }
  if (t < T.choose + .02) {
    if (t < T.newWf + .65) { push(t, T.newWf + .02, 'wEmpty', 'bChoose'); return; }
    plate(t < 16.7 ? 'bChoose' : 'bChooseH'); return;
  }
  // 2–6 · building, panel on the right
  if (t < T.close + .02) {
    if (t < T.choose + .3) { plate('bChooseH', 1); plate('lTop', P(t, T.choose + .02, T.choose + .3, E.io)); drawCanvas(t); return; }
    const pl = panelFor(t);
    // panel body scrolls (step list to Control Flow; Send Email settings to Subject) with a short blend, as the app scrolls
    if (t >= T.listScroll && t < T.listScroll + .6) { scrollStrip(t, T.listScroll, 'lTop', 'lMid', 607, [955, 184, 456, 647]); drawCanvas(t); return; }
    // the settings scroll 826 px down to Subject, longer than the panel is tall: a short slide with a blend
    if (t >= T.seScroll && t < T.subj[0]) { const k = P(t, T.seScroll, T.seScroll + .55, E.io), clip = [955, 190, 456, 580]; plate('sTo'); ctx.save(); ctx.beginPath(); ctx.rect(...clip); ctx.clip();
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(...clip); region('sTo', clip, 1 - k, 0, -k * 140); region('sMidP', clip, k, 0, (1 - k) * 140); ctx.restore(); drawCanvas(t); return; }
    const prev = Object.entries(DROPS).find(([n, t0]) => n === pl && t < t0 + .14);
    if (prev) { const base = { tInbox: 'tCfg', rDD: 'rCfg', dTplDD: 'dType', pWhoDD: 'pCfg', pApprDD: 'pWho', sToDD: 'sOut', sAttDD: 'sMid1' }[pl]; xf(base, pl, t, prev[1] + .02, .12); }
    else plate(pl);
    drawCanvas(t);
    // typing over the real fields
    if (pl === 'dType' && t < T.cdType[1] + .4) typeIn(t, 'dType0', 'dType', [970, 450, 427, 50], TXT.cd, 12, 400, T.cdType[0], T.cdType[1], { lh: 18.6, ox: 11, oy: 10, caretH: 15 });
    if (pl === 'pTyped' && t < T.paType[1] + .4) typeIn(t, 'pAppr0', 'pTyped', [970, 465, 427, 32], TXT.pa, 12, 400, T.paType[0], T.paType[1], { lh: 18.6, ox: 11, oy: 10, caretH: 15 });
    if (pl === 'sMid1' && t < T.body[1] + .4) {
      typeIn(t, 'sMid0', 'sMid1', [970, 250, 427, 34], TXT.subj, 12.5, 400, T.subj[0], T.subj[1], { lh: 34, ox: 12, caretH: 16 });
      if (t >= T.body[0] - .1) typeIn(t, 'sMid0', 'sMid1', [970, 367, 427, 126], TXT.body, 12, 400, T.body[0], T.body[1], { lh: 18.6, ox: 11, oy: 10 - BODY_SCROLL, caretH: 15 });
      else region('sMid0', [970, 367, 427, 126]);
    }
    // toasts for each step added
    toast(t, 'toastTR', T.choose + .05); toast(t, 'toastRA', T.raAdd + .05); toast(t, 'toastCD', T.cdAdd + .05); toast(t, 'toastPA', T.paAdd + .05); toast(t, 'toastSE', T.seAdd + .05);
    // rings and highlights, timed to the voice
    ring(t, 20.5, 22.1, R('tCfg', 't:This watches the matter inbox, not your personal email'), 6, 4);
    ring(t, 22.4, 23.2, R('tInbox', 't:Gmail'), 6, 4); ring(t, 23.2, 24.2, R('tInbox', 't:Outlook'), 6, 4);
    if (t > T.inboxPick && t < T.trigSave) sweep(t, 24.8, R('tCfg', 'phrase:subject, sender, bod'), 27.2);
    ring(t, 39.9, 42.3, R('rPick', 't:Text output') && [1000, 469, 380, 32], 10, 3);
    if (t > T.raPick) sweep(t, 43.0, R('rPick', 'phrase:If the trigger was a'), 45.4);
    ring(t, 55.6, 56.6, [970, 683, 427, 38], 10, 2);   // the memo template, once picked
    ring(t, 76.4, 77.3, R('sOut', 't:Outlook (Microsoft 365)') && [978, 494, 410, 27], 8, 2);
    return;
  }
  // 7 · close the panel, name it, publish
  if (t < T.publish + .02) {
    if (t < T.titleC + .02) { plate('sNoPanel'); drawCanvas(t, { selOff: true }); return; }
    if (t < T.title[0]) { plate('tEdit'); drawCanvas(t, { selOff: true }); return; }
    plate('tTyped'); drawCanvas(t, { selOff: true });
    typeIn(t, 'tEdit0', 'tTyped', [128, 97, 260, 28], TXT.title, 13.5, 600, T.title[0], T.title[1], { lh: 28, ox: 8, caretH: 17 });
    return;
  }
  // the explainer's own frames start on the list-and-preview page; the builder stays underneath while the scrim and dialog fade in
  if (t < T.next + .02) { const k = P(t, T.publish + .02, T.publish + .3, E.io); if (k < 1) { plate('tTyped'); drawCanvas(t, { selOff: true }); }
    ctx.save(); ctx.globalAlpha *= k; seq('pub1', t, T.publish + .02 - .3, 3); ctx.restore(); return; }
  if (t < T.gotIt + .02) { const k = P(t, T.next + .02, T.next + .3, E.io); seq('pub1', t, T.publish + .02, 0); ctx.save(); ctx.globalAlpha = k; seq('pub2', t, T.next + .02 - .5, 5); ctx.restore(); return; }
  // 8 · switch it on in the matter
  if (t < T.matters + .02) { xf('pub2_44', 'pFull', t, T.gotIt + .02, .2); return; }
  if (t < T.wfIcon + .02) { if (t < T.matters + .65) { push(t, T.matters + .02, 'pFull', 'aMat'); return; } plate('aMat'); return; }
  if (t < T.activate + .02) { if (t < T.wfIcon + .65) { push(t, T.wfIcon + .02, 'aMat', 'mList'); return; } plate(t < 94.3 ? 'mList' : 'mListH'); return; }
  if (t < T.sender + .02) { xf('mListH', 'mCfg0', t, T.activate + .02, .2); if (t > 95.3) plate('mCfg0H'); return; }
  if (t < T.val[0]) { plate('mCfg1'); return; }
  if (t < T.dlgScroll + .02) { plate('mCfg2'); typeIn(t, 'mCfg2_0', 'mCfg2', [473, 531, 494, 34], TXT.val, 14, 400, T.val[0], T.val[1], { lh: 34, ox: 13, caretH: 18 }); return; }
  if (t < T.dlgScroll + .5) { const d = R('mCfg2', 'dialog') || [441, 33, 558, 794]; const body = [d[0], d[1] + 72, d[2], d[3] - 72 - 86]; const k = P(t, T.dlgScroll, T.dlgScroll + .5, E.io);
    plate('mCfg2'); ctx.save(); ctx.beginPath(); ctx.rect(...body); ctx.clip(); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(...body); region('mCfg2', body, 1 - k, 0, -k * 160); region('mCfg3', body, k, 0, (1 - k) * 160); ctx.restore(); return; }
  plate('mCfg3');
  ring(t, 100.4, 102.0, R('mCfg3', 't:Not connected to this matter'), 6, 4);
  ring(t, 102.0, 104.0, R('mCfg3', 't:Connect and turn on sending'), 8, 3);
  ring(t, 105.2, 106.9, R('mCfg3', 'Activate#2'), 10, 3);
}
const BODY_SCROLL = 13.3;   // the body field in the capture is scrolled 13 px inside (its first line sits under the top edge)

// ------------------------------------------------------------------ cursor
// targets in app px; ['node', id, dx, dy] follows a node; ['handle', id, which] a node's handle; ['world', x, y]
function cursorPath() {
  const g = (n, k) => C(R(n, k));
  const at = (n, k, dx = 0, dy = 0) => { const r = R(n, k); return [r[0] + r[2] / 2 + dx, r[1] + r[3] / 2 + dy]; };
  return [
    [9.0, 9.01, 'enter'], [9.3, 9.9, g('aMat', 't:Explore')],
    [10.3, 10.9, at('aExp', 't:Workflows', -60)], [11.9, 12.6, g('wEmpty', 'New Workflow')],
    [13.9, 14.5, [760, 300]], [16.0, 16.7, at('bChoose', 't:When an email arrives', -100)],
    [18.1, 18.6, ['node', 'trig', 0, 30]], [21.6, 22.0, at('tCfg', 'Andri inbox The matter inbox for the matter this workflow is', -60)],
    [23.9, 24.3, at('tInbox', 'Andri inbox The matter inbox for the matter this workflow is#2', -80)],
    [27.6, 28.3, g('tCfg', 't:Save Draft')], [28.7, 29.2, g('lTop', 'Zoom out')],
    [29.9, 30.3, ['world', 300, -60]], [30.35, 31.05, ['worldpan', 300, -60]],
    [31.3, 31.9, at('lTop', 't:Run Action', -40)],
    [32.9, 33.4, ['node', 'run', 0, 22]], [33.5, 34.45, ['node', 'run', 0, 22]],
    [34.55, 35.0, ['handle', 'trig', 'out']], [35.1, 35.8, ['handle', 'run', 'in']],
    [36.2, 36.6, ['node', 'run', 0, 30]], [37.1, 37.6, g('rCfg', 'Select an action from your library')],
    [38.6, 39.4, at('rDD', 't:Remedy-check [0f3c9b3j]', -60)], [45.1, 45.6, g('rPick', 'Save Draft#2')],
    [46.0, 46.7, at('lTop', 't:Create Document', -40)],
    [47.3, 47.8, ['node', 'doc', 0, 22]], [47.9, 48.95, ['node', 'doc', 0, 22]],
    [49.05, 49.5, ['handle', 'run', 'out']], [49.55, 50.25, ['handle', 'doc', 'in']],
    [50.4, 50.85, ['node', 'doc', 0, 30]], [51.0, 51.3, [1180, 500]],
    [54.0, 54.5, g('dType', 'No template: Andri generates formatting')], [54.8, 55.3, at('dTplDD', 't:Aldridge_Vine_Memo_Template.docx', -40)],
    [56.0, 56.6, g('dTpl', 'Save Draft#2')],
    [57.6, 58.3, ['world', 330, 120]], [58.45, 59.35, ['worldpan', 330, 120]],
    [59.6, 60.4, at('lMid', 't:Pause / Approval', -40)],
    [61.0, 61.5, ['node', 'pa', 0, 22]], [61.55, 62.6, ['node', 'pa', 0, 22]],
    [62.7, 63.2, ['handle', 'doc', 'out']], [63.25, 63.95, ['handle', 'pa', 'in']],
    [64.05, 64.45, ['node', 'pa', 0, 30]], [64.7, 65.1, g('pCfg', 'Any administrator')], [65.4, 65.8, at('pWhoDD', 't:A specific person', -20)],
    [66.05, 66.45, g('pWho', 'Select a team member...')], [66.7, 67.05, at('pApprDD', 't:adam.frith@aldridgevine.co.uk (Admin)', -60)],
    [67.3, 67.6, [1180, 520]], [69.8, 70.2, g('pTyped', 'Save Draft#2')],
    [70.6, 71.3, at('lMid', 't:Send Email', -40)],
    [71.95, 72.4, ['node', 'se', 0, 22]], [72.5, 73.45, ['node', 'se', 0, 22]],
    [73.5, 73.9, ['handle', 'pa', 'approved']], [73.95, 74.65, ['handle', 'se', 'in']],
    [74.8, 75.25, ['node', 'se', 0, 30]], [75.5, 75.95, at('sCfg', 't:Outlook (Microsoft 365)', -140)],
    [76.3, 76.7, g('sOut', 'Insert data from previous step')], [77.0, 77.35, at('sToDD', 't:Sender email address#2', -20)],
    [77.95, 78.25, [1150, 268]], [78.95, 79.1, [1150, 400]],
    [80.95, 81.15, g('sMid1', 'Attach from previous step')], [81.4, 81.75, at('sAttDD', 't:Generated document files#2', -40)],
    [82.0, 82.4, g('sAtt', 'Save Draft#2')], [82.6, 83.0, g('lTop', 'Close')],
    [83.3, 83.65, g('tEdit', 't:Untitled Workflow')], [84.9, 85.3, g('tEdit', 't:Publish')],
    [89.4, 89.9, g('pub1', 'Next')], [90.8, 91.2, g('pub2', 'Got it')],
    [91.4, 91.85, g('pFull', 'Matters')], [92.6, 93.15, g('aMat', 'Workflows')],
    [93.9, 94.6, g('mList', 'Activate')], [95.0, 95.6, g('mCfg0', 'From a specific sender')], [95.9, 96.25, at('mCfg1', 'field:e.g. john@client.com', -100)],
    [97.9, 98.3, [820, 700]], [104.6, 105.1, [1050, 760]], [106.2, 106.9, 'exit'],
  ];
}
const CLICKS = [T.explore, T.wfItem, T.newWf, T.choose, T.trigClick, T.inboxDD, T.inboxPick, T.trigSave, ...T.zo, T.raAdd, T.raClick, T.raDD, T.raPick, T.raSave,
  T.cdAdd, T.cdClick, T.cdTA, T.tplDD, T.tplPick, T.cdSave, T.paAdd, T.paClick, T.whoDD, T.whoPick, T.apprDD, T.apprPick, T.paTA, T.paSave,
  T.seAdd, T.seClick, T.outlook, T.toDD, T.toPick, T.subjC, T.bodyC, T.attDD, T.attPick, T.seSave, T.close, T.titleC, T.publish, T.next, T.gotIt,
  T.matters, T.wfIcon, T.activate, T.sender, T.valC];
const DRAGS = [T.pan1, T.raDrag, T.raJoin, T.cdDrag, T.cdJoin, T.pan2, T.paDrag, T.paJoin, T.seDrag, T.seJoin].map(([a, b]) => [a - .06, b + .04]);
const CURSOR_ON = [[9.0, 106.9]];
function resolveTarget(tg, t) {
  if (tg === 'enter') return 'S:' + [1980, 1140];
  if (tg === 'exit') return 'S:' + [2000, 1150];
  if (!Array.isArray(tg) || typeof tg[0] === 'number') return tg;
  const v = view(t);
  if (tg[0] === 'node') { const s = spriteOf(tg[1], t), n = NM(s), p = nodePos(tg[1], t); return w2s(v, p[0] + n.card[2] / 2 + tg[2], p[1] + tg[3]); }
  if (tg[0] === 'handle') { const s = spriteOf(tg[1], t), p = nodePos(tg[1], t), h = handle(s, tg[2]); return w2s(v, p[0] + h[0], p[1] + h[1]); }
  if (tg[0] === 'world') return w2s(v, tg[1], tg[2]);
  if (tg[0] === 'worldpan') return w2s(v, tg[1], tg[2]);
}
// the cursor, in app px (app) and on screen (scr)
function cursorAt(t) {
  if (!CURSOR_ON.some(([a, b]) => t >= a && t < b)) return null;
  const path = cursorPath(); let pos = null;
  const toApp = (p, tt) => typeof p === 'string' ? p : p;
  for (const [a, b, tg] of path) {
    let p = resolveTarget(tg, Math.min(t, b));
    // a canvas pan drag keeps the cursor on the same world point while the view moves (so it travels with the canvas)
    if (Array.isArray(tg) && tg[0] === 'worldpan') { const startV = view(a), endV = view(b); const s0 = w2s(startV, tg[1], tg[2]); const k = E.io(cl((t - a) / (b - a))); p = [s0[0], L(s0[1], w2s(endV, tg[1], tg[2])[1], k)]; if (t >= b) p = w2s(endV, tg[1], tg[2]); }
    if (!pos) pos = p;
    if (t >= b) { pos = p; continue; }
    if (t > a) { if (Array.isArray(tg) && (tg[0] === 'node' && DRAGS.some(([d0, d1]) => a >= d0 - .01 && b <= d1 + .01))) { pos = p; } else { const k = E.io((t - a) / (b - a)); pos = typeof pos === 'string' || typeof p === 'string' ? p : [L(pos[0], p[0], k), L(pos[1], p[1], k)]; } }
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
const TITLE = { tag: 'ANDRI ACADEMY · 10.2', l1: 'Workflows: answer incoming', l2: 'emails automatically.' };
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
const NEXT = 'Andri Academy · Next: Start from a ready example: overnight redline, new client intake';
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
