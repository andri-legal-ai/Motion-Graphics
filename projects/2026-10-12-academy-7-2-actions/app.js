// Andri Academy 7.2 · Actions: write a brief once, use it in chat and workflows
// Everything is drawn on one <canvas> by renderFrame(t), a pure function of time t (seconds).
// App screens are plates rebuilt from staging measurements of 12 Oct 2026 (screens/build.mjs -> plates/*.png, 2x).
// Engine, camera, captions, cursor, mascot, title and end card follow the approved 1.1, 1.2, 4.1 and 5.1 videos.
// The app window is staging's own size, 1470 x 835 (window coordinates = staging page coordinates).

const W = 1920, H = 1080, FPS = 60, DURATION = 106.5;
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
const PLATES = ['mGreet', 'spExplore0', 'spExplore', 'aEmpty', 'aEmptyN', 'pForm1', 'pForm1b', 'pForm2', 'pForm3', 'aBuild0', 'aBuild1', 'aBuildFull',
  'aBuilt', 'aBuiltHover', 'aDetail', 'aDetailHover', 'aConfirm', 'aShared', 'spDetail', 'kbFrame', 'spKB', 'cGreet', 'cConv',
  'pk_docs', 'pk_company', 'pk_tags', 'pk_actions', 'spCbMid', 'spCbAt', 'spCbChip', 'spCbDock', 'spThread', 'wf', 'wfOpen'];
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

