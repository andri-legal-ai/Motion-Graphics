// Andri Academy 4.1 · Case law research, start to finish
// Everything is drawn on one <canvas> by renderFrame(t), a pure function of time t (seconds).
// App screens are plates rebuilt from the live staging DOM (staging-snapshot/ -> screens/build.mjs -> plates/*.png, 2x).
// Engine, camera, captions, cursor, mascot and end card follow the approved 1.1, 1.2 and 3.1 videos.
// The app window is staging's own size, 1470 x 835 (window coordinates = staging page coordinates).

const W = 1920, H = 1080, FPS = 60, DURATION = 77.8;
const AW = 1470, AH = 835;
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

// ------------------------------------------------------------------ assets
const IMG = {}, MASC = {};
let RECTS, MMETA, READY = null;
const PLATES = ['clA', 'clB', 'clC', 'clC1', 'clC2', 'spJur', 'spExplore', 'spExploreHot', 'spDlg0', 'spDlg1',
  'rvBuilder', 'rvPanel0', 'rvPanel1', 'rvPanel2', 'rvPanel3', 'rvReady', 'rvRunQ', 'rvRunT', 'rvRunA', 'rvDone',
  'chGreet', 'chConv', 'spThread', 'spThreadWork', 'spCbMid', 'spCbMidOn', 'spCbDock'];
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(src); i.src = src; }); }
async function load() {
  RECTS = window.RECTS_DATA; MMETA = window.MASCOT_DATA;
  const jobs = PLATES.map(n => loadImg(ROOT + 'plates/' + n + '.png').then(i => IMG[n] = i));
  jobs.push(loadImg(ROOT + 'plates/bailii.jpg').then(i => IMG.bailii = i));
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
const R = (set, id) => RECTS[set][id];
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function plate(name, alpha = 1) { if (alpha <= 0) return; ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(IMG[name], 0, 0, AW, AH); ctx.restore(); }
// a source region (window px) of a plate drawn at a destination (window px)
function region(name, sx, sy, sw, sh, dx, dy, alpha = 1) {
  if (alpha <= 0) return; ctx.save(); ctx.globalAlpha *= alpha;
  ctx.drawImage(IMG[name], sx * 2, sy * 2, sw * 2, sh * 2, dx, dy, sw, sh); ctx.restore();
}
function sprite(name, x, y, w, h, alpha = 1, scale = 1) {
  if (alpha <= 0) return; ctx.save(); ctx.globalAlpha *= alpha;
  ctx.translate(x + w / 2, y + h / 2); ctx.scale(scale, scale); ctx.drawImage(IMG[name], -w / 2, -h / 2, w, h); ctx.restore();
}
// shadow for a floating sprite captured without its own (known-issues #1)
function floatShadow(x, y, w, h, r, alpha = 1, kind = 'pop') {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha;
  if (kind === 'pop') { ctx.shadowColor = 'rgba(0,0,0,.14)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6; }
  else if (kind === 'dlg') { ctx.shadowColor = 'rgba(0,0,0,.22)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12; }
  else { ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 28; ctx.shadowOffsetY = 12; }
  ctx.fillStyle = '#FEFDFB'; rr(x + 2, y + 2, w - 4, h - 4, r); ctx.fill(); ctx.restore();
}
function font(w, s, fam = 'Rethink') { ctx.font = `${w} ${s}px ${fam}`; }
function ring(t, a, b, r, rad = 9, pad = 4) {
  const v = V2(t, a, b, .25, .3); if (v <= 0) return;
  const g = P(t, a, a + .35, E.back);
  ctx.save(); ctx.globalAlpha *= v; ctx.strokeStyle = '#E9CD4F'; ctx.lineWidth = 3;
  const p = pad + (1 - g) * 6; rr(r[0] - p, r[1] - p, r[2] + p * 2, r[3] + p * 2, rad + p); ctx.stroke(); ctx.restore();
}
const C = r => [r[0] + r[2] / 2, r[1] + r[3] / 2];
function caret(t, x, y, h = 20, col = '#241E19') { if (Math.floor(t * 2.2) % 2 === 0) { ctx.fillStyle = col; ctx.fillRect(x + 1, y - h + 4, 1.5, h); } }
function typedPart(t, text, a, b) { return text.slice(0, Math.round(P(t, a, b, E.lin) * text.length)); }
function wrap(text, maxW) {
  const words = text.split(' '); const lines = []; let cur = '';
  for (const w of words) { const nx = cur ? cur + ' ' + w : w; if (ctx.measureText(nx).width > maxW && cur) { lines.push(cur); cur = w; } else cur = nx; }
  if (cur || !lines.length) lines.push(cur); return lines;
}
function spinner(t, x, y, r, col = 'rgb(99,131,99)', lw = 1.6) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y, r, t * 6.5, t * 6.5 + 4.2); ctx.stroke(); ctx.restore(); }

// ------------------------------------------------------------------ timeline (video seconds)
// narration (ElevenLabs "UK voice voice to use for ANDRI vids", one take) start times, matched to audio/mix-uk.wav
const VO = { L1: 0.6, L2: 7.6, L3: 15.8, L4: 21.9, L5: 31.6, L6: 38.2, L7: 43.5, L8: 50.4, L9a: 59.3, L9b: 62.55, L10: 69.95 };
const T = {
  exploreClick: 8.6, caseClick: 9.85, pushCL: 9.95, jurClick: 11.75, jurClose: 14.8, empClick: 20.3,
  searchClick: 31.95, typeS: [32.1, 33.9], results: 34.5,
  viewClick: 38.95, bailIn: 39.0, bailOut: 42.7,
  tick1: 44.6, tick2: 45.3, addTR: 46.9, nairClick: 48.4, addClick: 49.5, pushRV: 49.75,
  clickQ: 51.4, qboxClick: 51.95, typeQ: [52.1, 54.1], done: 54.6, start: 55.45, runT: 56.0, runA: 57.0, runDone: 57.9,
  railChat: 59.85, pushCH: 60.0, cbClick: 60.85, typeC: [60.95, 62.35], send: 62.55,
  END: 69.45,
};
const SEARCH = 'maternity redundancy sham consultation';
const QUESTION = 'Did the tribunal find the redundancy was genuine? Say why in one sentence.';
const ASK = 'Does the Acas Code uplift apply to a redundancy dismissal?';
// thread rows in the order staging showed them (captures 36 to 41)
const S = 62.55;
const TH = { user: S + .05, w0: [S + .25, S + .6], wmem: [S + .6, S + 1.0], wthk: [S + .7, S + 1.0], s1: S + 1.0, s2: S + 1.3, s3: S + 1.6, wana: [S + 1.7, S + 2.2], think: S + 2.2, p1: S + 2.6, p2: S + 3.1, p3: S + 3.6, p4: S + 4.1, scroll: [S + 3.2, S + 3.8, 160] };

// cursor: [t0, t1, target]; targets in window px (resolved through the camera at draw time)
function cursorPath() {
  const ex = [344.7 + 10 + 142, 17 + 46 + 36];
  return [
    [7.6, 7.61, 'enter'], [7.7, 8.5, [381, 34]], [8.9, 9.65, ex],
    [10.6, 11.55, [157, 146]], [13.6, 14.6, [158, 250]],
    [16.2, 16.21, [158, 250]], [19.2, 20.15, [112, 378]], [20.7, 21.3, 'exit'],
    [31.0, 31.01, 'enter'], [31.1, 31.8, [620, 108]], [34.0, 34.6, [900, 330]],
    [37.9, 38.75, C(R('clC', 'view_ballerino'))], [39.05, 39.5, 'exit'],
    [43.6, 43.61, 'enter'], [43.7, 44.45, C(R('clC', 'cb_bacon'))], [44.8, 45.15, C(R('clC', 'cb_ballerino'))], [45.9, 46.7, C(R('clC1', 'btnAddTR'))],
    [47.4, 48.2, [495 + 70 + 120, 242 + 233]], [48.9, 49.35, [495 + 405, 242 + 306]],
    [50.4, 51.25, C(R('rvBuilder', 'clickQ'))], [51.5, 51.85, [1181, 560]], [54.15, 54.5, C(R('rvPanel0', 'btnDone'))], [54.9, 55.3, C(R('rvReady', 'btnStart2'))], [55.7, 56.3, 'exit'],
    [58.9, 58.91, 'enter'], [59.0, 59.75, C(R('rvBuilder', 'rail_chat'))], [60.2, 60.75, [371 + 300, 587.9 + 26]], [62.2, 62.48, [371 + 741, 587.9 + 71]], [62.8, 63.4, 'exit'],
  ];
}
const CLICKS = [T.exploreClick, T.caseClick, T.jurClick, T.jurClose, T.empClick, T.searchClick, T.viewClick, T.tick1, T.tick2, T.addTR, T.nairClick, T.addClick,
  T.clickQ, T.qboxClick, T.done, T.start, T.railChat, T.cbClick, T.send];
const CURSOR_ON = [[7.6, 21.3], [31.0, 39.5], [43.6, 56.3], [58.9, 63.4]];

// captions (step number, text) in the pill under the window
const CAP = [[7.4, 1, 'Open Case law'], [15.6, 2, 'Filter and read'], [31.4, 3, 'Search by keyword'], [38.0, 4, 'Read the judgment'], [43.3, 5, 'Compare in a table'], [59.6, 6, 'Ask in the matter']];
const CAP_END = 68.0;

// ------------------------------------------------------------------ camera
const POSE = { s: 1.06, cx: 960, cy: 497 };
function zoomOn(r, maxW = 1560, maxH = 800, cx = 960, cy = 497) { const s = Math.min(maxW / r[2], maxH / r[3]); return { fx: r[0] + r[2] / 2, fy: r[1] + r[3] / 2, s, cx, cy, clip: r, r: 18, o: 1 }; }
function shot(name) {
  const full = [0, 0, AW, AH];
  if (name === 'screen') return { fx: AW / 2, fy: AH / 2, s: POSE.s, cx: POSE.cx, cy: POSE.cy, clip: full, r: 22, o: 1 };
  if (name === 'below') return { fx: AW / 2, fy: AH / 2, s: POSE.s, cx: POSE.cx, cy: POSE.cy + 1100, clip: full, r: 22, o: 1 };
  if (name === 'jz') return zoomOn([16, 92, 620, 320]);           // the Jurisdiction menu: four countries
  if (name === 'card') return zoomOn([360, 96, 1050, 568]);       // one ruling card while it scrolls
  if (name === 'sum') return zoomOn([370, 186, 1030, 292]);       // highlighted words in a search result
  if (name === 'tbl') return zoomOn([96, 206, 1100, 282]);        // the answers in the review table
  if (name === 'steps') return zoomOn([280, 262, 950, 300]);      // memory, legislation and case law steps
  if (name === 'cite') return zoomOn([284, 388, 940, 200]);       // the answer citing Holmes v QinetiQ
  if (name === 'gone') return { ...shot('cite'), o: 0 };          // plain fade from the last shot, no zoom
}
const SHOTS = [[0, 'below', 0], [6.5, 'screen', 0.85], [11.55, 'jz', 0.75], [15.0, 'screen', 0.7], [22.1, 'card', 0.9], [30.8, 'screen', 0.8],
  [34.9, 'sum', 0.8], [37.5, 'screen', 0.7], [57.95, 'tbl', 0.8], [59.2, 'screen', 0.7], [S + .8, 'steps', 0.7], [S + 3.2, 'cite', 0.7], [S + 5.8, 'gone', 1.0]];
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

// ------------------------------------------------------------------ screens (window px)
// 1 the matter greeting, with the Explore menu
function scrGreet(t) {
  plate('chGreet');
  floatShadow(371, 587.9, 768, 98, 24, 1, 'pop');
  sprite('spCbMid', 371, 587.9, 768, 140);
  const k = P(t, T.exploreClick + .03, T.exploreClick + .25, E.out), out = 1 - P(t, T.caseClick + .05, T.caseClick + .2, E.io);
  if (t >= T.exploreClick && k * out > 0) {
    const a = k * out; floatShadow(344.7, 17, 674, 335.5, 16, a, 'pop');
    sprite(t >= 9.5 ? 'spExploreHot' : 'spExplore', 344.7, 17, 674, 336, a, L(.97, 1, k));
  }
}
// 2 Case law: feed (A), Employment law (B, scrolls), search results (C)
function bScroll(t) { return eased(t, [[0, 0], [21.4, 440], [26.0, 800], [31.0, 0]], 1.0); }
function eased(t, keys, d = .6) { let v = keys[0][1]; for (let i = 1; i < keys.length; i++) { const [a, x] = keys[i]; if (t < a) break; v = L(v, x, P(t, a, a + d, E.io)); } return v; }
function scrCaseLaw(t) {
  if (t < T.empClick + .1) {
    plate('clA');
    // jurisdiction menu: open on the four countries, closed again by picking United Kingdom
    const k = P(t, T.jurClick + .03, T.jurClick + .22), out = 1 - P(t, T.jurClose + .05, T.jurClose + .2, E.io);
    if (t >= T.jurClick && k * out > 0) { floatShadow(34, 168, 248, 133, 8, k * out); sprite('spJur', 34, 168, 248, 133, k * out, L(.97, 1, k)); }
    // "by legal area, decision date or court"
    ring(t, 16.9, 17.9, [55, 179.6, 64, 19], 7, 3);
    ring(t, 17.75, 18.75, [55, 549.6, 80, 19], 7, 3);
    ring(t, 18.55, 19.6, [55, 796.6, 44, 19], 7, 3);
  }
  const showB = t >= T.empClick + .1 && t < T.results + .3;
  if (showB) {
    const fadeIn = P(t, T.empClick + .1, T.empClick + .35, E.io);
    if (fadeIn < 1) plate('clA');
    ctx.save(); ctx.globalAlpha *= fadeIn;
    const dy = bScroll(t);
    region('clB', 0, 0, AW, 68, 0, 0);                         // nav
    region('clB', 0, 68, 300, AH - 68, 0, 68);                 // filters (do not scroll)
    region('clB', 300, 68 + dy, AW - 300, AH - 68, 300, 68);   // results column
    // rings on the card parts as the voice names them
    const rb = (id, a, b, rad = 8) => { const r = R('clB', id); ring(t, a, b, [r[0], r[1] - dy, r[2], r[3]], rad, 3); };
    rb('hcCourt', 23.8, 25.0); rb('hcCite', 24.5, 25.6, 6); rb('hcBadge', 25.3, 26.4);
    const lb = (id, w, a, b) => { const r = R('clB', id); ring(t, a, b, [r[0], r[1] - dy - 1, w, r[3] + 2], 6, 3); };
    lb('hcHold', 60, 27.0, 28.0); lb('hcIssues', 56, 27.7, 28.7); lb('hcCited', 80, 28.6, 30.3);
    // typing the keywords
    if (t >= T.searchClick) {
      const sb = R('clB', 'sbar');
      ctx.save(); ctx.strokeStyle = 'rgba(36,30,25,.5)'; ctx.lineWidth = 1; rr(sb[0] + .5, sb[1] + .5, sb[2] - 1, sb[3] - 1, 16); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(406, 97, 900, 22);
      font(400, 14); ctx.fillStyle = 'rgb(36,30,25)'; ctx.textBaseline = 'alphabetic';
      const s = typedPart(t, SEARCH, T.typeS[0], T.typeS[1]); ctx.fillText(s, 408, 114);
      caret(t, 408 + ctx.measureText(s).width, 114, 18); ctx.restore();
    }
    ctx.restore();
  }
  if (t >= T.results) {
    const k = P(t, T.results, T.results + .3, E.io);
    const name = t >= T.tick2 + .05 ? 'clC2' : t >= T.tick1 + .05 ? 'clC1' : 'clC';
    plate(name, k);
    if (t >= T.results + .3 && t < 37.6) { /* focused search caret */ const w = (font(400, 14), ctx.measureText(SEARCH).width); caret(t, 408 + w, 114, 18); }
    ring(t, 46.0, 47.0, R('clC1', 'btnAddTR'), 8, 3);                         // "choose Add to tabular review"
    // the dialog: dim, then the Existing matter list, Nair picked, Add
    const dk = P(t, T.addTR + .05, T.addTR + .3, E.io) * (1 - P(t, T.addClick + .05, T.addClick + .25, E.io));
    if (t >= T.addTR && dk > 0) {
      ctx.save(); ctx.globalAlpha *= dk; ctx.fillStyle = 'rgba(36,30,25,.78)'; ctx.fillRect(0, 0, AW, AH); ctx.restore();
      const s = L(.96, 1, P(t, T.addTR + .05, T.addTR + .35, E.out));
      floatShadow(495, 242, 480, 351, 16, dk, 'dlg');
      sprite(t >= T.nairClick + .05 ? 'spDlg1' : 'spDlg0', 495, 242, 480, 351, dk, s);
    }
    // View case opens BAILII in a new tab
    bailii(t);
  }
}
function bailii(t) {
  const k = P(t, T.bailIn, T.bailIn + .55, E.qio), o = P(t, T.bailOut, T.bailOut + .5, E.qio);
  if (k <= 0 || o >= 1) return;
  const y = L(AH + 20, 28, k) + o * (AH + 20), x = 40, w = AW - 80, h = AH - 56;
  ctx.save();
  ctx.shadowColor = 'rgba(35,30,25,.35)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18; ctx.fillStyle = '#fff'; rr(x, y, w, h, 12); ctx.fill(); ctx.shadowColor = 'transparent';
  rr(x, y, w, h, 12); ctx.clip();
  ctx.fillStyle = '#E8E3DA'; ctx.fillRect(x, y, w, 44);
  [['#E9897B', 0], ['#EDC25E', 20], ['#8DC26F', 40]].forEach(([col, dx]) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + 22 + dx, y + 22, 6, 0, 7); ctx.fill(); });
  ctx.fillStyle = '#fff'; rr(x + 90, y + 9, 520, 26, 8); ctx.fill();
  font(400, 13); ctx.fillStyle = '#494746'; ctx.textBaseline = 'middle'; ctx.fillText('bailii.org/uk/cases/UKEAT/2024/98.html', x + 104, y + 22.5);
  const iw = w, ih = iw * 827 / 1456; ctx.drawImage(IMG.bailii, x, y + 44, iw, ih);
  ctx.restore();
}
// 3 the review in the matter
function scrReview(t) {
  let name = 'rvBuilder';
  if (t >= T.clickQ + .05) name = 'rvPanel0';
  if (t >= T.typeQ[0]) { font(400, 11.5); name = ctx.measureText(typedPart(t, QUESTION, T.typeQ[0], T.typeQ[1])).width > 272 ? 'rvPanel2' : 'rvPanel1'; }
  if (t >= T.typeQ[1] + .05) name = 'rvPanel3';
  if (t >= T.done + .05) name = 'rvReady';
  if (t >= T.start + .05) name = 'rvRunQ';
  if (t >= T.runT) name = 'rvRunT';
  if (t >= T.runA) name = 'rvRunA';
  if (t >= T.runDone) name = 'rvDone';
  // panel slides in from the right when the question cell is clicked, and out on Done
  if (name.startsWith('rvPanel')) {
    const k = P(t, T.clickQ + .05, T.clickQ + .4, E.out);
    if (k < 1) { plate('rvBuilder'); ctx.save(); ctx.beginPath(); ctx.rect(0, 0, AW, AH); ctx.clip(); ctx.globalAlpha *= k; ctx.translate((1 - k) * 40, 0); plate(name); ctx.restore(); }
    else plate(name);
  } else if (name === 'rvReady') { const k = P(t, T.done + .05, T.done + .35, E.io); plate('rvPanel3', 1 - k); plate('rvReady', k); }
  else if (name === 'rvRunQ') { const k = P(t, T.start + .05, T.start + .3, E.io); plate('rvReady', 1 - k); plate('rvRunQ', k); }
  else if (name === 'rvRunA') { const k = P(t, T.runA, T.runA + .3, E.io); plate('rvRunT', 1 - k); plate('rvRunA', k); }
  else if (name === 'rvDone') { const k = P(t, T.runDone, T.runDone + .3, E.io); plate('rvRunA', 1 - k); plate('rvDone', k); }
  else plate(name);
  // typing: the question box and the column header update together, as in staging
  if (t >= T.qboxClick && t < T.typeQ[1] + .05) {
    const s = typedPart(t, QUESTION, T.typeQ[0], T.typeQ[1]);
    font(400, 16); ctx.fillStyle = 'rgb(36,30,25)'; ctx.textBaseline = 'alphabetic';
    const lines = wrap(s, 432); lines.forEach((ln, i) => ctx.fillText(ln, 964, 485 + i * 24));
    if (t < T.typeQ[1]) caret(t, 964 + ctx.measureText(lines[lines.length - 1]).width, 485 + (lines.length - 1) * 24, 20);
    if (t >= T.typeQ[0]) { font(400, 11.5); ctx.fillStyle = 'rgb(73,71,70)'; wrap(s, 276).forEach((ln, i) => ctx.fillText(ln, 429, 255 + i * 15.5)); }
  }
  if (t < T.typeQ[0] && t >= T.qboxClick) { /* focused, empty: the placeholder is still shown */ }
  // spinners while it runs
  if (t >= T.start + .3 && t < T.runDone) {
    spinner(t, 397.6, 179, 5.6);
    if (t >= T.runT) { if (t < T.runA) spinner(t, 435, 302, 4.6); spinner(t, 435, 380, 4.6); }
  }
  // "each ruling becomes a row"
  ring(t, 50.7, 51.9, [157, 291.9, 213, 16.3], 6, 4);
  ring(t, 50.9, 52.1, [157, 356.9, 110, 16.3], 6, 4);
  ring(t, 58.1, 59.4, [426, 355, 28, 18], 6, 3);                         // "with its sources": the quote count
}
// 4 the matter chat: greeting, typed question, then the turn
function scrChat(t) {
  const sent = t >= T.send;
  plate(sent ? 'chConv' : 'chGreet');
  if (sent && t < T.send + .4) plate('chGreet', 1 - P(t, T.send, T.send + .4, E.io));
  if (sent) thread(t);
  // chat box: centred on the greeting, docks to the bottom once sent
  const mv = P(t, T.send + .05, T.send + .6, E.io);
  const x = L(371, 395, mv), y = L(587.9, 682.9, mv), w = L(768, 720, mv);
  floatShadow(x, y, w, 98, 24, 1, 'pop');
  ctx.save(); ctx.fillStyle = 'rgba(254,253,251,.92)'; rr(x + 1, y + 1, w - 2, 96, 23); ctx.fill(); ctx.restore();
  if (mv < 1) sprite(t >= T.cbClick && t < T.send + .05 ? 'spCbMidOn' : 'spCbMid', x, y, w, 140 * w / 768, 1 - mv);
  if (mv > 0) sprite('spCbDock', x, y, w, 140 * w / 720, mv);
  if (t >= T.cbClick && t < T.send + .05) {
    const s = typedPart(t, ASK, T.typeC[0], T.typeC[1]);
    font(400, 16); ctx.fillStyle = 'rgb(36,30,25)'; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, 371 + 17, 587.9 + 34);
    caret(t, 371 + 17 + ctx.measureText(s).width, 587.9 + 34, 20);
  }
}
function thread(t) {
  const it = id => RECTS.spThread[id], wk = id => RECTS.spThreadWork[id];
  const sc = t < TH.scroll[0] ? 0 : L(0, TH.scroll[2], P(t, TH.scroll[0], TH.scroll[1], E.io));
  const ox = 243, oy = 141 - sc;
  ctx.save(); ctx.beginPath(); ctx.rect(57, 141, 1396, 677); ctx.clip();
  const blit = (img, r, a, b = 1e9) => { const k = Math.min(P(t, a, a + .35), 1 - P(t, b, b + .2, E.io)); if (k <= 0) return; const [x, y, w, h] = r;
    ctx.save(); ctx.globalAlpha *= k; ctx.drawImage(IMG[img], x * 2, y * 2, w * 2, h * 2, ox + x, oy + y + (1 - P(t, a, a + .35)) * 10, w, h); ctx.restore(); };
  blit('spThread', it('it_meta'), TH.user); blit('spThread', it('it_user'), TH.user); blit('spThread', it('it_col'), TH.user);
  blit('spThreadWork', wk('it_w0'), TH.w0[0], TH.w0[1]);
  blit('spThreadWork', wk('it_wmem'), TH.wmem[0], TH.wmem[1]);
  if (t >= TH.wmem[0] && t < TH.wmem[1] + .2) { const [x, y] = wk('spin_mem'); spinner(t, ox + x + 6, oy + y + 6, 5, 'rgb(201,167,51)', 1.5); }
  blit('spThreadWork', wk('it_wthk'), TH.wthk[0], TH.wthk[1]);
  blit('spThread', it('it_s1'), TH.s1); blit('spThread', it('it_s2'), TH.s2); blit('spThread', it('it_s3'), TH.s3);
  blit('spThreadWork', wk('it_wana'), TH.wana[0], TH.wana[1]);
  blit('spThread', it('it_think'), TH.think); blit('spThread', it('it_dot'), TH.p1); blit('spThread', it('it_p1'), TH.p1);
  blit('spThread', it('it_p2'), TH.p2); blit('spThread', it('it_p3'), TH.p3); blit('spThread', it('it_p4'), TH.p4);
  ctx.restore();
  // "searches case law and legislation"
  const lr = id => { const r = it(id); return [ox + r[0] - 2, oy + r[1] - 1, r[2] + 4, r[3] + 2]; };
  ring(t, S + 1.75, S + 2.8, lr('lbl_cl'), 6, 3);
  ring(t, S + 1.4, S + 2.5, lr('lbl_leg'), 6, 3);
}

