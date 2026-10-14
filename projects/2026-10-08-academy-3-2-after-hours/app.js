// Andri Academy 3.2 · Andri works while you sleep
// Everything is drawn on one <canvas> by renderFrame(t), a pure function of time t (seconds).
// App screens are still plates of the Andri rebuild (plates/*.png, 2x); all motion is drawn here.
// Engine, camera, captions, cursor, mascot and end card follow the approved 1.1 and 1.2 videos.

const W = 1920, H = 1080, FPS = 60, DURATION = 60.6;
const c = document.getElementById('c'); c.width = W; c.height = H;
const ctx0 = c.getContext('2d');
let ctx = ctx0;
// the window is drawn into its own layer when it fades, so its stacked plates fade as one picture
const lay = document.createElement('canvas'); lay.width = W; lay.height = H; const layCtx = lay.getContext('2d');
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
  const plates = ['m0', 'm0hot', 'pmAns', 'pmOff', 'pmOn', 'tipD'];
  const jobs = plates.map(n => loadImg(ROOT + 'plates/' + n + '.png').then(i => IMG[n] = i));
  jobs.push(loadImg(ROOT + 'assets/Andri-Logo-Ink.svg').then(i => IMG.logo = i));
  for (const pose of ['wave', 'done', 'disc', 'tick']) {
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
function plate(name, alpha = 1) { if (alpha <= 0) return; ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(IMG[name], 0, 0, 1440, 860); ctx.restore(); }
function sprite(name, alpha = 1, dx = 0, dy = 0, scale = 1) {
  if (alpha <= 0) return;
  const [x, y, w, h] = box(name); ctx.save(); ctx.globalAlpha *= alpha;
  ctx.translate(x + w / 2 + dx, y + h / 2 + dy); ctx.scale(scale, scale);
  ctx.drawImage(IMG[name], -w / 2, -h / 2, w, h); ctx.restore();
}
function font(w, s, fam = 'Rethink') { ctx.font = `${w} ${s}px ${fam}`; }
// gold ring around a small control (app px), fades in and out over [a, b]
function ring(t, a, b, r, rad = 10, pad = 5) {
  const v = V2(t, a, b, .25, .3); if (v <= 0) return;
  const g = P(t, a, a + .35, E.back);
  ctx.save(); ctx.globalAlpha *= v; ctx.strokeStyle = '#E9CD4F'; ctx.lineWidth = 3;
  const p = pad + (1 - g) * 6; rr(r[0] - p, r[1] - p, r[2] + p * 2, r[3] + p * 2, rad + p); ctx.stroke(); ctx.restore();
}
const C = r => [r[0] + r[2] / 2, r[1] + r[3] / 2];
// shadow under a floating piece of UI (its plate has no shadow and transparent corners: known-issues 1)
function floatShadow(r, rad, blur, offY, col, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.shadowColor = col; ctx.shadowBlur = blur; ctx.shadowOffsetY = offY; ctx.fillStyle = '#FFFFFF';
  rr(r[0], r[1], r[2], r[3], rad); ctx.fill(); ctx.restore();
}

// ------------------------------------------------------------------ timeline (video seconds)
// narration (ElevenLabs, "UK voice voice to use for ANDRI vids") start times, matched to audio/mix-uk.wav
const VO = { L0: 0.6, L1: 5.6, L2: 9.4, L3: 14.0, L4: 22.0, L5: 31.9, L6: 41.8, L7: 49.7, L8: 54.75 };
const CLICK_SL = 7.9, OPEN = 8.0, CLICK_AH = 11.0, CLICK_ON = 17.9;
const TIP_A = 35.8, TIP_B = 41.0;

// cursor: [t0, t1, target]; targets in app px (resolved through the camera at draw time)
function cursorPath() {
  const sl = R('m0', 'tbSl'), nv = R('pmAns', 'nv4'), on = R('pmOff', 'tgR_1'), q = R('pmOn', 'qD');
  return [
    [5.7, 5.71, 'enter'], [5.9, 6.85, C(sl)], [8.5, 8.51, C(sl)], [9.5, 10.5, C(nv)], [11.6, 12.4, [C(nv)[0] + 60, C(nv)[1] + 200]], [13.0, 13.6, 'exit'],
    [15.5, 15.51, 'exit'], [15.6, 16.9, C(on)], [18.7, 19.4, 'exit'],
    [34.5, 34.51, 'exit'], [34.6, 35.6, [C(q)[0] + 2, C(q)[1] + 2]], [41.0, 41.6, 'exit'],
  ];
}
const CLICKS = [CLICK_SL, CLICK_AH, CLICK_ON];
const CURSOR_ON = [[5.7, 13.6], [15.5, 19.4], [34.5, 41.6]];

// captions (step number, text) shown in the pill under the window, as in the storyboard
const CAP = [[5.6, 1, 'Open Personalisation'], [14.0, 2, 'Matter reflections'], [31.9, 3, 'Nightly dreams'], [49.7, 4, 'Switch either off']];
const CAP_END = 53.6;

// ------------------------------------------------------------------ camera
const POSE = { s: 1.08, cx: 960, cy: 503 };
function zoomOn(r, maxW, maxH, cx = 960, cy = 500) { const s = Math.min(maxW / r[2], maxH / r[3]); return { fx: r[0] + r[2] / 2, fy: r[1] + r[3] / 2, s, cx, cy, clip: r, r: 18, o: 1 }; }
const SW = [384, 122, 478, 268], DR = [376, 134, 470, 258], MAIL = [872, 64, 364, 266], PROF = [874, 354, 360, 426];   // MAIL: Preview header, label and the email, as Bennett framed it
function shot(name) {
  const full = [0, 0, 1440, 860];
  if (name === 'screen') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy, clip: full, r: 22, o: 1 };
  if (name === 'below') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy + 1100, clip: full, r: 22, o: 1 };
  if (name === 'sw') return zoomOn(SW, 1500, 780);
  if (name === 'dr') return zoomOn(DR, 1500, 780);
  if (name === 'mail') return zoomOn(MAIL, 1500, 780);
  if (name === 'prof') return zoomOn(PROF, 1500, 820);
  if (name === 'swOut') { const z = zoomOn(SW, 1500, 780); return { ...z, s: z.s * 1.03, o: 0 }; }   // plain fade out, no zoom (holds the drifted scale)
}
// Bennett, 8 Oct: zoom back out to the whole screen between close-ups, never pan from one zoom to the next.
// Close-ups: the reflections switch, the preview email, the dreams help, the profile and the switches, each entered from the full screen.
const SHOTS = [[0, 'below', 0], [4.7, 'screen', 0.85], [13.4, 'sw', 0.9], [21.3, 'screen', 0.9], [22.5, 'mail', 1.0], [30.2, 'screen', 0.9], [31.4, 'dr', 1.0],
  [40.9, 'screen', 0.9], [42.4, 'prof', 1.0], [48.3, 'screen', 0.9], [49.6, 'sw', 1.0], [53.5, 'swOut', 1.0]];
