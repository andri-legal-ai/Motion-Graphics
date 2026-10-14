// Andri Academy 6.1 · Your draft and their contract, finished in Word
// Everything is drawn on one <canvas> by renderFrame(t), a pure function of time t (seconds).
// App screens are plates of the real Word on the web with the real (staging) Andri add-in and the real Microsoft add-in store,
// captured in Chrome on 12 Oct 2026 and cleaned by plates/prep.mjs (pointer removed, demo firm names). All motion is drawn here.
// Engine, camera, captions, cursor, mascot, title and end card follow the approved 1.1, 1.2 and 5.1 videos.

const W = 1920, H = 1080, FPS = 60, LDUR = 142.8;
const CUTS = [];   // time map as in 2.1/5.1 (unused here)
const logical = v => { let L = v; for (const [s, d] of CUTS) { if (d > 0) { if (L >= s) L += d; } else { const h = -d; if (L >= s + h) L -= h; else if (L >= s) L = s; } } return L; };
const videoT = L => { for (let i = CUTS.length - 1; i >= 0; i--) { const [s, d] = CUTS[i]; if (d > 0) { if (L >= s + d) L -= d; else if (L >= s) L = s; } else if (L > s) L += -d; } return L; };
const DURATION = videoT(LDUR);
const c = document.getElementById('c'); c.width = W; c.height = H;
const ctx = c.getContext('2d');
const ROOT = '../';
const AW = 1518, AH = 784;   // the Word window, in app px (one plate pixel = one app px)

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
const PLATES = ['H01-blank', 'H02-overflow', 'H03-addins-panel', 'N39b-casefiles-after', 'H06-opening', 'b58-blank-doc', 'b59-addins-panel', 'b60-addins-search', 'b62-store-home', 'b64-store-search', 'b65-store-listing', 'b67-welcome', 'b68-allow',
  'a14-caselist', 'a15-matter-drafts-empty', 'a16-casefiles', 'a17-open-dialog', 'a19-opening-letter', 'a20-letter-ready', 'a21-date-selected', 'a22-date-typed',
  'a23-para2-selected', 'a24-request-typed', 'a24-request-typed-k', 'a32-review-edits-k', 'a45-clause5-typed-k', 'b68-allow-k', 'a25-thinking', 'a26-steps', 'a27-reply-card', 'a30-card', 'a32-review-edits', 'a34-kept-tracked', 'a35-reviewed-redline',
  'a36-saving', 'a37-saved', 'a38-web-drafts-word', 'a38-web-drafts-word-k', 'a39-pane-drafts', 'a40-open-settlement', 'a41-settlement-open', 'a42-settlement-scrolled', 'a44-clause5-selected',
  'a45-clause5-typed', 'a46-thinking2', 'a47-steps2', 'a48-reply2-card', 'a49-reply2-top', 'a53-review2', 'a54-kept2', 'a55-reviewed2', 'a56-drafts2'];
const IMG = {}, MASC = {};
// 13 Oct 2026 re-film at 2x (devicePixelRatio 2, lossless): every Word + Andri pane screen. The store pages and the web Drafts page stay 1x.
const SHARP = { 'a14-caselist': 'N14-caselist', 'a15-matter-drafts-empty': 'N15-matter', 'a16-casefiles': 'N16-casefiles', 'a17-open-dialog': 'N17-open-dialog',
  'a19-opening-letter': 'N20-letter', 'a20-letter-ready': 'N20-letter', 'a21-date-selected': 'N21-date-selected', 'a22-date-typed': 'N22-date-typed',
  'a23-para2-selected': 'N23-para-selected', 'a24-request-typed': 'N24-request-typed', 'a24-request-typed-k': 'N24-request-typed', 'a25-thinking': 'N25-thinking',
  'a26-steps': 'N25-thinking', 'a30-card': 'N30-reply', 'a32-review-edits': 'N32-review', 'a32-review-edits-k': 'N32-review', 'a34-kept-tracked': 'N35-redline',
  'a35-reviewed-redline': 'N35-redline', 'a36-saving': 'N36-saving', 'a37-saved': 'N37-saved', 'a39-pane-drafts': 'N39-pane-drafts',
  'a40-open-settlement': 'N40-open-settlement', 'a41-settlement-open': 'N41-settlement-open', 'a42-settlement-scrolled': 'N42-settlement-scrolled',
  'a44-clause5-selected': 'N44-clause5-selected', 'a45-clause5-typed': 'N45-clause5-typed', 'a45-clause5-typed-k': 'N45-clause5-typed', 'a46-thinking2': 'N46-thinking2',
  'a47-steps2': 'N46-thinking2', 'a48-reply2-card': 'N48-reply2-card', 'a49-reply2-top': 'N49-reply2-top', 'a53-review2': 'N53-review2', 'a54-kept2': 'N55-reviewed2',
  'a55-reviewed2': 'N55-reviewed2', 'a56-drafts2': 'N56-drafts2', 'b67-welcome': 'H04-welcome', 'b68-allow': 'H05-allow', 'b68-allow-k': 'H05-allow',
  'b58-blank-doc': 'H01-blank', 'b59-addins-panel': 'H03-addins-panel' };
