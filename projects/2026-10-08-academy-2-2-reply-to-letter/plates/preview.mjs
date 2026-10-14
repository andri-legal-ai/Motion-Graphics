// Quick look at the 2.2 rebuild states, to compare with staging-captures/.
import { chromium, SRC } from './pw.mjs';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'check');
const STATES = {
  kb_dialog2: "S.kb('val',2)",
  kb_done: "S.kb('done',null)",
  chat_points: "S.docked();document.querySelector('#tin4').style.transform='translateY(-420px)'",
  chat_fcard: "S.docked();document.querySelector('#tin4').style.transform='translateY(-1240px)';S.cardAt('f',0)",
  chat_q2: "S.docked();document.querySelector('#tin4').style.transform='translateY(-2050px)';S.cardAt('q',0)",
  doc_panel: "S.docked();S.narrow();document.getElementById('dpanel').style.display='block';document.getElementById('toast').style.display='block';document.querySelector('#tin4').style.transform='translateY(-2900px)'",
  jobs_panel: "S.docked();S.narrow();document.getElementById('jpanel').style.display='block';document.querySelector('#tin4').style.transform='translateY(-2900px)'",
  greet_mp: "S.lines(1,true);S.mpAt(0)",
};
const only = process.argv.slice(2);
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 860 } });
for (const [name, js] of Object.entries(STATES)) {
  if (only.length && !only.includes(name)) continue;
  await pg.goto(SRC); await pg.waitForFunction('window.READY===true');
  await pg.evaluate(`(()=>{const S=STATE;S.base();${js}})()`);
  await pg.screenshot({ path: path.join(OUT, name + '.png') });
}
await b.close(); console.log('ok');
