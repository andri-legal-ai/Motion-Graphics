// Andri in BaseNeQXt (Dutch) · for Timothy's BaseNet launch, not an Academy video
// Everything is drawn on one <canvas> by renderFrame(t), a pure function of time t (seconds).
// App screens are plates of real Andri staging snapshots (plates/*.png, 2x, built by plates/capture.mjs, 13 Oct 2026).
// Engine, camera, cursor and caption pill are 11.1's (after the approved Academy videos). New for this video (Bennett, 13 Oct,
// reference https://prompt-motion.com/twoclipping-6dd14e, see reference/style-guide.md): an animated opening instead of the
// standing title card, three big kinetic text moments (masked word rise, the yellow highlight block that grows into the app
// window, rolls with ghost trails) and a logo outro.

const W = 1920, H = 1080, FPS = 60;
const DURATION = 142.6;
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
  inq: x => x * x * x,
  back: x => { const a = 1.4, k = a + 1; return 1 + k * Math.pow(x - 1, 3) + a * Math.pow(x - 1, 2); },
};
const P = (t, a, b, e = E.out) => e(cl((t - a) / (b - a)));
const V2 = (t, a, b, fi = .35, fo = .3) => Math.min(P(t, a, a + fi), 1 - P(t, b - fo, b, E.io));

// ------------------------------------------------------------------ assets
const PLATES = ['zl', 'mJ', 'k1', 'kF0', 'kF1', 'k1d', 'pz0', 'pz1', 'n0', 'n0e', 'n1', 'n1e', 'n2', 'n3', 'mD', 'mDq', 'kA', 'kB', 'kBs', 'kBp', 'kBd', 'kBn',
  'cT', 'dock', 'disc', 'th', 'wDoc', 'wHrs', 'wAg'];
const IMG = {};
let RECTS, READY = null;
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(src); i.src = src; }); }
async function load() {
  RECTS = window.RECTS_DATA;
  const jobs = PLATES.map(n => loadImg(ROOT + 'plates/' + n + '.png').then(i => IMG[n] = i));
  jobs.push(loadImg(ROOT + 'assets/Andri-Logo-Ink.svg').then(i => IMG.logo = i));
  jobs.push(loadImg(ROOT + 'assets/Andri-Logo-Icon-Ink.svg').then(i => IMG.icon = i));
  jobs.push(loadImg(ROOT + 'assets/BaseNet-mark.svg').then(i => IMG.bn = i));
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

// ------------------------------------------------------------------ helpers (11.1)
const R = (set, id) => RECTS[set][id];
const box = n => RECTS[n].box;
const C = r => [r[0] + r[2] / 2, r[1] + r[3] / 2];
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function font(w, s, fam = 'Rethink') { ctx.font = `${w} ${s}px ${fam}`; }
function plate(name, a = 1) { if (a <= 0 || !IMG[name]) return; ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(IMG[name], 0, 0, 1440, 860); ctx.restore(); }
function region(name, r, a = 1, dx = 0, dy = 0) { if (a <= 0) return; const [x, y, w, h] = r; ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(IMG[name], x * 2, y * 2, w * 2, h * 2, x + dx, y + dy, w, h); ctx.restore(); }
function xf(a, b, t, t0, d = .3) { const k = P(t, t0, t0 + d, E.io); if (k < 1) plate(a); if (k > 0) plate(b, k); }
function sprite(name, a = 1, dx = 0, dy = 0, sc = 1) {
  if (a <= 0) return; const [x, y, w, h] = box(name); ctx.save(); ctx.globalAlpha *= a;
  ctx.translate(x + w / 2 + dx, y + h / 2 + dy); ctx.scale(sc, sc); ctx.drawImage(IMG[name], -w / 2, -h / 2, w, h); ctx.restore();
}
function floatShadow(name, a = 1, dx = 0, dy = 0, r = 16) {
  if (a <= 0) return; const [x, y, w, h] = box(name);
  ctx.save(); ctx.globalAlpha *= a; ctx.shadowColor = 'rgba(35,30,25,.20)'; ctx.shadowBlur = 28; ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#FFFFFF'; rr(x + dx + 2, y + dy + 2, w - 4, h - 4, r); ctx.fill(); ctx.restore();
}
function ring(t, a, b, r, rad = 10, pad = 5) {
  if (!r) return; const v = V2(t, a, b, .25, .3); if (v <= 0) return;
  const g = P(t, a, a + .35, E.back);
  ctx.save(); ctx.globalAlpha *= v; ctx.strokeStyle = '#E9CD4F'; ctx.lineWidth = 3;
  const p = pad + (1 - g) * 6, m = 3; let x0 = r[0] - p, y0 = r[1] - p, x1 = r[0] + r[2] + p, y1 = r[1] + r[3] + p;
  x0 = Math.max(m, x0); y0 = Math.max(m, y0); x1 = Math.min(1440 - m, x1); y1 = Math.min(860 - m, y1);
  rr(x0, y0, x1 - x0, y1 - y0, Math.min(rad + p, (y1 - y0) / 2)); ctx.stroke(); ctx.restore();
}
function sweep(t, a, lines, end = 1e9) {
  if (!lines || t < a || t > end + .35) return;
  ctx.save(); ctx.globalAlpha *= 1 - P(t, end, end + .35, E.io); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#F8E37C';
  lines.forEach(([x, y, w, h], i) => { const k = P(t, a + i * .5, a + i * .5 + .8, E.io); if (k > 0) { rr(x - 2, y - 1, (w + 4) * k, h + 2, 3); ctx.fill(); } });
  ctx.restore();
}
function caret(t, x, y, h = 18) { if (Math.floor(t * 2.2) % 2 === 0) { ctx.fillStyle = '#241E19'; ctx.fillRect(x + 1, y, 1.4, h); } }
// typed text drawn into a real empty field (Rethink Sans at the field's own size), caret after it
function typed(t, text, t0, t1, x, y, sz = 14, color = '#241E19') {
  if (t < t0) { caret(t, x, y - sz + 1, sz + 4); return; }
  const n = Math.round(P(t, t0, t1, E.lin) * text.length); const s = text.slice(0, n);
  font(400, sz); ctx.fillStyle = color; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y);
  caret(t, x + ctx.measureText(s).width, y - sz + 1, sz + 4);
}
// a real typed field (from the filled plate kF1) revealed letter by letter over the empty one, caret after the text
function typeField(t, f, wInfo, n, t0, t1) {
  if (t < t0 - .4) return;
  const [tw, pad] = wInfo, k = P(t, t0, t1, E.lin), shown = Math.round(k * n) / n;
  if (shown > 0) region('kF1', [f[0], f[1], pad + tw * shown + 1, f[3]]);
  if (t < t1 + .35) caret(t, f[0] + pad + tw * shown, f[1] + f[3] / 2 - 9, 18);
}
// a page change pushes across, clipped below the top bar (1.1)
function push(t, t0, drawA, drawB, dir = 1) {
  const k = P(t, t0, t0 + .6, E.qio);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 67, 1440, 793); ctx.clip();
  ctx.save(); ctx.translate(-dir * 1440 * .3 * k, 0); drawA(); ctx.fillStyle = `rgba(35,30,25,${.06 * k})`; ctx.fillRect(0, 0, 1440, 860); ctx.restore();
  ctx.save(); ctx.translate(dir * 1440 * (1 - k), 0); ctx.shadowColor = 'rgba(35,30,25,.18)'; ctx.shadowBlur = 30; ctx.fillStyle = '#F2EFE9'; ctx.fillRect(0, 67, 1440, 793); ctx.shadowColor = 'transparent'; drawB(); ctx.restore();
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1440, 67); ctx.clip(); (k < .5 ? drawA : drawB)(); ctx.restore();
}
const pl = n => () => plate(n);
function dim(a) { if (a <= 0) return; ctx.save(); ctx.fillStyle = `rgba(36,30,25,${.55 * a})`; ctx.fillRect(0, 0, 1440, 860); ctx.restore(); }

