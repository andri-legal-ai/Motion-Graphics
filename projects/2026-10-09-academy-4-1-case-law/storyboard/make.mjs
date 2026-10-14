// Builds the 4.1 storyboard key frames from the staging-matched plates (window 1470 x 835), then tiles them (FFmpeg).
import { createRequire } from 'node:module'; import { writeFileSync, readFileSync, mkdirSync } from 'node:fs'; import { execFileSync } from 'node:child_process'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/bennettnittke/.local/node/lib/node_modules/@playwright/cli/node_modules/playwright');
const P = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const U = f => pathToFileURL(path.join(P, f)).href;
const R = JSON.parse(readFileSync(path.join(P, 'plates/rects.json')));
const CSS = `@font-face{font-family:Neco;src:url(${U('assets/fonts/Neco-500.woff2')});font-weight:500}@font-face{font-family:Neco;src:url(${U('assets/fonts/Neco-400.woff2')});font-weight:400}
@font-face{font-family:Rethink;src:url(${U('assets/fonts/RethinkSans.woff2')});font-weight:400 800}
*{margin:0;box-sizing:border-box}body{width:1920px;height:1080px;overflow:hidden;position:relative;font-family:Rethink;
background:radial-gradient(900px 760px at 350px 350px,#F9EFC2,transparent),radial-gradient(800px 650px at 1700px 200px,#fff,transparent),radial-gradient(950px 650px at 1300px 1010px,#F3DD86,transparent),#F1EDE3}
.win{position:absolute;overflow:hidden;border-radius:22px;box-shadow:0 0 0 1px rgba(35,30,25,.2),0 26px 44px rgba(35,30,25,.16);background:#F2EFE9}.win>div{position:absolute;left:0;top:0;width:1470px;height:835px;transform-origin:0 0}
.win img{position:absolute}.ring{position:absolute;border:3px solid #E9CD4F;border-radius:10px}
.pill{position:absolute;left:50%;transform:translateX(-50%);top:991px;height:62px;display:flex;align-items:center;gap:14px;background:#fff;border-radius:31px;padding:0 28px 0 10px;box-shadow:0 0 0 1px #DDD1BE,0 4px 8px rgba(35,30,25,.1);font:500 26px Neco;color:#231E19;white-space:nowrap}
.pill b{width:42px;height:42px;border-radius:50%;background:#F7E17E;display:grid;place-items:center;font:700 19px Rethink}
.dim{position:absolute;left:0;top:0;width:1470px;height:835px;background:rgba(36,30,25,.78)}`;
const im = (n, x, y, w, h, extra = '') => `<img src="${U('plates/' + n)}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;${extra}">`;
const plate = (n, dy = 0, h = 835) => `<div style="position:absolute;left:0;top:0;width:1470px;height:835px;overflow:hidden">${im(n + '.png', 0, -dy, 1470, h)}</div>`;
function win(content, zoom, step, text) {
  let s, ox, oy, W, H; if (!zoom) { s = 1.06; W = 1470 * s; H = 835 * s; ox = (1920 - W) / 2; oy = 497 - H / 2; zoom = [0, 0, 1470, 835]; }
  else { s = Math.min(1560 / zoom[2], 800 / zoom[3]); W = zoom[2] * s; H = zoom[3] * s; ox = (1920 - W) / 2; oy = 497 - H / 2; }
  return `<div class="win" style="left:${ox}px;top:${oy}px;width:${W}px;height:${H}px"><div style="transform:scale(${s}) translate(${-zoom[0]}px,${-zoom[1]}px)">${content}</div></div>` + (step ? `<div class="pill"><b>${step}</b>${text}</div>` : '');
}
const ring = (r, p = 4) => `<div class="ring" style="left:${r[0] - p}px;top:${r[1] - p}px;width:${r[2] + p * 2}px;height:${r[3] + p * 2}px"></div>`;
const title = `<div style="position:absolute;inset:0;background:#F7E17E"></div><div style="position:absolute;left:122px;top:372px;font:600 22px Rethink;letter-spacing:3px;color:#494746">ANDRI ACADEMY · 4.1</div>
<div style="position:absolute;left:120px;top:420px;font:500 128px Neco;color:#231E19;line-height:1.08">Case law research,<br><span style="font-weight:400;font-size:84px">start to finish.</span></div><img src="${U('assets/mascot/wave/f030.png')}" style="position:absolute;left:1180px;top:330px;width:640px">`;
const end = `<img src="${U('assets/Andri-Logo-Ink.svg')}" style="position:absolute;left:512px;top:438px;width:520px"><div style="position:absolute;left:515px;top:612px;font:500 25px Rethink;color:#494746">Andri Academy · Next: Prepare and rehearse the hearing</div>
<img src="${U('assets/mascot/done/f100.png')}" style="position:absolute;left:1105px;top:400px;width:420px"><img src="${U('assets/mascot/tick/f100.png')}" style="position:absolute;left:1105px;top:400px;width:420px">`;
const bailii = `<div style="position:absolute;left:60px;top:40px;width:1350px;height:780px;border-radius:12px;overflow:hidden;box-shadow:0 20px 50px rgba(35,30,25,.35);background:#fff">
<div style="height:40px;background:#E8E3DA;display:flex;align-items:center;padding-left:16px;gap:8px;font:13px Rethink;color:#494746"><span style="width:12px;height:12px;border-radius:50%;background:#E9897B"></span><span style="width:12px;height:12px;border-radius:50%;background:#EDC25E"></span><span style="width:12px;height:12px;border-radius:50%;background:#8DC26F"></span><span style="margin-left:20px;background:#fff;border-radius:7px;padding:4px 14px">bailii.org/uk/cases/UKEAT/2024/98.html</span></div>
${im('bailii.jpg', 0, 40, 1350, 767)}</div>`;
const T = R.spThread ? null : null;
const PANELS = [
  [title, 'Title card', 'VO: Case law research usually means a dozen open tabs...', 'push up into the app'],
  [win(plate('chGreet') + im('spCbMid.png', 371, 587.9, 768, 140) + im('spExploreHot.png', 344.7, 17, 674, 336), null, 1, 'Open Case law'), 'Explore menu, Case law', 'VO: Open Explore, then Case law...', 'Case law page'],
  [win(plate('clA') + im('spJur.png', 34, 168, 248, 133), null, 1, 'Open Case law'), 'Jurisdiction: four countries', 'VO: ...the UK, the Netherlands, Belgium and Switzerland.', 'click Employment law'],
  [win(plate('clB', 0, 1518) + ring([34, 271, 246, 30], 2), null, 2, 'Filter and read'), 'Employment law selected', 'VO: Narrow the list on the left...', 'scroll to a ruling'],
  [win(plate('clB', 440, 1518) + ring([386, 127.4, 54, 22.5], 3) + ring([446, 128.6, 147.2, 20], 3) + ring([599.2, 128.4, 110.2, 20.5], 3), [369, 100, 1032, 420], 2, 'Filter and read'), 'Zoom: court, citation, outcome', 'VO: Each ruling is summarised for you...', 'scroll: holdings, issues, precedents'],
  [win(plate('clC'), [369, 160, 1032, 560], 3, 'Search by keyword'), 'Search: 128 results, words highlighted', 'VO: To find something specific, search by keyword...', 'click View case'],
  [win(plate('clC') + bailii, null, 4, 'Read the judgment'), 'BAILII opens in a new tab', 'VO: View case opens the full judgment on BAILII...', 'back, tick rulings'],
  [win(plate('clC2') + ring([1206.8, 140, 158.2, 28], 3), null, 5, 'Compare in a table'), '2 selected, Add to tabular review', 'VO: To compare rulings, tick the ones you need...', 'dialog'],
  [win(plate('clC2') + '<div class="dim"></div>' + im('spDlg1.png', 495, 242, 480, 351), null, 5, 'Compare in a table'), 'Dialog: Nair selected, Add', 'VO: ...and pick the matter.', 'review builder'],
  [win(plate('rvPanel3'), null, 5, 'Compare in a table'), 'Question typed in the panel', 'VO: Each ruling becomes a row. Ask your question once...', 'Done, Start review'],
  [win(plate('rvDone'), [96, 200, 1100, 360], 5, 'Compare in a table'), 'Answers for every ruling', 'VO: ...Andri answers it for every ruling, with its sources.', 'rail chat icon'],
  [win(plate('chConv') + im('spThread.png', 243, 73 + 68, 1024, 1150, 'clip-path:inset(0 0 470px 0)') + im('spCbDock.png', 395, 614.9 + 68, 720, 140), [250, 180, 1000, 420], 6, 'Ask in the matter'), 'Steps: legislation and case law, answer cites Holmes', 'VO: Or just ask in the matter\'s chat...', 'window fades, end card'],
  [end, 'End card', 'VO: Find it, read it, compare it, or just ask...', 'end'],
];
const out = path.join(P, 'storyboard/panels'); mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
for (let i = 0; i < PANELS.length; i++) { const f = path.join(out, `p${String(i + 1).padStart(2, '0')}.html`); writeFileSync(f, `<html><head><meta charset=utf-8><style>${CSS}</style></head><body>${PANELS[i][0]}</body></html>`);
  await pg.goto(pathToFileURL(f).href); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(300); await pg.screenshot({ path: f.replace('.html', '.png') }); }
await b.close();
for (let i = 0; i < PANELS.length; i++) { const n = String(i + 1).padStart(2, '0'); writeFileSync(path.join(out, `cap${n}.txt`), `${i + 1}  ${PANELS[i][1]}\n${PANELS[i][2]}\nNext: ${PANELS[i][3]}`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(out, `p${n}.png`), '-vf', `scale=960:-1,pad=960:640:0:0:color=#231E19,drawtext=fontfile=/System/Library/Fonts/Helvetica.ttc:textfile=${path.join(out, `cap${n}.txt`)}:x=18:y=552:fontsize=18:fontcolor=#F0EDE6:line_spacing=8`, path.join(out, `c${n}.png`)]); }
execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(out, 'c%02d.png'), '-vf', 'tile=4x4:padding=8:margin=8:color=#F0EDE6', '-frames:v', '1', path.join(P, 'storyboard/storyboard-4.1.png')]);
console.log('ok');
