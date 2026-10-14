"""Builds the 1.2 storyboard key frames from real staging captures (Playwright), then tiles them (FFmpeg)."""
import pathlib, subprocess
from playwright.sync_api import sync_playwright
P = pathlib.Path(__file__).resolve().parent.parent
A = pathlib.Path("/Users/bennettnittke/Desktop/Andri/Motion Graphics/projects/2026-10-07-academy-1-1-first-matter/assets")
C = P / "staging-captures"
CSS = f"""
@font-face{{font-family:Neco;src:url({(A/'fonts/Neco-500.woff2').as_uri()});font-weight:500}}
@font-face{{font-family:Neco;src:url({(A/'fonts/Neco-400.woff2').as_uri()});font-weight:400}}
@font-face{{font-family:Rethink;src:url({(A/'fonts/RethinkSans.woff2').as_uri()});font-weight:400 800}}
*{{margin:0;box-sizing:border-box}} body{{width:1920px;height:1080px;overflow:hidden;font-family:Rethink;position:relative;
background:radial-gradient(900px 760px at 350px 350px,#F9EFC2,transparent),radial-gradient(800px 650px at 1700px 200px,#fff,transparent),radial-gradient(950px 650px at 1300px 1010px,#F3DD86,transparent),#F1EDE3}}
.win{{position:absolute;border-radius:22px;overflow:hidden;box-shadow:0 0 0 1px rgba(35,30,25,.2),0 26px 44px rgba(35,30,25,.16);background:#F2EFE9}}
.win img{{position:absolute}}
.mask{{position:absolute;background:#ECE8E0;border:1px solid #DDD5C8;border-radius:10px;display:flex;align-items:center;gap:6px;font:500 14px Rethink;color:#241E19;padding:0 10px}}
.pill{{position:absolute;left:50%;transform:translateX(-50%);top:991px;height:62px;display:flex;align-items:center;gap:14px;background:#fff;border-radius:31px;padding:0 28px 0 10px;box-shadow:0 0 0 1px #DDD1BE,0 4px 8px rgba(35,30,25,.1);font:500 26px Neco;color:#231E19;white-space:nowrap}}
.pill b{{width:42px;height:42px;border-radius:50%;background:#F7E17E;display:grid;place-items:center;font:700 19px Rethink}}
.cur{{position:absolute;width:34px}}
"""
CUR = '<svg class="cur" style="left:{x}px;top:{y}px" viewBox="0 0 30 30"><path d="M6 3 L6 24 L11.2 19.3 L14.6 27 L18.2 25.4 L14.9 17.9 L22 17.6 Z" fill="#1d1813" stroke="#fff" stroke-width="1.8"/></svg>'

def window(img, step, text, crop=None, cur=None, mask=True):
    # full screen: capture 1568x764 shown at width 1560, centred; crop = (x,y,w,h) zooms into a region
    if crop:
        x, y, w, h = crop; s = min(1500 / w, 860 / h); W, H = w * s, h * s
        left, top = (1920 - W) / 2, (980 - H) / 2
        inner = f'<img src="{(C/img).as_uri()}" style="left:{-x*s}px;top:{-y*s}px;width:{1568*s}px">'
    else:
        s = 1560 / 1568; W, H = 1560, 764 * s; left, top = 180, (980 - H) / 2; x = y = 0
        inner = f'<img src="{(C/img).as_uri()}" style="left:0;top:0;width:{W}px">'
    m = ""
    if mask:  # firm button: demo firm, never the real staging account
        mx, my = (1259 - x) * s, (14 - y) * s
        m = f'<div class="mask" style="left:{mx}px;top:{my}px;width:{92*s}px;height:{28*s}px;font-size:{14*s}px">Aldridge Vine</div>'
    c = CUR.format(x=left + (cur[0] - x) * s, y=top + (cur[1] - y) * s) if cur else ""
    return (f'<div class="win" style="left:{left}px;top:{top}px;width:{W}px;height:{H}px">{inner}{m}</div>{c}'
            f'<div class="pill"><b>{step}</b>{text}</div>')

def title():
    return f"""<div style="position:absolute;inset:0;background:#F7E17E"></div>
<div style="position:absolute;left:122px;top:372px;font:600 22px Rethink;letter-spacing:3px;color:#494746">ANDRI ACADEMY · 1.2</div>
<div style="position:absolute;left:120px;top:420px;font:500 128px Neco;color:#231E19;line-height:1.08">In-Depth or Plan<br><span style="font-weight:400;font-size:84px">Choose how Andri works.</span></div>
<img src="{(A/'mascot/idea/f030.png').as_uri()}" style="position:absolute;left:1180px;top:330px;width:640px">"""