// ------------------------------------------------------------------ the app, with pushes between screens
const SCREENS = [[7.0, scrGreet], [T.pushCL, scrCaseLaw], [T.pushRV, scrReview], [T.pushCH, scrChat]];
function drawApp(t) {
  let i = 0; while (i < SCREENS.length - 1 && SCREENS[i + 1][0] <= t) i++;
  const [t0, fn] = SCREENS[i];
  const k = i > 0 ? P(t, t0, t0 + .6, E.qio) : 1;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, AW, AH); ctx.clip();
  if (k < 1) { ctx.save(); ctx.translate(-k * AW * .35, 0); SCREENS[i - 1][1](t); ctx.fillStyle = `rgba(36,30,25,${.12 * k})`; ctx.fillRect(0, 0, AW, AH); ctx.restore(); }
  ctx.save(); ctx.translate((1 - k) * AW, 0); if (k < 1) { ctx.shadowColor = 'rgba(35,30,25,.18)'; ctx.shadowBlur = 30; ctx.fillStyle = '#F2EFE9'; ctx.fillRect(0, 0, AW, AH); ctx.shadowColor = 'transparent'; } fn(t); ctx.restore();
  ctx.restore();
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
  const resolve = tg => { if (tg === 'enter') return [1980, 1140]; if (tg === 'exit') return [2000, 1150]; return toScreen(cam, tg[0], tg[1]); };
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

