// Andri Academy 2.2 · Reply to a letter from the other side
// Everything is drawn on one <canvas> by renderFrame(t), a pure function of time t (seconds).
// App screens are still plates of the Andri rebuild (plates/*.png, 2x), captured from video-1.1/build/s22.html,
// which copies the staging run of 8 Oct 2026 (Nair v Calderdale Logistics, thread "Reply to Bowater Sykes").
// Engine, camera, captions, cursor, mascot and end card follow the approved 1.1 and 1.2 videos.

const W = 1920, H = 1080, FPS = 60;
const c = document.getElementById('c'); c.width = W; c.height = H;
let ctx = c.getContext('2d'), OFF = null;
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
// narration line starts (ElevenLabs, "UK voice voice to use for ANDRI vids"); every scene hangs off these
const VO = window.VO_TIMES || { L1: 0.6, L2: 7.0, L3: 15.6, L4: 28.2, L5: 36.6, L5b: 45.0, L6: 47.1, L7: 60.7, L8: 71.4, L9: 80.6, L10: 86.0 };
const A = VO.L2 - 0.7;   // knowledge base: upload their letter
const B = VO.L3 - 0.4;   // chat: list every point
const C = B + 6.9;       // first question sent
const D = VO.L4;         // zoom on the numbered points
const Em = VO.L5 - 0.9;  // firm memory
const F = VO.L6 - 0.6;   // our position, in one message
const G = VO.L7 - 0.6;   // Andri asks first
const Hd = VO.L8 - 0.3;  // the reply, on the letterhead
const J = VO.L9 - 0.9;   // open it from Jobs
const K = VO.L10 - 0.4;  // end card
const DURATION = K + 6.2;

