// node tools-storyboard.mjs : storyboard.png from storyboard/f/t*.png with a caption per panel (beat, sound, transition)
import { chromium } from './plates/pw.mjs'; import fs from 'node:fs'; import path from 'node:path';
const P = [
  [4, '0 · Title card', 'VO: "The other side\'s redline lands at midnight… make it your own."', 'Card pushes up into the app'],
  [12.5, '1 · Find the examples', 'VO: "Open Explore, then Workflows…" · clicks', 'Push to Workflows, push to the builder'],
  [18.2, '1 · Start from a template', 'VO: "This time, choose Start from a template." · click', 'Cut to Create a Workflow'],
  [25, '1 · Blank + four examples', 'VO names each example · rings as named', 'List scrolls to the fourth'],
  [34.8, '2 · Contract Redline Response', 'VO: "All six steps are already in place."', 'Camera moves in on the steps, then out'],
  [39.5, '2 · Trigger: Word attachment', 'VO: "…a Word document attached." · click', 'Panel scrolls; highlight on the filter'],
  [48, '2 · Review against the case', 'VO: "…reviews every change…" · click', 'Highlight in the prompt'],
  [53.5, '2 · Counter-edit in place', 'VO: "…new tracked changes and comments…" · click', 'Highlight in the instructions'],
  [61.8, '2 · Email to you, file attached', 'VO: "…emails it to you, with the document attached."', 'Ring on To, then the attachment'],
  [74.5, '3 · Intake to Advice', 'VO: "Now the intake example… Priya Nair…" · clicks', 'Back, New Workflow, template, Intake'],
  [79, '3 · In scope? Refer elsewhere', 'VO: "…one your firm handles… referred elsewhere."', 'Camera follows the canvas down'],
  [86, '3 · File complete? Ask for it', 'VO: "…checks the file is complete…"', 'Pan down'],
  [92, '3 · Triage, dossier', 'VO: "…triages the matter and builds a dossier…"', 'Pan down'],
  [100, '3 · Lawyer approves, advice, send', 'VO: "Nothing is written for the client until…"', 'Camera back to the full window'],
  [113.8, '4 · Make it yours: scope', 'VO: "Aldridge Vine only takes on employment work…" · typing', 'Select, type, Save Draft'],
  [120.2, '4 · Approval: Adam Frith', 'VO: "And send every approval to one person…" · clicks', 'Menus open and close as in staging'],
  [129.5, '5 · Rename, Publish', 'VO: "Give it a name, and click Publish…" · keys, click', 'The app\'s own explainer plays'],
  [138.5, '6 · Matter → Workflows → Activate', 'VO: "Go to the matter whose email address…" · clicks', 'Push to Matters, push to the matter'],
  [147.5, '6 · Filter "intake", Send from', 'VO: "…listens for the word intake… connect your Outlook…"', 'Dialog scrolls; camera moves in; window fades'],
  [154.5, '· End card', 'VO: "Start from an example, change what doesn\'t fit, and switch it on."', 'Next: Before you invite a colleague'],
];
const cards = P.map(([t, a, b, c]) => `<div class="p"><img src="file://${path.resolve('storyboard/f/t' + t + '.png')}"><div class="t"><b>${a}</b><br>${b}<br><i>→ ${c}</i></div></div>`).join('');
const html = `<html><body style="margin:0;padding:24px;background:#F1EDE3;font:15px -apple-system,sans-serif;color:#241E19">
<div style="font:600 26px Georgia;margin:0 0 16px">Andri Academy 10.3 · Start from a ready example: overnight redline, new client intake · storyboard</div>
<div style="display:grid;grid-template-columns:repeat(4,460px);gap:16px">${cards}</div>
<style>.p{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)}.p img{width:460px;display:block}.t{padding:8px 10px;line-height:1.35;font-size:13px}</style></body></html>`;
fs.writeFileSync('storyboard/board.html', html);
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 4 * 460 + 3 * 16 + 48, height: 800 } });
await pg.goto('file://' + path.resolve('storyboard/board.html')); await pg.waitForTimeout(500); await pg.screenshot({ path: 'storyboard.png', fullPage: true }); await b.close();
