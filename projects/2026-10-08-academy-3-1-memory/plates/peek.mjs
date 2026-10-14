// Screenshots rebuild states for a visual check: node peek.mjs
import { chromium, SRC } from './pw.mjs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../check');
const hideW = "for (const i of ['w_a','w_b','w_c']) document.getElementById(i).style.display='none';";
const STATES = { greet: '', typed: "S.typed();document.getElementById('ctx').textContent='Remember in this case that Ms Nair prefers email, not phone calls.'",
  thread: 'S.thread3();' + hideW, ans: "S.modal('ans')", memload: "S.modal('mem',{loading:true})", mem: "S.modal('mem')", memrem: "S.modal('mem',{file:'rem'})" };
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const pg = await b.newPage({ viewport: { width: 1440, height: 860 } });
pg.on('pageerror', e => console.log('ERR', String(e)));
for (const [n, js] of Object.entries(STATES)) {
  await pg.goto(SRC); await pg.waitForFunction(() => window.READY === true);
  await pg.evaluate(js => { const S = window.STATE; S.base(); eval(js); }, js);
  await pg.screenshot({ path: path.join(OUT, n + '.png') });
}
await b.close(); console.log('ok');