// ------------------------------------------------------------------ timeline (video seconds)
// narration (ElevenLabs "Devin dutch narration Andri", one take, cut at its pauses: audio/nl/L*.wav)
const VO = { L01: 0.7, L02: 6.9, L03: 15.6, L04: 20.6, L05: 27.6, L06: 32.0, L07: 42.4, L08: 50.0, L09: 55.0, L10: 61.0, L11: 66.6, L12: 72.3, L13: 76.6,
  L14: 83.4, L15: 93.6, L16: 100.8, L17: 105.4, L18: 113.2, L19: 125.4, L20: 131.9 };
// where each line starts in the take, so a word heard at take time w plays at wt(line, w) (word times: audio/words.json)
const TS = { L01: 0, L02: 4.55, L03: 13.43, L04: 18.13, L05: 25.00, L06: 29.18, L07: 38.59, L08: 45.85, L09: 50.55, L10: 56.21, L11: 59.91, L12: 65.60, L13: 69.52,
  L14: 75.98, L15: 85.72, L16: 92.84, L17: 97.35, L18: 104.36, L19: 116.40, L20: 122.58 };
const wt = (n, w) => +(VO[n] + w - TS[n]).toFixed(2);
const T = {
  hookOut: 6.45, morph1: 14.35,                      // the hook leaves; the second card's highlight grows into the window on "Zo werkt het"
  row: 17.0, kb1: 19.2, signin: 23.3, user: 27.95, pass: 29.25, go: 31.3,
  pers: 36.95, koppel: 38.55, zaken: 42.3, nieuw: 43.7, nameC: 44.2, dossier: 46.6, opt: 48.85, create: 50.2,
  kb2: 55.5, bn: 56.9,
  exit2: 60.55, morph2: 64.55, send: 67.8,
  kb3: 83.1, cb1: 86.8, cb2: 87.4, sync: 88.6, done: 90.0,
  chat1: 93.7, hrs: 100.9, kb4: 105.6, chat2: 110.3,
  exit3: 112.85, exit4: 125.05,
};
const MORPH = 1.15;                                  // block → window
const Q = 'Hoe is de zorg voor de kinderen verdeeld? Geef een kort overzicht.';
const TYPE = [65.95, 67.55];

// caption steps (the Academy pill), in two runs around the middle text moment
const CAPA = [[VO.L03, 1, 'Aanmelden bij BaseNet'], [VO.L07, 2, 'Dossier koppelen'], [VO.L09, 3, 'Documenten uit BaseNet']], CAPA_END = T.exit2 + .2;
const CAPB = [[T.morph2 + 1.3, 4, 'Vragen over uw dossier'], [VO.L14, 5, 'Synchroniseren naar Andri'], [VO.L15, 6, 'Vastleggen in BaseNeQXt']], CAPB_END = T.exit3 + .2;

// ------------------------------------------------------------------ camera
const POSE = { s: 1.08, cx: 960, cy: 503 };
function shot(name) {
  const full = [0, 0, 1440, 860];
  if (name === 'screen') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy, clip: full, r: 22, o: 1 };
  if (name === 'away') return { fx: 720, fy: 430, s: POSE.s * .93, cx: POSE.cx, cy: POSE.cy - 50, clip: full, r: 22, o: 0 };   // the window steps back and fades
  if (name === 'hidden') return { ...shot('screen'), o: 0 };
  if (name === 'below') return { ...shot('screen'), cy: POSE.cy + 1100 };                                    // under the frame, ready to rise in
  if (name === 'form') return { fx: 720, fy: 430, s: 1.34, cx: 960, cy: 520, clip: full, r: 22, o: 1 };         // the sign-in form
  if (name === 'pzZ') return { fx: 640, fy: 470, s: 1.3, cx: 960, cy: 520, clip: full, r: 22, o: 1 };           // the BaseNet row in Koppelingen
  if (name === 'dlgZ') return { fx: 720, fy: 500, s: 1.16, cx: 960, cy: 470, clip: full, r: 22, o: 1 };         // the New matter dialog and its picker
}
const SHOTS = [[0, 'hidden', 0], [T.morph1 + MORPH, 'screen', 0],
  [23.9, 'form', 1.1], [31.75, 'screen', 1.1],
  [39.25, 'pzZ', 1.1], [41.3, 'screen', .9],
  [T.exit2, 'away', .6], [T.exit2 + .6, 'hidden', 0], [T.morph2 + .3, 'below', 0], [T.morph2 + .32, 'screen', .95],
  [T.exit3, 'away', .6], [T.exit3 + .6, 'hidden', 0]];
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
const WIN = (() => { const s = POSE.s; return [POSE.cx - 720 * s, POSE.cy - 430 * s, 1440 * s, 860 * s]; })();   // the window on screen at rest

