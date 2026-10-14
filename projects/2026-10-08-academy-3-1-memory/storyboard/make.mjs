// Builds the 3.1 storyboard key frames from the staging-matched plates, then tiles them (FFmpeg).
import { chromium } from '../plates/pw.mjs'; import { writeFileSync } from 'node:fs'; import { execFileSync } from 'node:child_process'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const P = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const U = f => pathToFileURL(path.join(P, f)).href;
const R = JSON.parse((await import('node:fs')).readFileSync(path.join(P, 'plates/rects.json')));
const CSS = `@font-face{font-family:Neco;src:url(${U('assets/fonts/Neco-500.woff2')});font-weight:500}@font-face{font-family:Neco;src:url(${U('assets/fonts/Neco-400.woff2')});font-weight:400}
@font-face{font-family:Rethink;src:url(${U('assets/fonts/RethinkSans.woff2')});font-weight:400 800}
*{margin:0;box-sizing:border-box}body{width:1920px;height:1080px;overflow:hidden;position:relative;font-family:Rethink;
background:radial-gradient(900px 760px at 350px 350px,#F9EFC2,transparent),radial-gradient(800px 650px at 1700px 200px,#fff,transparent),radial-gradient(950px 650px at 1300px 1010px,#F3DD86,transparent),#F1EDE3}
.win{position:absolute;overflow:hidden;border-radius:22px;box-shadow:0 0 0 1px rgba(35,30,25,.2),0 26px 44px rgba(35,30,25,.16);background:#F2EFE9}.win>div{position:absolute;left:0;top:0;width:1440px;height:860px;transform-origin:0 0}
.win img{position:absolute}.ring{position:absolute;border:3px solid #E9CD4F;border-radius:10px}
.pill{position:absolute;left:50%;transform:translateX(-50%);top:991px;height:62px;display:flex;align-items:center;gap:14px;background:#fff;border-radius:31px;padding:0 28px 0 10px;box-shadow:0 0 0 1px #DDD1BE,0 4px 8px rgba(35,30,25,.1);font:500 26px Neco;color:#231E19;white-space:nowrap}
.pill b{width:42px;height:42px;border-radius:50%;background:#F7E17E;display:grid;place-items:center;font:700 19px Rethink}`;
const im = (n, x, y, w, h, extra = '') => `<img src="${U('plates/' + n + '.png')}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;${extra}">`;
const box = n => R[n].box;
const thread = (sc, upto) => { const it = R.thread3.items; const keys = Object.keys(it).filter(k => k !== 'w_a'); const last = keys.indexOf(upto);
  return `<div style="position:absolute;left:56px;top:140px;width:1382px;height:460px;overflow:hidden">${keys.slice(0, last + 1).map(k => { const [x, y, w, h] = it[k];
    return `<div style="position:absolute;left:${x}px;top:${y - sc}px;width:${w}px;height:${h}px;background:url(${U('plates/thread3.png')}) -${x}px -${y}px/1382px auto no-repeat"></div>`; }).join('')}</div>`; };
