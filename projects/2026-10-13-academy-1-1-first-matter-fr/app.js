// Andri Academy 1.1 French · Premier dossier, du début à la fin
// Everything is drawn on one <canvas> by renderFrame(t), a pure function of time t (seconds).
// App screens are still plates of real Andri staging (firm language French, 13 Oct 2026), captured from DOM snapshots
// by plates/capture.mjs (2x); all motion is drawn here. Look, camera, captions, cursor and end card follow the English 1.1.

const W = 1920, H = 1080, FPS = 60, INTRO = 3.0;   // DURATION is set after the time map (SEGS) below
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
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(src); i.src = src; }); }
const HOVER_NAMES = ['hv_chip', 'hv_trig', 'hv_optDe', 'hv_upd', 'hv_navDe', 'hv_new', 'hv_create', 'hv_kb', 'hv_upl', 'hv_choose', 'hv_uploadBtn', 'hv_railChat', 'hv_eq', 'hv_send1', 'hv_send2', 'hv_send3', 'hv_railJobs', 'hv_jobRow'];
const PLATES = [...HOVER_NAMES, 'listEN', 'coEN', 'coENdd', 'coENde', 'coDE', 'list', 'dlg0', 'dlgE', 'm0', 'kb0', 'pick0', 'pick1', 'kbProc', 'kbDone', 'm1', 'm1hot', 'eqp0', 'm1q1', 'm1q2', 'chat',
  'cboxDock', 'cboxDockOn', 'cboxDockAt', 'cboxDock2', 'mp0', 'mp2a', 'thread', 'split', 'src0', 'src1', 'jobsSplit', 'jobsP', 'docP', 'letter0', 'letter1'];