// ------------------------------------------------------------------ background (cream to gold, as in the Academy)
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

// ------------------------------------------------------------------ kinetic type (reference/style-guide.md)
// Rethink Sans 700, tight tracking, centred lines. Each word rises through a mask at its line, with a short ghost trail while it moves.
const KF = (s, w = 700) => { ctx.font = `${w} ${s}px Rethink`; ctx.letterSpacing = `${-0.035 * s}px`; };
function layout(lines, size, cy, gap = 1.12) {
  KF(size); const sp = ctx.measureText(' ').width * 1.05; const out = [];
  const lh = size * gap, top = cy - (lines.length * lh) / 2;
  lines.forEach((ln, li) => {
    const ws = ln.map(w => ctx.measureText(w.w).width); const tw = ws.reduce((a, b) => a + b, 0) + sp * (ln.length - 1);
    let x = 960 - tw / 2; const base = top + li * lh + size * .82;
    ln.forEach((w, i) => { out.push({ ...w, x, base, width: ws[i], line: li, top: top + li * lh, lh }); x += ws[i] + sp; });
  });
  return out;
}
// one word: rises in from below while it sharpens and fades in, leaves upward while it blurs and fades out.
// No mask: the letters are always whole (Bennett, 13 Oct: cut-off letters ruin the animation).
function kword(w, size, kin, kout, color = '#231E19') {
  if (kin <= 0 || kout >= 1) return;
  const y = w.base + (1 - kin) * size * .55 - kout * size * .5, a = kin * (1 - kout), b = (1 - kin) * 9 + kout * 9;
  ctx.save(); ctx.globalAlpha *= a; if (b > .3) ctx.filter = `blur(${b.toFixed(1)}px)`;
  KF(size); ctx.fillStyle = color; ctx.textBaseline = 'alphabetic'; ctx.fillText(w.w, w.x, y);
  ctx.restore();
}
// the highlight block behind the accent word (Andri yellow), sweeping left to right; returns its rect
function accentRect(w, size) { return [w.x - size * .12, w.top + size * .14, w.width + size * .24, w.lh - size * .2]; }
function highlight(r, k, a = 1) { if (k <= 0 || a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#F7E17E'; rr(r[0], r[1], r[2] * k, r[3], 12); ctx.fill(); ctx.restore(); }
// a whole text card: words in at their times, accent sweep, then out together (staggered) or morph
function kcard(t, lines, size, cy, { accentAt = null, outAt = null, morphAt = null, sub = null } = {}) {
  const ws = layout(lines, size, cy); let acc = null;
  ws.forEach((w, i) => {
    const kin = P(t, w.at, w.at + .55, E.q);
    const kout = outAt != null ? P(t, outAt + i * .035, outAt + i * .035 + .38, E.inq) : 0;
    if (w.accent) {
      acc = accentRect(w, size);
      const hk = accentAt != null ? P(t, accentAt, accentAt + .45, E.io) : 0;
      if (morphAt == null) {
        // the highlight leaves with its word: it moves up and fades with the text while it wipes away
        if (kout <= 0) highlight(acc, hk);
        else if (kout < 1) { const wk = P(kout, 0, .8, E.io); ctx.save(); ctx.globalAlpha *= 1 - kout; ctx.translate(0, -kout * size * .5);
          highlight([acc[0] + acc[2] * wk, acc[1], acc[2] * (1 - wk), acc[3]], hk); ctx.restore(); }
      } else if (t < morphAt) highlight(acc, hk);
    }
    // before a morph, every word (the accent too) leaves first; only its yellow block stays and grows
    const ko = morphAt != null ? P(t, morphAt - .45 + i * .03, morphAt - .1 + i * .03, E.inq) : kout;
    kword(w, size, kin, ko);
  });
  if (sub) { const a = V2(t, sub.at, outAt != null ? outAt + .3 : morphAt != null ? morphAt : 1e9, .4, .25); if (a > 0) { ctx.save(); ctx.globalAlpha = a; font(500, 34); ctx.letterSpacing = '0px'; ctx.fillStyle = '#6B655E'; ctx.textAlign = 'center'; ctx.fillText(sub.text, 960, cy + lines.length * size * .62 + 40 + (1 - P(t, sub.at, sub.at + .5, E.q)) * 14); ctx.restore(); } }
  return acc;
}
// a roll between big lines (with a small line under each): the old one leaves upward with its trail as the next rises
function roll(t, items, size, cy, end) {
  for (let i = 0; i < items.length; i++) {
    const it = items[i], next = items[i + 1]; const out = next ? next.at : end;
    if (t < it.at - .05 || t > out + .6) continue;
    const ws = layout([it.words.map(w => ({ w }))], size, cy);
    ws.forEach((w, j) => { const kin = P(t, it.at + j * .07, it.at + j * .07 + .5, E.q); const kout = P(t, out + j * .03, out + j * .03 + .36, E.inq);
      if (it.accent === j) highlight(accentRect(w, size), P(t, it.at + .35, it.at + .8, E.io), 1 - kout);
      kword(w, size, kin, kout); });
    const a = V2(t, it.at + .25, out + .25, .4, .2);
    if (a > 0 && it.sub) { ctx.save(); ctx.globalAlpha = a; font(500, 36); ctx.letterSpacing = '0px'; ctx.fillStyle = '#6B655E'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(it.sub, 960, cy + size * .62 + 52 + (1 - P(t, it.at + .25, it.at + .7, E.q)) * 12 - P(t, out, out + .3, E.inq) * 16); ctx.restore(); }
  }
}

// ------------------------------------------------------------------ the opening: Andri and BaseNet, then the hook
const CARD2 = [[{ w: 'Eén', at: wt('L02', 5.9) }, { w: 'keer', at: wt('L02', 6.24) }], [{ w: 'koppelen', at: wt('L02', 6.62), accent: true }]];
const HOOK = [[{ w: 'Andri', at: wt('L01', 2.30) }, { w: 'werkt', at: wt('L01', 2.20) + .14 }, { w: 'nu', at: wt('L01', 2.84) }, { w: 'mee', at: wt('L01', 3.02) }],
  [{ w: 'in', at: wt('L01', 3.22) }, { w: 'uw', at: wt('L01', 3.42) }, { w: 'BaseNeQXt-dossiers', at: wt('L01', 3.56), accent: true }]];
function opening(t) {
  if (t > T.morph1 + MORPH + .1) return;
  // the two marks: Andri and BaseNet, a gold line joins them, then they lift away as the voice moves on
  const out = P(t, 2.25, 2.75, E.inq);
  if (out < 1) {
    const sz = 132, gapX = 150, y = 470;
    const a1 = (x => x <= 0 ? 0 : E.back(x))(cl((t - .15) / .45)), a2 = (x => x <= 0 ? 0 : E.back(x))(cl((t - .45) / .45));
    const line = P(t, .8, 1.35, E.io);
    const lift = out * 70;
    ctx.save(); ctx.globalAlpha = 1 - out;
    if (line > 0) { ctx.strokeStyle = '#E9CD4F'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(960 - gapX + sz / 2 + 18, y - lift); ctx.lineTo(L(960 - gapX + sz / 2 + 18, 960 + gapX - sz / 2 - 18, line), y - lift); ctx.stroke();
      const dk = P(t, 1.25, 1.55, E.back); if (dk > 0) { ctx.fillStyle = '#E9CD4F'; ctx.beginPath(); ctx.arc(960, y - lift, 7 * dk, 0, Math.PI * 2); ctx.fill(); } }
    if (a1 > 0) { ctx.save(); ctx.translate(960 - gapX, y - lift); ctx.scale(a1, a1); ctx.drawImage(IMG.icon, -sz / 2, -sz / 2, sz, sz * 600 / 597); ctx.restore(); }
    if (a2 > 0) { const pulse = 1 + .06 * Math.sin(Math.PI * cl((t - wt('L01', .92)) / .4)); ctx.save(); ctx.translate(960 + gapX, y - lift); ctx.scale(a2 * pulse, a2 * pulse);
      ctx.beginPath(); ctx.roundRect(-sz / 2, -sz / 2, sz, sz, 30); ctx.clip(); ctx.drawImage(IMG.bn, -sz / 2, -sz / 2, sz, sz); ctx.restore(); }
    ctx.restore();
  }
  // the hook, word by word with the voice; its accent block becomes the app window
  const size = 112, cy = 520;
  if (t < T.hookOut + .8) kcard(t, HOOK, size, cy, { accentAt: wt('L01', 3.95), outAt: T.hookOut });
  if (t > wt('L02', 5.7)) {
    const acc = kcard(t, CARD2, 132, 500, { accentAt: wt('L02', 7.3), morphAt: T.morph1, sub: { at: wt('L02', 8.0), text: 'Andri leest de stukken en antwoordt met bronnen' } });
    if (t >= T.morph1 && acc) morphBlock(t, T.morph1, acc, 'zl');
  }
}
// the yellow block grows into the window, the window's own page fades in inside it
function morphBlock(t, t0, from, plateName, drawFn = null) {
  if (t >= t0 + MORPH) return;                       // from here the camera draws the window (same shape and shadow)
  const k = P(t, t0, t0 + MORPH, E.qio);
  const r = from.map((v, i) => L(v, WIN[i], k)), rad = L(12, 22, k);
  ctx.save(); ctx.shadowColor = `rgba(35,30,25,${.16 * k})`; ctx.shadowBlur = 44 * k; ctx.shadowOffsetY = 26 * k;
  ctx.fillStyle = '#F2EFE9'; rr(r[0], r[1], r[2], r[3], rad); ctx.fill();
  ctx.shadowColor = `rgba(35,30,25,${.22 * k})`; ctx.shadowBlur = 1; ctx.shadowOffsetY = 0; ctx.fill(); ctx.restore();
  // the yellow fades into the window colour while it grows
  const ya = 1 - P(t, t0 + MORPH * .35, t0 + MORPH * .75, E.io);
  if (ya > 0) { ctx.save(); ctx.globalAlpha = ya; ctx.fillStyle = '#F7E17E'; rr(r[0], r[1], r[2], r[3], rad); ctx.fill(); ctx.restore(); }
  const a = P(t, t0 + MORPH * .55, t0 + MORPH, E.io);
  if (a > 0) { ctx.save(); rr(r[0], r[1], r[2], r[3], rad); ctx.clip(); ctx.globalAlpha = a; ctx.translate(r[0], r[1]); ctx.scale(r[2] / 1440, r[3] / 860);
    if (drawFn) drawFn(); else ctx.drawImage(IMG[plateName], 0, 0, 1440, 860); ctx.restore(); }
}

// ------------------------------------------------------------------ the middle text moment (into the chat)
const QLINES = [[{ w: 'Vragen', at: wt('L10', 57.78) }, { w: 'stellen', at: wt('L10', 58.2) }],
  [{ w: 'over', at: wt('L10', 58.54) }, { w: 'uw', at: wt('L10', 58.82) }, { w: 'dossier', at: wt('L10', 59.0), accent: true }]];
function moment2(t) {
  if (t < T.exit2 + .3 || t > T.morph2 + .9) return;
  // the line "Nu het belangrijkste" opens it, small, above
  const pre = V2(t, wt('L10', 56.3), T.morph2 + .2, .45, .25);
  if (pre > 0) { ctx.save(); ctx.globalAlpha = pre; font(600, 30); ctx.letterSpacing = '4px'; ctx.fillStyle = '#6B655E'; ctx.textAlign = 'center'; ctx.fillText('NU HET BELANGRIJKSTE', 960, 360 + (1 - P(t, wt('L10', 56.3), wt('L10', 56.3) + .5, E.q)) * 12); ctx.letterSpacing = '0px'; ctx.restore(); }
  kcard(t, QLINES, 124, 545, { accentAt: wt('L10', 59.25), outAt: T.morph2 });
}

// ------------------------------------------------------------------ the security facts (rolls) and the outro
const SAFE = [[wt('L18', 105.3), 'Uw eigen account en uw eigen rechten'], [wt('L18', 108.6), 'Uw wachtwoord alleen om de sessie te starten'],
  [wt('L18', 111.3), 'Privé-dossiers blijven afgeschermd'], [wt('L18', 114.3), 'Alle data blijft in Europa']];
const SAFE_OUT = 125.05;
function moment3(t) {
  if (t < T.exit3 + .3 || t > SAFE_OUT + .9) return;
  kcard(t, [[{ w: 'Veilig', at: T.exit3 + .55 }, { w: 'in', at: T.exit3 + .67 }, { w: 'BaseNeQXt', at: T.exit3 + .79, accent: true }]], 104, 330, { accentAt: T.exit3 + 1.3, outAt: SAFE_OUT });
  KF(44, 600); const wMax = Math.max(...SAFE.map(([, s]) => ctx.measureText(s).width)); const x0 = 960 - (wMax + 70) / 2;
  SAFE.forEach(([at, s], i) => {
    const y = 500 + i * 86, kin = P(t, at, at + .5, E.q), kout = P(t, SAFE_OUT + i * .03, SAFE_OUT + .3 + i * .03, E.inq); if (kin <= 0 || kout >= 1) return;
    const ck = (x => x <= 0 ? 0 : E.back(x))(cl((t - at) / .4));
    ctx.save(); ctx.globalAlpha = 1 - kout; ctx.translate(0, -kout * 40);
    ctx.save(); ctx.translate(x0 + 22, y - 15); ctx.scale(ck, ck); ctx.fillStyle = '#F7E17E'; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#231E19'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-9, 1); ctx.lineTo(-2, 8); ctx.lineTo(10, -7); ctx.stroke(); ctx.restore();
    ctx.beginPath(); ctx.rect(x0 + 60, y - 60, wMax + 40, 78); ctx.clip(); KF(44, 600); ctx.fillStyle = '#231E19'; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x0 + 70, y + (1 - kin) * 50);
    ctx.restore();
  });
}
// the end card, built once and held: the Andri × BaseNet lockup, the webinar, the Academy (no rolls)
function logoLockup(t, t0, cx, cy, lw) {
  const lh = lw * 600 / 2299, lx = cx - (lw + 150) / 2, ly = cy - lh / 2, icW = lw * 600 / 2299;
  const ik = (x => x <= 0 ? 0 : E.back(x))(cl((t - t0) / .45));
  if (ik > 0) { ctx.save(); ctx.beginPath(); ctx.rect(lx - 20, ly - 20, icW + 40, lh + 40); ctx.clip(); ctx.translate(lx + icW / 2, ly + lh / 2); ctx.scale(ik, ik); ctx.drawImage(IMG.logo, -icW / 2, -lh / 2, lw, lh); ctx.restore(); }
  const wk = P(t, t0 + .3, t0 + .95, E.q);
  if (wk > 0) { const wx = lx + lw * 700 / 2299, ww = lw - lw * 700 / 2299; ctx.save(); ctx.beginPath(); ctx.rect(wx, ly - 10, ww * wk + 4, lh + 20); ctx.clip(); if (wk < 1) ctx.filter = `blur(${((1 - wk) * 6).toFixed(1)}px)`;
    ctx.drawImage(IMG.logo, lx + (1 - wk) * -30, ly, lw, lh); ctx.restore(); }
  const bk = (x => x <= 0 ? 0 : E.back(x))(cl((t - t0 - 1.0) / .45));
  if (bk > 0) { const s = lh * .92, by = ly + lh / 2; ctx.save(); font(400, 50); ctx.fillStyle = '#B4ADA3'; ctx.globalAlpha *= P(t, t0 + .95, t0 + 1.3); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('×', lx + lw + 40, by + 2); ctx.restore();
    ctx.save(); ctx.translate(lx + lw + 80 + s / 2, by); ctx.scale(bk, bk); ctx.beginPath(); ctx.roundRect(-s / 2, -s / 2, s, s, s * .22); ctx.clip(); ctx.drawImage(IMG.bn, -s / 2, -s / 2, s, s); ctx.restore(); }
}
const END0 = 125.95;                                 // the logo starts only once the security card has fully left
function outro(t) {
  if (t < END0) return;
  const fade = 1 - P(t, DURATION - 1.1, DURATION - .2, E.io);
  ctx.save(); ctx.globalAlpha = fade;
  logoLockup(t, END0, 960, 300, 470);
  // the webinar: a small label, then the date rises word by word with the voice
  const lab = P(t, wt('L19', 118.7), wt('L19', 118.7) + .4, E.q);
  if (lab > 0) { ctx.save(); ctx.globalAlpha *= lab; font(600, 26); ctx.letterSpacing = '4px'; ctx.fillStyle = '#6B655E'; ctx.textAlign = 'center'; ctx.fillText('LIVE WEBINAR', 960, 488 + (1 - lab) * 10); ctx.restore(); }
  kcard(t, [[{ w: 'Woensdag', at: wt('L19', 119.5) }, { w: '28', at: wt('L19', 119.94) }, { w: 'oktober', at: wt('L19', 120.45) }, { w: '·', at: wt('L19', 121.1) }, { w: '14:00', at: wt('L19', 121.42), accent: true }]], 84, 560, { accentAt: wt('L19', 121.9) });
  // the Academy line
  const ak = P(t, wt('L20', 123.3), wt('L20', 123.3) + .55, E.q);
  if (ak > 0) { ctx.save(); ctx.globalAlpha *= ak; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; KF(44, 600); ctx.fillStyle = '#231E19'; ctx.fillText('academy.andri.ai', 960, 720 + (1 - ak) * 20);
    ctx.letterSpacing = '0px'; font(500, 30); ctx.fillStyle = '#6B655E'; ctx.fillText('korte, praktische lessen', 960, 768 + (1 - ak) * 20); ctx.restore(); }
  ctx.restore();
}

// ------------------------------------------------------------------ the chat thread (as in 1.1: one tall sprite, items appear in turn)
const TH = () => RECTS.th;
const THBOX = () => TH().box;                                     // [57, 141, 1366, h] in app px
const VIS_BOTTOM = 700;                                            // the docked chat box starts here
function thEvents() {
  const th = TH(), ev = [[T.send + .1, th.ub]];
  th.steps.forEach((r, i) => ev.push([T.send + .5 + i * .36, r]));
  th.ans.forEach((r, i) => ev.push([wt('L11', 64.3) + i * .28, r]));
  return ev;
}
// scroll keyframes: steps fill the view, the answer comes up with its citation, back up to the BaseNet steps, down again
const TSCROLL = [[T.send + 2.4, 0], [T.send + 3.2, 330], [wt('L11', 64.2), 330], [wt('L11', 64.2) + .9, 470], [wt('L13', 69.75), 470], [wt('L13', 69.75) + .9, 95]];
function thScroll(t) { let s = TSCROLL[0][1]; for (let i = 1; i < TSCROLL.length; i += 2) { const [a, from] = TSCROLL[i - 1], [b, to] = TSCROLL[i]; if (t >= a) s = L(from, to, P(t, a, b, E.io)); } return s; }
function drawThread(t) {
  const [ox, oy, bw] = THBOX(), sc = thScroll(t);
  ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, bw, VIS_BOTTOM - oy); ctx.clip();
  for (const [a, r] of thEvents()) { const k = P(t, a, a + .4); if (k <= 0) continue; const [x, y, w, h] = r;
    ctx.save(); ctx.globalAlpha *= k; ctx.drawImage(IMG.th, x * 2, y * 2, w * 2, h * 2, ox + x, oy + y - sc + (1 - k) * 14, w, h); ctx.restore(); }
  ctx.restore();
  const g = ctx.createLinearGradient(0, VIS_BOTTOM - 50, 0, VIS_BOTTOM); g.addColorStop(0, 'rgba(252,251,249,0)'); g.addColorStop(1, '#FCFBF9');
  ctx.save(); ctx.fillStyle = g; ctx.fillRect(ox, VIS_BOTTOM - 50, bw, 50); ctx.restore();
}
const thRect = (t, r) => { const [ox, oy] = THBOX(); return [ox + r[0], oy + r[1] - thScroll(t), r[2], r[3]]; };