// zoomed shots push in slowly (3%) while they hold, so a long narration line never sits on a still frame
const DRIFT = { sw: .03, dr: .03, mail: .03, prof: .03 };
function shotAt(i, t) {
  const o = shot(SHOTS[i][1]), dr = DRIFT[SHOTS[i][1]] || 0;
  if (dr) { const a = SHOTS[i][0], b = i + 1 < SHOTS.length ? SHOTS[i + 1][0] : DURATION; o.s *= 1 + dr * E.io(cl((t - a) / (b - a))); }
  return o;
}
function camera(t) {
  let i = 0; while (i < SHOTS.length - 1 && SHOTS[i + 1][0] <= t) i++;
  const cur = shotAt(i, t), d = SHOTS[i][2];
  if (i === 0 || d === 0) return cur;
  const prev = shotAt(i - 1, t); const k = E.qio(cl((t - SHOTS[i][0]) / d));
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
    if (k > 0) { ctx.save(); ctx.globalAlpha = k * (1 - out); ctx.fillText(w, cx, y + (1 - k) * 44 - out * 22); ctx.restore(); }
    cx += ctx.measureText(w + ' ').width;
  });
}

// ------------------------------------------------------------------ the app
function drawApp(t) {
  // matter screen; the sliders button shows its hover state and tooltip while the cursor rests on it
  plate('m0');
  plate('m0hot', V2(t, 6.75, OPEN + .05, .12, .1));
  ring(t, 6.95, 7.85, R('m0', 'tbSl'), 10, 3);
  // Personalisation: scrim, then the panel (opens on Andri's answers)
  const op = P(t, OPEN, OPEN + .16, E.out);
  if (op <= 0) return;
  ctx.save(); ctx.globalAlpha *= op; ctx.fillStyle = 'rgba(20,16,12,.26)'; ctx.fillRect(0, 0, 1440, 860); ctx.restore();
  // as in staging, the panel opens with its left side (the section list) widening into view
  const rv = P(t, OPEN, OPEN + .34, E.q), [bx, by, bw, bh] = box('pmAns'), cut = 66 * (1 - rv);
  floatShadow([bx + cut, by, bw - cut, bh], 15, 46, 18, 'rgba(30,24,18,.22)', op);
  ctx.save(); rr(bx + cut, by, bw - cut, bh, 15); ctx.clip();
  const ah = P(t, CLICK_AH + .05, CLICK_AH + .17, E.io);                 // page switch (instant in the app; a 0.12 s blend)
  const on = t >= CLICK_ON + .05 ? 1 : 0;                                // reflections switched on: an instant swap, as in the app (no blend, so the two layouts never show at once)
  // the new state is laid over the old one, so nothing behind the panel shows through mid-blend
  if (ah < 1) sprite('pmAns', op);
  if (ah > 0) { if (on < 1) sprite('pmOff', op * ah); if (on > 0) sprite('pmOn', op * ah * on); }
  ctx.restore();
  ring(t, 17.3, 17.85, R('pmOff', 'tgR_1'), 9, 3);
  // Nightly dreams help (hover on its ?)
  const tp = V2(t, TIP_A, TIP_B, .18, .2);
  if (tp > 0) { const dy = (1 - P(t, TIP_A, TIP_A + .25, E.out)) * 4, b = box('tipD');
    floatShadow([b[0], b[1] + dy, b[2], b[3]], 8.3, 15, 5.5, 'rgba(60,45,20,.10)', tp); sprite('tipD', tp, 0, dy); }
  // either one switches off: rings on both Off buttons (not clicked)
  ring(t, 50.85, 53.1, R('pmOn', 'tgR_0'), 9, 3);
  ring(t, 51.2, 53.1, R('pmOn', 'tgD_0'), 9, 3);
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
  if (t > 5.6) return;
  const up = P(t, 4.7, 5.5, E.qio);
  ctx.save(); ctx.translate(0, -up * 1080);
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  ctx.fillStyle = '#F7E17E'; ctx.fillRect(0, 0, W, H);
  const e = P(t, 0.3, 0.75); font(600, 22); ctx.fillStyle = '#494746'; ctx.globalAlpha = e;
  ctx.letterSpacing = '3px'; ctx.fillText('ANDRI ACADEMY · 3.2', 122, 392); ctx.letterSpacing = '0px'; ctx.globalAlpha = 1;
  words('Andri works', 120, 530, 0.5, .09, 128, 500, '#231E19', null);
  words('while you sleep.', 120, 640, 1.0, .09, 84, 400, '#231E19', null);
  mascot('wave', t, .25, 5.6, 1180, 330, 640);
  ctx.restore();
}
function endCard(t) {
  if (t < 54.65) return;
  const a = P(t, 54.7, 55.3), dy = (1 - P(t, 54.7, 55.4, E.q)) * 24;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(0, dy);
  ctx.drawImage(IMG.logo, 512, 438, 520, 520 * 600 / 2299);
  font(500, 25); ctx.fillStyle = '#494746'; ctx.textBaseline = 'alphabetic'; ctx.fillText('Andri Academy · Next: Case law research, start to finish', 515, 635);
  ctx.restore();
  // mascot, then the tick springs in with a slight twist (as in 1.1)
  const m = mascot('done', t, 54.9, 63.0, 1105, 400, 420, { from: 'pop' });
  if (m) {
    const b = MMETA.done.badge, sc = m.sc;
    const bx = m.x + m.w / 2 + (b[0] * m.w + b[2] * m.w / 2 - m.w / 2) * sc, by = m.y + m.h + (b[1] * m.h + b[3] * m.h / 2 - m.h) * sc;
    const fi = Math.floor((t - 54.9) * MMETA.disc.fps) % MMETA.disc.frames, mw = m.w * m.sc, mh = m.h * m.sc;
    const ox = m.x + m.w / 2 - mw / 2, oy = m.y + m.h + m.dy - mh;
    const x = cl((t - 55.4) / .34), k = x <= 0 ? 0 : E.back(x);
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
  if (cam.o > 0 && t > 4.7) {
    // the app is drawn unclipped into its own layer, then the layer is clipped to the window once:
    // stacked plates never bleed at the antialiased edge, and the whole window fades as one picture
    const [x, y, w, h] = cam.clip; const [sx, sy] = toScreen(cam, x, y); const sw = w * cam.s, sh = h * cam.s;
    ctx = layCtx; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#F2EFE9'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(cam.cx - cam.fx * cam.s, cam.cy - cam.fy * cam.s); ctx.scale(cam.s, cam.s); drawApp(t); ctx.restore();
    ctx = ctx0;
    ctx.save(); ctx.globalAlpha = cam.o;
    ctx.shadowColor = 'rgba(35,30,25,.16)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 26; ctx.fillStyle = '#F2EFE9'; rr(sx, sy, sw, sh, cam.r); ctx.fill();
    ctx.shadowColor = 'rgba(35,30,25,.22)'; ctx.shadowBlur = 1; ctx.shadowOffsetY = 0; ctx.fill(); ctx.shadowColor = 'transparent';
    rr(sx, sy, sw, sh, cam.r); ctx.clip(); ctx.drawImage(lay, 0, 0);
    ctx.restore();
  }
  endCard(t);
  title(t);
  caption(t);
  cursor(t, cam);
}

window.MG = { width: W, height: H, fps: FPS, duration: DURATION, renderFrame };
if (!navigator.webdriver) { const t0 = performance.now(); (function loop() { renderFrame(((performance.now() - t0) / 1000) % DURATION).then(() => requestAnimationFrame(loop)); })(); }
