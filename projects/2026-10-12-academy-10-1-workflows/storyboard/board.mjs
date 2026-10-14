// Storyboard for 10.1: staging frames (10.2's 12 Oct snapshots) + beats; gaps marked where a screen is not captured yet
import { chromium } from '../plates/pw.mjs'; import { pathToFileURL } from 'node:url'; import path from 'node:path';
const S = f => pathToFileURL(path.resolve('check/s102', f + '.png')).href;
const B = [
 ['0', 'Title card', 'title', '"Writing the same Monday memo every week? Build a workflow once, and Andri writes it for you."'],
 ['1', 'A new workflow', S('L_a_explore_wf'), 'Explore → Workflows → New Workflow. "Open Explore, then Workflows, and click New Workflow."'],
 ['2', 'Choose how it starts', S('L_b_choose'), 'Rings down the five options as named; click On a schedule.'],
 ['3', 'Every Monday', null, 'Scheduled settings: weekly, Monday. NOT CAPTURED YET: needs staging.'],
 ['4', 'The instruction', S('L_b_trig_list'), '+ Add Node → Run Prompt ("Send a prompt to Andri and get a text response"). Its settings panel: NOT CAPTURED YET.'],
 ['5', 'The memo', S('L_b_cd_typed'), 'Create Document, instruction typed: "Turn this into a one-page memo for the partner." (no template list: 10.2 teaches it)'],
 ['6', 'Publish', S('L_pub1_4500'), 'Name it, Publish, first card only: "They don\'t run on their own."'],
 ['7', 'Switch it on', S('L_m_list'), 'Nair → Workflows → Activate. Configure dialog for a schedule: NOT CAPTURED YET.'],
 ['8', 'Other ways to start', S('L_b_trig_list'), 'Triggers list: Deadline Approaching, Assignment Updated, Manual Trigger, each ringed with its line; mock-case example per row.'],
 ['9', 'End card', 'end', '"Build it once, switch it on, and the work starts by itself." · Next: Workflows: answer incoming emails automatically'],
];
const cell = ([n, cap, img, txt]) => `<div class=c><div class=f>${img === 'title' ? `<div class=t><small>ANDRI ACADEMY · 10.1</small><b>Your weekly memo,</b><i>and other ways to start a workflow.</i></div>` :
  img === 'end' ? `<div class=e><b>andri</b><small>Andri Academy · Next: Workflows: answer incoming emails automatically</small></div>` :
  img ? `<img src="${img}">` : `<div class=g>Screen not captured yet<br><small>needs staging (signed out 13 Oct)</small></div>`}</div>
  <div class=k><span>${n}</span>${cap}</div><p>${txt}</p></div>`;
const html = `<html><head><style>@font-face{font-family:Neco;src:url(${pathToFileURL(path.resolve('assets/fonts/Neco-500.woff2')).href})}
@font-face{font-family:R;src:url(${pathToFileURL(path.resolve('assets/fonts/RethinkSans.woff2')).href})}
body{margin:0;padding:40px;background:linear-gradient(135deg,#F9EFC2,#F1EDE3 50%,#F3DD86);font-family:R;color:#231E19;width:2320px}
h1{font:500 44px Neco;margin:0 0 6px}h2{font:400 22px R;margin:0 0 30px}
.w{display:grid;grid-template-columns:repeat(4,550px);gap:26px}.c{background:#fff;border-radius:16px;padding:12px;box-shadow:0 6px 20px rgba(35,30,25,.08)}
.f{height:329px;border-radius:10px;overflow:hidden;background:#F2EFE9}.f img{width:100%;display:block}
.g{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;border:3px dashed #E9CD4F;border-radius:10px;font:500 26px Neco;box-sizing:border-box;text-align:center}
.t{height:100%;background:#F7E17E;padding:70px 30px;box-sizing:border-box}.t small{letter-spacing:2px;font-size:13px}.t b{display:block;font:500 40px Neco;margin-top:16px}.t i{font:400 27px Neco;font-style:normal}
.e{height:100%;display:flex;flex-direction:column;justify-content:center;padding:30px}.e b{font:500 60px Neco}.e small{font-size:16px;margin-top:10px}
.k{font:500 21px Neco;margin:12px 0 4px;display:flex;gap:10px;align-items:center}.k span{background:#F7E17E;border-radius:50%;width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;font:700 15px R}
p{margin:0;font-size:15px;line-height:1.4}</style></head><body><h1>Academy 10.1 · Your weekly memo, and other ways to start a workflow</h1>
<h2>Storyboard v1, 13 Oct 2026 · frames are staging snapshots (12 Oct) · dashed = screen still to capture in staging</h2><div class=w>${B.map(cell).join('')}</div></body></html>`;
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const p = await b.newPage({ viewport: { width: 2400, height: 1000 } });
const fs = await import('node:fs'); fs.writeFileSync('storyboard/board.html', html); await p.goto(pathToFileURL(path.resolve('storyboard/board.html')).href, { waitUntil: 'load' }); await p.waitForTimeout(400); await p.screenshot({ path: 'storyboard/storyboard-v1.png', fullPage: true }); await b.close(); console.log('ok');
