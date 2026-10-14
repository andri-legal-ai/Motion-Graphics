"""Builds the 3.2 storyboard key frames from the rebuild plates (Playwright), then tiles them (FFmpeg)."""
import json, pathlib, subprocess
from playwright.sync_api import sync_playwright
P = pathlib.Path(__file__).resolve().parent.parent
A = P / "assets"; PL = P / "plates"
R = json.loads((PL / "rects.json").read_text())
CSS = f"""
@font-face{{font-family:Neco;src:url({(A/'fonts/Neco-500.woff2').as_uri()});font-weight:500}}
@font-face{{font-family:Neco;src:url({(A/'fonts/Neco-400.woff2').as_uri()});font-weight:400}}
@font-face{{font-family:Rethink;src:url({(A/'fonts/RethinkSans.woff2').as_uri()});font-weight:400 800}}
*{{margin:0;box-sizing:border-box}} body{{width:1920px;height:1080px;overflow:hidden;font-family:Rethink;position:relative;
background:radial-gradient(900px 760px at 350px 350px,#F9EFC2,transparent),radial-gradient(800px 650px at 1700px 200px,#fff,transparent),radial-gradient(950px 650px at 1300px 1010px,#F3DD86,transparent),#F1EDE3}}
.win{{position:absolute;border-radius:22px;overflow:hidden;box-shadow:0 0 0 1px rgba(35,30,25,.2),0 26px 44px rgba(35,30,25,.16);background:#F2EFE9}}
.app{{position:absolute;left:0;top:0;width:1440px;height:860px;transform-origin:0 0}}
.app img{{position:absolute}}
.ring{{position:absolute;border:3px solid #E9CD4F;border-radius:12px}}
.pill{{position:absolute;left:50%;transform:translateX(-50%);top:991px;height:62px;display:flex;align-items:center;gap:14px;background:#fff;border-radius:31px;padding:0 28px 0 10px;box-shadow:0 0 0 1px #DDD1BE,0 4px 8px rgba(35,30,25,.1);font:500 26px Neco;color:#231E19;white-space:nowrap}}
.pill b{{width:42px;height:42px;border-radius:50%;background:#F7E17E;display:grid;place-items:center;font:700 19px Rethink}}
.cur{{position:absolute;width:34px}}
"""
CUR = '<svg class="cur" style="left:{x}px;top:{y}px" viewBox="0 0 30 30"><path d="M6 3 L6 24 L11.2 19.3 L14.6 27 L18.2 25.4 L14.9 17.9 L22 17.6 Z" fill="#1d1813" stroke="#fff" stroke-width="1.8"/></svg>'


def app(base="m0", pm=None, tip=None, rings=()):
    h = f'<img src="{(PL/(base+".png")).as_uri()}" style="left:0;top:0;width:1440px">'
    if pm:
        h += '<div style="position:absolute;inset:0;background:rgba(20,16,12,.26)"></div>'
        x, y, w, hh = R[pm]["box"]; h += f'<img src="{(PL/(pm+".png")).as_uri()}" style="left:{x}px;top:{y}px;width:{w}px">'
    if tip:
        x, y, w, hh = R[tip]["box"]; h += f'<img src="{(PL/(tip+".png")).as_uri()}" style="left:{x}px;top:{y}px;width:{w}px">'
    for r in rings:
        h += f'<div class="ring" style="left:{r[0]-5}px;top:{r[1]-5}px;width:{r[2]+10}px;height:{r[3]+10}px"></div>'
    return h


def window(inner, step, text, crop=None, cur=None):
    # crop = (x, y, w, h) in app px; otherwise the whole window at 1.08 (as in the video)
    if crop:
        x, y, w, h = crop; s = min(1560 / w, 880 / h); W, H = w * s, h * s
    else:
        x, y, w, h = 0, 0, 1440, 860; s = 1.08; W, H = 1440 * s, 860 * s
    left, top = (1920 - W) / 2, (1006 - H) / 2
    c = CUR.format(x=left + (cur[0] - x) * s - 7, y=top + (cur[1] - y) * s - 4) if cur else ""
    pill = f'<div class="pill"><b>{step}</b>{text}</div>' if step else ""
    return (f'<div class="win" style="left:{left}px;top:{top}px;width:{W}px;height:{H}px"><div class="app" style="transform:translate({-x*s}px,{-y*s}px) scale({s})">{inner}</div></div>{c}{pill}')