// ------------------------------------------------------------------ helpers
const R = (set, id) => RECTS[set][id];
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function plate(name, alpha = 1) { if (alpha <= 0) return; ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(IMG[name], 0, 0, AW, AH); ctx.restore(); }
// a source region of an image (its own px) drawn at a destination (window px)
function region(name, sx, sy, sw, sh, dx, dy, alpha = 1) {
  if (alpha <= 0 || sw <= 0 || sh <= 0) return; ctx.save(); ctx.globalAlpha *= alpha;
  ctx.drawImage(IMG[name], sx * 2, sy * 2, sw * 2, sh * 2, dx, dy, sw, sh); ctx.restore();
}
function sprite(name, x, y, w, h, alpha = 1, scale = 1) {
  if (alpha <= 0) return; ctx.save(); ctx.globalAlpha *= alpha;
  ctx.translate(x + w / 2, y + h / 2); ctx.scale(scale, scale); ctx.drawImage(IMG[name], -w / 2, -h / 2, w, h); ctx.restore();
}
// shadow for a floating sprite captured without its own (known-issues #1); values from the live CSS
function floatShadow(x, y, w, h, r, alpha = 1, kind = 'pop') {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha;
  if (kind === 'pop') { ctx.shadowColor = 'rgba(35,30,25,.16)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8; }
  else if (kind === 'panel') { ctx.shadowColor = 'rgba(35,30,25,.30)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18; }
  else { ctx.shadowColor = 'rgba(0,0,0,.10)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4; }
  ctx.fillStyle = '#FFFFFF'; rr(x + 2, y + 2, w - 4, h - 4, r); ctx.fill(); ctx.restore();
}
function font(w, s, fam = 'Rethink') { ctx.font = `${w} ${s}px ${fam}`; }
// gold ring around a small control (window px), only while the voice names it
function ring(t, a, b, r, rad = 9, pad = 4) {
  const v = V2(t, a, b, .25, .3); if (v <= 0) return;
  const g = P(t, a, a + .35, E.back);
  ctx.save(); ctx.globalAlpha *= v; ctx.strokeStyle = '#E9CD4F'; ctx.lineWidth = 3;
  const p = pad + (1 - g) * 6; rr(r[0] - p, r[1] - p, r[2] + p * 2, r[3] + p * 2, rad + p); ctx.stroke(); ctx.restore();
}
// yellow highlight sweep over a phrase (as 1.1's source passage and 4.2), timed to the words
function sweep(t, a, b, r) {
  const k = P(t, a, a + .8, E.io), v = 1 - P(t, b - .3, b, E.io); if (k <= 0 || v <= 0) return;
  ctx.save(); ctx.globalAlpha *= v; ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#F8E37C';
  rr(r[0] - 3, r[1] - 1, (r[2] + 6) * k, r[3] + 2, 3); ctx.fill(); ctx.restore();
}
const C = r => [r[0] + r[2] / 2, r[1] + r[3] / 2];
// colour of one pixel of an image (its own px), cached: used to clear a field before drawing typed text
const PXC = {};
function px(name, x, y) {
  const k = `${name}:${x}:${y}`; if (PXC[k]) return PXC[k];
  const cv = document.createElement('canvas'); cv.width = 1; cv.height = 1; const g = cv.getContext('2d');
  g.drawImage(IMG[name], Math.round(x * 2), Math.round(y * 2), 1, 1, 0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data;
  return (PXC[k] = `rgb(${d[0]},${d[1]},${d[2]})`);
}
function caret(t, x, y, h = 20, col = '#241E19') { if (Math.floor(t * 2.2) % 2 === 0) { ctx.fillStyle = col; ctx.fillRect(x + 1, y - h + 4, 1.5, h); } }
function wrap(text, maxW) {
  const words = text.split(' '); const lines = []; let cur = '';
  for (const w of words) { const nx = cur ? cur + ' ' + w : w; if (ctx.measureText(nx).width > maxW && cur) { lines.push(cur); cur = w; } else cur = nx; }
  if (cur || !lines.length) lines.push(cur); return lines;
}
function eased(t, keys, d = .6) { let v = keys[0][1]; for (let i = 1; i < keys.length; i++) { const [a, x] = keys[i]; if (t < a) break; v = L(v, x, P(t, a, a + d, E.io)); } return v; }

// ------------------------------------------------------------------ timeline (video seconds)
// narration lines (ElevenLabs "UK voice voice to use for ANDRI vids", one take, cut at its pauses: audio/uk/L*.wav)
const VO = { L01: 0.6, L02: 8.4, L03: 11.4, L04: 20.5, L05: 26.05, L06: 30.8, L07: 39.05, L08: 45.8, L09: 53.4, L10: 61.7, L11: 68.7, L12: 74.95, L13: 84.1, L14: 93.2, L15: 101.6 };
const T = {
  push: 7.4,
  exClick: 9.1, exHover: 10.0, actClick: 10.6, toActions: 10.7,
  createClick: 18.9,
  nameClick: 20.9, typeName: [21.1, 22.3], briefClick: 23.0, typeBrief: [23.25, 29.0],
  next1: 30.1, next2: 38.4, createGo: 46.3, build1: 49.3,
  closeClick: 52.4, built: 53.7, rowClick: 54.7, scrollDetail: [57.4, 58.4],
  shareHover: 65.9, shareClick: 66.4, shareGo: 67.6,
  toKB: 69.9, kbScroll: [71.0, 72.1], railChat: 75.1, toChat: 75.2,
  boxClick: 76.9, at: 77.5, arrows: [79.3, 80.0, 80.7], pick: 81.8, send: 83.0,
  ansIn: 85.6, sc1: [85.9, 86.8], sc2: [87.0, 88.1],
  toWF: 93.2, selClick: 97.6,
  exit: 100.0,
};
const END = 101.15;
const NAME = 'Remedy check';
const BRIEF = 'Compare the schedule of loss with the tribunal judgment. For each head of loss, say whether the judgment supports it, what the other side will argue, and the risk. Output a table.';

// captions (step number, text) in the pill under the window
const CAP = [[VO.L02, 1, 'Open Actions'], [VO.L04, 2, 'Write the brief'], [VO.L06, 3, 'Add firm files'], [VO.L07, 4, 'Expected output'],
  [VO.L08, 5, 'Andri builds it'], [VO.L09, 6, 'Check the skill'], [VO.L10, 7, 'Share with your firm'], [VO.L11, 8, 'Run it in a matter'], [VO.L14, 9, 'Use it in a workflow']];
const CAP_END = T.exit + .2;

// ------------------------------------------------------------------ camera
const POSE = { s: 1.08, cx: 960, cy: 503 };
function zoomOn(r, maxW = 1560, maxH = 820, cx = 960, cy = 503) { const s = Math.min(maxW / r[2], maxH / r[3]); return { fx: r[0] + r[2] / 2, fy: r[1] + r[3] / 2, s, cx, cy, r: 18, o: 1 }; }
function shot(name) {
  if (name === 'screen') return { fx: AW / 2, fy: AH / 2, s: POSE.s, cx: POSE.cx, cy: POSE.cy, r: 22, o: 1 };
  if (name === 'below') return { fx: AW / 2, fy: AH / 2, s: POSE.s, cx: POSE.cx, cy: POSE.cy + 1100, r: 22, o: 1 };
  if (name === 'check') return zoomOn([700, 330, 1100, 560]);     // the Skill Definition's checklist (staging: "worth a close-up")
  if (name === 'gone') return { ...shot('screen'), o: 0 };        // plain fade from the last shot, no zoom
}
const SHOTS = [[0, 'below', 0], [T.push - .9, 'screen', 0.85], [58.6, 'check', 1.2], [61.3, 'screen', 1.2], [T.exit, 'gone', 1.0]];
function clampCam(o) {
  if (o.s * AW >= W) o.fx = cl(o.fx, o.cx / o.s, AW - (W - o.cx) / o.s);
  if (o.s * AH >= H) o.fy = cl(o.fy, o.cy / o.s, AH - (H - o.cy) / o.s);
  return o;
}
function camera(t) {
  let i = 0; while (i < SHOTS.length - 1 && SHOTS[i + 1][0] <= t) i++;
  const cur = clampCam(shot(SHOTS[i][1])), d = SHOTS[i][2];
  if (i === 0 || d === 0) return cur;
  const prev = clampCam(shot(SHOTS[i - 1][1])); const k = E.io(cl((t - SHOTS[i][0]) / d));
  const o = {}; for (const key of ['fx', 'fy', 'cx', 'cy', 'r', 'o']) o[key] = L(prev[key], cur[key], k);
  o.s = Math.exp(L(Math.log(prev.s), Math.log(cur.s), k));
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

// ------------------------------------------------------------------ screens (window px)
const PX = 778, PY = 84, PW = 676, PH = 735;          // the side panel
// 1 the matter we start on, with the Explore menu
function scrGreet(t) {
  plate('mGreet');
  floatShadow(371, 587.9, 768, 98, 24, 1, 'pop'); sprite('spCbMid', 371, 587.9, 768, 140);
  const k = P(t, T.exClick + .03, T.exClick + .25, E.out) * (1 - P(t, T.actClick + .05, T.actClick + .15, E.io));   // closes on the click
  if (t >= T.exClick && k > 0) { floatShadow(344.7, 17, 674, 335.5, 16, k, 'pop'); sprite(t >= T.exHover ? 'spExplore' : 'spExplore0', 344.7, 17, 674, 336, k, L(.97, 1, k)); }
}
// 2 the Actions page: empty, then the New action panel
function panelIn(t, t0, name, dir = 'in') {
  const k = P(t, t0, t0 + .5, E.qio), s = dir === 'in' ? k : 1 - k, dx = (1 - s) * (PW + 24);
  floatShadow(PX + dx, PY, PW, PH, 16, 1, 'panel'); sprite(name, PX + dx, PY, PW, PH);
}
// typing into the New action form: the empty form (pForm1) with the filled one's text revealed letter by letter
function form1(t) {
  const fb = R('pForm1b', 'fBriefTx'), nm = R('pForm1b', 'fName');
  sprite('pForm1', PX, PY, PW, PH);
  if (t >= T.typeName[0]) {   // name field
    font(400, 14); const n = Math.round(P(t, T.typeName[0], T.typeName[1], E.lin) * NAME.length), s = NAME.slice(0, n), tw = ctx.measureText(s).width;
    ctx.fillStyle = px('pForm1b', nm[0] + nm[2] - 20, nm[1] + 18); ctx.fillRect(PX + nm[0] + 4, PY + nm[1] + 4, nm[2] - 8, nm[3] - 8);
    region('pForm1b', nm[0] + 6, nm[1] + 3, n === NAME.length ? 200 : 7 + tw, nm[3] - 6, PX + nm[0] + 6, PY + nm[1] + 3);
    if (t < T.briefClick) caret(t, PX + nm[0] + 13 + tw, PY + nm[1] + 25, 18);
  }
  if (t >= T.briefClick) {    // the brief: placeholder cleared, then the real text revealed line by line
    const fr = R('pForm1b', 'fBrief');
    ctx.fillStyle = px('pForm1b', fr[0] + 20, fr[1] + 300); ctx.fillRect(PX + fr[0] + 4, PY + fr[1] + 4, fr[2] - 8, 150);
    font(400, 14); const lines = wrap(BRIEF, fb[2]);
    const n = Math.round(P(t, T.typeBrief[0], T.typeBrief[1], E.lin) * BRIEF.length);
    let used = 0, cx = fb[0], cy = fb[1];
    lines.forEach((ln, i) => { const part = ln.slice(0, Math.max(0, n - used)); const tw = ctx.measureText(part).width;
      if (part.length) { region('pForm1b', fb[0] - 2, fb[1] + i * 22.4, part.length === ln.length ? fb[2] + 4 : tw + 3, 22.4, PX + fb[0] - 2, PY + fb[1] + i * 22.4); cx = fb[0] + tw; cy = fb[1] + i * 22.4; }
      used += ln.length + 1; });
    if (t < T.next1) caret(t, PX + cx + 1, PY + cy + 18, 18);
    // the counter under the box: "N more characters needed" until 100, then "n / 60,000"; Next turns on at 100
    const cr = R('pForm1b', 'counter'); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(PX + cr[0], PY + cr[1], cr[2], cr[3]);
    font(400, 11); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    if (n < 100) { ctx.fillStyle = '#96732C'; ctx.fillText(`${100 - n} more characters needed`, PX + cr[0] + cr[2], PY + cr[1] + cr[3] / 2 + .5); }
    else { ctx.fillStyle = '#494746'; ctx.fillText(`${n} / 60,000`, PX + cr[0] + cr[2], PY + cr[1] + cr[3] / 2 + .5); const nb = R('pForm1b', 'nextBtn'); region('pForm1b', nb[0] - 1, nb[1] - 1, nb[2] + 2, nb[3] + 2, PX + nb[0] - 1, PY + nb[1] - 1); }
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  } else if (t >= T.nameClick) {
    const nm2 = R('pForm1b', 'fName'); ctx.save(); ctx.strokeStyle = 'rgba(75,67,61,.51)'; ctx.lineWidth = 1; rr(PX + nm2[0] + .5, PY + nm2[1] + .5, nm2[2] - 1, nm2[3] - 1, 12); ctx.stroke(); ctx.restore();
    if (t < T.typeName[0]) caret(t, PX + nm2[0] + 13, PY + nm2[1] + 25, 18);
  }
}
function spinArc(t, r) { if (!r) return; ctx.save(); ctx.strokeStyle = 'rgba(36,30,25,.75)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(r[0] + 12, r[1] + 12, 12.5, t * 5.5, t * 5.5 + 1.6); ctx.stroke(); ctx.restore(); }
function detailScroll(t) { return eased(t, [[0, 0], [T.scrollDetail[0], R('spDetail', 'wfHead')[1] - 300]], T.scrollDetail[1] - T.scrollDetail[0]); }
function detailContent(t, alpha = 1, dx = 0) {
  const sc = detailScroll(t);
  ctx.save(); ctx.beginPath(); ctx.rect(PX + 1 + dx, PY + 53, PW - 2, PH - 54); ctx.clip();
  ctx.globalAlpha *= alpha; ctx.drawImage(IMG.spDetail, 0, sc * 2, PW * 2, (PH - 53) * 2, PX + dx, PY + 53, PW, PH - 53); ctx.restore();
}
function scrActions(t) {
  if (t < T.createClick + .05) {
    plate('aEmpty');
    ring(t, 13.3, 14.8, [96.6, 92.3, 64, 19.5], 7, 4);      // "Personal, just for you"
    ring(t, 15.0, 16.9, [185.8, 92.3, 71, 19.5], 7, 4);     // "and Company, for your whole firm"
    return;
  }
  if (t < T.next1) {
    if (t < T.createClick + .55) { plate('aEmptyN'); panelIn(t, T.createClick + .05, 'pForm1'); return; }   // the list narrows at once, the panel slides in
    plate('aEmptyN'); floatShadow(PX, PY, PW, PH, 16, 1, 'panel'); form1(t);
    ring(t, 26.6, 28.3, [PX + R('pForm1b', 'counter')[0] + 120, PY + R('pForm1b', 'counter')[1], 80, 16.5], 6, 4);   // "at least a hundred characters"
    return;
  }
  if (t < T.createGo + .05) {
    plate('aEmptyN'); floatShadow(PX, PY, PW, PH, 16, 1, 'panel');
    if (t < T.next2) { sprite('pForm2', PX, PY, PW, PH); const s5 = R('pForm2', 'sel5'); ring(t, 32.3, 34.3, [PX + s5[0], PY + s5[1], s5[2], s5[3]], 6, 4); }
    else { sprite('pForm3', PX, PY, PW, PH); const h = R('pForm3', 'hint'); sweep(t, 42.6, 45.6, [PX + h[0] + 39, PY + h[1] + 13, 232, 18]); }
    return;
  }
  // building: the card with a spinner and "How Andri built this"; later the log with Andri's thinking
  if (t < T.closeClick + .05) {
    const b1 = t >= T.build1; plate(b1 ? 'aBuild1' : 'aBuild0');
    spinArc(t, R(b1 ? 'aBuild1' : 'aBuild0', 'spin'));
    return;
  }
  // the panel closed, the action still building; then ready ("Remedy-check [0f3c9b3j]")
  if (t < T.rowClick + .05) {
    plate('aBuildFull');   // the panel closes at once (a cut, never a blend of two layouts)
    const k = P(t, T.built, T.built + .35, E.io);
    if (k < 1) spinArc(t, R('aBuildFull', 'spin'));
    if (k > 0) plate(t >= T.rowClick - .55 ? 'aBuiltHover' : 'aBuilt', k);
    return;
  }
  // the detail: slides in; its content scrolls to the Workflow checklist; then share
  const base = t < T.shareClick ? (t >= T.shareHover ? 'aDetailHover' : 'aDetail') : t < T.shareGo ? 'aConfirm' : 'aShared';
  if (t < T.rowClick + .55) {
    const k = P(t, T.rowClick + .05, T.rowClick + .55, E.qio);
    region('aDetail', 0, 0, AW, AH, 0, 0); ctx.fillStyle = '#F2EFE9'; ctx.fillRect(PX - 4, PY - 4, PW + 8, PH + 8);   // the list narrows at once
    const dx = (1 - k) * (PW + 24); floatShadow(PX + dx, PY, PW, PH, 16, 1, 'panel');
    region('aDetail', PX, PY, PW, PH, PX + dx, PY); detailContent(t, 1, dx);
    return;
  }
  plate(base); detailContent(t);
  const sd = R('spDetail', 'sd'), sc = detailScroll(t);
  const ih = R('spDetail', 'inpHead'); ring(t, 56.6, 57.5, [PX + ih[0] - 2, PY + 53 + ih[1] - sc - 2, 44, ih[3] + 4], 6, 3);   // "the inputs it needs" (the Inputs heading)
  ring(t, 62.3, 63.7, [PX + 80, 101, 50, 18.8], 6, 3);                                    // "New actions are personal" (the breadcrumb)
  if (base === 'aShared') ring(t, 68.0, 69.2, [PX + 80, 101, 58, 18.8], 6, 3);           // now "Company"
}
// 3 the matter's Knowledge Base (employment folder), scrolled to the judgment and the schedule of loss
function kbScroll(t) { return eased(t, [[0, 0], [T.kbScroll[0], 661]], T.kbScroll[1] - T.kbScroll[0]); }
function scrKB(t) {
  const sc = kbScroll(t);
  ctx.fillStyle = '#F2EFE9'; ctx.fillRect(0, 0, AW, AH);
  ctx.save(); ctx.beginPath(); ctx.rect(56, 137, AW - 56, AH - 137); ctx.clip();
  region('kbFrame', 56, 137, AW - 56, 72, 56, 137 - sc);                          // the toolbar scrolls away with the list
  ctx.drawImage(IMG.spKB, 0, 0, AW * 2, 1300 * 2, 0, 209 - sc, AW, 1300);
  ctx.restore();
  region('kbFrame', 0, 0, AW, 137, 0, 0); region('kbFrame', 0, 137, 56, AH - 137, 0, 137);   // nav, sticky breadcrumb bar, rail
  const n5 = R('spKB', 'kn_05'), n13 = R('spKB', 'kn_13');
  ring(t, 72.3, 73.5, [n5[0], 209 - sc + n5[1], n5[2], n5[3]], 7, 4);          // "the judgment"
  ring(t, 73.4, 74.8, [n13[0], 209 - sc + n13[1], n13[2], n13[3]], 7, 4);      // "and the schedule of loss"
}
// 4 the matter chat: @, the lists, the picked action, then the run
const CBX = 371, CBY = 587.9;
function pickerName(t) { if (t < T.arrows[0]) return 'pk_docs'; if (t < T.arrows[1]) return 'pk_company'; if (t < T.arrows[2]) return 'pk_tags'; return 'pk_actions'; }
function threadScroll(t) {
  const ans = R('spThread', 'ans'), rt = R('spThread', 'aRT');
  return eased(t, [[0, 0], [T.sc1[0], ans[1] - 18], [T.sc2[0], rt[1] - 22]], .95);
}
function scrChat(t) {
  const sent = t >= T.send;
  plate(sent ? 'cConv' : 'cGreet');
  if (sent && t < T.send + .4) plate('cGreet', 1 - P(t, T.send, T.send + .4, E.io));
  if (sent) thread(t);
  // chat box: centred on the greeting, docks to the bottom once sent
  const mv = P(t, T.send + .05, T.send + .6, E.io);
  const x = L(CBX, 395, mv), y = L(CBY, 682.9, mv), w = L(768, 720, mv);
  floatShadow(x, y, w, 98, 24, 1, 'pop');
  const cbName = t >= T.pick ? 'spCbChip' : t >= T.at ? 'spCbAt' : 'spCbMid';
  if (mv < 1) sprite(sent ? 'spCbChip' : cbName, x, y, w, 140 * w / 768, 1 - mv);
  if (mv > 0) sprite('spCbDock', x, y, w, 140 * w / 720, mv);
  if (!sent && t >= T.boxClick && t < T.at) caret(t, CBX + 17, CBY + 37, 20);
  if (!sent && t >= T.at && t < T.pick) { font(400, 16); caret(t, CBX + 17 + ctx.measureText('@').width, CBY + 37, 20); }
  if (!sent && t >= T.pick) { font(400, 16); caret(t, CBX + 17 + 160, CBY + 37, 20); }
  // the @ list above the box (720 wide, 11 px above it); it switches lists on each right arrow
  if (t >= T.at && t < T.pick) {
    const nm = pickerName(t), hh = IMG[nm].height / 2, py = CBY - 11 - hh;
    const k = P(t, T.at + .02, T.at + .2, E.out);
    floatShadow(CBX + 24, py, 720, hh, 16, k, 'pop'); sprite(nm, CBX + 24, py, 720, hh, k);
  }
}
function thread(t) {
  const it = id => RECTS.spThread[id], sc = threadScroll(t);
  const ox = 243, oy = 141 - sc;
  ctx.save(); ctx.beginPath(); ctx.rect(57, 141, 1396, 677); ctx.clip();
  const blit = (r, a) => { const k = P(t, a, a + .35); if (k <= 0) return; const [x, y, w, h] = r;
    ctx.save(); ctx.globalAlpha *= k; ctx.drawImage(IMG.spThread, x * 2, y * 2, w * 2, h * 2, ox + x, oy + y + (1 - k) * 10, w, h); ctx.restore(); };
  blit(it('it_meta'), T.send + .05); blit(it('it_user'), T.send + .05); blit(it('it_col'), T.send + .05);
  for (let i = 0; i < 6; i++) { const r = it('st' + i); blit([46, r[1] - 2, 930, r[3] + 12], T.send + .4 + i * .32); }
  const a = it('ans'); blit([40, a[1] - 4, 940, 2300 - a[1] + 4], T.ansIn);
  ctx.restore();
  // "whether the judgment supports it, the other side's argument, and the risk" (the table's column headings)
  const th = id => { const r = it(id); return [ox + r[0] + 4, oy + r[1] + 8, r[2] - 8, r[3] - 16]; };
  ring(t, 89.2, 90.5, th('thSup'), 7, 3);
  ring(t, 90.5, 91.8, th('thOpp'), 7, 3);
  ring(t, 91.8, 93.0, th('thRisk'), 7, 3);
}
// 5 the workflow builder: the Run Action step and its list of actions
function scrWF(t) {
  plate(t >= T.selClick + .05 ? 'wfOpen' : 'wf');
  ring(t, 96.0, 97.1, [38, 148, 91.6, 32], 8, 4);           // "Add a Run Action step"
}

// ------------------------------------------------------------------ the app, with pushes between screens
const SCREENS = [[0, scrGreet], [T.toActions, scrActions], [T.toKB, scrKB], [T.toChat, scrChat], [T.toWF, scrWF]];
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

// ------------------------------------------------------------------ cursor
// path: [t0, t1, target in window px | 'enter' | 'exit']
function cursorPath() {
  const exAct = [344.7 + 11 + 120, 17 + 122 + 30];
  const create = C(R('aEmpty', 'createBtn'));
  const pf = id => { const r = R('pForm1b', id); return [PX + r[0] + r[2] / 2, PY + r[1] + r[3] / 2]; };
  const next2 = [PX + R('pForm2', 'nextBtn2')[0] + 40, PY + R('pForm2', 'nextBtn2')[1] + 18];
  const go = [PX + R('pForm3', 'createGo')[0] + 69, PY + R('pForm3', 'createGo')[1] + 18];
  const pClose = [PX + R('aBuild1', 'pClose')[0] - PX + 9, R('aBuild1', 'pClose')[1] + 9];
  const row = C(R('aBuilt', 'row1'));
  const share = C(R('aDetail', 'pShare')), shareGo = C(R('aConfirm', 'pShareGo'));
  const pk = R('pk_actions', 'pkRow'), pkY = CBY - 11 - 152;
  const sel = C(R('wf', 'wfSelect')), item = C(R('wfOpen', 'wfItem'));
  return [
    [8.1, 8.11, 'enter'], [8.2, 8.95, [383, 34]], [9.45, 10.0, exAct],
    [16.9, 18.55, create], [19.6, 20.6, pf('fName')], [22.5, 22.95, [PX + 330, PY + 420]], [23.4, 24.2, [PX + 330, PY + 560]],
    [29.0, 29.9, pf('nextBtn')], [36.8, 37.9, next2], [44.9, 45.9, go], [46.8, 47.6, [PX + 300, PY + 600]],
    [51.4, 52.2, pClose], [53.9, 54.5, [row[0] - 300, row[1]]], [55.0, 55.6, [PX + 360, PY + 520]],
    [64.9, 65.8, share], [66.6, 67.35, shareGo], [68.0, 68.9, 'exit'],
    [74.1, 74.11, 'enter'], [74.2, 74.95, [28, 280.5]], [75.9, 76.75, [CBX + 300, CBY + 26]], [77.1, 77.3, [CBX + 300, CBY + 60]],
    [80.9, 81.6, [CBX + 24 + 140, pkY + pk[1] + 22]], [82.2, 82.85, [CBX + 741, CBY + 71]], [83.5, 84.2, 'exit'],
    [94.6, 94.61, 'enter'], [94.7, 95.8, [400, 600]], [96.7, 97.45, sel], [97.95, 98.55, item], [99.4, 99.9, 'exit'],
  ];
}
const CLICKS = [T.exClick, T.actClick, T.createClick, T.nameClick, T.briefClick, T.next1, T.next2, T.createGo, T.closeClick, T.rowClick, T.shareClick, T.shareGo,
  T.railChat, T.boxClick, T.pick, T.send, T.selClick];
const CURSOR_ON = [[8.1, 68.9], [74.1, 84.2], [94.6, 99.9]];
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

// ------------------------------------------------------------------ title card (1.2 layout) and end card
let globalT = 0;
function words(text, x, y, t0, step, size, weight, color, fam = 'Neco') {
  font(weight, size, fam); ctx.fillStyle = color; ctx.textBaseline = 'alphabetic';
  let cx = x; text.split(' ').forEach((w, i) => {
    const k = P(globalT, t0 + i * step, t0 + i * step + .5, E.q);
    if (k > 0) { ctx.save(); ctx.globalAlpha *= k; ctx.fillText(w, cx, y + (1 - k) * 44); ctx.restore(); }
    cx += ctx.measureText(w + ' ').width;
  });
}
const TITLE = { tag: 'ANDRI ACADEMY · 7.2', l1: 'Actions: write a brief once,', l2: 'use it in chat and workflows.' };
function title(t) {
  if (t > T.push + .9) return;
  const up = P(t, T.push, T.push + .8, E.qio);
  ctx.save(); ctx.translate(0, -up * 1080);
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  ctx.fillStyle = '#F7E17E'; ctx.fillRect(0, 0, W, H);
  const e = P(t, 0.3, 0.75); font(600, 22); ctx.fillStyle = '#494746'; ctx.globalAlpha = e;
  ctx.letterSpacing = '3px'; ctx.fillText(TITLE.tag, 122, 392); ctx.letterSpacing = '0px'; ctx.globalAlpha = 1;
  // 1.2 sizes (128 / 84); a longer first line is fitted to end before the mascot
  font(500, 128, 'Neco'); const s1 = Math.min(128, Math.floor(128 * 1040 / ctx.measureText(TITLE.l1).width));
  font(400, 84, 'Neco'); const s2 = Math.min(84, Math.floor(84 * 1040 / ctx.measureText(TITLE.l2).width));
  words(TITLE.l1, 120, 530, 0.5, .09, s1, 500, '#231E19');
  words(TITLE.l2, 120, 640, 1.15, .09, s2, 400, '#231E19');
  // the waving mascot, clipped to the card so nothing hangs over the app during the push
  mascot('wave', t, .25, T.push + .9, 1180, 330, 640);
  ctx.restore();
}
const NEXT = 'Andri Academy · Next: Delegate it to Andri, and to your trainee';
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
async function renderFrame(t) {
  if (!READY) READY = load();
  await READY;
  globalT = t;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.globalCompositeOperation = 'source-over';
  background(t);
  const cam = camera(t);
  if (cam.o > 0 && t > T.push - .1) {
    const sx = cam.cx - cam.fx * cam.s, sy = cam.cy - cam.fy * cam.s, sw = AW * cam.s, sh = AH * cam.s;
    ctx.save(); ctx.globalAlpha *= cam.o;   // multiply, never set: the exit fade must reach everything inside
    ctx.shadowColor = 'rgba(35,30,25,.16)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 26; ctx.fillStyle = '#F2EFE9'; rr(sx, sy, sw, sh, cam.r); ctx.fill();
    ctx.shadowColor = 'rgba(35,30,25,.22)'; ctx.shadowBlur = 1; ctx.shadowOffsetY = 0; ctx.fill(); ctx.shadowColor = 'transparent';
    rr(sx, sy, sw, sh, cam.r); ctx.clip();
    ctx.translate(sx, sy); ctx.scale(cam.s, cam.s);
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