let MMETA, READY = null;
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(src); i.src = src; }); }
async function load() {
  MMETA = window.MASCOT_DATA;
  const jobs = PLATES.map(n => loadImg(ROOT + 'plates/' + (SHARP[n] || n) + '.png').then(i => IMG[n] = i));
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

// ------------------------------------------------------------------ helpers
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function font(w, s, fam = 'Rethink') { ctx.font = `${w} ${s}px ${fam}`; }
// browser pages (store, Andri on the web) were captured at 1568 x 764: fitted to the window width, the page colour below
const WEB = 1518 / 1568;
const isWeb = n => /^b6[245]|^a38/.test(n);
const S = (x, y) => [x * WEB, y * WEB];                     // a point on a browser page -> app px
const SR = r => [r[0] * WEB, r[1] * WEB, r[2] * WEB, r[3] * WEB];
function plate(name, a = 1, dx = 0, dy = 0) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a;
  if (isWeb(name)) { const im = IMG[name]; ctx.drawImage(im, 0, im.height - 2, im.width, 2, dx, dy + 764 * WEB - 1, AW, AH - 764 * WEB + 1); ctx.drawImage(im, dx, dy, AW, 764 * WEB); }
  else ctx.drawImage(IMG[name], dx, dy, AW, AH);
  ctx.restore();
  if (dx === 0 && dy === 0) { ctx.save(); ctx.globalAlpha *= a; soften(name); ctx.restore(); }
}
// part of a plate, in place (or moved by dx, dy)
function region(name, r, a = 1, dx = 0, dy = 0) {
  if (a <= 0) return; const [x, y, w, h] = r; const k = IMG[name].width / AW;   // plate px per app px (1x captures 1, 2x captures 2, browser pages 1/WEB)
  ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(IMG[name], x * k, y * k, w * k, h * k, x + dx, y + dy, w, h); ctx.restore();
}
function soften(name) {   // blur a small area of a plate in place (app px)
  if (!name.startsWith('b65')) return; const r = SR([533, 288, 190, 42]);
  ctx.save(); ctx.beginPath(); ctx.rect(...r); ctx.clip(); ctx.filter = 'blur(5px)'; region(name, [r[0] - 8, r[1] - 8, r[2] + 16, r[3] + 16]); ctx.restore();
}
const pk = (name, t, leave) => t < leave ? name + '-k' : name;
function xf(a, b, t, t0, d = .3) { const k = P(t, t0, t0 + d, E.io); if (k < 1) plate(a); if (k > 0) plate(b, k); }
// gold ring around a small control (app px), only while the voice names it
function ring(t, a, b, r, rad = 10, pad = 5) {
  const v = V2(t, a, b, .25, .3); if (v <= 0) return;
  const g = P(t, a, a + .35, E.back);
  ctx.save(); ctx.globalAlpha *= v; ctx.strokeStyle = '#E9CD4F'; ctx.lineWidth = 3;
  const p = pad + (1 - g) * 6; rr(r[0] - p, r[1] - p, r[2] + p * 2, r[3] + p * 2, rad + p); ctx.stroke(); ctx.restore();
}
// the yellow highlight sweep (as 1.1's source passage and 4.2): multiply, left to right, timed to the words
function sweep(t, a, b, r) {
  const k = P(t, a, a + .8, E.io) * (1 - P(t, b - .3, b, E.io)); if (k <= 0) return;
  const w = r[2] * P(t, a, a + .8, E.io);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha *= 1 - P(t, b - .3, b, E.io);
  ctx.fillStyle = '#F8E37C'; rr(r[0] - 2, r[1] - 1, w + 4, r[3] + 2, 3); ctx.fill(); ctx.restore();
}
function caret(t, x, y, h = 15, col = '#241E19') { if (Math.floor(t * 2.2) % 2 === 0) { ctx.fillStyle = col; ctx.fillRect(x, y - h / 2, 1.3, h); } }
// typing: the empty field is shown, then the real typed text of the later capture is revealed left to right
function reveal(t, name, r, a, b, caretCol, dy = 0) {
  if (t < a) return; const k = P(t, a, b, E.lin); const w = r[2] * k;
  if (w > 0) region(name, [r[0], r[1], w, r[3]], 1, 0, dy);
  if (t < b + .3) caret(t, r[0] + w + 1, r[1] + r[3] / 2 + dy, r[3] - 3, caretCol);
}
// a page switch (a new browser tab, or back): pushes across, as in 1.1
function push(t, t0, from, to, dir = 1, d = .65) {
  const k = P(t, t0, t0 + d, E.qio);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, AW, AH); ctx.clip();
  if (k < 1) { ctx.save(); ctx.translate(-k * AW * dir, 0); from(); ctx.restore(); }
  if (k > 0) { ctx.save(); ctx.translate((1 - k) * AW * dir, 0); to(); ctx.restore(); }
  ctx.restore();
}
// popups (dropdown panels, dialogs) appear with a short fade and a 6 px drop, the way Word and the add-in show them
function pop(t, t0, base, top, d = .18) { const k = P(t, t0, t0 + d, E.out); plate(base); if (k < 1) { ctx.save(); ctx.globalAlpha = k; plate(top); ctx.restore(); } else plate(top); }
// the pane only (right side of the window): for changes that happen in the add-in while the document stays put
const PANE = [1123, 100, 395, 684];
function paneXf(t, t0, a, b, d = .25) { const k = P(t, t0, t0 + d, E.io); plate(a); if (k > 0) region(b, PANE, k); }

