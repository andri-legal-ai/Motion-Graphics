// storyboard.png: one key frame per beat with its words, sound and the transition into the next beat
import { chromium } from '../plates/pw.mjs'; import { writeFileSync } from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const P = [
 ['2.0', '0 Title', '"Someone new joining your firm? Before you invite them, here\'s how roles, seats and credits work."', 'title push up'],
 ['9.6', '1 Matters → firm button', '"As an admin, click your firm\'s name in the top bar…" ring on Aldridge Vine', 'click · push to Company'],
 ['11.6', '1 Company', '"…then Company, and open Members." ring on Company', 'click Members · cut'],
 ['14.4', '2 Members', '"Click Invite Member…" hover look on the button', 'click · dialog fades in'],
 ['17.2', '2 Invite', '"…and enter your colleague\'s email address." typed', 'click Role · menu opens'],
 ['22.0', '3 Admin', '"An Admin has full access…" highlight on the line', 'zoom in 1.3x (still)'],
 ['27.5', '3 Member', '"A Member creates and uses…"', 'highlight moves'],
 ['32.4', '3 Support', '"Support works like a Member, for part-time helpers…"', 'click Support · cut'],
 ['38.5', '4 The 30-day rule', '"Moving someone between a billable seat and Support locks their role for thirty days." ring on Role', ''],
 ['45.0', '4 Send', '"Send the invitation…" ring on Invite Member (not sent)', 'click ✕ · dialog fades out'],
 ['51.9', '5 Billing', '"So who pays for Support? Open Billing." page scrolls to Credits', 'zoom in 1.3x'],
 ['56.0', '5 Not a seat', '"Support members aren\'t billed as a seat…" highlight', ''],
 ['61.0', '5 Never expire', '"Credits never expire, and they\'re shared by the whole firm."', ''],
 ['64.0', '5 Two wallets', '"There are two wallets. Premium unlocks…" ring on the tabs', ''],
 ['69.0', '5 £50 pack', '"…packs from fifty pounds for eight and a half thousand credits." ring', 'zoom out · click Support'],
 ['73.5', '5 Support tab', '"And every billable member unlocks one Support seat."', 'click Matters · push'],
 ['80.7', '6 Matter menu', '"When someone leaves… In the matter\'s menu, choose Transfer ownership"', 'click · dialog fades in'],
 ['84.6', '6 Transfer', '"…pick the new owner. The whole matter moves to them." ring + highlight', 'zoom in 1.34x'],
 ['88.0', '6 Two-factor', '"Transfers need two-factor authentication." highlight', 'Cancel · zoom out'],
 ['92.5', '6 Members', '"Then remove them on the Members page. They lose access…"', 'window fades out (1 s)'],
 ['99.0', 'End card', '"The right role, the right seat, and every matter handed over before anyone leaves."', 'Next: Set up Andri for your firm'],
];
const cells = P.map(([t, a, b, c]) => `<div class=c><img src="file://${HERE}/../check/sb/t${t}.png"><div class=a>${a} <span>· ${t}s</span></div><div class=b>${b}</div><div class=d>${c ? '→ ' + c : ''}</div></div>`).join('');
const html = `<html><body style="margin:0;background:#F1EDE3;font-family:-apple-system,Helvetica"><div style="padding:30px 30px 10px;font:600 30px Helvetica;color:#231E19">Academy 11.1 · Before you invite a colleague · storyboard (sound: UK narration, a click on every press, soft whoosh on page pushes)</div>
<style>.g{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;padding:20px 30px 30px}.c img{width:100%;border-radius:10px;display:block}.a{font:600 19px Helvetica;margin-top:8px;color:#231E19}.a span{font-weight:400;color:#777}.b{font:15px/1.35 Helvetica;color:#333;margin-top:4px}.d{font:14px Helvetica;color:#8a7a2a;margin-top:4px}</style><div class=g>${cells}</div></body></html>`;
writeFileSync(path.join(HERE, 'sb.html'), html);
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const pg = await b.newPage({ viewport: { width: 2400, height: 1000 } });
await pg.goto('file://' + path.join(HERE, 'sb.html')); await pg.waitForTimeout(500);
await pg.screenshot({ path: path.join(HERE, '../storyboard.png'), fullPage: true }); await b.close(); console.log('ok');