// ------------------------------------------------------------------ assets
const IMG = {}, MASC = {};
let RECTS, MMETA, READY = null;
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(src); i.src = src; }); }
async function load() {
  RECTS = window.RECTS_DATA; MMETA = window.MASCOT_DATA;
  const plates = ['kb0', 'kbVal', 'kbDone', 'upd0', 'upd1', 'upd2', 'greet', 'chat', 'split', 'cboxMidOn', 'cboxMid2', 'cboxDock', 'cboxDock1', 'cboxDock2', 'cboxDock3', 'cboxDock4', 'cboxDock5', 'cboxDock6',
    'cboxSplit', 'disc', 'discSplit', 'mp0', 'mp1_4', 'mp1_5', 'mp1_6', 'fcard', 'fcardHot', 'q2', 'q2Hot', 'dpanel', 'jpanel', 'jpanelHot', 'toast', 'thA', 'thB', 'thC', 'thN'];
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
const R = (set, id) => RECTS[set][id];
const box = n => RECTS[n].box;
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function plate(name, alpha = 1) { if (alpha <= 0) return; ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(IMG[name], 0, 0, 1440, 860); ctx.restore(); }
function sprite(name, alpha = 1, dx = 0, dy = 0, scale = 1) {
  if (alpha <= 0) return;
  const [x, y, w, h] = box(name); ctx.save(); ctx.globalAlpha *= alpha;
  ctx.translate(x + w / 2 + dx, y + h / 2 + dy); ctx.scale(scale, scale);
  ctx.drawImage(IMG[name], -w / 2, -h / 2, w, h); ctx.restore();
}
// soft shadow under a floating sprite (its plate is captured without one, see plates/capture.mjs)
const FLOAT_R = { mp: 16, fcard: 16, q2: 16, dpanel: 16, jpanel: 16, toast: 12, upd: 16 };
function floatShadow(name, alpha = 1, dx = 0, dy = 0, strong = false) {
  if (alpha <= 0) return; const [x, y, w, h] = box(name), r = FLOAT_R[Object.keys(FLOAT_R).find(k => name.startsWith(k))] || 16;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.shadowColor = strong ? 'rgba(30,25,20,.30)' : 'rgba(60,45,20,.16)'; ctx.shadowBlur = strong ? 60 : 34; ctx.shadowOffsetY = strong ? 24 : 12;
  ctx.fillStyle = '#F4F1EC'; rr(x + dx + 2, y + dy + 2, w - 4, h - 4, r); ctx.fill(); ctx.restore();
}
function font(w, s, fam = 'Rethink') { ctx.font = `${w} ${s}px ${fam}`; }
function ring(t, a, b, r, rad = 10, pad = 5) {
  const v = V2(t, a, b, .25, .3); if (v <= 0) return;
  const g = P(t, a, a + .35, E.back);
  ctx.save(); ctx.globalAlpha *= v; ctx.strokeStyle = '#E9CD4F'; ctx.lineWidth = 3;
  const p = pad + (1 - g) * 6; rr(r[0] - p, r[1] - p, r[2] + p * 2, r[3] + p * 2, rad + p); ctx.stroke(); ctx.restore();
}
const Cn = r => [r[0] + r[2] / 2, r[1] + r[3] / 2];
function eased(t, keys, d = .6) { let v = keys[0][1]; for (let i = 1; i < keys.length; i++) { const [a, x] = keys[i]; if (t < a) break; v = L(v, x, P(t, a, a + d, E.io)); } return v; }

// ------------------------------------------------------------------ typing with @ chips (drawn over the chat box sprites)
// a message is a list of pieces: [text, t0, t1] typed letter by letter, or {chip, at, typed, from} where the
// filter text (typed) shows from `from` and turns into the green @ chip at `at`, as Andri does.
const MSG1 = () => [['List every point Bowater Sykes make in ', B + 0.6, B + 2.3], { typed: '@21_Let', from: B + 2.45, upto: B + 3.5, chip: '@[21_Letter_Bowater_Sykes_Remedy.docx]', at: B + 4.45 }, [' so I can see nothing is missed.', B + 5.5, B + 6.35]];
const MSG2 = () => [['Remember for the whole firm: we write to the other side in formal English.', Em + 0.3, Em + 2.3]];
const POS = 'Draft our reply to Bowater Sykes, point by point, on our letter template. Accept point 3. Reject points 1, 2 and 4: they must prove she failed to mitigate, and have no evidence; the judgment found no genuine redundancy and a sham consultation; the tribunal’s provisional view is the middle Vento band. Refer to our offer in ';
const MSG3 = () => [[POS, F + 0.3, F + 5.0], { typed: '@10_Letter', from: F + 5.15, upto: F + 5.8, chip: '@[10_Letter_Settlement.docx]', at: F + 6.75 }, ['.', F + 6.95, F + 7.0]];
const LINE_H = 24.65, TXT = 17;
// lay the visible text out into lines; returns {lines:[[{s, chip}]], end:[x,line]}
function layout(t, msg, maxW) {
  font(400, TXT);
  const toks = [];
  for (const p of msg) {
    if (Array.isArray(p)) { const [s, a, b] = p; if (t < a) break; const n = Math.round(P(t, a, b, E.lin) * s.length); for (const w of s.slice(0, n).split(/(?<= )/)) if (w) toks.push({ s: w }); if (t < b) break; }
    else { if (t < p.from) break; if (t >= p.at) toks.push({ s: p.chip, chip: true }); else { const n = Math.round(P(t, p.from, p.upto, E.lin) * p.typed.length); toks.push({ s: p.typed.slice(0, Math.max(1, n)) }); break; } }
  }
  const lines = [[]]; let x = 0;
  for (const tk of toks) { const w = ctx.measureText(tk.s).width + (tk.chip ? 6 : 0); if (x + w > maxW && x > 0 && tk.s.trim()) { lines.push([]); x = 0; } lines[lines.length - 1].push({ ...tk, x, w }); x += w; }
  return { lines, endX: x };
}
function drawTyped(t, msg, x0, y0, maxW, caretOn) {
  const { lines, endX } = layout(t, msg, maxW);
  font(400, TXT); ctx.textBaseline = 'alphabetic';
  lines.forEach((ln, i) => ln.forEach(tk => {
    const y = y0 + i * LINE_H;
    if (tk.chip) { ctx.fillStyle = '#E3EBE1'; rr(x0 + tk.x, y - 15, tk.w - 2, 21, 4); ctx.fill(); ctx.fillStyle = '#5E7F5F'; ctx.fillText(tk.s, x0 + tk.x + 3, y); }
    else { ctx.fillStyle = '#241E19'; ctx.fillText(tk.s, x0 + tk.x, y); }
  }));
  if (caretOn && Math.floor(t * 2.2) % 2 === 0) { ctx.fillStyle = '#241E19'; ctx.fillRect(x0 + endX + 1, y0 + (lines.length - 1) * LINE_H - 17, 1.5, 21); }
  return lines.length;
}

// ------------------------------------------------------------------ the thread (tall sprites, items revealed over time)
// variants: thA until the firm memory is confirmed, thB until the question about the offer is answered, thC after
const VIS = 528;   // newest item's bottom sits this far below the thread top (just above the docked chat box)
function threadEvents() {
  const ev = [
    [C + 0.15, 'a_stamp'], [C + 0.15, 'a_ub'], [C + 1.0, 'a_s0'], [C + 1.5, 'a_s1'], [C + 2.1, 'a_t1'], [C + 2.9, 'a_reply', C + 6.6], [C + 6.8, 'a_acts'],
    [Em + 2.85, 'm_stamp'], [Em + 2.85, 'm_ub'], [Em + 3.5, 'm_s0'], [Em + 4.0, 'm_s1'], [Em + 4.4, 'm_wait'], [Em + 4.55, 'm_banner'],
    [Em + 9.1, 'm_s2'], [Em + 9.6, 'm_reply', Em + 10.3], [Em + 10.5, 'm_acts'],
    [F + 7.85, 'p_stamp'], [F + 7.85, 'p_ub'], [F + 8.5, 'p_t1'], [F + 9.0, 'p_s0'], [F + 9.35, 'p_s1'], [F + 9.7, 'p_s2'], [F + 10.05, 'p_s3'], [F + 10.5, 'p_t2'],
    [F + 11.0, 'p_s4'], [F + 11.35, 'p_s5'], [F + 11.7, 'p_s6'], [F + 12.2, 'p_t3'], [F + 12.8, 'p_s7'], [F + 13.1, 'p_wait'], [F + 13.25, 'p_banner'],
    [G + 6.75, 'p_t4'], [G + 7.2, 'p_s8'], [G + 7.6, 'p_s9'], [G + 8.1, 'p_t5'], [G + 8.6, 'p_doc'], [G + 9.1, 'p_reply', G + 10.8],
  ];
  return ev;
}
const VAR_B = () => Em + 8.95, VAR_C = () => G + 6.55;
const variantAt = t => t >= VAR_C() ? 'thC' : t >= VAR_B() ? 'thB' : 'thA';
function itemRect(v, id) { return RECTS[v].items[id]; }
// scroll keyframes: follow the newest item; at the zoom on the numbered points, frame the list
function scrollKeys() {
  const keys = [[0, 0]];
  for (const [a, id, end] of threadEvents()) {
    const v = variantAt(a + .01), r = itemRect(v, id); if (!r) continue;
    if (end) { keys.push([a, Math.max(0, r[1] + Math.min(r[3], 120) - VIS)]); keys.push([end - .4, Math.max(0, r[1] + r[3] - VIS)]); }
    else keys.push([a, Math.max(0, r[1] + r[3] - VIS)]);
  }
  // the numbered points, framed for the zoom
  const ol = itemRect('thA', 'a_ol'), np = itemRect('thA', 'a_np');
  keys.push([D - .9, Math.max(0, ol[1] + ol[3] - 470)]);
  keys.sort((p, q) => p[0] - q[0]);
  // keep the frame on the list until the memory request is sent
  return keys.filter(k => !(k[0] > D - .9 && k[0] < Em + 2.8) || k[0] === D - .9);
}
let SK = null;
const threadScroll = t => eased(t, SK || (SK = scrollKeys()), .6);
function drawThread(t, alpha = 1) {
  if (alpha <= 0) return;
  const v = variantAt(t), sc = threadScroll(t), img = IMG[v], it = RECTS[v].items, [bx, by] = RECTS[v].box;
  ctx.save(); ctx.beginPath(); ctx.rect(56, 140, 1382, 704); ctx.clip(); ctx.globalAlpha *= alpha;
  for (const [a, id, end] of threadEvents()) {
    const r = it[id]; if (!r) continue;
    const k = P(t, a, a + .4); if (k <= 0) continue;
    // a streamed answer grows line by line
    const hh = end ? Math.max(24, r[3] * P(t, a, end, E.lin)) : r[3];
    const [x, y, w] = r; ctx.save(); ctx.globalAlpha *= k;
    ctx.drawImage(img, x * 2, y * 2, w * 2, hh * 2, bx + x, by + y - sc + (1 - k) * 12, w, hh); ctx.restore();
  }
  ctx.restore();
}
function fadeBottom(x, w, alpha = 1) {
  const g = ctx.createLinearGradient(0, 644, 0, 844); g.addColorStop(0, 'rgba(254,253,251,0)'); g.addColorStop(.45, '#FEFDFB'); g.addColorStop(1, '#FEFDFB');
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = g; ctx.fillRect(x, 644, w, 200); ctx.restore();
}
// narrow thread (chat beside the document): the end of the conversation
function drawThreadNarrow(alpha) {
  if (alpha <= 0) return;
  const it = RECTS.thN.items, [bx, by] = RECTS.thN.box, r = it.p_doc, sc = Math.max(0, r[1] + r[3] + 70 - VIS);
  ctx.save(); ctx.beginPath(); ctx.rect(56, 140, 790, 704); ctx.clip(); ctx.globalAlpha *= alpha;
  ctx.drawImage(IMG.thN, 0, sc * 2, 790 * 2, 704 * 2, bx, by, 790, 704); ctx.restore();
}

// ------------------------------------------------------------------ cursor
const CLK = { up: A + 1.6, choose: A + 2.7, upload: A + 3.7, pick1: B + 4.35, send1: B + 6.6, send2: Em + 2.65, yes: Em + 7.6, pick2: F + 6.65, send3: F + 7.7, rec: G + 5.2, jobs: J + 1.4 };
const CLICKS = Object.values(CLK);
const dockBottomShift = n => box('cboxDock' + n)[3] - box('cboxDock1')[3];
function cursorPath() {
  const kb = RECTS.kb0, u0 = RECTS.upd0, u1 = RECTS.upd1;
  const mp0 = RECTS.mp0, mp1 = RECTS.mp1_5;
  const go = R('cboxDock1', 'go'), goMid = R('cboxMidOn', 'go');
  const f = RECTS.fcardHot, q = RECTS.q2Hot;
  const sh5 = dockBottomShift(5);
  return [
    [A + 0.5, A + 0.51, 'enter'], [A + 0.6, A + 1.35, Cn(kb.btnUp)], [A + 1.9, A + 2.5, Cn(u0.updCh)], [A + 3.0, A + 3.5, Cn(u1.updBtn)], [A + 4.1, A + 4.7, 'exit'],
    [B + 3.4, B + 3.41, 'exit'], [B + 3.5, B + 4.15, [Cn(mp0.mpRow)[0] - 60, Cn(mp0.mpRow)[1]]], [B + 5.8, B + 6.4, Cn(goMid)], [B + 6.9, B + 7.5, 'exit'],
    [Em + 1.9, Em + 1.91, 'exit'], [Em + 2.0, Em + 2.5, Cn(go)], [Em + 5.9, Em + 6.6, [f.dopt0[0] + 140, f.dopt0[1] + 14]], [Em + 8.0, Em + 8.6, 'exit'],
    [F + 5.75, F + 5.76, 'exit'], [F + 5.85, F + 6.45, [Cn(mp1.mpRow)[0] - 60, Cn(mp1.mpRow)[1] - sh5]], [F + 7.1, F + 7.5, [Cn(go)[0], Cn(go)[1]]], [F + 7.9, F + 8.5, 'exit'],
    [G + 1.8, G + 1.81, 'exit'], [G + 1.9, G + 2.6, [q.dopt0[0] + 160, q.dopt0[1] + 14]], [G + 5.6, G + 6.2, 'exit'],
    [J + 0.1, J + 0.11, 'exit'], [J + 0.2, J + 1.1, Cn(R('greet', 'railJobs'))], [J + 2.7, J + 3.3, Cn(R('jpanel', 'jDl'))], [J + 4.1, J + 4.7, 'exit'],
  ];
}
const CURSOR_ON = [[A + 0.5, A + 4.7], [B + 3.4, B + 7.5], [Em + 1.9, Em + 8.6], [F + 5.75, F + 8.5], [G + 1.8, G + 6.2], [J + 0.1, J + 4.7]];

// captions (step number, text) in the pill under the window
const CAP = [[A + 0.2, 1, 'Add their letter'], [B, 2, 'List every point'], [Em, 3, 'Set the firm’s tone'], [F, 4, 'Your position, in one message'],
  [G, 5, 'Andri asks first'], [Hd, 6, 'The reply, on your letterhead'], [J, 7, 'Open it from Jobs']];
const CAP_END = K - 0.7;

// ------------------------------------------------------------------ camera
const POSE = { s: 1.08, cx: 960, cy: 503 };
function zoomOn(r, maxW, maxH, cx = 960, cy = 500) { const s = Math.min(maxW / r[2], maxH / r[3]); return { fx: r[0] + r[2] / 2, fy: r[1] + r[3] / 2, s, cx, cy, clip: r, r: 18, o: 1 }; }
// the numbered points, in app px at the moment of the zoom
function pointsRect() {
  const it = RECTS.thA.items, [bx, by] = RECTS.thA.box, sc = threadScroll(D + 1), np = it.a_np, ol = it.a_ol;
  return [bx + ol[0] - 30, by + np[1] - sc - 14, ol[2] + 50, ol[1] + ol[3] - np[1] + 26];
}
function shot(name) {
  const full = [0, 0, 1440, 860];
  if (name === 'screen') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy, clip: full, r: 22, o: 1 };
  if (name === 'below') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy + 1100, clip: full, r: 22, o: 1 };
  if (name === 'gone') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy, clip: full, r: 22, o: 0 };   // plain fade, as Bennett likes
  if (name === 'mp0') { const m = box('mp0'), k = Math.min(1300 / m[2], 640 / m[3]); return { ...zoomOn(m, 1300, 640), r: 16 * k }; }
  if (name === 'points') return zoomOn(pointsRect(), 1640, 820);
  if (name === 'fcard') { const b = box('fcardHot').slice(); b[3] -= 6; return { ...zoomOn(b, 1500, 860), r: 16 * Math.min(1500 / b[2], 860 / b[3]) / 1 }; }
  if (name === 'q2') { const b = box('q2Hot'); return { ...zoomOn(b, 1560, 820), r: 16 * Math.min(1560 / b[2], 820 / b[3]) }; }
  if (name === 'letter') { const d = box('dpanel'); return zoomOn([d[0] + 20, d[1] + 50, d[2] - 40, 560], 1500, 900); }
  if (name === 'jobs') { const d = box('jpanel'); return zoomOn([d[0], d[1], d[2], 320], 1400, 760); }
}
const SHOTS = () => [[0, 'below', 0], [6.35, 'screen', 0.85],
  [B + 2.6, 'mp0', 0.7], [B + 4.6, 'screen', 0.7],
  [D, 'points', 0.85], [D + 6.6, 'screen', 0.8],
  [Em + 5.1, 'fcard', 0.8], [Em + 7.85, 'screen', 0.7],
  [G + 0.45, 'q2', 0.8], [G + 5.45, 'screen', 0.7],
  [Hd + 2.3, 'letter', 0.9], [Hd + 7.6, 'screen', 0.8],
  [J + 2.2, 'jobs', 0.8], [J + 4.0, 'screen', 0.7],
  [K - 1.05, 'gone', 1.0]];