// ------------------------------------------------------------------ the app, by time
const RAIL1 = [28, 293], RAIL2 = [28, 337];                      // rail: first and second icon (chat or timeline, Kennisbank)
function drawApp(t) {
  // 0 the matters list (the opening's window lands here)
  if (t < T.row + .02) { plate('zl'); return; }
  // 1 a matter, its Kennisbank, Aanmelden bij BaseNet, the form
  if (t < T.row + .64) { push(t, T.row + .02, pl('zl'), pl('mJ')); return; }
  if (t < T.kb1 + .02) { plate('mJ'); return; }
  if (t < T.kb1 + .64) { push(t, T.kb1 + .02, pl('mJ'), pl('k1')); return; }
  if (t < T.signin + .02) { plate('k1'); ring(t, wt('L04', 20.0), T.signin + .1, R('k1', 'signin'), 10, 4); return; }
  if (t < T.go + .1) {
    const a = P(t, T.signin + .02, T.signin + .3, E.out); plate('k1');
    if (a < 1) { plate('kF0', a); return; }
    plate('kF0');
    typeField(t, R('kF0', 'user'), R('kF1', 'userW'), 's.vanhoven'.length, T.user + .1, T.user + .75);
    typeField(t, R('kF0', 'pass'), R('kF1', 'passW'), 17, T.pass + .1, T.pass + .9);
    const ti = R('kF0', 'title'); font(500, 14); const tw = ctx.measureText('Aanmelden bij BaseNet').width;
    ring(t, wt('L04', 23.35), wt('L04', 24.5), [ti[0], ti[1], tw + 2, ti[3]], 6, 5);
    ring(t, T.go - .9, T.go + .15, R('kF0', 'go'), 10, 3);
    return;
  }
  // 2 signed in: the form closes; Personalisatie, Koppelingen, the BaseNet row
  if (t < T.pers + .02) { const a = 1 - P(t, T.go + .1, T.go + .35, E.io); plate('k1d'); if (a > 0) plate('kF1', a); return; }
  if (t < T.zaken + .02) {
    plate('k1d');
    const o = P(t, T.pers + .02, T.pers + .3, E.out) * (1 - P(t, T.zaken + .02, T.zaken + .3, E.io)); dim(o);
    const name = t < T.koppel + .02 ? 'pz0' : 'pz1'; floatShadow(name, o, 0, (1 - o) * -8, 22); sprite(name, o, 0, (1 - o) * -8);
    ring(t, T.koppel - .9, T.koppel + .1, R('pz0', 'koppel'), 8, 3);
    const s = R('pz1', 'bnSigned'); ring(t, wt('L06', 37.0), wt('L06', 37.0) + 2.2, [s[0] - 30, s[1] - 26, s[2] + 40, s[3] + 26], 10, 6);
    return;
  }
  // 3 a new matter with its BaseNet dossier
  if (t < T.zaken + .64) { push(t, T.zaken + .02, pl('k1d'), pl('zl'), -1); return; }
  if (t < T.create + .1) {
    plate('zl');
    const o = P(t, T.nieuw + .02, T.nieuw + .3, E.out); if (o <= 0) return;
    ctx.save(); ctx.globalAlpha = o;
    const pick = t >= T.dossier + .02, typedS = t >= wt('L07', 43.3) + .55, chosen = t >= T.opt + .02;
    if (!pick) {
      plate('n0e'); const f = R('n0', 'name'); typed(t, 'De Vries / Bakker', T.nameC + .2, T.nameC + 1.0, f[0] + 12, f[1] + 25, 14);
      ring(t, wt('L07', 40.9), T.dossier + .1, R('n0', 'dossier'), 10, 4);
    } else if (!chosen) {
      const s = R('n1', 'search'), q0 = T.dossier + .55, q1 = q0 + .55;
      if (t < q1 + .15) { plate('n1e'); typed(t, 'De Vries', q0, q1, s[0] + 26, s[1] + 25, 14); }
      else plate('n2');
    } else { plate('n3'); ring(t, T.opt + .4, T.create + .1, R('n3', 'create'), 10, 3); }
    ctx.restore();
    return;
  }
  if (t < T.create + .7) { push(t, T.create + .1, pl('zl'), pl('mD')); return; }
  // 4 the new matter: its Kennisbank, Andri then the BaseNet source
  if (t < T.kb2 + .02) { plate('mD'); ring(t, wt('L08', 49.2), T.kb2 + .1, R('mD', 'kbBtn'), 12, 3); return; }
  if (t < T.kb2 + .64) { push(t, T.kb2 + .02, pl('mD'), pl('kA')); return; }
  if (t < T.exit2 + .7) {
    xf('kA', 'kB', t, T.bn + .02, .3);
    ring(t, wt('L09', 51.9), T.bn + .1, R('kA', 'basenet'), 8, 3);
    if (t > T.bn) { sweep(t, wt('L09', 53.5), R('kB', 'notice'), T.exit2); ring(t, wt('L09', 54.3), T.exit2, R('kB', 'badge'), 10, 3); }
    return;
  }
  // 5 the conversation: the question typed, sent, Andri's BaseNet steps, the answer with its source
  if (t < T.kb3 + .02) {
    if (t < T.send + .02) { plate(t >= TYPE[0] ? 'mDq' : 'mD'); if (t >= TYPE[0]) { const ta = R('mD', 'ta'); ctx.fillStyle = px('mD', ta[0] + 400, ta[1] + 14); ctx.fillRect(ta[0] + 2, ta[1] + 2, ta[2] - 4, ta[3] - 4);
        typed(t, Q, TYPE[0], TYPE[1], ta[0] + 16, ta[1] + 29, 16); } return; }
    const conv = P(t, T.send + .02, T.send + .45, E.io);
    if (conv < 1) { plate('mDq', 1 - conv); }
    ctx.save(); ctx.globalAlpha *= conv; plate('cT'); drawThread(t); sprite('dock'); sprite('disc'); ctx.restore();
    ring(t, wt('L12', 65.9), wt('L12', 68.5), thRect(t, TH().cite), 8, 4);
    const st = TH().steps; const u = [st[2][0], st[2][1], st[2][2], st[6][1] + st[6][3] - st[2][1]];
    ring(t, wt('L13', 70.2), wt('L13', 74.6), thRect(t, u), 14, 4);
    return;
  }
  // 6 back to the Kennisbank: two files ticked, Synchroniseren naar Andri, In Andri (they stay in BaseNet)
  if (t < T.kb3 + .64) { push(t, T.kb3 + .02, () => { plate('cT'); drawThread(t); sprite('dock'); sprite('disc'); }, pl('kB')); return; }
  if (t < T.chat1 + .02) {
    if (t < T.cb1 + .05) plate('kB');
    else if (t < T.cb2 + .05) { plate('kB'); region('kBs', R('kB', 'f1')); }
    else if (t < T.sync + .05) { plate('kBs'); }
    else if (t < T.done) { plate('kBp'); }
    else { const tk = 1 - P(t, wt('L14', 84.9) + .8, wt('L14', 84.9) + 1.1, E.io); plate('kBn'); if (tk > 0) plate('kBd', tk); }
    ring(t, T.sync - .8, T.sync + .1, R('kBs', 'sync'), 10, 3);
    ring(t, wt('L14', 83.19) - .1, wt('L14', 84.9) + .6, [R('kB', 'f1')[0] + 4, R('kB', 'f1')[1] + 4, R('kB', 'f1')[2] - 8, R('kB', 'f2')[1] + R('kB', 'f2')[3] - R('kB', 'f1')[1] - 8], 10, 2);
    return;
  }
  // 7 writing to BaseNet, only when asked: a document saved (Andri asks first), hours, then e-mail in the dossier and the agenda
  if (t < T.chat1 + .64) { push(t, T.chat1 + .02, pl('kBn'), () => wTurn(t, 'wDoc', T.chat1 + .5)); return; }
  if (t < T.kb4 + .02) {
    const s = P(t, T.hrs, T.hrs + .55, E.io);
    if (s < 1) { ctx.save(); ctx.globalAlpha *= 1 - s; ctx.translate(0, -s * 30); wTurn(t, 'wDoc', T.chat1 + .5); ctx.restore(); }
    if (s > 0) { ctx.save(); ctx.globalAlpha *= s; ctx.translate(0, (1 - s) * 30); wTurn(t, 'wHrs', T.hrs + .2); ctx.restore(); }
    ring(t, wt('L15', 88.3), wt('L15', 89.7), R('wDoc', 'bubble'), 14, 4);
    ring(t, wt('L15', 90.3), T.hrs, R('wDoc', 'chips')[1], 10, 3);
    if (t > T.hrs) { const ch = R('wHrs', 'chips'); ring(t, wt('L16', 93.6), wt('L16', 95.6), [ch[1][0], ch[1][1], ch[1][2], ch[2][1] + ch[2][3] - ch[1][1]], 10, 3); if ((R('wHrs', 'ans') || [])[0]) sweep(t, Math.max(wt('L16', 94.2), wAns('wHrs', T.hrs + .2)), [R('wHrs', 'ans')[0]].map(r => [r[0] + 20, r[1] + 2, Math.min(r[2] - 20, 880), 22]), T.kb4); }
    return;
  }
  if (t < T.kb4 + .64) { push(t, T.kb4 + .02, () => wTurn(t, 'wHrs', 0), pl('kBn')); return; }
  if (t < T.chat2 + .02) { plate('kBn'); ring(t, wt('L17', 98.4), wt('L17', 100.4), R('kB', 'mailType')[0], 6, 5); ring(t, wt('L17', 98.4), wt('L17', 100.4), R('kB', 'mail'), 10, 1); return; }
  if (t < T.chat2 + .64) { push(t, T.chat2 + .02, pl('kBn'), () => wTurn(t, 'wAg', T.chat2 + .4)); return; }
  wTurn(t, 'wAg', T.chat2 + .4);
  const ch = R('wAg', 'chips'); ring(t, wt('L17', 103.3), T.exit3, [ch[0][0], ch[0][1], ch[0][2], ch[2][1] + ch[2][3] - ch[0][1]], 10, 3);
}
// a conversation turn on its own page: the question, then Andri's steps one by one, then the answer
function wTurn(t, name, t0) {
  plate(name);
  const bg = px(name, 1300, 600), ub = R(name, 'ub'), chips = R(name, 'chips'), ans = R(name, 'ans') || [];
  const items = [ub, ...chips, ...ans]; const top = ub[1], last = Math.max(...items.map(r => r[1] + r[3])), bottom = Math.min(last + 84, 860);
  // cover everything of the turn, then draw each item in as it arrives
  ctx.save(); ctx.fillStyle = bg; ctx.fillRect(120, top - 4, 1180, bottom - top); ctx.restore();
  items.forEach((r, i) => { const a = t0 + (i === 0 ? 0 : .35 + (i - 1) * .3), k = P(t, a, a + .35); if (k <= 0) return;
    const rr2 = i === 0 ? [r[0] - 40, r[1] - 4, r[2] + 44, r[3] + 8] : [r[0] - 30, r[1] - 3, r[2] + 40, r[3] + 6]; region(name, rr2, k, 0, (1 - k) * 12); });
  const act = P(t, t0 + .35 + items.length * .3, t0 + .65 + items.length * .3); if (act > 0) region(name, [120, last + 4, 1180, bottom - last - 4], act);
  region(name, [300, 700, 840, 140]);                                   // the docked chat box and its disclaimer stay put
}
const wAns = (name, t0) => t0 + .35 + (R(name, 'chips').length) * .3 + .4;   // when a turn's answer has come in