// ------------------------------------------------------------------ title and end card
let globalT = 0;
function words(text, x, y, t0, step, size, weight, color, fam = 'Neco') {
  font(weight, size, fam); ctx.fillStyle = color; ctx.textBaseline = 'alphabetic';
  let cx = x; text.split(' ').forEach((w, i) => {
    const k = P(globalT, t0 + i * step, t0 + i * step + .5, E.q);
    if (k > 0) { ctx.save(); ctx.globalAlpha *= k; ctx.fillText(w, cx, y + (1 - k) * 44); ctx.restore(); }
    cx += ctx.measureText(w + ' ').width;
  });
}
function title(t) {
  if (t > 7.4) return;
  const up = P(t, 6.5, 7.3, E.qio);
  ctx.save(); ctx.translate(0, -up * 1080);
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  ctx.fillStyle = '#F7E17E'; ctx.fillRect(0, 0, W, H);
  const e = P(t, 0.3, 0.75); font(600, 22); ctx.fillStyle = '#494746'; ctx.globalAlpha = e;
  ctx.letterSpacing = '3px'; ctx.fillText('ANDRI ACADEMY · 4.1', 122, 392); ctx.letterSpacing = '0px'; ctx.globalAlpha = 1;
  words('Case law research,', 120, 530, 0.5, .09, 128, 500, '#231E19');
  words('start to finish.', 120, 640, 1.15, .09, 84, 400, '#231E19');
  mascot('wave', t, .25, 7.4, 1180, 330, 640);
  ctx.restore();
}
function endCard(t) {
  const END = T.END;
  if (t < END) return;
  const a = P(t, END + .05, END + .65), dy = (1 - P(t, END + .05, END + .75, E.q)) * 24;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(0, dy);
  ctx.drawImage(IMG.logo, 512, 438, 520, 520 * 600 / 2299);
  font(500, 25); ctx.fillStyle = '#494746'; ctx.textBaseline = 'alphabetic'; ctx.fillText('Andri Academy · Next: Prepare and rehearse the hearing', 515, 635);
  ctx.restore();
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
}

// ------------------------------------------------------------------ frame
async function renderFrame(t) {
  if (!READY) READY = load();
  await READY;
  globalT = t;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.textAlign = 'left';
  background(t);
  const cam = camera(t);
  if (cam.o > 0 && t > 6.4) {
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