// ------------------------------------------------------------------ timeline (video seconds)
// narration: ElevenLabs "UK voice voice to use for ANDRI vids", one take, cut at its 35 sentence pauses (audio/uk/S01..S36.wav)
const VO = { S01: 0.6, S02: 4.9, S03: 9.0, S04: 12.8, S05: 17.4, S06: 24.2, S07: 26.7, S08: 31.0, S09: 36.6, S10: 38.6, S11: 41.6,
  S12: 44.2, S13: 45.4, S14: 48.4, S15: 52.6, S16: 56.4, S17: 58.9, S18: 61.4, S19: 64.1, S20: 66.8, S21: 72.6, S22: 78.0, S23: 80.7,
  S24: 86.6, S25: 90.9, S26: 95.2, S27: 97.0, S28: 101.6, S29: 106.2, S30: 109.6, S31: 113.0, S32: 120.4, S33: 126.4, S34: 130.4,
  S35: 133.7, S36: 138.3 };
const T = {
  push: 7.75,                                   // title card pushes up into Word
  dots: 17.6, addins: 18.5, more: 20.6, store: 20.75, sfocus: 21.9, styp: [22.1, 22.75], senter: 22.95, sres: 23.35,
  card: 24.9, listing: 25.0,
  back: 30.2, dots2: 31.2, addins2: 31.8, andri: 32.5, signin: 34.6, allow: 35.4, list: 36.3,
  nair: 44.6, casefiles: 46.6, letter: 52.4, open: 53.5, loaded: 55.0,
  dateSel: 57.9, dtyp: [59.0, 59.9],
  paraSel: 62.6, field: 67.3, rtyp: [67.55, 70.6], send: 71.3, steps: 73.6, reply: 76.6,
  review: 79.0, keep: 85.6, done1: 86.5, desel: 86.9,
  save: 96.1, saved: 97.3, backList: 99.0, web: 101.5, webBack: 106.0,
  casefiles2: 107.6, settle: 110.6, open2: 111.7, scroll: 113.4, clauseSel: 114.4, field2: 115.2, ptyp1: [115.4, 117.9], ptyp2: [117.9, 119.6], send2: 120.2,
  steps2: 121.6, reply2top: 124.0, reply2card: 126.5, review2: 127.2, keep2: 128.3, done2: 129.1, desel2: 129.5,
  backList2: 133.5,
  exit: 136.7,
};
const END = 137.8;

// captions (step number, text) in the pill under the window
const CAP = [[VO.S03, 1, 'Add Andri to Word'], [VO.S08, 2, 'Sign in'], [VO.S09, 3, 'Your matters'], [VO.S14, 4, 'Open your draft'],
  [VO.S16, 5, 'Small fixes, by hand'], [VO.S18, 6, 'Ask Andri to rewrite'], [VO.S22, 7, 'Review every change'], [VO.S26, 8, 'Save it to the matter'],
  [VO.S29, 9, 'Their contract'], [VO.S34, 10, 'What uses credits']];