// a window shot: content (1440x860 app px), zoom rect [x,y,w,h] in app px or null for the full window
function win(content, zoom, step, text) {
  let s, ox, oy, W, H; if (!zoom) { s = 1.08; W = 1440 * s; H = 860 * s; ox = (1920 - W) / 2; oy = 503 - H / 2; zoom = [0, 0, 1440, 860]; }
  else { s = Math.min(1500 / zoom[2], 820 / zoom[3]); W = zoom[2] * s; H = zoom[3] * s; ox = (1920 - W) / 2; oy = 500 - H / 2; }
  return `<div class="win" style="left:${ox}px;top:${oy}px;width:${W}px;height:${H}px"><div style="transform:scale(${s}) translate(${-zoom[0]}px,${-zoom[1]}px)">${content}</div></div>` + (step ? `<div class="pill"><b>${step}</b>${text}</div>` : '');
}
const ring = (r, p = 5) => `<div class="ring" style="left:${r[0] - p}px;top:${r[1] - p}px;width:${r[2] + p * 2}px;height:${r[3] + p * 2}px"></div>`;
const chat = (sc, upto, cb = 'cboxDock') => im('chat', 0, 0, 1440, 860) + thread(sc, upto) + im(cb, ...box(cb)) + im('disc', ...box('disc'));
const modal = n => im('chat', 0, 0, 1440, 860) + thread(260, 'x_c') + im('cboxDock', ...box('cboxDock')) + `<div style="position:absolute;inset:0;background:rgba(30,26,22,.42)"></div>` + im(n, ...box(n));
const M = R.pMem;
const title = `<div style="position:absolute;inset:0;background:#F7E17E"></div><div style="position:absolute;left:122px;top:372px;font:600 22px Rethink;letter-spacing:3px;color:#494746">ANDRI ACADEMY · 3.1</div>
<div style="position:absolute;left:120px;top:420px;font:500 128px Neco;color:#231E19;line-height:1.08">Say it once.<br><span style="font-weight:400;font-size:84px">Andri remembers.</span></div><img src="${U('assets/mascot/idea/f030.png')}" style="position:absolute;left:1180px;top:330px;width:640px">`;
const end = `<img src="${U('assets/Andri-Logo-Ink.svg')}" style="position:absolute;left:512px;top:438px;width:520px"><div style="position:absolute;left:515px;top:612px;font:500 25px Rethink;color:#494746">Andri Academy · Next: Andri works while you sleep</div>
<img src="${U('assets/mascot/done/f100.png')}" style="position:absolute;left:1105px;top:400px;width:420px"><img src="${U('assets/mascot/tick/f100.png')}" style="position:absolute;left:1105px;top:400px;width:420px">`;
const it = R.thread3.items, T = (k, pad = 0) => [56 + it[k][0] - pad, 140 + it[k][1] - pad];
const PANELS = [
  [title, 'Title card: Say it once. / Andri remembers.', 'VO: Tired of telling Andri the same thing in every conversation? Say it once...', 'push up into the app'],
  [win(im('m1', 0, 0, 1440, 860) + im('cboxMidOn', ...box('cboxMidOn')) + `<div style="position:absolute;left:385px;top:512px;font:17px Rethink;color:#241E19">Remember in this case that Ms Nair prefers email, not phone calls.</div>`, null, 1, 'Tell Andri once'), 'Nair matter: the line is typed and sent', 'VO: In a matter, just say it in the chat. Start with "remember in this case"...', 'conversation starts'],
  [win(chat(0, 'x_a'), [300, 160, 1110, 220], 1, 'Tell Andri once'), 'Zoom: Remembered · Case · How Ms Nair prefers...', 'VO: Andri saves it as a note for this matter, and uses it from now on.', 'zoom out, next question'],
  [win(chat(200, 'x_b'), [300, 170 + 0, 1110, 260], 2, 'Ask what it knows'), 'Zoom: Accessing memories · Case, reply links the note', 'VO: To check what Andri knows, just ask.', 'zoom out, forget'],
  [win(chat(450, 'x_c'), [300, 170, 1110, 220], 3, 'Correct or forget'), 'Zoom: Forgot · Case, note deleted', 'VO: If something changes, tell it to forget...', 'zoom out, sliders icon'],
  [win(modal('pAns') + ring(R.chat.sliders, 6), null, 4, 'See all memories'), 'Personalisation opens on Andri\'s answers', 'VO: To see everything Andri keeps, open Personalisation, then Memories.', 'click Memories'],
  [win(modal('pMem') + ring(M.g_firm, 3), null, 4, 'See all memories'), 'Memories: Personal, Firm, Matters (rings on each label)', 'VO: Personal holds how you work... Firm holds rules for everyone...', 'click a file'],
  [win(modal('pRem') + ring(M.btEdit3, 3) + ring(M.btDel3, 3), null, 4, 'See all memories'), 'remedy_hearing_gap.md open: Edit, Delete, + New file', 'VO: Every memory is a file. Open it, edit it, or delete it...', 'window fades out'],
  [end, 'End card: logo, mascot with tick, Next line', 'VO: Say it once, and Andri keeps it: for you, your firm, and every matter.', 'end'],
];
const out = path.join(P, 'storyboard/panels');
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
for (let i = 0; i < PANELS.length; i++) { const f = path.join(out, `p${String(i + 1).padStart(2, '0')}.html`); writeFileSync(f, `<html><head><meta charset=utf-8><style>${CSS}</style></head><body>${PANELS[i][0]}</body></html>`);
  await pg.goto(pathToFileURL(f).href); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(400); await pg.screenshot({ path: f.replace('.html', '.png') }); }
await b.close();
for (let i = 0; i < PANELS.length; i++) { const n = String(i + 1).padStart(2, '0'); writeFileSync(path.join(out, `cap${n}.txt`), `${i + 1}  ${PANELS[i][1]}\n${PANELS[i][2]}\nNext: ${PANELS[i][3]}`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(out, `p${n}.png`), '-vf', `scale=960:-1,pad=960:640:0:0:color=#231E19,drawtext=fontfile=/System/Library/Fonts/Helvetica.ttc:textfile=${path.join(out, `cap${n}.txt`)}:x=18:y=552:fontsize=18:fontcolor=#F0EDE6:line_spacing=8`, path.join(out, `c${n}.png`)]); }
execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(out, 'c%02d.png'), '-vf', 'tile=3x3:padding=8:margin=8:color=#F0EDE6', '-frames:v', '1', path.join(P, 'storyboard/storyboard-3.1.png')]);
console.log('ok');
