"""Builds the 2.1 storyboard key frames from real staging captures (Playwright), then tiles them (FFmpeg)."""
import pathlib, subprocess
from playwright.sync_api import sync_playwright
P = pathlib.Path(__file__).resolve().parent.parent
A = P / "assets"
C = P / "staging-captures"
CSS = f"""
@font-face{{font-family:Neco;src:url({(A/'fonts/Neco-500.woff2').as_uri()});font-weight:500}}
@font-face{{font-family:Neco;src:url({(A/'fonts/Neco-400.woff2').as_uri()});font-weight:400}}
@font-face{{font-family:Rethink;src:url({(A/'fonts/RethinkSans.woff2').as_uri()});font-weight:400 800}}
*{{margin:0;box-sizing:border-box}} body{{width:1920px;height:1080px;overflow:hidden;font-family:Rethink;position:relative;
background:radial-gradient(900px 760px at 350px 350px,#F9EFC2,transparent),radial-gradient(800px 650px at 1700px 200px,#fff,transparent),radial-gradient(950px 650px at 1300px 1010px,#F3DD86,transparent),#F1EDE3}}
.win{{position:absolute;border-radius:22px;overflow:hidden;box-shadow:0 0 0 1px rgba(35,30,25,.2),0 26px 44px rgba(35,30,25,.16);background:#F2EFE9}}
.win img{{position:absolute}}
.mask{{position:absolute;background:#ECE8E0;border:1px solid #DDD5C8;border-radius:10px;display:flex;align-items:center;justify-content:center;font:500 14px Rethink;color:#241E19}}
.pill{{position:absolute;left:50%;transform:translateX(-50%);top:991px;height:62px;display:flex;align-items:center;gap:14px;background:#fff;border-radius:31px;padding:0 28px 0 10px;box-shadow:0 0 0 1px #DDD1BE,0 4px 8px rgba(35,30,25,.1);font:500 26px Neco;color:#231E19;white-space:nowrap}}
.pill b{{width:42px;height:42px;border-radius:50%;background:#F7E17E;display:grid;place-items:center;font:700 19px Rethink}}
.cur{{position:absolute;width:34px}}
"""
CUR = '<svg class="cur" style="left:{x}px;top:{y}px" viewBox="0 0 30 30"><path d="M6 3 L6 24 L11.2 19.3 L14.6 27 L18.2 25.4 L14.9 17.9 L22 17.6 Z" fill="#1d1813" stroke="#fff" stroke-width="1.8"/></svg>'
CW, CH = 1518, 784  # staging capture size


def window(img, step, text, crop=None, cur=None):
    if crop:
        x, y, w, h = crop; s = min(1500 / w, 860 / h); W, H = w * s, h * s
        left, top = (1920 - W) / 2, (980 - H) / 2
    else:
        x = y = 0; s = 1560 / CW; W, H = 1560, CH * s; left, top = 180, (980 - H) / 2
    inner = f'<img src="{(C/img).as_uri()}" style="left:{-x*s}px;top:{-y*s}px;width:{CW*s}px">'
    # firm button: demo firm, never the real staging account
    m = f'<div class="mask" style="left:{(1219-x)*s}px;top:{(13-y)*s}px;width:{87*s}px;height:{28*s}px;font-size:{13*s}px">Aldridge Vine</div>'
    c = CUR.format(x=left + (cur[0] - x) * s, y=top + (cur[1] - y) * s) if cur else ""
    return (f'<div class="win" style="left:{left}px;top:{top}px;width:{W}px;height:{H}px">{inner}{m}</div>{c}'
            f'<div class="pill"><b>{step}</b>{text}</div>')


def title():
    return f"""<div style="position:absolute;inset:0;background:#F7E17E"></div>
<div style="position:absolute;left:122px;top:372px;font:600 22px Rethink;letter-spacing:3px;color:#494746">ANDRI ACADEMY · 2.1</div>
<div style="position:absolute;left:120px;top:420px;font:500 128px Neco;color:#231E19;line-height:1.08">The whole letter,<br><span style="font-weight:400">in one request.</span></div>
<img src="{(A/'mascot/idea/f030.png').as_uri()}" style="position:absolute;left:1180px;top:330px;width:640px">"""


def end():
    return f"""<img src="{(A/'Andri-Logo-Ink.svg').as_uri()}" style="position:absolute;left:512px;top:438px;width:520px">
<div style="position:absolute;left:515px;top:612px;font:500 25px Rethink;color:#494746">Andri Academy · Next: Reply to a letter from the other side</div>
<img src="{(A/'mascot/done/f100.png').as_uri()}" style="position:absolute;left:1105px;top:400px;width:420px">
<img src="{(A/'mascot/tick/f100.png').as_uri()}" style="position:absolute;left:1105px;top:400px;width:420px">"""


PANELS = [
    (title(), "Title card: The whole letter, in one request. Mascot with the lightbulb",
     "VO: Still building client letters in Word, one paragraph at a time?", "push up into the app"),
    (window("a-template-chip-in-box.jpg", 1, "One request", crop=(430, 620, 690, 130)), "Zoom: the request types in: who, what, which documents",
     "VO: Ask for the whole thing in one message: who it's for, what it should cover...", "@ list opens"),
    (window("a-mention-list-template.jpg", 2, "Your letter template", crop=(430, 455, 690, 290), cur=(700, 545)), "@ list filtered to the letter template (Letter), picked as a chip",
     "VO: Type the at sign and pick your firm's template, so it comes out on your letterhead.", "send, zoom out"),
    (window("b-asks-first-q1.jpg", 3, "Andri asks first", cur=(600, 516)), "Andri has questions before continuing: click the recommended answer (3 questions)",
     "VO: If an answer would change the draft, Andri asks first. Click a suggestion, or type your own.", "panel slides in"),
    (window("d-creating-word-document-reply.jpg", 4, "Written in the background"), "Creating Word document, the reply, How Andri built this",
     "VO: Then Andri writes it in the background. You can watch how it's built, or carry on with your work.", "toast, panel turns into the letter"),
    (window("e-document-ready-preview.jpg", 5, "Ready on your letterhead"), "Document Ready: the letter on the Aldridge Vine letterhead, Jobs icon ringed",
     "VO: When it's ready, you're notified, and it opens on your letterhead... saved under Jobs.", "close preview, type the change"),
    (window("h-edited-letter-ready.jpg", 6, "Ask for changes"), "Change request, Creating Word document · edit, same file back as 1 / 2",
     "VO: Need changes? Say so in one line. Andri edits the same draft, rather than starting again.", "out to end card"),
    (end(), "End card: logo, mascot with tick, Next line", "VO: One request. The whole letter, on your template.", "end"),
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
                    f"scale=960:-1,pad=960:640:0:0:color=#231E19,drawtext=fontfile=/System/Library/Fonts/Helvetica.ttc:textfile={out / f'cap{i:02d}.txt'}:x=18:y=556:fontsize=17:fontcolor=#F0EDE6:line_spacing=10",
                    str(out / f"c{i:02d}.png")], check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "1", "-i", str(out / "c%02d.png"), "-vf", "tile=3x3:padding=8:margin=8:color=#F0EDE6",
                "-frames:v", "1", str(P / "storyboard" / "storyboard-2.1.png")], check=True)
print("ok")
