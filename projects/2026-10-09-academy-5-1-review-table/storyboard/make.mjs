// Storyboard for 5.1: one key frame per beat (rendered from app.js with stills.mjs), captioned with beat, words, sound and transition.
import { chromium } from '../plates/pw.mjs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), SB = path.join(HERE, '../check/sb');
const P = [
  ['3.0', '0 Title', '"Checking the same clause in every contract… in one table."', 'Title card pushes up into the app (whoosh)'],
  ['12.5', '1 Your contracts', '"…six supplier contracts for Pennbridge Foods are already in the matter\'s Knowledge Base." Ring on the folder.', 'Cursor to the sidebar, tooltip "Review", click; page pushes across'],
  ['18.8', '2 Open Review', '"Each document becomes a row, and each question a column." Rings: Sources, then the question column.', 'Click Add a source'],
  ['25.0', '3 Add the contracts', '"Pick from this matter\'s Knowledge Base, your firm\'s, or case law." Ring on the tabs.', 'Click the folder, Select all (6 of 6)'],
  ['28.9', '3 Add the contracts', '"Open the folder, select all six, and use them."', 'Use sources: panel slides out, six rows'],
  ['36.5', '4 Ask a question', '"…pick a format: short text, yes or no, an exact extract, a date, a number, or a choice list." Zoom on the menu.', 'Click Yes / No; zoom to the panel and column'],
  ['43.0', '4 Ask a question', '"Yes or no suits this one…" The header field typed; the column shows "Liability cap".', 'Click the question box (click)'],
  ['45.5', '4 Ask a question', '"…does the contract cap the supplier\'s liability?" typed; the column fills in.', 'Done: panel slides out, zoom out'],
  ['51.9', '5 Add more questions', '"…a date for when each contract ends, and a number for the notice period."', 'Done, then question 3 the same way'],
  ['64.0', '6 Test one cell', '"…try one cell." Andri is thinking… in the first cell (zoomed).', 'The answer arrives'],
  ['66.5', '6 Test one cell', '"…check the question does what you meant." Ring on Yes.', 'Zoom out; click Start review'],
  ['72.5', '7 Run the review', '"Andri answers every question for every contract, one row each." Cells fill; 0/18 → 18/18.', 'Completed; click a source'],
  ['79.5', '8 Check the source', '"…the exact passage, with the document and the page." Ring on Page 1.', 'Close the panel, zoom out, open the filter'],
  ['84.5', '9 Filter a column', '"…the two contracts with no liability cap."', 'Escape; "2 of 6 documents"; clear the filter'],
  ['90.0', '10 Add a question later', '"Need one more question later? Add it…" Governing law typed.', 'Done (click)'],
  ['92.0', '10 Add a question later', '"…only the new cells run." Ring on "Run review on 6 new cells".', 'Run review: only the new column runs'],
  ['94.0', '10 Add a question later', '"The answers you already have stay as they are."', 'Click Export'],
  ['99.5', '11 Export', '"…export the whole table to Excel, with every answer and its reasoning." The sheet (real values).', 'Window fades out (1 s)'],
  ['105.5', 'End card', '"Many contracts, the same questions, one table. Every answer sourced."', 'Next: Your draft and their contract, finished in Word'],
];
const cells = P.map(([t, b, w, s], i) => `<div class=c><img src="${pathToFileURL(path.join(SB, 't' + t + '.png')).href}"><div class=t><b>${i + 1}. ${b}</b> <i>${t}s</i><br>${w}<br><span>→ ${s}</span></div></div>`).join('');
const html = `<html><head><style>body{margin:0;background:#F1EDE3;font:15px/1.35 -apple-system,Helvetica;color:#241E19;width:2400px}
h1{font:600 30px -apple-system;margin:26px 30px 6px} p{margin:0 30px 18px;color:#494746}
.g{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;padding:0 30px 30px}.c{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)}
img{width:100%;display:block}.t{padding:10px 12px 12px}.t i{color:#8a8178;font-style:normal}.t span{color:#7a6a3a}</style></head><body>
<h1>Andri Academy 5.1 · Check many contracts at once, in one table · storyboard</h1><p>Key frames rendered from the build (staging snapshots of 9 Oct 2026, demo matter "Pennbridge Foods", firm Aldridge Vine). Narration: UK voice, one take, 1:32.</p><div class=g>${cells}</div></body></html>`;
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const p = await b.newPage({ viewport: { width: 2400, height: 1000 } });
const f = path.join(HERE, 'storyboard.html'); (await import('node:fs')).writeFileSync(f, html); await p.goto(pathToFileURL(f).href); await p.waitForTimeout(800); await p.screenshot({ path: path.join(HERE, 'storyboard-5.1.png'), fullPage: true }); await b.close(); console.log('ok');
