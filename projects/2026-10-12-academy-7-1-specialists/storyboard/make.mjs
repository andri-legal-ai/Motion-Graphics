// Storyboard for 7.1: one key frame per beat (rendered from app.js with stills.mjs), captioned with beat, words, sound and transition.
import { chromium } from '../plates/pw.mjs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), SB = path.join(HERE, '../check/sb');
const P = [
  ['3.0', '0 Title', '"Still pasting your firm\'s own clauses over Andri\'s, by hand? Give Andri a colleague who already knows them."', 'Title card pushes up into the app (whoosh)'],
  ['14.5', '1 Your firm\'s models', '"…letter and memo templates and a skeleton argument sit in one folder, in the Company Knowledge Base." Highlights on the three files, ring on Knowledge base.', 'Click Explore'],
  ['20.7', '2 Open Specialists', '"Open Explore, then Specialists." The real Explore menu.', 'Click Specialists; page pushes across'],
  ['26.5', '2 Open Specialists', '"A specialist is a colleague Andri consults. It gives direction and references, and never drafts for you." Highlights on both lines.', 'Click New specialist; panel slides in'],
  ['33.8', '3 Name it', '"…give it a short name. Employment law." Typed; the hint becomes "Andri will consult it as employment-law".', 'Click the consult field'],
  ['40.9', '4 When to consult it', '"This is the only thing Andri reads…" The line typed, gentle zoom, highlight on the help text.', 'Zoom out; click Notes'],
  ['47.5', '5 Notes for the build', '"Notes for the build are optional. Andri reads them once, while it builds." Typed.', 'The form scrolls'],
  ['52.5', '6 Choose its files', '"Now choose what it learns from. Pick the folder…" Click the folder\'s circle.', 'Scroll to the chip'],
  ['55.0', '6 Choose its files', '"…everything inside comes with it, now and later." Highlight on that line.', 'Click Build specialist (click)'],
  ['58.5', '7 Build it', '"Click Build specialist." employment-law, Building, Working now; 1 of 15.', 'Steps stream in'],
  ['63.0', '7 Build it', '"…It takes a few minutes, and you can leave the page." Highlight on the real line.', 'A few minutes later: Ready'],
  ['69.0', '8 It\'s ready', '"Andri has rewritten the consult line… the brief it wrote is yours to edit." Ring on Ready, highlights.', 'Matters, then Nair (two clicks, pages push)'],
  ['72.9', '8 It\'s ready', 'Matters list (Nair).', 'Click Nair: the letter conversation'],
  ['76.0', '9 Andri consults it', '"Back in a matter, Andri has just drafted a letter to Ms Nair." Highlight "Dear Ms Nair".', 'Click the box'],
  ['79.5', '9 Andri consults it', '"Ask it to check the letter against your house style." Typed.', 'Send (click)'],
  ['83.0', '9 Andri consults it', '"Andri consults the specialist by itself…" Consulting @employment-law, spinner.', 'The answer arrives'],
  ['86.5', '9 Andri consults it', '"…every change the firm\'s letter template asks for." Highlight on the template link.', 'Cut to the end of the thread'],
  ['90.5', '10 Ask it directly', '"…type the at sign…" @ list opens on Matter Documents (gentle zoom).', 'One step across (←/→): Specialists'],
  ['92.0', '10 Ask it directly', '"…and pick it from Specialists." Ring on Specialists.', 'Click employment-law; zoom out'],
  ['95.5', '10 Ask it directly', 'Chip @[S:employment-law] and the question typed.', 'Send (click)'],
  ['99.0', '10 Ask it directly', '"It answers straight from your firm\'s memo template." Highlight on "memo template".', 'Explore, Specialists'],
  ['101.3', '10 Ask it directly', 'The Explore menu over the chat.', 'Page pushes across to Specialists'],
  ['107.5', '11 One per team', '"Add one specialist per team, or a playbook… Keep each consult line to its own area." Ring New specialist, highlight the line.', 'Window fades out (1 s)'],
  ['116.0', 'End card', '"Your firm\'s know-how, on call in every matter."', 'Next: Actions: write a brief once, use it in chat and workflows'],
];
const cells = P.map(([t, b, w, s], i) => `<div class=c><img src="${pathToFileURL(path.join(SB, 't' + t + '.png')).href}"><div class=t><b>${i + 1}. ${b}</b> <i>${t}s</i><br>${w}<br><span>→ ${s}</span></div></div>`).join('');
const html = `<html><head><style>body{margin:0;background:#F1EDE3;font:15px/1.35 -apple-system,Helvetica;color:#241E19;width:2400px}
h1{font:600 30px -apple-system;margin:26px 30px 6px} p{margin:0 30px 18px;color:#494746}
.g{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;padding:0 30px 30px}.c{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)}
img{width:100%;display:block}.t{padding:10px 12px 12px}.t i{color:#8a8178;font-style:normal}.t span{color:#7a6a3a}</style></head><body>
<h1>Andri Academy 7.1 · Your firm\'s experts, on call · storyboard</h1><p>Key frames rendered from the build (staging snapshots of 12 Oct 2026: a real Employment law specialist built from the firm folder, my own conversation in Nair; firm Aldridge Vine). Narration: UK voice, one take, 1:40.</p><div class=g>${cells}</div></body></html>`;
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const p = await b.newPage({ viewport: { width: 2400, height: 1000 } });
const f = path.join(HERE, 'storyboard.html'); (await import('node:fs')).writeFileSync(f, html); await p.goto(pathToFileURL(f).href); await p.waitForTimeout(800); await p.screenshot({ path: path.join(HERE, 'storyboard-7.1.png'), fullPage: true }); await b.close(); console.log('ok');
