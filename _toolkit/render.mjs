// Renders a canvas animation frame by frame with Playwright, pipes frames into FFmpeg.
// The page must expose:  window.MG = { width, height, fps, duration, renderFrame(t) }
//   renderFrame(t) draws the frame at time t (seconds) onto the page's single <canvas>.
//   It may return a Promise (e.g. to wait for fonts/images).
//   Optional: MG.cuts = [t, ...], times where the picture changes at once (motion blur never blends across them).
//
// Usage: node render.mjs <project-dir> [--out name.mp4] [--from s] [--to s] [--audio file]
//                                      [--workers n] [--blur n]
//   project-dir holds index.html. Output goes to <project-dir>/renders/.
//   Without --workers/--blur the render is exactly as before (13 Oct 2026). Both are opt-in:
//   --workers n  renders n parts in parallel browser pages, then joins them (same frames, faster)
//   --blur n     motion blur: n sub-frames per frame over half a frame, blended (n times slower; finals only).
//                Tested on 11.1: 4 shows a fast cursor as four copies, 16 smears it into a faint blur that is
//                hard to follow. Keep it off for Academy and Help videos; for social reels try 12 to 16.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('/Users/bennettnittke/.local/node/lib/node_modules/@playwright/cli/node_modules/playwright')); }

const args = process.argv.slice(2);
const dir = path.resolve(args[0] || '.');
const opt = (k, d) => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : d; };
const outName = opt('--out', 'final.mp4');
const audio = opt('--audio', null);
const workers = Math.max(1, Math.floor(Number(opt('--workers', 1))));
const blur = Math.max(1, Math.floor(Number(opt('--blur', 1))));

// local image/font files must count as same-origin, or a canvas that draws them cannot be exported
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();
await page.goto(pathToFileURL(path.join(dir, 'index.html')).href);
await page.waitForFunction(() => window.MG && typeof window.MG.renderFrame === 'function');
await page.evaluate(() => document.fonts.ready);
const { width, height, fps, duration } = await page.evaluate(() => {
  const { width, height, fps, duration } = window.MG; return { width, height, fps, duration };
});
const from = Number(opt('--from', 0)), to = Number(opt('--to', duration));
const total = Math.round((to - from) * fps);

mkdirSync(path.join(dir, 'renders'), { recursive: true });
const out = path.join(dir, 'renders', outName);

if (workers === 1 && blur === 1) {
  const ff = spawn('ffmpeg', [
    '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    ...(audio ? ['-ss', String(from), '-i', audio, '-c:a', 'aac', '-b:a', '192k', '-shortest'] : []),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'slow',
    '-vf', `scale=${width}:${height}`, '-movflags', '+faststart', out,
  ], { stdio: ['pipe', 'ignore', 'inherit'] });

  for (let i = 0; i < total; i++) {
    const t = from + i / fps;
    const b64 = await page.evaluate(async (t) => {
      await window.MG.renderFrame(t);
      return document.querySelector('canvas').toDataURL('image/png').split(',')[1];
    }, t);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % fps === 0) process.stdout.write(`\r${(t).toFixed(1)}s / ${to}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log(`\nDone: ${out}`);
  process.exit(0);
}

// ---- parallel and/or motion-blurred render
const cuts = await page.evaluate(() => (window.MG.cuts || []).map(Number));
await page.close();
const run = a => new Promise((res, rej) => { const p = spawn('ffmpeg', a, { stdio: ['ignore', 'ignore', 'inherit'] }); p.on('close', c => c ? rej(new Error('ffmpeg exit ' + c)) : res()); });
// sub-frame s of frame time t, kept on the frame's own side of any cut (never blend two screens)
const subT = (t, s) => {
  if (blur === 1) return t;
  const ts = t + (s / blur) * 0.5 / fps;
  return cuts.some(c => c > t && c <= ts) ? t : ts;
};
const vf = [`scale=${width}:${height}`];
if (blur > 1) vf.unshift(`tmix=frames=${blur}`, `select='eq(mod(n\\,${blur})\\,${blur - 1})'`, `setpts=N/(${fps}*TB)`);

const base = out.replace(/\.mp4$/, ''), per = Math.ceil(total / workers), segs = [];
const t0 = Date.now(); let done = 0;
await Promise.all(Array.from({ length: workers }, async (_, w) => {
  const a = w * per, b = Math.min(total, a + per); if (a >= b) return;
  const seg = `${base}.part${w}.mp4`; segs[w] = seg;
  const pg = await browser.newPage();
  await pg.goto(pathToFileURL(path.join(dir, 'index.html')).href);
  await pg.waitForFunction(() => window.MG && typeof window.MG.renderFrame === 'function');
  await pg.evaluate(() => document.fonts.ready);
  const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(fps * blur), '-i', '-',
    '-vf', vf.join(','), '-r', String(fps),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'slow', seg], { stdio: ['pipe', 'ignore', 'inherit'] });
  const closed = new Promise(r => ff.on('close', r));
  for (let i = a; i < b; i++) {
    const t = from + i / fps;
    for (let s = 0; s < blur; s++) {
      const b64 = await pg.evaluate(async (t) => {
        await window.MG.renderFrame(t);
        return document.querySelector('canvas').toDataURL('image/png').split(',')[1];
      }, subT(t, s));
      if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    }
    if (++done % fps === 0) process.stdout.write(`\r${done}/${total} frames  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  ff.stdin.end(); await closed; await pg.close();
}));
await browser.close();

const list = `${base}.parts.txt`;
writeFileSync(list, segs.filter(Boolean).map(s => `file '${s.replace(/'/g, "'\\''")}'`).join('\n'));
const silent = audio ? `${base}.silent.mp4` : out;
await run(['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', silent]);
if (audio) {
  await run(['-y', '-i', silent, '-ss', String(from), '-i', audio, '-map', '0:v', '-map', '1:a',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
  rmSync(silent);
}
segs.filter(Boolean).forEach(s => rmSync(s)); rmSync(list);
console.log(`\nDone: ${out}  (${workers} worker${workers > 1 ? 's' : ''}, blur ${blur}, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