const CAP_END = T.exit + .2;

// ------------------------------------------------------------------ camera
const POSE = { s: 1.0, cx: 960, cy: 486 };   // 1:1 with the captures: the window's top-left lands on whole pixels (201, 94), so the screens are not resampled
function zoomOn(r, maxW, maxH, cx = 960, cy = 486, cap = 1.2) { const s = Math.min(cap, maxW / r[2], maxH / r[3]); return { fx: r[0] + r[2] / 2, fy: r[1] + r[3] / 2, s, cx, cy, r: 18, o: 1 }; }
function shot(name) {
  if (name === 'screen') return { fx: AW / 2, fy: AH / 2, s: POSE.s, cx: POSE.cx, cy: POSE.cy, r: 20, o: 1 };
  if (name === 'below') return { fx: AW / 2, fy: AH / 2, s: POSE.s, cx: POSE.cx, cy: POSE.cy + 1100, r: 20, o: 1 };
  if (name === 'dateZ') return zoomOn([230, 120, 680, 330], 1100, 600);     // the letter's date line, typed over by hand (about 1.6x)
  if (name === 'inputZ') return zoomOn([940, 420, 578, 364], 925, 640, 1000, 520);   // the Ask Andri box while a request is typed (about 1.6x)
  if (name === 'paneZ') return zoomOn([900, 150, 618, 634], 1000, 900, 1010, 486);     // the add-in pane: the review panel, the reply (about 1.4x)
  if (name === 'gone') return { ...shot('screen'), o: 0 };
}
const SHOTS = [[0, 'below', 0], [T.push, 'screen', .85],
  [T.field - .35, 'inputZ', 1.1], [T.send + .9, 'screen', 1.1],
  [T.review + .2, 'paneZ', 1.2], [T.keep - .55, 'screen', 1.0],
  [T.field2 - .4, 'inputZ', 1.1], [T.send2 + .9, 'screen', 1.1],
  [T.reply2top + .2, 'paneZ', 1.2], [T.reply2card + .1, 'screen', 1.0],
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
// keep every zoom inside the window (known-issues #6)
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

// ------------------------------------------------------------------ rects (app px, measured on the plates)
const RC = {
  dots: [1334, 88, 32, 31], addins: [1335, 157, 139, 33], more: [1183, 612, 132, 33], myAndri: [1008, 277, 48, 48],   // 2x install screens (H01..H03)
  sbox: SR([8, 58, 270, 28]), stext: SR([17, 64, 40, 16]), card: SR([386, 92, 262, 116]), openBtn: SR([578, 160, 78, 26]),
  signin: [1150, 684, 338, 38], allow: [1368, 517, 70, 22],   // measured on the 2x welcome/allow screens (H04, H05)
  search: [1138, 193, 166, 27], sort: [1310, 193, 102, 27], newcase: [1419, 194, 82, 26], nairRow: [1139, 245, 362, 47],
  casefiles: [1272, 191, 95, 21], letterRow: [1140, 322, 360, 38], openDlg: [1194, 506, 251, 28],
  date: [305, 289, 105, 17], chip: [1150, 634, 340, 18], input: [1146, 656, 342, 17], sendBtn: [1469, 697, 22, 22],
  reviewBtn: [1153, 549, 329, 28], xBtn: [1358, 619, 24, 20], keepBtn: [1386, 619, 70, 20], okBtn: [1458, 619, 24, 20],
  trackBtn: [1192, 72, 99, 21], saveBtn: [1352, 156, 99, 24], backBtn: [1140, 160, 18, 18], v2: [1441, 295, 19, 15],
  webWord: SR([311, 135, 49, 23]), webCard: SR([262, 172, 250, 194]),
  settleRow: [1140, 285, 360, 38], clause5: [326, 502, 420, 50],
  in1: [1146, 656, 312, 17], in2: [1146, 672, 236, 17],
  repay: [1154, 497, 106, 15],
  review2Btn: [1153, 549, 329, 28], keep2: [1386, 437, 70, 20], done: [1324, 718, 52, 22],
};

// ------------------------------------------------------------------ the app, by time
function drawApp(t) {
  // 1 install: a blank document, the Home tab's ••• menu, Add-ins, then the Microsoft add-in store in a new tab (sharp 2x captures)
  if (t < T.dots) { plate('H01-blank'); ring(t, VO.S05 + .25, T.dots - .05, RC.dots, 7, 3); return; }
  if (t < T.addins) { pop(t, T.dots + .03, 'H01-blank', 'H02-overflow'); ring(t, T.dots + .3, T.addins - .05, RC.addins, 7, 3); return; }
  if (t < T.store) {
    pop(t, T.addins + .03, 'H02-overflow', 'H03-addins-panel');
    ring(t, VO.S05 + 2.4, VO.S05 + 3.4, RC.more, 8, 4);
    return;
  }
  if (t < T.store + .7) { push(t, T.store, () => plate('H03-addins-panel'), () => plate('b62-store-home')); return; }
  if (t < T.senter + .05) { plate('b62-store-home'); if (t >= T.styp[0] - .05) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(...SR([10, 61, 260, 22])); region('b64-store-search', SR([8, 82, 271, 3])); }
    reveal(t, 'b64-store-search', RC.stext, T.styp[0], T.styp[1], '#242424'); return; }
  if (t < T.sres) { plate('b64-store-search'); ctx.save(); ctx.globalAlpha = 1 - P(t, T.senter + .05, T.sres, E.io); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(...SR([300, 50, 1268, 700])); ctx.restore(); return; }
  if (t < T.listing) { plate('b64-store-search'); ring(t, VO.S06 + .1, VO.S06 + 1.2, RC.card, 10, 4); return; }
  if (t < T.back) { pop(t, T.listing, 'b64-store-search', 'b65-store-listing', .25); ring(t, VO.S07 + 1.3, VO.S07 + 3.4, RC.openBtn, 8, 5); return; }
  // 2 back in Word: Andri from the add-ins, the welcome pane, sign in
  if (t < T.back + .7) { push(t, T.back, () => plate('b65-store-listing'), () => plate('H01-blank'), -1); return; }
  if (t < T.dots2) { plate('H01-blank'); return; }
  if (t < T.addins2) { pop(t, T.dots2 + .03, 'H01-blank', 'H02-overflow'); return; }
  if (t < T.andri) { pop(t, T.addins2 + .03, 'H02-overflow', 'H03-addins-panel'); ring(t, T.addins2 + .25, T.andri - .05, RC.myAndri, 10, 3); return; }
  if (t < T.signin) { xf('H03-addins-panel', 'b67-welcome', t, T.andri + .02, .22); return; }
  if (t < T.allow) { pop(t, T.signin + .05, 'b67-welcome', pk('b68-allow', t, 34.75), .15); return; }
  if (t < T.list) { xf('b68-allow', 'H06-opening', t, T.allow + .05, .18);   // the prompt closes; the pane says Opening secure sign-in…
    // the secure sign-in window opens over Word and closes by itself: a short wait on the welcome pane, then the matters
    return; }
  // 3 your matters
  if (t < T.nair) { xf('H06-opening', 'a14-caselist', t, T.list, .3);
    ring(t, VO.S10 + .05, VO.S10 + .85, RC.search, 10, 3); ring(t, VO.S10 + .85, VO.S10 + 1.6, RC.sort, 10, 3); ring(t, VO.S10 + 1.6, VO.S10 + 2.6, RC.newcase, 10, 3);
    return; }
  if (t < T.casefiles) { plate('a15-matter-drafts-empty'); ring(t, VO.S13 + .2, T.casefiles - .05, RC.casefiles, 10, 3); return; }
  // 4 open your draft from Case files
  if (t < T.letter) { plate('a16-casefiles'); ring(t, VO.S14 + .3, VO.S14 + 3.7, RC.letterRow, 12, 3); return; }
  if (t < T.open) { pop(t, T.letter + .03, 'a16-casefiles', 'a17-open-dialog', .2); return; }
  if (t < T.loaded) { xf('a17-open-dialog', 'a19-opening-letter', t, T.open + .03, .35); return; }
  if (t < T.dateSel) { paneXf(t, T.loaded, 'a19-opening-letter', 'a20-letter-ready', .3); return; }
  // 5 a small fix by hand: today's date
  if (t < T.dtyp[0]) { plate('a21-date-selected'); return; }
  if (t < T.paraSel) {
    plate('a22-date-typed');
    if (t < T.dtyp[1] + .05) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(RC.date[0] - 1, RC.date[1] - 1, 112, RC.date[3] + 2); reveal(t, 'a22-date-typed', [RC.date[0], RC.date[1], 86, RC.date[3]], T.dtyp[0], T.dtyp[1], '#000'); }
    return;
  }
  // 6 select the paragraph, ask Andri
  if (t < T.field) { plate('a23-para2-selected'); ring(t, VO.S19 + .2, VO.S19 + 2.1, RC.chip, 9, 3); return; }
  if (t < T.send) {   // typing: the box grows at the first key (as in Andri), then the real typed line is revealed
    if (t < T.rtyp[0]) { plate('a23-para2-selected'); return; }
    plate('a24-request-typed');
    if (t < T.rtyp[1] + .05) { ctx.fillStyle = '#FAFBF9'; ctx.fillRect(1146, 655, 344, 19); reveal(t, 'a24-request-typed', RC.input, T.rtyp[0], T.rtyp[1], '#241E19'); }
    return;
  }
  if (t < T.steps) { plate('a25-thinking'); return; }
  if (t < T.reply) { paneXf(t, T.steps, 'a25-thinking', 'a26-steps', .25); return; }
  // 7 review every change
  if (t < T.review) { paneXf(t, T.reply, 'a26-steps', 'a30-card', .35); return; }
  if (t < T.keep) {
    const k = P(t, T.review + .03, T.review + .28, E.out); plate('a30-card'); region(pk('a32-review-edits', t, 84.4), PANE, k, 0, (1 - k) * 10);
    ring(t, VO.S23 + .55, VO.S23 + 1.5, RC.xBtn, 7, 3); ring(t, VO.S23 + 1.5, VO.S23 + 2.4, RC.okBtn, 7, 3); ring(t, VO.S23 + 2.5, VO.S23 + 4.6, RC.keepBtn, 7, 3);
    return;
  }
  if (t < T.desel) { plate('a34-kept-tracked'); return; }
  if (t < T.save) { xf('a34-kept-tracked', 'a35-reviewed-redline', t, T.desel, .2); ring(t, VO.S25 + .2, VO.S25 + 3.4, RC.trackBtn, 6, 3); return; }
  // 8 save to the matter, and where it shows in Andri on the web
  if (t < T.saved) { plate('a36-saving'); return; }
  if (t < T.backList) { paneXf(t, T.saved, 'a36-saving', 'a37-saved', .2); return; }
  if (t < T.web) { plate('a39-pane-drafts'); ring(t, VO.S27 + 2.3, VO.S27 + 4.0, RC.v2, 6, 4); return; }
  if (t < T.webBack) {
    if (t < T.web + .7) { push(t, T.web, () => plate('a39-pane-drafts'), () => plate('a38-web-drafts-word')); return; }
    plate('a38-web-drafts-word');   // the capture's own pointer stays on the Word tab; the drawn cursor rests on it ring(t, VO.S28 + 2.0, VO.S28 + 3.6, RC.webWord, 8, 3); return;
  }
  // 9 their contract: the same way, in its own conversation
  if (t < T.casefiles2) { if (t < T.webBack + .7) { push(t, T.webBack, () => plate('a38-web-drafts-word'), () => plate('a39-pane-drafts'), -1); return; } plate('a39-pane-drafts'); return; }
  if (t < T.settle) { plate('a39-pane-drafts'); region('N39b-casefiles-after', [1123, 180, 395, 604]); ring(t, VO.S30 + .3, T.settle - .05, RC.settleRow, 12, 3); return; }
  if (t < T.open2) { const k = P(t, T.settle + .03, T.settle + .23); plate('a39-pane-drafts'); region('N39b-casefiles-after', [1123, 180, 395, 604]); region('a40-open-settlement', [0, 100, AW, 684], k); return; }
  if (t < T.scroll) { xf('a40-open-settlement', 'a41-settlement-open', t, T.open2 + .03, .35); return; }
  if (t < T.clauseSel) {   // scroll down to clause 5 (the document area only)
    const k = P(t, T.scroll, T.scroll + .7, E.qio), D = 237;
    plate('a41-settlement-open');
    ctx.save(); ctx.beginPath(); ctx.rect(0, 100, 1118, 684); ctx.clip();
    region('a41-settlement-open', [0, 100, 1118, 684], 1, 0, -k * D);
    region('a42-settlement-scrolled', [0, 100, 1118, 684], 1, 0, (1 - k) * D);
    ctx.restore(); return;
  }
  if (t < T.field2) { plate('a44-clause5-selected'); return; }
  if (t < T.send2) {   // the position, typed: the box grows at the first key, then two real lines are revealed
    if (t < T.ptyp1[0]) { plate('a44-clause5-selected'); return; }
    plate('a45-clause5-typed');
    if (t < T.ptyp2[1] + .05) {
      ctx.fillStyle = '#FAFBF9'; ctx.fillRect(1146, 655, 344, 34);
      if (t < T.ptyp2[0]) reveal(t, 'a45-clause5-typed', RC.in1, T.ptyp1[0], T.ptyp1[1], '#241E19');
      else { region('a45-clause5-typed', RC.in1); reveal(t, 'a45-clause5-typed', RC.in2, T.ptyp2[0], T.ptyp2[1], '#241E19'); }
    }
    return;
  }
  if (t < T.steps2) { plate('a46-thinking2'); return; }
  if (t < T.reply2top) { paneXf(t, T.steps2, 'a46-thinking2', 'a47-steps2', .25); return; }
  if (t < T.reply2card) { paneXf(t, T.reply2top, 'a47-steps2', 'a49-reply2-top', .35); sweep(t, VO.S32 + 3.4, VO.S32 + 5.6, RC.repay); return; }
  if (t < T.review2) { paneXf(t, T.reply2card, 'a49-reply2-top', 'a48-reply2-card', .3); return; }
  if (t < T.keep2) { const k = P(t, T.review2 + .03, T.review2 + .28, E.out); plate('a48-reply2-card'); region('a53-review2', PANE, k, 0, (1 - k) * 10); ring(t, VO.S33 + .2, VO.S33 + 1.7, RC.keep2, 7, 3); return; }
  if (t < T.done2) { plate('a54-kept2'); return; }
  if (t < T.backList2) { xf('a54-kept2', 'a55-reviewed2', t, T.done2 + .02, .25); ring(t, VO.S34 + .1, VO.S34 + 2.9, RC.sendBtn, 11, 3); return; }
  // 10 credits: opening matters and saving versions cost nothing
  plate('a56-drafts2'); ring(t, VO.S35 + .9, VO.S35 + 2.8, [1441, 295, 19, 15], 6, 4); ring(t, VO.S35 + .9, VO.S35 + 2.8, [1442, 333, 19, 15], 6, 4);
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
const C = r => [r[0] + r[2] / 2, r[1] + r[3] / 2];
function cursorPath() {
  return [
    [14.8, 14.81, 'enter'], [15.2, 16.4, [760, 420]], [16.6, 17.45, C(RC.dots)], [17.8, 18.35, C(RC.addins)], [19.4, 20.45, C(RC.more)],
    [21.05, 21.75, C(RC.sbox)], [23.4, 24.75, C(RC.card)], [25.4, 26.2, S(700, 214)],
    [29.2, 30.1, [900, 560]], [30.45, 31.05, C(RC.dots)], [31.3, 31.65, C(RC.addins)], [31.95, 32.35, C(RC.myAndri)], [33.3, 34.45, C(RC.signin)], [34.75, 35.25, C(RC.allow)],
    [35.7, 36.2, [1300, 470]],
    [43.3, 44.45, C(RC.nairRow)], [45.6, 46.45, C(RC.casefiles)], [47.3, 47.9, [1320, 470]], [51.4, 52.25, C(RC.letterRow)], [52.7, 53.35, C(RC.openDlg)],
    [55.4, 56.2, [700, 420]], [56.8, 57.75, [355, 297]],
    [60.4, 61.3, [640, 470]], [61.6, 62.45, [500, 568]], [65.9, 67.15, [1205, 672]], [70.75, 71.15, C(RC.sendBtn)],
    [77.9, 78.85, C(RC.reviewBtn)], [84.4, 85.45, C(RC.keepBtn)], [86.3, 87.6, [960, 520]],
    [95.0, 95.95, C(RC.saveBtn)], [97.9, 98.85, C(RC.backBtn)], [99.6, 100.6, [1000, 560]],
    [101.0, 101.35, [1000, 560]], [102.2, 103.2, S(335, 146)],
    [106.6, 107.45, C(RC.casefiles)], [109.6, 110.45, C(RC.settleRow)], [110.9, 111.55, C(RC.openDlg)],
    [112.4, 113.25, [553, 500]], [113.6, 114.25, [500, 528]], [114.55, 115.05, [1205, 672]], [119.75, 120.05, C(RC.sendBtn)],
    [126.4, 127.05, C(RC.review2Btn)], [127.5, 128.15, C(RC.keep2)], [129.0, 130.3, [960, 520]],
    [132.6, 133.35, C(RC.backBtn)], [134.0, 135.0, [1060, 600]], [135.8, 136.6, 'exit'],
  ];
}
const CLICKS = [T.dots, T.addins, T.more, T.sfocus, T.card, T.dots2, T.addins2, T.andri, T.signin, T.allow,
  T.nair, T.casefiles, T.letter, T.open, T.dateSel, T.paraSel, T.field, T.send, T.review, T.keep,
  T.save, T.backList, T.casefiles2, T.settle, T.open2, T.clauseSel, T.field2, T.send2, T.review2, T.keep2, T.backList2];