// ------------------------------------------------------------------ cursor
function cursorPath() {
  const g = (n, k) => C(R(n, k)); const at = (n, k, dx = 0, dy = 0) => { const r = R(n, k); return [r[0] + r[2] / 2 + dx, r[1] + r[3] / 2 + dy]; };
  return [
    [15.5, 15.51, 'enter'], [15.6, T.row, at('zl', 'row1name', -20)],
    [18.3, T.kb1, g('mJ', 'kbBtn')], [20.2, 20.9, [880, 470]], [22.4, T.signin, g('k1', 'signin')],
    [24.4, 25.0, [1000, 560]], [27.3, T.user, at('kF0', 'user', -120)], [28.7, T.pass, at('kF0', 'pass', -120)], [30.5, T.go, g('kF0', 'go')],
    [31.9, 32.7, [880, 560]], [35.9, T.pers, g('k1', 'pers')], [37.6, T.koppel, at('pz0', 'koppel', -40)], [39.0, 39.6, [1100, 330]],
    [41.6, T.zaken, g('zl', 'zaken')], [42.9, T.nieuw, g('zl', 'nieuw')], [43.85, T.nameC, at('n0', 'name', 60)],
    [45.5, T.dossier, at('n0', 'dossier', 90)], [47.9, T.opt, at('n2', 'opt', -40)], [49.4, T.create, g('n3', 'create')],
    [51.0, 51.7, [900, 420]], [54.8, T.kb2, g('mD', 'kbBtn')], [56.1, T.bn, g('kA', 'basenet')], [57.6, 58.3, [760, 640]],
    [59.8, 60.5, 'exit'],
    [65.0, 65.01, 'enter'], [65.1, 65.8, at('mD', 'ta', 200, 10)], [67.0, T.send, g('mD', 'go')], [68.4, 69.2, [1250, 600]],
    [82.2, T.kb3, g('mD', 'kbBtn')], [85.6, T.cb1, g('kB', 'cb1')], [87.0, T.cb2, g('kB', 'cb2')], [87.9, T.sync, g('kBs', 'sync')], [89.3, 89.9, [1060, 640]],
    [92.9, T.chat1, RAIL1], [94.5, 95.2, [1250, 640]], [104.7, T.kb4, RAIL2], [106.3, 107.0, [900, 520]], [109.5, T.chat2, RAIL1], [111.0, 111.7, [1250, 650]],
    [112.2, 112.8, 'exit'],
  ];
}
const CLICKS = [T.row, T.kb1, T.signin, T.user, T.pass, T.go, T.pers, T.koppel, T.zaken, T.nieuw, T.nameC, T.dossier, T.opt, T.create, T.kb2, T.bn,
  T.send, T.kb3, T.cb1, T.cb2, T.sync, T.chat1, T.kb4, T.chat2];
