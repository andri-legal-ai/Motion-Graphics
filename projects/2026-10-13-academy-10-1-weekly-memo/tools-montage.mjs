// node tools-montage.mjs out.png cols width img1 img2 ... : labelled grid of images (for checking plates)
import { chromium } from './plates/pw.mjs'; import path from 'node:path';
const [out, cols, w, ...imgs] = process.argv.slice(2);
const html = `<body style="margin:0;background:#888;display:grid;grid-template-columns:repeat(${cols},${w}px);gap:4px;font:14px sans-serif">` +
  imgs.map(f => `<div style="position:relative"><img src="file://${path.resolve(f)}" style="width:${w}px;display:block"><span style="position:absolute;left:4px;top:4px;background:#ff0;padding:1px 4px">${path.basename(f, '.png')}</span></div>`).join('') + '</body>';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: cols * (+w + 4), height: 400 } });
const tmp = path.resolve(path.dirname(out), '_montage.html'); (await import('node:fs')).writeFileSync(tmp, html); await p.goto('file://' + tmp); await p.waitForTimeout(500); await p.screenshot({ path: out, fullPage: true }); await b.close();