async function load() {
  RECTS = window.RECTS_DATA; MMETA = window.MASCOT_DATA;
  const jobs = PLATES.map(n => loadImg(ROOT + 'plates/' + n + '.png').then(i => IMG[n] = i));
  jobs.push(loadImg(ROOT + 'assets/Andri-Logo-Ink.svg').then(i => IMG.logo = i));
  jobs.push(loadImg(ROOT + 'assets/Andri-Logo-Icon-Ink.svg').then(i => IMG.icon = i));
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
const C = r => [r[0] + r[2] / 2, r[1] + r[3] / 2];
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function plate(name, alpha = 1) { if (alpha <= 0) return; ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(IMG[name], 0, 0, 1440, 860); ctx.restore(); }
function part(name, rect, dx = 0, dy = 0, alpha = 1) {
  if (alpha <= 0) return;
  const [x, y, w, h] = rect; ctx.save(); ctx.globalAlpha *= alpha;
  ctx.drawImage(IMG[name], x * 2, y * 2, w * 2, h * 2, x + dx, y + dy, w, h); ctx.restore();
}
// floating sprite (captured alone, transparent corners); its shadow is drawn here (known-issues #1)
function sprite(name, alpha = 1, dy = 0, scale = 1, shadow = true, at = null) {
  if (alpha <= 0) return;
  const [x, y, w, h] = at || box(name); ctx.save(); ctx.globalAlpha *= alpha;
  ctx.translate(x + w / 2, y + h / 2 + dy); ctx.scale(scale, scale);
  if (shadow) { ctx.shadowColor = 'rgba(35,30,25,.16)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12; }
  ctx.drawImage(IMG[name], -w / 2, -h / 2, w, h); ctx.restore();
}
function dim(alpha) { if (alpha <= 0) return; ctx.save(); ctx.fillStyle = `rgba(36,30,25,${.78 * alpha})`; ctx.fillRect(0, 0, 1440, 860); ctx.restore(); }
function font(w, s, fam = 'Rethink') { ctx.font = `${w} ${s}px ${fam}`; }
let globalT = 0;

// ------------------------------------------------------------------ timeline (app seconds; video time = t + INTRO)
// The scene times below are written on one timeline ("old" time). v2 (Bennett, 12 Oct: "quite fast"): everything after the
// title card plays 1.2x slower than that timeline, so cursor moves, typing and screens get more time. renderFrame maps
// video app time to old time with OLD(); audio/mix.py places narration, clicks and whooshes with the same factor.
// rate = video seconds per old second; idle stretches while Andri writes play a little quicker so the voice keeps flowing
// v6 (Bennett, 13 Oct 2026): a new first step shows how to switch Andri to the language (French here). It is inserted at S0 (old time) and lasts LANG
// seconds; every old time from S0 on moves LANG later (sh()). renderFrame maps video time -> tl (with the section) -> old time.
const S0 = 8.6, LANG = 10.0;
const sh = x => x >= S0 ? x + LANG : x;
const SEGS = [[0, 7.45, 1.0], [7.45, S0, 1.2], [S0, S0 + LANG, 1.0],
  [sh(S0), sh(13.6), 1.2], [sh(13.6), sh(15.0), 0.75], [sh(15.0), sh(17.0), 1.0], [sh(17.0), sh(20.8), 1.2], [sh(20.8), sh(24.2), 0.85], [sh(24.2), sh(33.5), 1.2], [sh(33.5), sh(38.6), 0.6],
  [sh(38.6), sh(43.4), 1.2], [sh(43.4), sh(46.3), 0.8], [sh(46.3), sh(51.1), 1.2], [sh(51.1), sh(53.6), 0.85],
  [sh(53.6), sh(55.6), 0.55], [sh(55.6), sh(57.6), 0.45], [sh(57.6), sh(62.0), 1.2], [sh(62.0), sh(63.3), 0.7],
  [sh(63.3), sh(66.0), 1.2], [sh(66.0), sh(67.0), 0.8], [sh(67.0), 999, 1.2]];
function NEW(o) { let n = 0; for (const [a, b, r] of SEGS) { if (o <= a) break; n += (Math.min(o, b) - a) * r; } return n; }
// French: the lines are shorter than the German ones, so the stretches where Andri works or the camera holds play a little faster
// (gaps between lines 3.3 to 4.6 s, all while something moves). The old timeline ends at 89.608 (section-inclusive).
const DURATION = INTRO + NEW(89.608);
function OLD(tn) { let n = 0; for (const [a, b, r] of SEGS) { const d = (b - a) * r; if (tn <= n + d) return a + (tn - n) / r; n += d; } return tn; }
// narration line starts, set in old time (the beat each line belongs to), placed in video app time (audio/de2/*.wav)
const VO_OLD = { L0: 0.6, L1: 4.6, L2: 9.5, L3: 17.7, L4: 25.9, L5: 38.4, L6: 47.4, L7: 57.96, L7b: 67.2, L8: 73.5 };
const VO = Object.fromEntries(Object.entries(VO_OLD).map(([k, v]) => [k, NEW(sh(v))])); VO.Lsw = NEW(S0 + 0.3);
const Q1 = 'Établissez une analyse SWOT de la position de Mme Nair : son poste de responsable des opérations, comparé à celui de James Thornton.';
const JOBS_FR = 'Traitements';   // set from the French rail tooltip in staging
const NAME = 'Nair c. Calderdale Logistique SA';
const Q2 = 'Quels arguments la défenderesse fait-elle valoir ?';
const Q3 = 'Rédigez une courte lettre à Priya Nair sur l’état actuel de la procédure.';
const CHIP2 = '@[03_Reponse.pdf]', CHIP3 = '@[Aldridge_Vine_Modele_de_lettre.docx]';

// screens: [start of push, screen id, direction]
const SCREENS = [[0, 'list'], [13.9, 'matter', 1], [16.0, 'kb', 1], [25.1, 'chat', -1]];
const PUSH = 0.7;

// cursor: [t0, t1, target]
const RC = (set, id) => C(R(set, id));
function cursorPath() {
  const th = RECTS.thread.items;
  return [
    [8.6, 8.9, C(R('listEN', 'navFirst'))],   // the cursor is still on Dossiers from the language step
    [9.1, 9.8, RC('list', 'btnNew')],
    [10.5, 11.0, [R('dlgE', 'dlgIn')[0] + 330, R('dlgE', 'dlgIn')[1] + 26]],
    [12.9, 13.4, RC('dlgE', 'btnCreate')],
    [15.1, 15.8, RC('m0', 'btnKB')],
    [16.9, 17.6, RC('kb0', 'btnUp')],
    [18.2, 18.7, RC('pick0', 'pickChoose')],
    [19.2, 19.7, RC('pick1', 'pickUp')],
    [20.0, 20.6, [1250, 760]],
    [24.3, 24.9, RC('kbDone', 'railChatKB')],
    [28.6, 29.3, RC('m1', 'eqBtn')],
    [30.3, 30.85, [R('m1', 'cbox')[0] + 300, R('m1', 'cbox')[1] + 30]],
    [32.7, 33.1, RC('m1q2', 'go')],
    [33.5, 34.1, [1250, 820]],
    [39.4, 40.1, 'cite1'],
    [40.6, 41.2, [1180, 820]],
    [45.9, 46.4, 'srcClose'],
    [46.9, 47.5, [1250, 830]],
    [50.0, 50.5, [R('mp0', 'box')[0] + 330, R('mp0', 'box')[1] + 137]],
    [52.6, 53.0, RC('cboxDockAt', 'go')],
    [53.3, 53.8, [1250, 830]],
    [59.95, 60.35, [R('mp2a', 'box')[0] + 330, R('mp2a', 'box')[1] + 137]],
    [60.55, 61.0, RC('cboxDock2', 'go')],
    [63.3, 63.9, RC('chat', 'railJobs')],
    [65.3, 65.8, [R('jobsP', 'jobRow')[0] + 190, R('jobsP', 'jobRow')[1] + 18]],
    [67.3, 67.8, 'exit'],
  ];
}
const CLICKS = [9.9, 13.5, 15.9, 17.7, 18.8, 19.8, 25.0, 29.4, 30.95, 33.2, 40.2, 46.5, 50.6, 53.1, 60.4, 61.1, 64.3, 65.9];
const CURSOR_ON = [[8.6, 20.6], [24.2, 34.1], [39.3, 41.2], [45.8, 47.5], [49.9, 53.8], [59.8, 67.8]];

// captions (step number, text) in the pill under the window
// each caption starts with its narration line (VO_OLD), never before it (Bennett, German 1.1)
const CAP = [[9.5, 1, 'Créer un dossier'], [17.7, 2, 'Ajouter les pièces'], [25.9, 3, 'Poser une première question'],
  [38.4, 4, 'Cliquer sur une source'], [47.4, 5, 'Choisir un document avec @'], [57.96, 6, 'Demander une première lettre']];
const CAP_END0 = 72.9;
// with the language step first: section-inclusive time, steps renumbered
const CAPS = [[S0 + 0.3, 1, 'Andri en français'], ...CAP.map(([a, n, x]) => [sh(a), n + 1, x])];
const CAP_END = sh(CAP_END0);

// ------------------------------------------------------------------ camera
const POSE = { s: 1.08, cx: 960, cy: 503 };
function shot(name) {
  const full = [0, 0, 1440, 860];
  if (name === 'screen') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy, clip: full, r: 22, o: 1 };
  if (name === 'below') return { fx: 720, fy: 430, s: POSE.s, cx: POSE.cx, cy: POSE.cy + 1100, clip: full, r: 22, o: 1 };
  if (name === 'gone') return { fx: 720, fy: 430, s: POSE.s * .9, cx: POSE.cx - 520, cy: POSE.cy, clip: full, r: 22, o: 0 };
  if (name === 'dlg') { const d = R('dlgE', 'dlg'); const s = Math.min(1050 / d[2], 780 / d[3]); return { fx: d[0] + d[2] / 2, fy: d[1] + d[3] / 2, s, cx: 960, cy: 520, clip: d, r: 18 * s, o: 1 }; }
  if (name === 'para') {
    const p = RECTS.src.panel, q = RECTS.src.para; const r = [p[0] + q[0] - 26, p[1] + q[1] - 26, q[2] + 52, q[3] + 52];
    const s = Math.min(1100 / r[2], 600 / r[3]); return { fx: r[0] + r[2] / 2, fy: r[1] + r[3] / 2, s, cx: 900, cy: 500, clip: r, r: 18, o: 1 };
  }
}
const SHOTS = [[0, 'below', 0], [7.55, 'screen', 0.85], [10.1, 'dlg', 0.75], [13.6, 'screen', 0.7], [41.4, 'para', 0.8], [45.1, 'screen', 0.7], [67.2, 'gone', 0.65]];
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

// ------------------------------------------------------------------ text: per word rise
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


// ------------------------------------------------------------------ hover states and tooltips (Andri's own look, staging 13 Oct 2026)
// Shown only while the cursor rests on a control: from arrival until the click (tooltips) or until the screen changes (hover look).
function hov(name, alpha = 1, dy = 0) { if (alpha <= 0) return; const [x, y, w, h] = RECTS[name].box; ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(IMG[name], x, y + dy, w, h); ctx.restore(); }
const HV = (t, a, b) => (t >= a && t < b) ? 1 : 0;
function tooltip(btn, text, alpha) {   // white, 1 px #CCC1B3 border, 8 px corners, 500 14 px Rethink Sans, padding 4/10, 8 px right of the button
  if (alpha <= 0) return; ctx.save(); ctx.globalAlpha *= alpha; font(500, 14); ctx.letterSpacing = '-0.35px';
  const w = ctx.measureText(text).width + 22, h = 30, x = btn[0] + btn[2] + 8, y = btn[1] + btn[3] / 2 - h / 2;
  ctx.shadowColor = 'rgba(35,30,25,.16)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6; ctx.fillStyle = '#FFFFFF'; rr(x, y, w, h, 8); ctx.fill();
  ctx.shadowColor = 'rgba(35,30,25,.06)'; ctx.shadowBlur = 2; ctx.shadowOffsetY = 1; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#CCC1B3'; ctx.lineWidth = 1; rr(x + .5, y + .5, w - 1, h - 1, 7.5); ctx.stroke();
  ctx.fillStyle = '#241E19'; ctx.textBaseline = 'middle'; ctx.fillText(text, x + 11, y + h / 2 + .5); ctx.letterSpacing = '0px'; ctx.restore();
}

// ------------------------------------------------------------------ app screens
let SCREEN_PLATE = 'list';
function caret(t, x, y, h = 20) { if (Math.floor(t * 2.2) % 2 === 0) { ctx.fillStyle = '#241E19'; ctx.fillRect(x + 1, y, 1.5, h); } }

// 1 matters list, New Matter dialog
function drawList(t) {
  plate(t < S0 ? 'listEN' : 'list');
  if (t >= S0) hov('hv_new', HV(t, 9.8, 9.95));
  const open = P(t, 9.95, 10.25, E.out) * (1 - P(t, 13.55, 13.75, E.io));
  if (open <= 0) return;
  dim(open);
  const d = R('dlgE', 'dlg'); const typing = t >= 11.1;
  ctx.save(); ctx.globalAlpha *= open; ctx.translate(d[0] + d[2] / 2, d[1] + d[3] / 2 + (1 - open) * 14); ctx.scale(.97 + .03 * open, .97 + .03 * open);
  ctx.shadowColor = 'rgba(20,15,10,.25)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  ctx.drawImage(IMG[typing ? 'dlgE' : 'dlg0'], d[0] * 2, d[1] * 2, d[2] * 2, d[3] * 2, -d[2] / 2, -d[3] / 2, d[2], d[3]);
  ctx.restore();
  if (typing) {   // the matter name, typed into the real field (14 px Rethink Sans, 12 px padding)
    const f = R('dlgE', 'dlgIn'); const n = Math.round(P(t, 11.2, 12.8, E.lin) * NAME.length);
    font(400, 14); ctx.fillStyle = '#241E19'; ctx.textBaseline = 'middle'; ctx.save(); ctx.globalAlpha *= open;
    const s = NAME.slice(0, n); ctx.fillText(s, f[0] + 13, f[1] + f[3] / 2 + 1);
    if (t < 13.5) caret(t, f[0] + 13 + ctx.measureText(s).width, f[1] + 10);
    ctx.restore();
  }
  hov('hv_create', HV(t, 13.4, 13.55) * open);
}
function drawMatter(t) { plate('m0'); hov('hv_kb', HV(t, 15.8, 16.0)); }

// 2 Knowledge Base: upload dialog, rows processing then done
function drawKB(t) {
  const rowsIn = t >= 19.95;
  plate('kb0');
  hov('hv_upl', HV(t, 17.6, 17.8));
  if (rowsIn) {
    // the table frame and header come from the done plate; rows slide in, process, then show summary, status and tags
    const tb = RECTS.kbDone.kbRows; const top = tb[0].row[1] - 50, bot = tb[tb.length - 1].row[1] + tb[tb.length - 1].row[3] + 70;
    part('kbProc', [100, top, 1340, bot - top], 0, 0, P(t, 19.95, 20.2));
    tb.forEach((r, i) => {
      const a = 20.0 + i * .18, k = P(t, a, a + .45, E.back), al = P(t, a, a + .2);
      ctx.save(); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(r.row[0], r.row[1], r.row[2], r.row[3]); ctx.restore();
      if (al <= 0) return;
      const done = P(t, 21.8 + i * .32, 22.15 + i * .32, E.io);
      ctx.save(); ctx.beginPath(); ctx.rect(r.row[0], r.row[1] - 2, r.row[2], r.row[3] + 4); ctx.clip();
      part('kbProc', r.row, (1 - k) * -50, 0, al * (1 - done));
      part('kbDone', r.row, (1 - k) * -50, 0, al * done); ctx.restore();
      if (done < 1) {   // spinner in the status cell while Andri reads the file
        const [sx, sy, , sh] = r.status; ctx.save(); ctx.globalAlpha = al * (1 - done); ctx.translate(sx + 22 + (1 - k) * -50, sy + sh / 2);
        ctx.lineWidth = 2; ctx.strokeStyle = '#E3DCCF'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#96732C'; ctx.beginPath(); ctx.arc(0, 0, 6, t * 9, t * 9 + 1.6); ctx.stroke(); ctx.restore();
      }
    });
  }
  // Email Documents: the other way in, ringed while the voice says it (drawn above the rows; fits the button's 12 px corners)
  const em = V2(t, 20.1, 21.7, .3, .4);
  if (em > 0) { const b = R('kb0', 'btnEmail'); ctx.save(); ctx.globalAlpha = em; ctx.strokeStyle = '#E9CD4F'; ctx.lineWidth = 3; rr(b[0] - 3.5, b[1] - 3.5, b[2] + 7, b[3] + 7, 15.5); ctx.stroke(); ctx.restore(); }
  hov('hv_railChat', HV(t, 24.9, 25.1)); tooltip(R('kbDone', 'railChatKB'), 'Chat', HV(t, 25.05, 25.0) || (t >= 24.95 && t < 25.0 ? 1 : 0));
  // the upload dialog: opens, files chosen, Upload
  const pk = P(t, 17.8, 18.05, E.out) * (1 - P(t, 19.85, 20.05, E.io));
  if (pk > 0) {
    dim(pk);
    const chosen = P(t, 18.9, 19.1, E.io);
    sprite('pick0', pk * (1 - chosen), (1 - pk) * 10);
    hov('hv_choose', HV(t, 18.7, 18.9) * pk * (1 - chosen));
    sprite('pick1', pk * chosen, (1 - pk) * 10);
    hov('hv_uploadBtn', HV(t, 19.7, 19.85) * pk * chosen);
    if (t > 19.75 && t < 20.0) { const u = R('pick1', 'pickUp'); ctx.save(); ctx.globalAlpha = pk; ctx.strokeStyle = 'rgba(233,205,79,.7)'; ctx.lineWidth = 3; rr(u[0] - 3, u[1] - 3, u[2] + 6, u[3] + 6, 12); ctx.stroke(); ctx.restore(); }
  }
}

// 3 the chat: greeting with Example questions, then the conversation
const TH = () => RECTS.thread.items;
const TB = () => RECTS.thread.box;         // the thread's scroll box in app px (wide card)
const VIS_H = 548;                         // thread area visible above the docked chat box
function wideChunk(r) { return [217, r[1], 924, r[3]]; }   // answer blocks include the status dot on the left
function threadEvents() {
  const it = TH(); const ev = [];
  ev.push([33.45, it.ub1]); it.steps1_children.forEach((r, i) => ev.push([33.95 + i * .165, r]));
  it.ans1_children.forEach((r, i) => ev.push([36.9 + i * .32, wideChunk(r)])); ev.push([38.8, it.act1]);
  ev.push([53.2, it.ub2]); it.steps2_children.forEach((r, i) => ev.push([53.5 + i * .18, r]));
  it.ans2_children.forEach((r, i) => ev.push([54.2 + i * .4, wideChunk(r)])); ev.push([55.4, it.act2]);
  ev.push([61.2, it.ub3]); it.steps3_children.forEach((r, i) => ev.push([61.55 + i * .3, r]));
  ev.push([63.25, wideChunk(it.ans3_children[0])]); ev.push([63.55, it.act3]);
  return ev;
}
function threadScroll(t) {
  const ev = threadEvents(); let s = 0, prev = 0;
  for (const [a, r] of ev) {
    const target = Math.max(prev, r[1] + r[3] - VIS_H);
    if (t < a) break;
    s = L(prev, target, P(t, a, a + .6, E.io)); prev = target;
  }
  return s;
}
function drawThread(t, alpha = 1) {
  const ev = threadEvents(), sc = threadScroll(t), [ox, oy, bw] = TB();
  ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, bw, 844 - oy); ctx.clip(); ctx.globalAlpha *= alpha;
  for (const [a, r] of ev) {
    const k = P(t, a, a + .4); if (k <= 0) continue;
    const [x, y, w, h] = r; ctx.save(); ctx.globalAlpha *= k;
    ctx.drawImage(IMG.thread, x * 2, y * 2, w * 2, h * 2, ox + x, oy + y - sc + (1 - k) * 14, w, h); ctx.restore();
  }
  // "Creating Word document": working until the letter is done, then the check (drawn over the finished row)
  const s3 = TH().steps3_children; const last = s3[s3.length - 1]; const wk = 1 - P(t, 63.0, 63.2);
  if (t >= 62.75 && wk > 0) { const y = oy + last[1] - sc + last[3] / 2, x = ox + last[0] + 22; ctx.save(); ctx.globalAlpha *= wk;
    ctx.fillStyle = '#FBFAF8'; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = '#E3DCCF'; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#96732C'; ctx.beginPath(); ctx.arc(x, y, 6, t * 9, t * 9 + 1.6); ctx.stroke(); ctx.restore(); }
  ctx.restore();
  // the thread fades out behind the docked chat box
  const g = ctx.createLinearGradient(0, 652, 0, 712); g.addColorStop(0, 'rgba(252,251,249,0)'); g.addColorStop(1, '#FCFBF9');
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = g; ctx.fillRect(ox, 652, bw, 60); ctx.fillStyle = '#FCFBF9'; ctx.fillRect(ox, 712, bw, 132); ctx.restore();
}
function wrap(text, maxW) {   // word wrap like the textarea
  const out = []; let cur = '';
  for (const w of text.split(' ')) { const tryL = cur ? cur + ' ' + w : w; if (ctx.measureText(tryL).width > maxW && cur) { out.push(cur); cur = w; } else cur = tryL; }
  out.push(cur); return out;
}
function chip(text, x, y, kind) {   // @ mention: staging's own colours (pdf brown, Word green, 18 % tint), 2 px radius, 16 px
  font(400, 16); const w = ctx.measureText(text).width; const col = kind === 'doc' ? [88, 126, 119] : [150, 115, 44];
  ctx.fillStyle = `rgba(${col},.18)`; rr(x, y - 16.5, w, 21, 2); ctx.fill(); ctx.fillStyle = `rgb(${col})`; ctx.fillText(text, x, y); return w;
}
function dock(t, split) {
  // docked chat box: empty, typing, @ menus
  let name = 'cboxDock';
  if (t >= 49.4 && t < 50.6) name = 'cboxDockOn';
  if (t >= 50.6 && t < 53.15) name = 'cboxDockAt';
  if (t >= 57.85 && t < 60.4) name = 'cboxDockOn';
  if (t >= 60.4 && t < 61.15) name = 'cboxDock2';
  ctx.save(); ctx.globalAlpha *= 1 - split;
  sprite(name, 1, 0, 1, false);
  if (name === 'cboxDockAt') hov('hv_send2', HV(t, 53.0, 53.15));
  if (name === 'cboxDock2') hov('hv_send3', HV(t, 61.0, 61.15));
  const [tx, ty0] = RECTS[name].text0; const ty = ty0 + 17;   // first line baseline (16 px on a 24 px line)
  font(400, 16); ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#241E19';
  if (t >= 49.4 && t < 50.6) { const s = '@Rep'.slice(0, Math.round(P(t, 49.5, 49.9, E.lin) * 4)); ctx.fillText(s, tx, ty); caret(t, tx + ctx.measureText(s).width, ty - 16); }
  if (t >= 50.6 && t < 53.15) { const w = chip(CHIP2, tx, ty, 'pdf'); font(400, 16); ctx.fillStyle = '#241E19';
    const s = ' ' + Q2.slice(0, Math.round(P(t, 50.8, 52.5, E.lin) * Q2.length)); ctx.fillText(s, tx + w, ty); if (t < 53.0) caret(t, tx + w + ctx.measureText(s).width, ty - 16); }
  if (t >= 57.85 && t < 60.4) {
    const s = Q3.slice(0, Math.round(P(t, 57.9, 59.55, E.lin) * Q3.length)); ctx.fillText(s, tx, ty);
    let cx = tx + ctx.measureText(s).width;
    if (t >= 59.6) { const at = ' @Ald'.slice(0, Math.round(P(t, 59.6, 59.85, E.lin) * 5)); ctx.fillText(at, cx, ty); cx += ctx.measureText(at).width; }
    caret(t, cx, ty - 16);
  }
  if (t >= 60.4 && t < 61.15) { ctx.fillText(Q3, tx, ty); chip(CHIP3, tx, ty + 24, 'doc'); }
  ctx.restore();
  // disclaimer under the docked box: staging style (500 11 px Rethink Sans, #494746, centred), on the card white
  ctx.save(); ctx.globalAlpha *= 1 - split; font(500, 11); ctx.fillStyle = '#494746'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const dd = RECTS.cboxDock.disc; ctx.fillText('Andri est un système d\'IA et peut commettre des erreurs ; veuillez vérifier ses réponses.', dd[0] + dd[2] / 2, dd[1] + 11.6); ctx.textAlign = 'left'; ctx.restore();
  // @ menus
  const m1 = P(t, 49.85, 50.05, E.out) * (1 - P(t, 50.6, 50.75, E.io)); if (m1 > 0) sprite('mp0', m1, (1 - m1) * 10);
  const m2 = P(t, 59.85, 60.05, E.out) * (1 - P(t, 60.4, 60.55, E.io)); if (m2 > 0) sprite('mp2a', m2, (1 - m2) * 10);
}
function drawChat(t) {
  // greeting with Example questions, until the SWOT question is sent
  const conv = P(t, 33.3, 33.9, E.io);
  if (conv < 1) {
    ctx.save(); ctx.globalAlpha *= 1 - conv;
    const typed = Q1.slice(0, Math.round(P(t, 31.1, 32.95, E.lin) * Q1.length));
    font(400, 16); const lines = wrap(typed, R('m1q1', 'text0')[2]);
    if (t >= 31.05) plate(lines.length > 1 ? 'm1q2' : 'm1q1');
    else plate(t >= 29.4 ? 'm1hot' : 'm1');
    if (t >= 31.05) {   // the typed question, staging's 16 px Rethink Sans on a 24 px line
      const [tx, ty] = R(lines.length > 1 ? 'm1q2' : 'm1q1', 'text0'); font(400, 16); ctx.fillStyle = '#241E19'; ctx.textBaseline = 'alphabetic';
      lines.forEach((l, i) => ctx.fillText(l, tx, ty + 17 + i * 24));
      if (t < 33.2) { const last = lines[lines.length - 1] || ''; caret(t, tx + ctx.measureText(last).width, ty + 1 + (lines.length - 1) * 24); }
    }
    if (t < 29.4) hov('hv_eq', HV(t, 29.3, 29.4));
    hov('hv_send1', HV(t, 33.1, 33.3));
    const eq = P(t, 29.5, 29.75, E.out) * (1 - P(t, 30.9, 31.1, E.io));
    if (eq > 0) sprite('eqp0', eq, (1 - eq) * 12);
    ctx.restore();
  }
  if (conv <= 0) return;
  const split = P(t, 40.3, 40.55, E.io) * (1 - P(t, 46.6, 46.85, E.io));      // source view: narrow card + PDF viewer
  const jobs = P(t, 64.4, 64.65, E.io);                                        // Jobs: narrow card + Jobs panel
  ctx.save(); ctx.globalAlpha *= conv;
  plate('chat'); drawThread(t, 1); dock(t, Math.max(split, jobs));
  if (split > 0) { plate('split', split); }
  const slide = P(t, 40.3, 40.85, E.qio) * (1 - P(t, 46.6, 47.15, E.qio));
  if (slide > 0) {   // the judgment opens beside the chat; the yellow highlight sweeps across the cited passage
    const [px, py, pw, ph] = RECTS.src.panel; const off = (1 - slide) * (pw + 40);
    sprite('src0', 1, 0, 1, true, [px + off, py, pw, ph]);
    const hw = P(t, 42.4, 43.3, E.io);
    if (hw > 0) { const q = RECTS.src.para; ctx.save(); ctx.beginPath(); ctx.rect(px + off + q[0] - 4, py + q[1] - 4, (q[2] + 8) * hw, q[3] + 8); ctx.clip(); ctx.drawImage(IMG.src1, px + off, py, pw, ph); ctx.restore(); }
  }
  // Jobs (French rail label): hover look while the cursor rests, tooltip from shortly after arrival until the click
  hov('hv_railJobs', HV(t, 63.9, 64.45)); tooltip(R('chat', 'railJobs'), JOBS_FR, HV(t, 64.0, 64.3));
  if (jobs > 0) {
    plate('jobsSplit', jobs);
    const js = P(t, 64.4, 64.95, E.qio); const [px, py, pw, ph] = box('jobsP'); const off = (1 - js) * (pw + 40);
    const docOn = t >= 66.0;
    sprite(docOn ? 'docP' : 'jobsP', 1, 0, 1, true, [px + off, py, pw, ph]);
    if (!docOn && js >= 1) hov('hv_jobRow', HV(t, 65.8, 66.0));
  }
  ctx.restore();
}

const DRAW = { list: drawList, matter: drawMatter, kb: drawKB, chat: drawChat };
const NAV = { list: 'list', matter: 'm0', kb: 'kb0', chat: 'm1' };
function app(t) {
  let i = 0; while (i < SCREENS.length - 1 && SCREENS[i + 1][0] <= t) i++;
  const [t0, id, dir] = SCREENS[i]; const k = i === 0 ? 1 : E.qio(cl((t - t0) / PUSH));
  if (k >= 1) { DRAW[id](t); return; }
  const prev = SCREENS[i - 1][1];
  ctx.save(); ctx.beginPath(); ctx.rect(0, 67, 1440, 793); ctx.clip();
  ctx.save(); ctx.translate(-dir * 1440 * .3 * k, 0); DRAW[prev](t); ctx.fillStyle = `rgba(35,30,25,${.06 * k})`; ctx.fillRect(0, 0, 1440, 860); ctx.restore();
  ctx.save(); ctx.translate(dir * 1440 * (1 - k), 0); ctx.shadowColor = 'rgba(35,30,25,.18)'; ctx.shadowBlur = 30; ctx.fillStyle = '#F2EFE9'; ctx.fillRect(0, 67, 1440, 793); ctx.shadowColor = 'transparent'; DRAW[id](t); ctx.restore();
  ctx.restore();
  part(NAV[k < .5 ? prev : id], [0, 0, 1440, 67]);
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
    if (tg === 'cite1') { const r = TH().cite1, [ox, oy] = TB(); return toScreen(cam, ox + r[0] + r[2] / 2, oy + r[1] + r[3] / 2 - threadScroll(t)); }
    if (tg === 'srcClose') { const p = RECTS.src.panel, q = RECTS.src.close; return toScreen(cam, p[0] + q[0] + q[2] / 2, p[1] + q[1] + q[3] / 2); }
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
  const first = CAPS[0][0];
  if (t < first || t > CAP_END + .1) return;
  let ci = 0; for (let i = 0; i < CAPS.length; i++) if (t >= CAPS[i][0]) ci = i;
  const [t0, n, text] = CAPS[ci];
  const H = 62, Rr = 21, PAD = 90;
  font(500, 26, 'Neco'); const widthOf = s => ctx.measureText(s).width + PAD;
  const open = P(t, first + .12, first + .55, E.qio), close = P(t, CAP_END - .45, CAP_END - .05, E.qio);
  let w = widthOf(text);
  if (ci > 0) w = L(widthOf(CAPS[ci - 1][2]), w, P(t, t0, t0 + .45, E.qio));
  w = L(H, w, open * (1 - close));
  const pop = (x => x <= 0 ? 0 : E.back(x))(cl((t - first) / .32)) * (1 - P(t, CAP_END - .1, CAP_END + .1, E.io));
  if (pop <= 0) return;
  const x = 960 - w / 2, y = 1022 - H / 2;
  ctx.save();
  ctx.translate(960, y + H / 2); ctx.scale(pop, pop); ctx.translate(-960, -(y + H / 2));
  ctx.shadowColor = 'rgba(35,30,25,.10)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4; ctx.fillStyle = '#FFFFFF'; rr(x, y, w, H, H / 2); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#DDD1BE'; ctx.lineWidth = 1; ctx.stroke();
  ctx.save(); rr(x, y, w, H, H / 2); ctx.clip();
  ctx.fillStyle = '#F7E17E'; ctx.beginPath(); ctx.arc(x + 31, y + H / 2, Rr, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(x + 31, y + H / 2, Rr, 0, Math.PI * 2); ctx.clip();
  font(700, 19); ctx.fillStyle = '#231E19'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const nk = ci > 0 ? P(t, t0, t0 + .35, E.qio) : 1;
  if (ci > 0 && nk < 1) { ctx.globalAlpha = 1 - nk; ctx.fillText(String(CAPS[ci - 1][1]), x + 31, y + H / 2 + 1 - nk * 22); }
  ctx.globalAlpha = nk; ctx.fillText(String(n), x + 31, y + H / 2 + 1 + (1 - nk) * 22); ctx.restore();
  font(500, 26, 'Neco'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#231E19';
  const tin = ci === 0 ? P(t, first + .35, first + .7, E.q) : P(t, t0 + .12, t0 + .5, E.q);
  const tout = ci > 0 ? 1 - P(t, t0, t0 + .15, E.io) : 0;
  const fadeEnd = 1 - P(t, CAP_END - .5, CAP_END - .3, E.io);
  if (tout > 0) { ctx.globalAlpha = tout * fadeEnd; ctx.fillText(CAPS[ci - 1][2], x + 64, y + H / 2 + 1 - (1 - tout) * 10); }
  ctx.globalAlpha = tin * fadeEnd; ctx.fillText(text, x + 64, y + H / 2 + 1 + (1 - tin) * 12);
  ctx.restore(); ctx.restore();
}
function callout(t, a, b, anchor, x, y, title, file, kind) {
  const v = V2(t, a, b, .35, .3); if (v <= 0) return;
  font(500, 25, 'Neco'); const tw = ctx.measureText(title).width; font(500, 14); const fw = ctx.measureText(file).width;
  const w = Math.max(tw, fw + 20) + 32, h = 62, dy = (1 - P(t, a, a + .4, E.back)) * 14;
  const k = P(t, a + .05, a + .55, E.io), sx = x, sy = y + h / 2 + dy, [ax, ay] = anchor, mx = L(ax, sx, .5);
  ctx.save(); ctx.globalAlpha = v; ctx.strokeStyle = '#C9A733'; ctx.fillStyle = '#C9A733'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(ax, ay, 5, 0, Math.PI * 2); ctx.fill();
  ctx.setLineDash([1600]); ctx.lineDashOffset = (1 - k) * 1600; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.bezierCurveTo(mx, ay, mx, sy, sx, sy); ctx.stroke(); ctx.setLineDash([]);
  ctx.translate(0, dy); ctx.shadowColor = 'rgba(120,95,20,.18)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6; ctx.fillStyle = '#F7E17E'; rr(x, y, w, h, 14); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#231E19'; font(500, 25, 'Neco'); ctx.textBaseline = 'alphabetic'; ctx.fillText(title, x + 16, y + 30);
  ctx.fillStyle = kind === 'doc' ? '#2B5BC4' : '#C23A3F'; rr(x + 16, y + 39, 11, 14, 2); ctx.fill();
  ctx.fillStyle = '#231E19'; font(500, 14); ctx.fillText(file, x + 33, y + 51); ctx.restore();
}

// ------------------------------------------------------------------ scenes
function title(t) {
  if (t > 8.45) return;
  const up = P(t, 7.45, 8.25, E.qio);
  ctx.save(); ctx.translate(0, -up * 1080);
  ctx.fillStyle = '#F7E17E'; ctx.fillRect(0, 0, W, H);
  const e = P(t, 0.3, 0.75) * (1 - P(t, 7.25, 7.45)); font(600, 22); ctx.fillStyle = '#494746'; ctx.globalAlpha = e;
  ctx.letterSpacing = '3px'; ctx.fillText('ANDRI ACADEMY · 1.1', 122, 392); ctx.letterSpacing = '0px'; ctx.globalAlpha = 1;
  words('Premier dossier,', 120, 530, 0.5, .09, 128, 500, '#231E19', null);
  words('du début à la fin.', 120, 640, 1.15, .09, 84, 400, '#231E19', null);
  // the mascot is clipped to the card so nothing hangs over the app as it pushes up
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  mascot('wave', t, .25, 3.8, 1180, 330, 640);
  mascot('idea', t, 3.95, 8.45, 1180, 330, 640, { from: 'pop' });
  ctx.restore();
  ctx.restore();
}
function letterScene(t) {
  if (t < 67.0 || t > 73.4) return;
  const k = P(t, 67.1, 67.95, E.qio), out = P(t, 72.6, 73.2, E.io);
  const lb = RECTS.letter.box, sc = L(.45, .79, k), lw = lb[2] * sc, lh = lb[3] * sc;
  const x = L(1120, 900, k), y = L(300, (1080 - lh) / 2 - 10, k) + out * 60;
  ctx.save(); ctx.globalAlpha = k * (1 - out); ctx.translate(x, y); ctx.rotate(L(6, 0, k) * Math.PI / 180);
  ctx.shadowColor = 'rgba(60,45,20,.28)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 24; ctx.fillStyle = '#fff'; rr(0, 0, lw, lh, 20); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); rr(0, 0, lw, lh, 20); ctx.clip(); ctx.drawImage(IMG.letter0, 0, 0, lw, lh);
  const marks = [['lm1', 68.6], ['lm2', 69.2], ['lm3', 69.8]];
  for (const [m, a] of marks) { const r = RECTS.letter[m], w = P(t, a, a + .45, E.io); if (w > 0) { ctx.save(); ctx.beginPath(); ctx.rect(r[0] * sc - 3, r[1] * sc - 3, (r[2] + 6) * sc * w, (r[3] + 6) * sc); ctx.clip(); ctx.drawImage(IMG.letter1, 0, 0, lw, lh); ctx.restore(); } }
  ctx.restore(); ctx.restore();
  const A = m => { const r = RECTS.letter[m]; return [x + (r[0] + r[2]) * sc + 2, y + (r[1] + r[3] / 2) * sc]; };
  const cx = x + lw + 40, ca = (t < 72.6) ? 1 : 1 - out;
  ctx.save(); ctx.globalAlpha = ca;
  callout(t, 68.7, 72.9, A('lm1'), cx, y + RECTS.letter.lm1[1] * sc - 40, 'Modèle du cabinet', 'Aldridge_Vine_Modele_de_lettre.docx', 'doc');
  callout(t, 69.3, 72.9, A('lm2'), cx, y + RECTS.letter.lm2[1] * sc - 30, 'Numéro de cause', '03_Reponse.pdf', 'pdf');
  callout(t, 69.9, 72.9, A('lm3'), cx, y + RECTS.letter.lm3[1] * sc + 60, 'La décision', '05_Decision_incidente_Tribunal.pdf', 'pdf');
  ctx.restore();
  words('Sur votre modèle.', 120, 520, 68.2, .08, 78, 500, '#231E19', 72.5);
  words('Chaque fait sourcé.', 120, 610, 68.8, .08, 78, 400, '#231E19', 72.55);
}
function endCard(t) {
  if (t < 73.2) return;
  const a = P(t, 73.3, 73.9), dy = (1 - P(t, 73.3, 74.0, E.q)) * 24;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(0, dy);
  ctx.drawImage(IMG.logo, 512, 438, 520, 520 * 600 / 2299);
  font(500, 25); ctx.fillStyle = '#494746'; ctx.textBaseline = 'alphabetic'; ctx.fillText('Andri Academy · À suivre : Approfondi ou Plan', 515, 635);
  ctx.restore();
  const m = mascot('done', t, 73.6, 80.5, 1105, 400, 420, { from: 'pop' });
  if (m) {
    const b = MMETA.done.badge, sc = m.sc;
    const bx = m.x + m.w / 2 + (b[0] * m.w + b[2] * m.w / 2 - m.w / 2) * sc, by = m.y + m.h + (b[1] * m.h + b[3] * m.h / 2 - m.h) * sc;
    const fi = Math.floor((t - 73.6) * MMETA.disc.fps) % MMETA.disc.frames, mw = m.w * m.sc, mh = m.h * m.sc;
    const ox = m.x + m.w / 2 - mw / 2, oy = m.y + m.h + m.dy - mh;
    const x = cl((t - 74.1) / .34), k = x <= 0 ? 0 : E.back(x);
    if (k > 0) {
      ctx.save(); ctx.globalAlpha *= cl(x * 4);
      ctx.translate(bx, by); ctx.rotate((1 - k) * -0.35); ctx.scale(k, k); ctx.translate(-bx, -by);
      ctx.drawImage(MASC.tick[fi], ox, oy, mw, mh); ctx.restore();
    }
  }
}

// ------------------------------------------------------------------ frame
function centredWords(text, cy, t0, size, weight, T, outK) {
  font(weight, size, 'Neco'); ctx.fillStyle = '#231E19'; ctx.textBaseline = 'alphabetic';
  const parts = text.split(' '), sp = ctx.measureText(' ').width, ws = parts.map(w => ctx.measureText(w).width);
  let x = 960 - (ws.reduce((a, b) => a + b, 0) + sp * (parts.length - 1)) / 2;
  parts.forEach((w, i) => { const k = P(T, t0 + i * .08, t0 + i * .08 + .5, E.q);
    if (k > 0) { ctx.save(); ctx.globalAlpha = k * (1 - outK); ctx.fillText(w, x, cy + (1 - k) * 40 - outK * 30); ctx.restore(); }
    x += ws[i] + sp; });
}
function intro(T) {
  ctx.fillStyle = '#F7E17E'; ctx.fillRect(0, 0, W, H);
  const out = P(T, 2.55, 3.0, E.io);
  const ik = (x => x <= 0 ? 0 : E.back(x))(cl((T - .15) / .45));
  if (ik > 0) { const s = 150 * ik; ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(960, 330 - out * 30); ctx.rotate((1 - ik) * -.5);
    ctx.drawImage(IMG.icon, -s / 2, -s / 2, s, s * 600 / 597); ctx.restore(); }
  centredWords('Bienvenue à', 520, .45, 64, 400, T, out);
  centredWords('Andri Academy', 650, .75, 128, 500, T, out);
}

// ------------------------------------------------------------------ step 1: switch Andri to French (Cabinet -> Langue -> Français)
// timed to the line (audio/fr/Lsw.wav, starts at 0.3): "Cliquez en haut sur votre cabinet" ~2.6-3.9, "choisissez Français sous Langue" ~4.4-5.9, "puis enregistrez" ~6.2-7.2
const LP = { chipIn: [2.2, 2.6, 3.4], clickChip: 3.5, push1: 3.6, trig: [4.4, 4.9], clickTrig: 5.0, de: [5.5, 6.0], clickDe: 6.1,
  scroll: [6.5, 7.0], upd: [7.0, 7.5], clickUpd: 7.6, nav: [8.4, 8.9], clickNav: 9.0, push2: 9.1 };
const SCROLL = 140;                                   // the Save button sits below the window, so the page scrolls a little
function coPlate(name, sc, alpha = 1) {               // Company / Cabinet page plates are 1440 x 1000: top bar fixed, content scrolled
  if (alpha <= 0) return; const im = IMG[name]; ctx.save(); ctx.globalAlpha *= alpha;
  ctx.drawImage(im, 0, (67 + sc) * 2, 2880, 793 * 2, 0, 67, 1440, 793); ctx.drawImage(im, 0, 0, 2880, 134, 0, 0, 1440, 67); ctx.restore();
}
function langScreen(u) {
  const sc = SCROLL * P(u, LP.scroll[0], LP.scroll[1], E.io);
  if (u < LP.push2) {
    const name = u >= LP.clickUpd + .08 ? 'coDE' : u >= LP.clickDe + .08 ? 'coENde' : 'coEN';
    coPlate(name, sc);
    if (name === 'coEN') hov('hv_trig', HV(u, 4.9, 5.05));
    if (name === 'coENde') hov('hv_upd', HV(u, 7.5, 7.65), -sc);
    if (name === 'coDE') hov('hv_navDe', HV(u, 8.9, 9.1));
    const dd = P(u, LP.clickTrig + .08, LP.clickTrig + .22) * (1 - P(u, LP.clickDe + .02, LP.clickDe + .12));
    if (dd > 0) { coPlate('coENdd', 0, dd); hov('hv_optDe', HV(u, 6.0, 6.12) * dd); }
  } else coPlate('coDE', sc);
}
function drawLang(u) {
  // push 1: matters list (English) -> Company page; push 2: Cabinet page (French) -> Dossiers
  const pushes = [[LP.push1, () => plate('listEN'), () => langScreen(u), 'listEN', 'coEN'], [LP.push2, () => langScreen(u), () => plate('list'), 'coDE', 'list']];
  if (u < LP.push1) { plate('listEN'); hov('hv_chip', HV(u, 3.4, 3.6)); return; }
  if (u >= LP.push1 + PUSH && u < LP.push2) { langScreen(u); return; }
  if (u >= LP.push2 + PUSH) { plate('list'); return; }
  const [t0, prev, next, navA, navB] = u < LP.push2 ? pushes[0] : pushes[1]; const k = E.qio(cl((u - t0) / PUSH));
  ctx.save(); ctx.beginPath(); ctx.rect(0, 67, 1440, 793); ctx.clip();
  ctx.save(); ctx.translate(-1440 * .3 * k, 0); prev(); ctx.fillStyle = `rgba(35,30,25,${.06 * k})`; ctx.fillRect(0, 0, 1440, 860); ctx.restore();
  ctx.save(); ctx.translate(1440 * (1 - k), 0); ctx.shadowColor = 'rgba(35,30,25,.18)'; ctx.shadowBlur = 30; ctx.fillStyle = '#F2EFE9'; ctx.fillRect(0, 67, 1440, 793); ctx.shadowColor = 'transparent'; next(); ctx.restore();
  ctx.restore();
  part(k < .5 ? navA : navB, [0, 0, 1440, 67]);
}
const LANG_CLICKS = [LP.clickChip, LP.clickTrig, LP.clickDe, LP.clickUpd, LP.clickNav];
function drawPointer(pos, u, clicks) {
  const press = clicks.some(cc => u >= cc - .07 && u < cc + .15);
  for (const cc of clicks) if (u >= cc && u < cc + .45) { const k = (u - cc) / .45; ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#C9A733'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(pos[0], pos[1], 9 + 26 * E.out(k), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  ctx.save(); ctx.translate(pos[0] - 7, pos[1] - 4); const s = 34 / 30 * (press ? .86 : 1); ctx.scale(s, s);
  const p = new Path2D('M6 3 L6 24 L11.2 19.3 L14.6 27 L18.2 25.4 L14.9 17.9 L22 17.6 Z');
  ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1;
  ctx.fillStyle = '#1d1813'; ctx.fill(p); ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round'; ctx.stroke(p); ctx.restore();
}
function cursorLang(u, cam) {
  if (u < LP.chipIn[0]) return;
  const co = RECTS.coEN, opt = RECTS.coENdd.opts[2];   // English, Dutch, French, German
  const path = [[LP.chipIn[0], LP.chipIn[1], [1980, 1140]], [LP.chipIn[1], LP.chipIn[2], C(RECTS.listEN.chip)],
    [LP.trig[0], LP.trig[1], [co.trig[0] + 120, co.trig[1] + 24]], [LP.de[0], LP.de[1], [opt[0] + 60, opt[1] + 16]],
    [LP.upd[0], LP.upd[1], [co.upd[0] + 80, co.upd[1] + 22 - SCROLL]], [LP.nav[0], LP.nav[1], C(RECTS.listEN.navFirst)]];
  let pos = toScreen(cam, 1980, 1140);
  for (const [a, b, tg] of path) { const p = toScreen(cam, tg[0], tg[1]); if (u >= b) { pos = p; continue; } if (u > a) { const k = E.io((u - a) / (b - a)); pos = [L(pos[0], p[0], k), L(pos[1], p[1], k)]; } break; }
  drawPointer(pos, u, LANG_CLICKS);
}
async function renderFrame(T) {
  if (!READY) READY = load();
  await READY;
  if (T < INTRO) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.textAlign = 'left'; intro(T); return; }
  const tl = OLD(T - INTRO);                                        // section-inclusive time
  const sec = tl >= S0 && tl < S0 + LANG ? tl - S0 : null;          // inside the language step
  const t = tl >= S0 + LANG ? tl - LANG : Math.min(tl, S0);         // old timeline time
  globalT = t;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.textAlign = 'left';
  background(tl);
  const cam = sec !== null ? shot('screen') : camera(t);
  if (cam.o > 0 && t > 7.4) {
    const [x, y, w, h] = cam.clip; const [sx, sy] = toScreen(cam, x, y); const sw = w * cam.s, sh = h * cam.s;
    ctx.save(); ctx.globalAlpha = cam.o;
    ctx.shadowColor = 'rgba(35,30,25,.16)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 26; ctx.fillStyle = '#F2EFE9'; rr(sx, sy, sw, sh, cam.r); ctx.fill();
    ctx.shadowColor = 'rgba(35,30,25,.22)'; ctx.shadowBlur = 1; ctx.shadowOffsetY = 0; ctx.fill(); ctx.shadowColor = 'transparent';
    rr(sx, sy, sw, sh, cam.r); ctx.clip();
    ctx.translate(cam.cx - cam.fx * cam.s, cam.cy - cam.fy * cam.s); ctx.scale(cam.s, cam.s);
    if (sec !== null) drawLang(sec); else app(t);
    ctx.restore();
  }
  mascot('point', t, 42.6, 45.2, 1500, 560, 340, { flip: true });
  letterScene(t);
  endCard(t);
  title(t);
  caption(tl);
  if (sec !== null) cursorLang(sec, cam); else cursor(t, cam);
}

window.MG = { width: W, height: H, fps: FPS, duration: DURATION, renderFrame };
if (!navigator.webdriver) { const t0 = performance.now(); (function loop() { renderFrame(((performance.now() - t0) / 1000) % DURATION).then(() => requestAnimationFrame(loop)); })(); }