const CURSOR_ON = [[15.5, 60.5], [65.0, 112.8]];
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

// ------------------------------------------------------------------ caption pill (exactly as 1.1 and 11.1), one run at a time
function caption(t, CAP, CAP_END) {
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
  font(700, 19); ctx.fillStyle = '#231E19'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
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

// ------------------------------------------------------------------ frame
async function renderFrame(t) {
  if (!READY) READY = load();
  await READY;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.letterSpacing = '0px'; ctx.filter = 'none';
  background(t);
  const cam = camera(t);
  if (cam.o > 0) {
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
  ctx.save(); opening(t); ctx.restore();
  ctx.save(); moment2(t); ctx.restore();
  ctx.save(); moment3(t); ctx.restore();
  ctx.save(); outro(t); ctx.restore();
  caption(t, CAPA, CAPA_END); caption(t, CAPB, CAPB_END);
  cursor(t, cam);
}

// event times for the mix (audio/cues.mjs reads them from the page)
window.MIX = { VO, CLICKS, WH: [T.morph1, T.row, T.kb1, T.zaken, T.create, T.kb2, T.exit2, T.morph2, T.kb3, T.chat1, T.kb4, T.chat2, T.exit3, END0], DUR: DURATION,
  chapters: [['Introductie', 0], ['1. Aanmelden bij BaseNet', VO.L03], ['2. Dossier koppelen', VO.L07], ['3. Documenten uit BaseNet', VO.L09], ['4. Vragen over uw dossier', VO.L10],
    ['5. Synchroniseren naar Andri', VO.L14], ['6. Vastleggen in BaseNeQXt', VO.L15], ['7. Veilig en privé', VO.L18], ['Webinar en Academy', VO.L19]] };
window.MG = { width: W, height: H, fps: FPS, duration: DURATION, renderFrame };
if (!navigator.webdriver) { const t0 = performance.now(); (function loop() { renderFrame(((performance.now() - t0) / 1000) % DURATION).then(() => requestAnimationFrame(loop)); })(); }