let SH = null;
function camera(t) {
  const S = SH || (SH = SHOTS());
  let i = 0; while (i < S.length - 1 && S[i + 1][0] <= t) i++;
  const cur = shot(S[i][1]), d = S[i][2];
  if (i === 0 || d === 0) return cur;
  const prev = shot(S[i - 1][1]); const k = E.qio(cl((t - S[i][0]) / d));
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
function drawKB(t) {
  // the list, then the new row validating, then complete with its Letter tag
  const done = P(t, A + 5.6, A + 6.0, E.io);
  plate(t >= A + 4.6 ? 'kbVal' : 'kb0');
  plate('kbDone', done);
  ring(t, A + 1.2, A + 1.75, R('kb0', 'btnUp'), 10, 4);
  // the upload dialog
  const open = P(t, CLK.up + .1, CLK.up + .4, E.out), close = P(t, A + 4.35, A + 4.65, E.io), vis = open * (1 - close);
  if (vis > 0) {
    ctx.save(); ctx.globalAlpha *= vis * .42; ctx.fillStyle = 'rgb(48,42,34)'; ctx.fillRect(0, 0, 1440, 860); ctx.restore();
    const d = t >= CLK.upload + .1 ? 'upd2' : t >= CLK.choose + .15 ? 'upd1' : 'upd0';
    floatShadow(d, vis, 0, (1 - P(t, CLK.up + .1, CLK.up + .5, E.back)) * 16, true);
    sprite(d, vis, 0, (1 - P(t, CLK.up + .1, CLK.up + .5, E.back)) * 16);
    // the progress bar fills before "Upload complete" (staging shows it for a moment)
  }
  const kb = RECTS.kbDone;
  ring(t, A + 5.7, A + 7.4, kb.kbNewOk, 7, 4);   // as the voice says "When it shows Complete"
}
function chatBox(t) {
  // docked chat box; grows upward with the text; swapped for the question cards while they are open
  const fOpen = P(t, Em + 4.85, Em + 5.15, E.io) * (1 - P(t, Em + 8.7, Em + 8.95, E.io));   // closes once the camera is back
  const qOpen = P(t, G + 0.0, G + 0.3, E.io) * (1 - P(t, G + 6.3, G + 6.55, E.io));
  const cardOn = Math.max(fOpen, qOpen);
  const b1 = box('cboxDock1');
  let msg = null, from = 0, until = 0;
  if (t >= Em && t < CLK.send2 + .05) { msg = MSG2(); from = Em; until = CLK.send2; }
  if (t >= F && t < CLK.send3 + .05) { msg = MSG3(); from = F; until = CLK.send3; }
  ctx.save(); ctx.globalAlpha *= 1 - cardOn;
  if (msg) {
    const n = Math.max(1, layout(t, msg, 724).lines.length), nm = 'cboxDock' + Math.min(6, n), b = box(nm), shift = b[3] - b1[3];
    ctx.drawImage(IMG[nm], b[0], b[1] - shift, b[2], b[3]);
    drawTyped(t, msg, b[0] + 18, b[1] - shift + 35, 724, t < until);
  } else { const b = box('cboxDock'); ctx.drawImage(IMG.cboxDock, b[0], b[1], b[2], b[3]); }
  ctx.restore();
  const d = box('disc'); ctx.save(); ctx.globalAlpha *= 1 - cardOn; ctx.drawImage(IMG.disc, d[0], d[1], d[2], d[3]); ctx.restore();
  // @ list for our settlement letter
  const m = P(t, F + 5.2, F + 5.4, E.out) * (1 - P(t, CLK.pick2 + .05, CLK.pick2 + .2, E.io));
  if (m > 0) { const n = Math.min(6, Math.max(4, layout(t, MSG3(), 724).lines.length)), nm = 'mp1_' + n; floatShadow(nm, m, 0, -dockBottomShift(n) + (1 - m) * 10); sprite(nm, m, 0, -dockBottomShift(n) + (1 - m) * 10); }
  // the cards
  if (fOpen > 0) { const nm = t >= Em + 6.75 ? 'fcardHot' : 'fcard', dy = (1 - P(t, Em + 4.85, Em + 5.3, E.back)) * 30; floatShadow(nm, fOpen, 0, dy); sprite(nm, fOpen, 0, dy); }
  if (qOpen > 0) { const nm = t >= G + 2.7 ? 'q2Hot' : 'q2', dy = (1 - P(t, G, G + .45, E.back)) * 30; floatShadow(nm, qOpen, 0, dy); sprite(nm, qOpen, 0, dy); }
}
function drawChat(t) {
  // greeting with the chat box in the middle until the first question is sent
  const conv = P(t, CLK.send1 + .1, CLK.send1 + .7, E.io);
  if (conv < 1) {
    ctx.save(); ctx.globalAlpha *= 1 - conv;
    plate('greet');
    if (t >= B + 0.55) {
      const n = layout(t, MSG1(), 724).lines.length, nm = n > 1 ? 'cboxMid2' : 'cboxMidOn', b = box(nm);
      ctx.drawImage(IMG[nm], b[0], b[1], b[2], b[3]);
      drawTyped(t, MSG1(), b[0] + 18, b[1] + 35, 724, t < CLK.send1);
    }
    const m = P(t, B + 2.5, B + 2.7, E.out) * (1 - P(t, B + 5.3, B + 5.45, E.io));
    floatShadow('mp0', m, 0, (1 - m) * 10); sprite('mp0', m, 0, (1 - m) * 10);
    ctx.restore();
  }
  if (conv <= 0) return;
  const split = P(t, Hd + 0.8, Hd + 1.1, E.io), slide = P(t, Hd + 0.75, Hd + 1.35, E.qio);
  ctx.save(); ctx.globalAlpha *= conv;
  plate('chat', 1 - split);
  drawThread(t, 1 - split);
  fadeBottom(56, 1382, 1 - split);
  if (split < 1) { ctx.save(); ctx.globalAlpha *= 1 - split; chatBox(t); ctx.restore(); }
  // the numbered points, one ring after another, while zoomed in
  if (t > D && t < D + 6.8) {
    const it = RECTS.thA.items, [bx, by] = RECTS.thA.box, sc = threadScroll(t);
    ['a_b1', 'a_b2', 'a_b3', 'a_b4'].forEach((id, i) => { const r = it[id]; ring(t, D + 1.0 + i * 1.15, D + 2.05 + i * 1.15, [bx + r[0] + 2, by + r[1] - sc + 2, r[2] - 1, r[3] - 4], 6, 3); });
  }
  // the Firm tag on the saved memory
  if (t > Em + 9.2 && t < Em + 11.2) {
    const r = RECTS.thB.items.m_firm, [bx, by] = RECTS.thB.box, sc = threadScroll(t);
    ring(t, Em + 9.4, Em + 11.0, [bx + r[0], by + r[1] - sc, r[2], r[3]], 6, 3);
  }
  // chat beside the document
  if (split > 0) {
    ctx.save(); ctx.globalAlpha *= split; plate('split'); drawThreadNarrow(1); fadeBottom(56, 790);
    sprite('cboxSplit'); sprite('discSplit'); ctx.restore();
  }
  // side panels: the document, then Jobs
  const jIn = P(t, CLK.jobs + .1, CLK.jobs + .7, E.qio);
  if (slide > 0 && jIn < 1) {
    const p = box('dpanel'); ctx.save(); ctx.translate((1 - slide) * (p[2] + 40) + jIn * (p[2] + 40), 0);
    ctx.shadowColor = 'rgba(35,30,25,.12)'; ctx.shadowBlur = 30; ctx.drawImage(IMG.dpanel, p[0], p[1], p[2], p[3]); ctx.restore();
    // the point headings, as Andri wrote them
    const l = R('dpanel', 'lp1'); ring(t, Hd + 3.4, Hd + 6.4, [l[0] - 4, l[1] - 2, 200, l[3] + 4], 7, 3);
  }
  if (jIn > 0) {
    const p = box('jpanel'); ctx.save(); ctx.translate((1 - jIn) * (p[2] + 40), 0);
    ctx.shadowColor = 'rgba(35,30,25,.12)'; ctx.shadowBlur = 30; ctx.drawImage(IMG[t >= J + 3.25 ? 'jpanelHot' : 'jpanel'], p[0], p[1], p[2], p[3]); ctx.restore();
  }
  if (jIn > 0) { const d = R('jpanel', 'jDl'); ring(t, J + 2.45, J + 4.0, d, 7, 5); }
  // the Jobs icon in the matter sidebar
  if (t > J + 1.3 && t < J + 5.6) { const r = R('greet', 'railJobs'); ring(t, J + 1.35, J + 5.4, [r[0] - 2, r[1] - 2, r[2] + 4, r[3] + 4], 10, 6); }
  // "Document Ready" notification
  const ts = V2(t, Hd + 0.3, Hd + 6.0, .35, .4);
  if (ts > 0) { const dx = (1 - P(t, Hd + 0.3, Hd + .75, E.out)) * 60; floatShadow('toast', ts, dx, 0); sprite('toast', ts, dx, 0); }
  ctx.restore();
}
function drawApp(t) {
  const toChat = P(t, B - 0.55, B + 0.15, E.qio);   // page push from the knowledge base to the chat
  if (toChat < 1) { ctx.save(); ctx.translate(-toChat * 1440, 0); drawKB(t); ctx.restore(); }
  if (toChat > 0) { ctx.save(); ctx.translate((1 - toChat) * 1440, 0); drawChat(t); ctx.restore(); }
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

// ------------------------------------------------------------------ scenes
function title(t) {
  if (t > 7.2) return;
  const up = P(t, 6.3, 7.1, E.qio);
  ctx.save(); ctx.translate(0, -up * 1080);
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  ctx.fillStyle = '#F7E17E'; ctx.fillRect(0, 0, W, H);
  const e = P(t, 0.3, 0.75) * (1 - P(t, 6.1, 6.3)); font(600, 22); ctx.fillStyle = '#494746'; ctx.globalAlpha = e;
  ctx.letterSpacing = '3px'; ctx.fillText('ANDRI ACADEMY · 2.2', 122, 392); ctx.letterSpacing = '0px'; ctx.globalAlpha = 1;
  words('Reply to a letter', 120, 530, 0.5, .09, 120, 500, '#231E19', null);
  words('from the other side.', 120, 640, 1.15, .09, 84, 400, '#231E19', null);
  mascot('wave', t, .25, 7.2, 1180, 330, 640);   // the lightbulb pose has the left arm fused into a ray in its artwork
  ctx.restore();
}
function endCard(t) {
  if (t < K - 0.05) return;
  const a = P(t, K, K + .6), dy = (1 - P(t, K, K + .7, E.q)) * 24;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(0, dy);
  ctx.drawImage(IMG.logo, 512, 438, 520, 520 * 600 / 2299);
  font(500, 25); ctx.fillStyle = '#494746'; ctx.textBaseline = 'alphabetic'; ctx.fillText('Andri Academy · Next: Say it once. Andri remembers.', 515, 635);
  ctx.restore();
  const m = mascot('done', t, K + .25, DURATION + 1, 1105, 400, 420, { from: 'pop' });
  if (m) {
    const b = MMETA.done.badge;
    const bx = m.x + m.w / 2 + (b[0] * m.w + b[2] * m.w / 2 - m.w / 2) * m.sc, by = m.y + m.h + (b[1] * m.h + b[3] * m.h / 2 - m.h) * m.sc;
    const fi = Math.floor((t - K - .25) * MMETA.disc.fps) % MMETA.disc.frames, mw = m.w * m.sc, mh = m.h * m.sc;
    const ox = m.x + m.w / 2 - mw / 2, oy = m.y + m.h + m.dy - mh;
    const x = cl((t - K - .75) / .34), k = x <= 0 ? 0 : E.back(x);
    if (k > 0) {
      ctx.save(); ctx.globalAlpha *= cl(x * 4);
      ctx.translate(bx, by); ctx.rotate((1 - k) * -0.35); ctx.scale(k, k); ctx.translate(-bx, -by);
      ctx.drawImage(MASC.tick[fi], ox, oy, mw, mh); ctx.restore();
    }
  }
  // the clickable Up next card is added by the Academy website
}

// ------------------------------------------------------------------ frame
async function renderFrame(t) {
  if (!READY) READY = load();
  await READY;
  globalT = t;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.textAlign = 'left';
  background(t);
  const cam = camera(t);
  if (cam.o > 0 && t > 6.3) {
    // while the window fades, draw it whole first and fade it as one image, so no layer shows through another
    const fading = cam.o < 1, main = ctx;
    if (fading) { OFF = OFF || Object.assign(document.createElement('canvas'), { width: W, height: H }); ctx = OFF.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H); ctx.globalAlpha = 1; ctx.textAlign = 'left'; }
    const [x, y, w, h] = cam.clip; const [sx, sy] = toScreen(cam, x, y); const sw = w * cam.s, sh = h * cam.s;
    ctx.save(); ctx.globalAlpha = 1;
    ctx.shadowColor = 'rgba(35,30,25,.16)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 26; ctx.fillStyle = '#F2EFE9'; rr(sx, sy, sw, sh, cam.r); ctx.fill();
    ctx.shadowColor = 'rgba(35,30,25,.22)'; ctx.shadowBlur = 1; ctx.shadowOffsetY = 0; ctx.fill(); ctx.shadowColor = 'transparent';
    rr(sx, sy, sw, sh, cam.r); ctx.clip();
    ctx.translate(cam.cx - cam.fx * cam.s, cam.cy - cam.fy * cam.s); ctx.scale(cam.s, cam.s);
    drawApp(t);
    ctx.restore();
    if (fading) { ctx = main; ctx.save(); ctx.globalAlpha = cam.o; ctx.drawImage(OFF, 0, 0); ctx.restore(); }
  }
  endCard(t);
  title(t);
  caption(t);
  cursor(t, cam);
}

window.MG = { width: W, height: H, fps: FPS, duration: DURATION, renderFrame };
if (!navigator.webdriver) { const t0 = performance.now(); (function loop() { renderFrame(((performance.now() - t0) / 1000) % DURATION).then(() => requestAnimationFrame(loop)); })(); }
