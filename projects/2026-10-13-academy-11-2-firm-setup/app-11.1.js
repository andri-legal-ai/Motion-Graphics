// Andri Academy 11.1 · Before you invite a colleague
// Everything is drawn on one <canvas> by renderFrame(t), a pure function of time t (seconds).
// App screens are plates of real Andri staging snapshots (plates/*.png, 2x, built by plates/capture.mjs, 13 Oct 2026); all motion is drawn here.
// Engine, camera, captions, cursor, mascot, title and end card are 8.1's (after the approved 1.1, 1.2 and 5.1 videos);
// the window fades as one picture on its own layer (9.2, known-issues #12).

const W = 1920, H = 1080, FPS = 60, LDUR = 103.6;
const CUTS = [];
const logical = v => v;
const videoT = L => L;
const DURATION = videoT(LDUR);
const c = document.getElementById('c'); c.width = W; c.height = H;
let ctx = c.getContext('2d');
const OFF = document.createElement('canvas'); OFF.width = W; OFF.height = H; const OFFCTX = OFF.getContext('2d');
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
const PLATES = ['mat', 'matF', 'k0', 'k0h', 'k1', 'k1h', 'k1b', 'k2', 'k2e', 'k3', 'mRole', 'mRoleH', 'k4', 'k4h', 'k4x', 'bT', 'bStrip', 'b2', 'b2h', 'b3', 'b3m', 'mMenu', 'mMenuH', 'tD', 'tDh'];
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
function plate(name, a = 1) { if (a <= 0 || !IMG[name]) return; ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(IMG[name], 0, 0, 1440, 860); ctx.restore(); }
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
  if (a <= 0) return;
  // the shadow card follows the menu's own outline when it was measured (its picture can carry a few transparent px around it)
  const lb = RECTS[name].lb, inner = lb ? [lb[0] - 2, lb[1] - 2, lb[2] + 4, lb[3] + 4] : null; if (lb) r = RECTS[name].lbR[0] || r;
  const [x, y, w, h] = inner || box(name);
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
function sweep(t, a, lines, end = 1e9) {
  if (!lines || t < a || t > end + .35) return;
  ctx.save(); ctx.globalAlpha *= 1 - P(t, end, end + .35, E.io); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#F8E37C';
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
const VO = { N1: 0.6, N2: 8.0, N3: 14.4, N4: 18.8, N5: 20.5, N6: 26.0, N7: 30.6, N8: 36.8, N9: 43.6, N10: 48.4, N11: 53.4, N12: 59.4, N13: 63.4, N14: 71.4, N15: 75.4, N16: 79.6, N17: 86.6, N18: 90.2, N19: 97.0 };
// where each line starts in the take, so a word heard at take time w plays at wt(line, w) (word times: audio/words.json)
const TS = { N1: 0, N2: 6.33, N3: 12.07, N4: 15.81, N5: 17.30, N6: 22.47, N7: 26.67, N8: 32.35, N9: 38.89, N10: 42.54, N11: 46.05, N12: 51.75, N13: 55.28, N14: 62.74, N15: 66.18, N16: 69.82, N17: 76.31, N18: 79.07, N19: 83.81 };
const wt = (n, w) => +(VO[n] + w - TS[n]).toFixed(2);
const T = {
  push: 6.9,                                                     // title card pushes up into the app
  firm: wt('N2', 8.3), members: wt('N2', 10.75),
  invite: wt('N3', 12.4), emailC: wt('N3', 13.66), email: [wt('N3', 13.8), wt('N3', 15.2)],
  roleC: wt('N4', 16.2),
  support: wt('N7', 31.6),
  x: wt('N9', 42.2),
  billing: wt('N10', 45.0), scroll: wt('N10', 45.55),
  supTab: wt('N14', 62.7),
  matters: wt('N15', 67.4),
  dots: wt('N16', 70.0), transfer: wt('N16', 71.55),
  cancel: 89.4, firm2: 90.35, members2: wt('N18', 80.2),
  exit: 95.0,
};
const END = 96.1;
const TXT = { email: ['rosalind.keane@aldridgevine.co.uk'] };
const CAP = [[VO.N2, 1, 'Members'], [VO.N3, 2, 'Invite'], [VO.N4, 3, 'Pick a role'], [VO.N8, 4, 'The 30-day rule'], [VO.N10, 5, 'Seats and credits'], [VO.N15, 6, 'When someone leaves']];
const CAP_END = T.exit + .2;

// ------------------------------------------------------------------ camera
const POSE = { s: 1.08, cx: 960, cy: 503 };
function shot(name) {
  const full = [0, 0, 1440, 860];
  if (name === 'screen') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy, clip: full, r: 22, o: 1 };
  if (name === 'below') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy + 1100, clip: full, r: 22, o: 1 };
  if (name === 'roleZ') return { fx: 720, fy: 480, s: 1.3, cx: 960, cy: 500, clip: full, r: 22, o: 1 };    // the invite dialog and its wide role menu
  if (name === 'credZ') return { fx: 720, fy: 420, s: 1.3, cx: 960, cy: 500, clip: full, r: 22, o: 1 };     // the Credits card
  if (name === 'trZ') return { fx: 720, fy: 430, s: 1.34, cx: 960, cy: 500, clip: full, r: 22, o: 1 };      // the Transfer matter ownership dialog
  if (name === 'gone') return { ...shot('screen'), o: 0 };                                                 // plain fade out, no zoom
}
// zooms only on still moments (5.1 lesson), about 1.4x over 1.2 s
const SHOTS = [[0, 'below', 0], [T.push, 'screen', .85],
  [19.75, 'roleZ', 1.2], [47.3, 'screen', 1.2],
  [52.45, 'credZ', 1.2], [70.2, 'screen', 1.1],
  [81.85, 'trZ', 1.2], [88.75, 'screen', 1.1],
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
// the cursor rests on a control: its real hover look (a plate captured while hovering in staging) until the click
const HOV = {}; // filled from the cursor path: name -> [arrive, click]
// the Billing panel scrolls from the top to the Credits card (bStrip is the panel's content in one tall picture)
function billScroll(t, t0) {
  const k = P(t, t0, t0 + .9, E.io), s = k * RECTS.bStrip.s1, [x, y, w, h] = RECTS.bStrip.box;
  plate('bT'); ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = px('bT', 1430, 400); ctx.fillRect(x, y, w, h);
  ctx.drawImage(IMG.bStrip, 0, s * 2, w * 2, h * 2, x, y, w, h); ctx.restore();
}
const hovering = (t, a, b) => t >= a && t < b;
function drawApp(t) {
  const C1 = CP;   // cursor arrival times (see cursorPath)
  // 1 the matters list; the firm button in the top bar opens Company
  if (t < T.firm + .02) {
    plate(hovering(t, C1.firm, T.firm + .02) ? 'matF' : 'mat');
    ring(t, wt('N2', 7.6), T.firm + .1, R('mat', 'firm'), 10, 3);
    return;
  }
  if (t < T.firm + .64) { push(t, T.firm + .02, 'matF', 'k0'); return; }
  if (t < T.members + .02) {
    plate(hovering(t, C1.members, T.members + .02) ? 'k0h' : 'k0');
    ring(t, wt('N2', 9.45), wt('N2', 10.45), R('k0', 'heading'), 8, 5);
    return;
  }
  // 2 Members, then Invite Member: the dialog fades in, the email is typed
  if (t < T.invite + .02) { plate(hovering(t, C1.invite, T.invite + .02) ? 'k1h' : 'k1'); ring(t, wt('N3', 12.0), T.invite + .1, R('k1', 'invite'), 10, 3); return; }
  if (t < T.roleC + .02) {
    if (t < T.invite + .27) { plate('k1h'); plate('k2', P(t, T.invite + .02, T.invite + .27, E.out)); return; }
    plate('k2e'); typeIn(t, 'k2', 'k2e', [490, 425, 455, 30], TXT.email, 14, 400, T.email[0], T.email[1], { ox: 12, caretH: 18 });
    return;
  }
  // 3 the role menu: each role named, Support picked
  if (t < T.support + .02) {
    plate('k3'); pop('mRole', t, T.roleC, T.support + .02);
    if (hovering(t, C1.support, T.support + .02)) sprite('mRoleH');
    if (t >= T.roleC + .2) {
      sweep(t, wt('N5', 17.85), R('mRole', 'adminD'), VO.N6);
      sweep(t, wt('N6', 22.95), R('mRole', 'memberD'), VO.N7);
      sweep(t, wt('N7', 27.1), R('mRole', 'supportD'));
      ring(t, wt('N5', 17.3), wt('N5', 18.3), R('mRole', 'admin'), 6, 4);
      ring(t, wt('N6', 22.5), wt('N6', 23.5), R('mRole', 'member'), 6, 4);
      ring(t, wt('N7', 26.6), wt('N7', 27.6), R('mRole', 'support'), 6, 4);
    }
    return;
  }
  // 4 Support picked: the 30-day rule on the role, then the Invite Member button (not sent), the dialog closed
  if (t < T.x + .02) {
    plate(hovering(t, C1.x, T.x + .02) ? 'k4x' : hovering(t, C1.submit, C1.leaveSubmit) ? 'k4h' : 'k4');
    ring(t, wt('N8', 33.85), wt('N8', 37.95), R('k4', 'role'), 10, 3);
    ring(t, wt('N9', 38.9), wt('N9', 41.0), R('k4', 'submit'), 12, 3);
    return;
  }
  if (t < T.billing + .02) {
    if (t < T.x + .24) { xf('k4x', 'k1', t, T.x + .02, .2); return; }
    plate(hovering(t, C1.billing, T.billing + .02) ? 'k1b' : 'k1');
    return;
  }
  // 5 Billing: scroll to Credits; the How it works lines, the two wallets, the £50 pack, the Support tab
  if (t < T.scroll + .02) { plate('bT'); return; }
  if (t < T.scroll + .92) { billScroll(t, T.scroll + .02); return; }
  if (t < T.supTab + .02) {
    plate(hovering(t, C1.supTab, T.supTab + .02) ? 'b2h' : 'b2');
    sweep(t, wt('N11', 46.16), R('b2', 'notSeat'), VO.N12);
    sweep(t, wt('N12', 51.76), R('b2', 'never'), VO.N13);
    const pr = R('b2', 'premium'), su = R('b2', 'supTab');
    ring(t, wt('N13', 55.2), wt('N13', 56.6), [pr[0], pr[1], su[0] + su[2] - pr[0], pr[3]], 10, 4);
    sweep(t, wt('N13', 56.8), R('b2', 'capable'));
    ring(t, wt('N13', 59.3), wt('N13', 61.9), R('b2', 'p50'), 12, 3);
    return;
  }
  if (t < T.matters + .02) {
    plate(hovering(t, C1.matters, T.matters + .02) ? 'b3m' : 'b3');
    ring(t, wt('N14', 64.4), wt('N14', 65.4), R('b3', 'supTab'), 10, 4);
    return;
  }
  // 6 someone leaves: back to Matters, the matter's menu, Transfer ownership
  if (t < T.matters + .64) { push(t, T.matters + .02, 'b3m', 'mat'); return; }
  if (t < T.transfer + .02) {
    plate('mat'); pop('mMenu', t, T.dots, T.transfer + .02);
    if (hovering(t, C1.transfer, T.transfer + .02)) sprite('mMenuH');
    return;
  }
  if (t < T.cancel + .02) {
    if (t < T.transfer + .27) { plate('mat'); plate('tD', P(t, T.transfer + .02, T.transfer + .27, E.out)); return; }
    plate(hovering(t, C1.cancel, T.cancel + .02) ? 'tDh' : 'tD');
    ring(t, wt('N16', 72.9), wt('N16', 74.2), R('tD', 'newOwner'), 10, 3);
    sweep(t, wt('N16', 74.3), R('tD', 'lose'), VO.N17);
    sweep(t, wt('N17', 76.4), R('tD', 'mfa'));
    return;
  }
  // then remove them on the Members page
  if (t < T.firm2 + .02) { if (t < T.cancel + .24) { xf('tDh', 'mat', t, T.cancel + .02, .2); return; } plate(hovering(t, C1.firm2, T.firm2 + .02) ? 'matF' : 'mat'); return; }
  if (t < T.firm2 + .64) { push(t, T.firm2 + .02, 'matF', 'k0'); return; }
  if (t < T.members2 + .02) { plate(hovering(t, C1.members2, T.members2 + .02) ? 'k0h' : 'k0'); return; }
  plate('k1');
  ring(t, wt('N18', 80.2), wt('N18', 81.3), R('k1', 'sMembers'), 8, 3);
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
// arrival times on each control (the hover look shows from here until the click)
const CP = { firm: 9.45, members: 12.0, invite: 14.3, support: 35.05, submit: 44.25, leaveSubmit: 45.95, x: 46.5, billing: 50.4, supTab: 70.95,
  matters: 76.2, dots: 79.4, transfer: 80.9, cancel: 89.05, firm2: 89.95, members2: 91.0 };
function cursorPath() {
  const g = (n, k) => C(R(n, k));
  const at = (n, k, dx = 0, dy = 0) => { const r = R(n, k); return [r[0] + r[2] / 2 + dx, r[1] + r[3] / 2 + dy]; };
  const lab = (n, k, dx = 26) => { const r = R(n, k); return [r[0] + dx, r[1] + r[3] / 2]; };   // on a sidebar label, not the middle of its row
  return [
    [8.3, 8.31, 'enter'], [8.5, CP.firm, g('mat', 'firm')],
    [11.2, CP.members, lab('k0', 'sMembers', 34)], [13.5, CP.invite, g('k1', 'invite')],
    [15.25, 15.7, at('k2', 'email', -120)], [18.3, 18.9, at('k2', 'role', -150)],
    [19.4, 19.95, [1200, 450]],
    [34.3, CP.support, lab('mRole', 'support', 30)], [35.8, 36.5, [1040, 470]],
    [43.5, CP.submit, at('k4', 'submit', 60)], [CP.leaveSubmit, CP.x, g('k4', 'x')],
    [47.4, 48.0, [700, 470]], [49.6, CP.billing, lab('k1', 'sBilling', 30)],
    [51.2, 51.9, [1180, 640]], [70.3, CP.supTab, g('b2', 'supTab')],
    [71.8, 72.4, [1000, 400]], [75.5, CP.matters, g('b3', 'matters')],
    [78.5, CP.dots, g('mat', 'dots')], [80.3, CP.transfer, at('mMenu', 'transfer', -30)],
    [81.65, 82.15, [1060, 560]], [88.5, CP.cancel, g('tD', 'cancel')],
    [89.5, CP.firm2, g('mat', 'firm')], [90.75, CP.members2, lab('k0', 'sMembers', 34)],
    [91.8, 92.5, [760, 560]], [94.4, 95.0, 'exit'],
  ];
}
const CLICKS = [T.firm, T.members, T.invite, T.emailC, T.roleC, T.support, T.x, T.billing, T.supTab, T.matters, T.dots, T.transfer, T.cancel, T.firm2, T.members2];
const CURSOR_ON = [[8.3, 95.0]];
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
const TITLE = { tag: 'ANDRI ACADEMY · 11.1', l1: 'Before you invite', l2: 'a colleague.' };
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
const NEXT = 'Andri Academy · Next: Set up Andri for your firm';
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
    const main = ctx, layer = cam.o < 1;
    if (layer) { ctx = OFFCTX; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H); }
    ctx.save();
    ctx.shadowColor = 'rgba(35,30,25,.16)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 26; ctx.fillStyle = '#F2EFE9'; rr(sx, sy, sw, sh, cam.r); ctx.fill();
    ctx.shadowColor = 'rgba(35,30,25,.22)'; ctx.shadowBlur = 1; ctx.shadowOffsetY = 0; ctx.fill(); ctx.shadowColor = 'transparent';
    rr(sx, sy, sw, sh, cam.r); ctx.clip();
    ctx.translate(cam.cx - cam.fx * cam.s, cam.cy - cam.fy * cam.s); ctx.scale(cam.s, cam.s);
    drawApp(t);
    ctx.restore();
    if (layer) { ctx = main; ctx.save(); ctx.globalAlpha = cam.o; ctx.drawImage(OFF, 0, 0); ctx.restore(); }
  }
  endCard(t);
  title(t);
  caption(t);
  cursor(t, cam);
}

window.MG = { width: W, height: H, fps: FPS, duration: DURATION, renderFrame };
if (!navigator.webdriver) { const t0 = performance.now(); (function loop() { renderFrame(((performance.now() - t0) / 1000) % DURATION).then(() => requestAnimationFrame(loop)); })(); }