def title():
    return f"""<div style="position:absolute;inset:0;background:#F7E17E"></div>
<div style="position:absolute;left:122px;top:372px;font:600 22px Rethink;letter-spacing:3px;color:#494746">ANDRI ACADEMY · 3.2</div>
<div style="position:absolute;left:120px;top:420px;font:500 128px Neco;color:#231E19;line-height:1.08">Andri works<br><span style="font-weight:400;font-size:84px">while you sleep.</span></div>
<img src="{(A/'mascot/clock/f030.png').as_uri()}" style="position:absolute;left:1000px;top:390px;width:900px">"""


def end():
    return f"""<img src="{(A/'Andri-Logo-Ink.svg').as_uri()}" style="position:absolute;left:512px;top:438px;width:520px">
<div style="position:absolute;left:515px;top:612px;font:500 25px Rethink;color:#494746">Andri Academy · Next: Case law research, start to finish</div>
<img src="{(A/'mascot/done/f100.png').as_uri()}" style="position:absolute;left:1105px;top:400px;width:420px">
<img src="{(A/'mascot/tick/f100.png').as_uri()}" style="position:absolute;left:1105px;top:400px;width:420px">"""


C = lambda r: (r[0] + r[2] / 2, r[1] + r[3] / 2)
on, off = R["pmOn"], R["pmOff"]
LEFT = (370, 105, 520, 290)                      # the two switches
PANELS = [
    (title(), "Title card: Andri works while you sleep, clock mascot", "VO: Andri can keep working while you're away. Here's how to set it up.", "push up into the app"),
    (window(app("m0hot"), 1, "Open Personalisation", cur=C(R["m0"]["tbSl"])), "Sliders icon, tooltip Personalisation, click", "VO: Open Personalisation, with the sliders icon at the top.", "panel opens"),
    (window(app("m0", "pmAns"), 1, "Open Personalisation", cur=C(on["nv4"])), "Opens on Andri's answers; click After hours", "VO: Then choose After hours: what Andri may do while you're away.", "page switches"),
    (window(app("m0", "pmOn"), 2, "Matter reflections", crop=LEFT, cur=C(on["tgR_1"])), "Zoom: reflections Off, click On, line changes", "VO: ...off by default. Switch them on, and each night Andri looks back...", "pan to preview"),
    (window(app("m0", "pmOn"), 2, "Matter reflections", crop=(870, 115, 375, 215)), "Preview email, now in full colour", "VO: If something was missed... only when there's a genuine insight.", "pan to dreams"),
    (window(app("m0", "pmOn", "tipD"), 3, "Nightly dreams", crop=(370, 160, 520, 240), cur=C(on["qD"])), "Zoom: Nightly dreams On, its help text", "VO: Nightly dreams is on by default... Facts from one matter never leave it.", "pan to profile"),
    (window(app("m0", "pmOn"), 3, "Nightly dreams", crop=(870, 330, 375, 450)), "Working profile, rewritten every Sunday", "VO: Every Sunday it rewrites your working profile...", "back to switches"),
    (window(app("m0", "pmOn", rings=(on["tgR_0"], on["tgD_0"])), 4, "Switch either off", crop=LEFT), "Small rings on both Off buttons", "VO: Changed your mind? Either one switches off with a single click.", "fade to end card"),
    (end(), "End card: logo, mascot with tick, Next line", "VO: Reflections flag what you missed. Dreams tune Andri to you.", "end"),
]

out = P / "storyboard" / "panels"; out.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True, args=["--allow-file-access-from-files"])
    pg = b.new_page(viewport={"width": 1920, "height": 1080})
    for i, (html, *_r) in enumerate(PANELS, 1):
        f = out / f"p{i:02d}.html"; f.write_text(f"<html><head><meta charset=utf-8><style>{CSS}</style></head><body>{html}</body></html>")
        pg.goto(f.as_uri()); pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(500)
        pg.screenshot(path=str(out / f"p{i:02d}.png"))
    b.close()
for i, (_h, what, sound, nxt) in enumerate(PANELS, 1):
    (out / f"cap{i:02d}.txt").write_text(f"{i}  {what}\n{sound}   Next: {nxt}")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(out / f"p{i:02d}.png"), "-vf",
                    f"scale=960:-1,pad=960:640:0:0:color=#231E19,drawtext=fontfile=/System/Library/Fonts/Helvetica.ttc:textfile={out / f'cap{i:02d}.txt'}:x=18:y=556:fontsize=19:fontcolor=#F0EDE6:line_spacing=10",
                    str(out / f"c{i:02d}.png")], check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "1", "-i", str(out / "c%02d.png"), "-vf", "tile=3x3:padding=8:margin=8:color=#F0EDE6",
                "-frames:v", "1", str(P / "storyboard" / "storyboard-3.2.png")], check=True)
print("ok")