def end():
    return f"""<img src="{(A/'Andri-Logo-Ink.svg').as_uri()}" style="position:absolute;left:512px;top:438px;width:520px">
<div style="position:absolute;left:515px;top:612px;font:500 25px Rethink;color:#494746">Andri Academy · Next: The whole letter, in one request</div>
<img src="{(A/'mascot/done/f100.png').as_uri()}" style="position:absolute;left:1105px;top:400px;width:420px">
<img src="{(A/'mascot/tick/f100.png').as_uri()}" style="position:absolute;left:1105px;top:400px;width:420px">"""

PANELS = [
    (title(), "Title card: In-Depth or Plan, mascot with the lightbulb", "VO: Two ways to ask Andri. Here's when to use each.", "push up into the app"),
    (window("b2-mode-menu-greeting.jpg", 1, "The mode button", crop=(430, 440, 740, 180), cur=(682, 582)), "Zoom: the mode menu with In-Depth Mode and Plan Mode", "VO: The mode button sits in the chat box, and always shows the mode you're in.", "zoom out"),
    (window("b3-in-depth-answer.jpg", 2, "In-Depth: research, one reply"), "In-Depth: search steps, then one answer with sources", "VO: In-Depth is the default. Andri researches the case file, your firm's documents and the law...", "mode menu again"),
    (window("b4-plan-mode-selected.jpg", 3, "Plan: approve first", cur=(700, 572)), "Plan Mode picked: the button turns green", "VO: For a bigger job with several steps, switch to Plan.", "task typed, sent"),
    (window("b5-plan-discovery.jpg", 3, "Plan: approve first", cur=(640, 616)), "Plan discovery: Andri asks first, click an answer", "VO: Andri may ask a few questions first. Click an answer, or type your own.", "plan panel slides in"),
    (window("b6-plan-panel-flow.jpg", 3, "Plan: approve first"), "The plan: summary, Execution Flow, deliverables", "VO: Then it shows the plan: the steps, what you'll get, and what it won't do.", "zoom to decision bar"),
    (window("b7-decision-bar.jpg", 3, "Plan: approve first", crop=(450, 590, 700, 50), cur=(1106, 616)), "Zoom: the plan is waiting for your decision", "VO: Execute starts the work. Edit changes the plan, and Cancel drops it.", "zoom out"),
    (window("b8-back-to-in-depth.jpg", 3, "Plan: approve first", crop=(440, 500, 720, 110)), "Chat box back on In-Depth Mode", "VO: Plan only applies to that one message. After it, Andri is back in In-Depth.", "out to end card"),
    (end(), "End card: logo, mascot with tick, Next line", "VO: A quick question: In-Depth. A bigger job: Plan.", "end"),
]

out = P / "storyboard" / "panels"
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True, args=["--allow-file-access-from-files"])
    pg = b.new_page(viewport={"width": 1920, "height": 1080})
    for i, (html, *_r) in enumerate(PANELS, 1):
        f = out / f"p{i:02d}.html"; f.write_text(f"<html><head><meta charset=utf-8><style>{CSS}</style></head><body>{html}</body></html>")
        pg.goto(f.as_uri()); pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(600)
        pg.screenshot(path=str(out / f"p{i:02d}.png"))
    b.close()
for i, (_h, what, sound, nxt) in enumerate(PANELS, 1):
    (out / f"cap{i:02d}.txt").write_text(f"{i}  {what}\n{sound}   Next: {nxt}")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(out / f"p{i:02d}.png"), "-vf",
                    f"scale=960:-1,pad=960:640:0:0:color=#231E19,drawtext=fontfile=/System/Library/Fonts/Helvetica.ttc:textfile={out / f'cap{i:02d}.txt'}:x=18:y=556:fontsize=19:fontcolor=#F0EDE6:line_spacing=10",
                    str(out / f"c{i:02d}.png")], check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "1", "-i", str(out / "c%02d.png"), "-vf", "tile=3x3:padding=8:margin=8:color=#F0EDE6",
                "-frames:v", "1", str(P / "storyboard" / "storyboard-1.2.png")], check=True)
print("ok")
