// Andri Academy 7.1 · Your firm's experts, on call
// Everything is drawn on one <canvas> by renderFrame(t), a pure function of time t (seconds).
// App screens are plates of real Andri staging snapshots (plates/*.png, 2x, built by plates/capture71.mjs); all motion is drawn here.
// Engine, camera, captions, cursor, mascot, title and end card follow the approved 1.1, 1.2 and 5.1 videos.

const W = 1920, H = 1080, FPS = 60, LDUR = 115.5;
const CUTS = [];   // no cuts or holds in this version (time map as in 2.1 and 5.1)
const logical = v => { let L = v; for (const [s, d] of CUTS) { if (d > 0) { if (L >= s) L += d; } else { const h = -d; if (L >= s + h) L -= h; else if (L >= s) L = s; } } return L; };
const videoT = L => { for (let i = CUTS.length - 1; i >= 0; i--) { const [s, d] = CUTS[i]; if (d > 0) { if (L >= s + d) L -= d; else if (L >= s) L = s; } else if (L > s) L += -d; } return L; };
const DURATION = videoT(LDUR);
const c = document.getElementById('c'); c.width = W; c.height = H;
const ctx = c.getContext('2d');
const ROOT = '../';
const AW = 1470, AH = 835;   // the app window, as in staging (1470 x 835)

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
const PLATES = ['cJ1b', 'f00b', 'f01b', 'f02b', 'kbF', 'menuEx', 's00', 'fN', 'pF0', 'f00', 'f01', 'f02', 'f03', 'tallA', 'tallB', 'b01', 'b02', 'r02', 'mL',
  'cJ1', 'cJ2', 'cJ3', 'cJ4', 'cK0', 'cK1', 'lsDocs', 'lsSpec', 'cK2', 'cK3', 'cK4', 'r01'];
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
function plate(name, a = 1) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(IMG[name], 0, 0, AW, AH); ctx.restore(); }
function region(name, r, a = 1, dx = 0, dy = 0) { if (a <= 0) return; const [x, y, w, h] = r; ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(IMG[name], x * 2, y * 2, w * 2, h * 2, x + dx, y + dy, w, h); ctx.restore(); }
function xf(a, b, t, t0, d = .3) { const k = P(t, t0, t0 + d, E.io); if (k < 1) plate(a); if (k > 0) plate(b, k); }
function sprite(name, a = 1, dx = 0, dy = 0, sc = 1) {
  if (a <= 0) return; const [x, y, w, h] = box(name); ctx.save(); ctx.globalAlpha *= a;
  ctx.translate(x + w / 2 + dx, y + h / 2 + dy); ctx.scale(sc, sc); ctx.drawImage(IMG[name], -w / 2, -h / 2, w, h); ctx.restore();
}
// shadow for a floating sprite captured without its own (known-issues #1)
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
// yellow highlight sweep over the words the voice names (as 1.1's source passage and 4.2): #F8E37C, multiply, left to right
function hl(t, a, b, lines, dy = 0) {
  if (!lines || t < a) return; const v = 1 - P(t, b - .3, b, E.io); if (v <= 0) return;
  const total = lines.reduce((s, r) => s + r[2], 0); let k = P(t, a, a + .8, E.io) * total;
  ctx.save(); ctx.globalAlpha *= v * .85; ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#F8E37C';
  for (const r of lines) { const w = Math.min(r[2], k); if (w > 0) { rr(r[0] - 3, r[1] - 2 + dy, w + 6, r[3] + 4, 4); ctx.fill(); } k -= r[2]; if (k <= 0) break; }
  ctx.restore();
}
function caret(t, x, y, h = 18) { if (Math.floor(t * 2.2) % 2 === 0) { ctx.fillStyle = '#241E19'; ctx.fillRect(x + 1, y, 1.4, h); } }
// typing: the field's text area is cleared to its own background, then the real text of the filled plate is revealed letter by letter
// F = [x, y, line height, font size] of the field's text (measured in staging's computed style)
function typed(t, base, full, F, lines, a, b, { clear, bgAt, blank, lh = null } = {}) {
  if (t < a) return; const [x, y, lh0, fs] = F; const LH = lh || lh0;
  if (blank) region(blank, clear); else { ctx.fillStyle = px(base, bgAt[0], bgAt[1]); ctx.fillRect(...clear); }
  font(400, fs); const n = Math.round(P(t, a, b, E.lin) * lines.join(' ').length);
  let used = 0, cx = x, cy = y;
  lines.forEach((ln, i) => { const part = ln.slice(0, Math.max(0, n - used)); const tw = ctx.measureText(part).width;
    if (part.length) { region(full, [x - 1, y + i * LH - 1, part.length === ln.length ? clear[0] + clear[2] - x + 1 : tw + 2, LH + 2]); cx = x + tw; cy = y + i * LH; }
    used += ln.length + 1; });
  if (t < b + .3) caret(t, cx, cy + (LH - fs * 1.25) / 2, fs * 1.25);
}
// a key being pressed (keyboard step the cursor cannot show): a small keycap beside the app's own key hint
function keycap(t, a, press, r) {
  const v = V2(t, a, press + .35, .2, .2); if (v <= 0) return;
  const down = t >= press - .05 && t < press + .15;
  const w = 30, h = 26, x = r[0] - w - 10, y = r[1] + r[3] / 2 - h / 2;
  ctx.save(); ctx.globalAlpha *= v; ctx.translate(x + w / 2, y + h / 2); const k = down ? .9 : 1; ctx.scale(k, k); ctx.translate(-(x + w / 2), -(y + h / 2));
  ctx.shadowColor = 'rgba(35,30,25,.18)'; ctx.shadowBlur = down ? 2 : 6; ctx.shadowOffsetY = down ? 1 : 3;
  ctx.fillStyle = '#FFFFFF'; rr(x, y, w, h, 6); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#CCC1B3'; ctx.lineWidth = 1; ctx.stroke();
  font(600, 15); ctx.fillStyle = '#241E19'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('←', x + w / 2, y + h / 2 + 1); ctx.textAlign = 'left';
  ctx.restore();
}
// a page opening: the old page pushes out to the left, the new one in from the right (as 1.1)
function push(t, t0, from, to, d = .6) {
  const k = P(t, t0, t0 + d, E.qio);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, AW, AH); ctx.clip();
  if (k < 1) { ctx.save(); ctx.translate(-k * AW, 0); from(); ctx.restore(); }
  if (k > 0) { ctx.save(); ctx.translate((1 - k) * AW, 0); to(); ctx.restore(); }
  ctx.restore();
}
// the spinners turn (lucide loader, one turn a second): the still icon is covered at its centre and redrawn at the current angle
function spins(name, t, a = 1) {
  const S = RECTS[name] && RECTS[name].spins; if (!S || a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  for (const [x, y, size, col] of S) {
    const r = size * 9 / 24; ctx.fillStyle = px(name, Math.round(x + size * .7), Math.round(y)); ctx.beginPath(); ctx.arc(x, y, size * .62, 0, Math.PI * 2); ctx.fill();
    const ang = (t % 1) * Math.PI * 2; ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.4, size / 12); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, r, ang, ang + Math.PI * 1.55); ctx.stroke();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ timeline (video seconds)
// narration lines (ElevenLabs "UK voice voice to use for ANDRI vids", one take, cut at its pauses: audio/uk/L*.wav)
const VO = { L1: 0.6, L2: 8.9, L3a: 20.0, L3b: 22.8, L4: 30.2, L5: 34.8, L6: 45.0, L7a: 49.8, L7b: 51.9, L8a: 56.9, L8b: 59.0, L9: 66.4,
  L10a: 73.6, L10b: 77.7, L11: 81.4, L12: 88.3, L13: 93.6, L14: 97.6, L15: 109.2 };
const T = {
  push: 7.9,                                   // title card pushes up into the app
  exp1: 20.1, sp1: 21.3,                       // Explore, Specialists
  newSp: 29.6, name: 31.0, nameTy: [32.5, 33.5], hint: 33.6,
  consult: 35.4, conTy: [35.9, 38.9], count: 39.0,
  notes: 45.4, notesTy: [46.0, 48.6],
  scroll1: [50.0, 50.9], choose: 52.1, scroll2: [52.8, 53.4],
  build: 57.4, steps: 60.2, ready: 65.9,
  matters: 72.1, nair: 73.25,
  comp1: 77.6, compTy: [78.1, 80.5], send1: 81.1, answer1: 84.4, bottom: 87.6,
  comp2: 88.9, at: 89.5, spec: 90.75, pick: 91.9, qTy: [92.2, 93.4], send2: 93.7, answer2: 94.4,
  exp2: 96.6, sp2: 97.5,
  exit: 107.6,
};
const END = 108.7;
const TXT = { name: ['Employment law'], consult: ['UK employment: unfair dismissal, redundancy, maternity and sex discrimination, tribunal', 'remedy.'],
  notes: ['Use the Aldridge Vine letter and memo templates for structure and tone.'], check: ["Check that letter against our firm's house style before it goes out."],
  q2: ['what are the four headings in our memo template?'] };

// captions (step number, text) in the pill under the window
const CAP = [[VO.L2, 1, "Your firm's models"], [VO.L3a, 2, 'Open Specialists'], [VO.L4, 3, 'Name it'], [VO.L5, 4, 'When to consult it'],
  [VO.L6, 5, 'Notes for the build'], [VO.L7a, 6, 'Choose its files'], [VO.L8a, 7, 'Build it'], [VO.L9, 8, "It's ready"],
  [VO.L10a, 9, 'Andri consults it'], [VO.L12, 10, 'Ask it directly'], [VO.L14, 11, 'One per team']];
const CAP_END = T.exit + .2;

// ------------------------------------------------------------------ camera
const POSE = { s: 1.06, cx: 960, cy: 503 };
function zoomOn(r, maxW, maxH, cx = 960, cy = 500) { const s = Math.min(maxW / r[2], maxH / r[3]); return { fx: r[0] + r[2] / 2, fy: r[1] + r[3] / 2, s, cx, cy, r: 18, o: 1 }; }
function shot(name) {
  if (name === 'screen') return { fx: AW / 2, fy: AH / 2, s: POSE.s, cx: POSE.cx, cy: POSE.cy, r: 22, o: 1 };
  if (name === 'below') return { fx: AW / 2, fy: AH / 2, s: POSE.s, cx: POSE.cx, cy: POSE.cy + 1100, r: 22, o: 1 };
  if (name === 'helpZ') return zoomOn([700, 290, 770, 160], 1120, 700);     // the consult line and the line under it
  if (name === 'listZ') return zoomOn([380, 225, 760, 520], 1180, 800);     // the @ list over the box
  if (name === 'gone') return { ...shot('screen'), o: 0 };                  // plain fade out, no zoom
}
const SHOTS = [[0, 'below', 0], [T.push, 'screen', .85],
  [39.3, 'helpZ', 1.2], [43.1, 'screen', 1.2],
  [T.exit, 'gone', 1.0]];
function camera(t) {
  let i = 0; while (i < SHOTS.length - 1 && SHOTS[i + 1][0] <= t) i++;
  const cur = shot(SHOTS[i][1]), d = SHOTS[i][2];
  if (i === 0 || d === 0) return clampCam({ ...cur });
  const prev = clampCam({ ...shot(SHOTS[i - 1][1]) }); clampCam(cur); const k = E.io(cl((t - SHOTS[i][0]) / d));
  const o = {}; for (const key of ['fx', 'fy', 'cx', 'cy', 'r', 'o']) o[key] = L(prev[key], cur[key], k);
  o.s = Math.exp(L(Math.log(prev.s), Math.log(cur.s), k));
  return o;
}
// only the end shots are clamped to the window (academy-zoom-smoothness): the path between them stays straight
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

// ------------------------------------------------------------------ the form: the panel's scrolling part, drawn from the tall captures
const SCR = () => R('f00', 'scroller');   // [779, 137, 674, 681]
function formScroll(t, tall, y) {
  const [x0, y0, w, h] = SCR(); const img = IMG[tall];
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
  ctx.drawImage(img, 0, y * 2, w * 2, h * 2, x0, y0, w, h);
  ctx.restore();
}
function scrollAt(t) {
  if (t < T.choose + .02) return L(0, 323.5, P(t, T.scroll1[0], T.scroll1[1], E.io));
  return L(323.5, 388.5, P(t, T.scroll2[0], T.scroll2[1], E.io));
}
// a rect inside the tall form content, on screen at scroll y
const inForm = (r, y) => [r[0], SCR()[1] + r[1] - y, r[2], r[3]];

// the Explore menu opening over a page (the top bar is the same on every page)
function exploreMenu(t, t0, t1) {
  const m = P(t, t0 + .02, t0 + .2, E.out) * (1 - P(t, t1 + .02, t1 + .12));
  if (m <= 0) return; floatShadow('menuEx', m, 0, (1 - m) * -6, 16, true); sprite('menuEx', m, 0, (1 - m) * -6);
}

// ------------------------------------------------------------------ the app, by time
function drawApp(t) {
  // 1 the firm's models in Company > Knowledge base; then Explore > Specialists (the page pushes across)
  if (t < T.sp1 + .7) {
    const kb = () => {
      plate('kbF');
      hl(t, 12.8, 19.2, R('kbF', 'f3')); hl(t, 13.5, 19.2, R('kbF', 'f2')); hl(t, 14.4, 19.2, R('kbF', 'f1'));
      ring(t, 17.1, 18.9, R('kbF', 'sideKB'), 10, 2);
      exploreMenu(t, T.exp1, T.sp1);
    };
    if (t < T.sp1 + .05) { kb(); return; }
    push(t, T.sp1 + .05, kb, () => plate('s00')); return;
  }
  // 2 the empty Specialists page
  if (t < T.newSp + .05) { plate('s00'); hl(t, 22.9, 28.9, R('s00', 'line1')); hl(t, 25.6, 28.9, R('s00', 'footer')); return; }
  // 3 New specialist: the panel slides in from the right while the list narrows (500 ms in the app)
  if (t < T.newSp + .55) {
    const k = P(t, T.newSp + .05, T.newSp + .55, E.qio);
    plate('s00'); plate('fN', k); const dx = (1 - k) * 700; floatShadow('pF0', 1, dx); sprite('pF0', 1, dx); return;
  }
  // name, typed; the line under it changes once there is a name
  if (t < T.consult + .05) {
    plate('f00'); typed(t, 'f00', 'f01', [812, 242, 20, 14], TXT.name, T.nameTy[0], T.nameTy[1], { clear: R('f00', 'name'), blank: 'f00b' });
    if (t >= T.hint) region('f01', R('f00', 'hint'), P(t, T.hint, T.hint + .2));
    return;
  }
  // 4 when to consult it, typed; the counter updates
  if (t < T.notes + .05) {
    plate('f01'); typed(t, 'f01', 'f02', R('f00', 'consultF'), TXT.consult, T.conTy[0], T.conTy[1], { clear: R('f00', 'consult'), blank: 'f01b' });
    if (t >= T.count) region('f02', [1380, 410, 54, 20]);
    hl(t, 40.6, 43.6, R('f00', 'help'));
    return;
  }
  // 5 notes for the build, typed
  if (t < T.scroll1[0]) { plate('f02'); typed(t, 'f02', 'f03', R('f00', 'notesF'), TXT.notes, T.notesTy[0], T.notesTy[1], { clear: R('f00', 'notes'), blank: 'f02b' }); return; }
  // 6 what it learns from: the form scrolls, the folder is chosen, the form scrolls to Build specialist
  if (t < T.build + .05) {
    const y = scrollAt(t); plate('f03'); formScroll(t, t < T.choose + .02 ? 'tallA' : 'tallB', y);
    hl(t, 54.0, 56.2, (R('tallB', 'chip') || []).map(r => inForm(r, y)));
    return;
  }
  // 7 build: the panel switches to the specialist at once, a row appears in the list; the steps come in
  if (t < T.ready) { if (t < T.steps) plate('b01'); else xf('b01', 'b02', t, T.steps, .4); hl(t, 62.4, 65.4, R('b01', 'wait')); return; }
  // 8 a few minutes later: Ready, the rewritten consult line and the brief
  if (t < T.matters + .05) {
    xf('b02', 'r02', t, T.ready, .5);
    ring(t, 66.6, 68.2, R('r02', 'ready'), 9, 3); hl(t, 68.4, 72.0, R('r02', 'line')); hl(t, 70.4, 72.0, R('r02', 'edit'));
    return;
  }
  // 9 back in the matter: Matters, then Nair (the conversation opens where it was left)
  if (t < T.nair + .7) {
    if (t < T.nair + .05) { push(t, T.matters + .05, () => plate('r02'), () => plate('mL')); return; }
    push(t, T.nair + .05, () => plate('mL'), () => plate('cJ1')); return;
  }
  // the letter Andri drafted; the request typed and sent
  if (t < T.send1 + .02) {
    plate('cJ1'); hl(t, 75.4, 77.2, R('cJ1', 'dear'));
    typed(t, 'cJ1', 'cJ2', R('cJ1', 'compF'), TXT.check, T.compTy[0], T.compTy[1], { clear: [404, 694, 700, 34], blank: 'cJ1b', lh: 24 });
    return;
  }
  // sent: the new turn moves to the top; Andri consults the specialist, then answers
  if (t < T.answer1) { plate('cJ3'); spins('cJ3', t); hl(t, 82.2, 84.3, R('cJ3', 'consult')); return; }
  if (t < T.bottom) { plate('cJ4'); hl(t, 85.4, 87.5, R('cJ4', 'link')); return; }
  // 10 asking it directly: the at sign opens the list on Matter Documents; one step across is Specialists; pick, type, send
  if (t < T.at) { plate('cK0'); return; }
  if (t < T.pick + .02) {
    plate('cK1');
    const m = P(t, T.at + .02, T.at + .2, E.out), sp = t >= T.spec;
    const s = sp ? 'lsSpec' : 'lsDocs'; floatShadow(s, m, 0, 0, 16, true); sprite(s, m, 0, (1 - m) * 6);
    // the list's own hint says ←/→ switches section: ring it, show the ← key going down, then the list switches
    if (!sp) { ring(t, T.spec - .75, T.spec + .05, R('lsDocs', 'hint'), 6, 3); keycap(t, T.spec - .6, T.spec - .12, R('lsDocs', 'hint')); }
    if (sp) ring(t, T.spec + .2, T.pick - .1, R('lsSpec', 'head'), 8, 4);
    return;
  }
  if (t < T.send2 + .02) {
    plate('cK2'); const F = R('cK2', 'compF'), chip = R('cK2', 'chip')[0];
    typed(t, 'cK2', 'cK2', [chip[0] + chip[2] + 4.5, F[1], F[2], F[3]], TXT.q2, T.qTy[0], T.qTy[1], { clear: [chip[0] + chip[2] + 3, 698, 1100 - chip[0] - chip[2] - 3, 27], bgAt: [1000, 712], lh: 24 });
    return;
  }
  if (t < T.answer2) { plate('cK3'); spins('cK3', t); return; }
  // the answer, from the firm's memo template; then Explore > Specialists again
  if (t < T.sp2 + .05) { plate('cK4'); hl(t, 95.1, 96.6, R('cK4', 'memo')); exploreMenu(t, T.exp2, T.sp2); return; }
  // 11 one per team: the Specialists page, now with one
  if (t < T.sp2 + .7) { push(t, T.sp2 + .05, () => { plate('cK4'); exploreMenu(t, T.exp2, T.sp2 + 1); }, () => plate('r01')); return; }
  plate('r01');
  ring(t, 98.4, 100.2, R('r01', 'newBtn'), 12, 4);
  hl(t, 102.4, 106.8, [R('r01', 'desc')]);
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
  const f = RECTS.f00, kb = RECTS.kbF, me = RECTS.menuEx;
  const tb = R('tallA', 'choose'), bb = R('tallB', 'build');
  const chooseAt = [tb[0] + tb[2] / 2, SCR()[1] + tb[1] + tb[3] / 2 - 323.5];
  const buildAt = [bb[0] + bb[2] / 2, SCR()[1] + bb[1] + bb[3] / 2 - 388.5];
  const fieldPt = (r, dx = 220) => [r[0] + dx, r[1] + r[3] / 2];
  const ls = RECTS.lsSpec;
  return [
    [18.6, 18.61, 'enter'], [18.8, 19.8, C(kb.explore)], [20.4, 20.95, C(me.spItem)],
    [22.4, 23.2, [700, 560]],
    [28.6, 29.4, C(R('s00', 'newBtn'))], [30.2, 30.85, fieldPt(f.name)],
    [33.9, 35.25, fieldPt(f.consult, 300)], [39.0, 39.8, [1180, 470]],
    [44.4, 45.25, fieldPt(f.notes, 300)], [49.2, 49.9, [1250, 560]],
    [50.95, 51.95, chooseAt], [53.6, 54.2, [1180, 600]], [56.4, 57.25, buildAt], [57.8, 58.6, [1120, 520]],
    [71.3, 71.95, C(R('mL', 'matters'))], [72.6, 73.1, C(R('mL', 'nair')[0])], [73.9, 74.7, [1180, 360]],
    [76.8, 77.45, [700, 699]], [78.0, 78.6, [880, 640]], [80.5, 80.95, C(R('cJ1', 'send'))], [81.6, 82.4, [1240, 520]],
    [88.2, 88.75, [700, 699]], [89.0, 89.5, [880, 770]], [90.9, 91.75, [ls.item[0] + 140, ls.item[1] + 10]], [92.0, 92.6, [880, 640]],
    [93.25, 93.6, C(R('cK2', 'send'))], [93.9, 94.6, [1240, 520]],
    [95.7, 96.45, C(R('cK4', 'explore'))], [96.8, 97.3, C(me.spItem)], [98.0, 98.7, [1220, 300]],
    [105.4, 106.4, 'exit'],
  ];
}
const CLICKS = [T.exp1, T.sp1, T.newSp, T.name, T.consult, T.notes, T.choose, T.build, T.matters, T.nair, T.comp1, T.send1, T.comp2, T.pick, T.send2, T.exp2, T.sp2];
const CURSOR_ON = [[18.6, 106.4]];
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
const TITLE = { tag: 'ANDRI ACADEMY · 7.1', l1: "Your firm's experts,", l2: 'on call.' };
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
  // the mascot is clipped to the card, so nothing hangs over the app while the card pushes up
  mascot('wave', t, .25, T.push + .9, 1180, 330, 640);
  ctx.restore();
}
const NEXT = 'Andri Academy · Next: Actions: write a brief once, use it in chat and workflows';
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
async function renderFrame(v) {
  if (!READY) READY = load();
  await READY;
  const t = logical(v);
  globalT = t;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.globalCompositeOperation = 'source-over';
  background(t);
  const cam = camera(t);
  if (cam.o > 0 && t > T.push - .1) {
    const [sx, sy] = toScreen(cam, 0, 0); const sw = AW * cam.s, sh = AH * cam.s;
    ctx.save(); ctx.globalAlpha *= cam.o;   // multiply, never set: the exit fade lives here (ACADEMY-PROJECT)
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
  if (cam.o > .99 || t < T.exit) cursor(t, cam);
}

window.MG = { width: W, height: H, fps: FPS, duration: DURATION, renderFrame };
if (!navigator.webdriver) { const t0 = performance.now(); (function loop() { renderFrame(((performance.now() - t0) / 1000) % DURATION).then(() => requestAnimationFrame(loop)); })(); }