const CURSOR_ON = [[14.8, 136.6]];
function cursor(t, cam) {
  if (!CURSOR_ON.some(([a, b]) => t >= a && t < b)) return;
  const path = cursorPath(); let pos = null;
  const resolve = tg => tg === 'enter' ? [1980, 1140] : tg === 'exit' ? [2000, 1150] : toScreen(cam, tg[0], tg[1]);
  for (const [a, b, tg] of path) { const p = resolve(tg); if (!pos) pos = p; if (t >= b) { pos = p; continue; } if (t > a) { const k = E.io((t - a) / (b - a)); pos = [L(pos[0], p[0], k), L(pos[1], p[1], k)]; } break; }
  const press = CLICKS.some(cc => t >= cc - .07 && t < cc + .15);
  for (const cc of CLICKS) if (t >= cc && t < cc + .45) { const k = (t - cc) / .45; ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#C9A733'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(pos[0], pos[1], 9 + 26 * E.out(k), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  window.__cur = pos;
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
  const popK = (x => x <= 0 ? 0 : E.back(x))(cl((t - first) / .32)) * (1 - P(t, CAP_END - .1, CAP_END + .1, E.io));
  if (popK <= 0) return;
  const x = 960 - w / 2, y = 1022 - H / 2;
  ctx.save();
  ctx.translate(960, y + H / 2); ctx.scale(popK, popK); ctx.translate(-960, -(y + H / 2));
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
const TITLE = { tag: 'ANDRI ACADEMY · 6.1', l1: 'Your draft and their contract,', l2: 'finished in Word.' };
function title(t) {
  if (t > T.push + .9) return;
  const up = P(t, T.push, T.push + .8, E.qio);
  ctx.save(); ctx.translate(0, -up * 1080);
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  ctx.fillStyle = '#F7E17E'; ctx.fillRect(0, 0, W, H);
  const e = P(t, 0.3, 0.75); font(600, 22); ctx.fillStyle = '#494746'; ctx.globalAlpha = e;
  ctx.letterSpacing = '3px'; ctx.fillText(TITLE.tag, 122, 392); ctx.letterSpacing = '0px'; ctx.globalAlpha = 1;
  // 1.2 sizes (128 / 84); a long first line is fitted to end before the mascot
  font(500, 128, 'Neco'); const s1 = Math.min(128, Math.floor(128 * 1040 / ctx.measureText(TITLE.l1).width));
  words(TITLE.l1, 120, 530, 0.5, .09, s1, 500, '#231E19');
  words(TITLE.l2, 120, 640, 1.15, .09, 84, 400, '#231E19');
  mascot('wave', t, .25, T.push + .9, 1180, 330, 640);
  ctx.restore();
}
const NEXT = "Andri Academy · Next: Your firm's experts, on call";
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
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  background(t);
  const cam = camera(t);
  if (cam.o > 0 && t > T.push - .1) {
    const [sx, sy] = toScreen(cam, 0, 0); const sw = AW * cam.s, sh = AH * cam.s;
    ctx.save(); ctx.globalAlpha = cam.o;
    ctx.shadowColor = 'rgba(35,30,25,.16)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 26; ctx.fillStyle = '#F5F5F5'; rr(sx, sy, sw, sh, cam.r); ctx.fill();
    ctx.shadowColor = 'rgba(35,30,25,.22)'; ctx.shadowBlur = 1; ctx.shadowOffsetY = 0; ctx.fill(); ctx.shadowColor = 'transparent';
    rr(sx, sy, sw, sh, cam.r); ctx.clip();
    ctx.translate(cam.cx - cam.fx * cam.s, cam.cy - cam.fy * cam.s); ctx.scale(cam.s, cam.s);
    drawApp(t - .12);   // the screen changes a few frames after each click lands (the button is still there when pressed); drawApp multiplies globalAlpha, never sets it, so the exit fade holds
    ctx.restore();
  }
  endCard(t);
  title(t);
  caption(t);
  cursor(t, cam);
}

window.MG = { width: W, height: H, fps: FPS, duration: DURATION, renderFrame };
if (!navigator.webdriver) { const t0 = performance.now(); (function loop() { renderFrame(((performance.now() - t0) / 1000) % DURATION).then(() => requestAnimationFrame(loop)); })(); }
