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
