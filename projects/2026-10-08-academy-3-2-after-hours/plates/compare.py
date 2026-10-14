"""Renders the rebuild at staging viewport size (1920 x 936, modal unscaled) and puts it next to / over a staging capture.
usage: compare.py <state: ans|off|on|matter> <capture.jpg> <out-prefix>"""
import sys, pathlib, subprocess
from playwright.sync_api import sync_playwright
SRC = pathlib.Path("/Users/bennettnittke/Desktop/Andri/5 - Marketing/Videos/Andri Learn Video Designs/video-1.1/build/s32.html")
state, cap, out = sys.argv[1], sys.argv[2], sys.argv[3]
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True, args=["--allow-file-access-from-files"])
    pg = b.new_page(viewport={"width": 1920, "height": 936}, device_scale_factor=1)
    pg.goto(SRC.as_uri()); pg.wait_for_function("window.READY===true")
    js = {"ans": "S.open('ans')", "off": "S.open('ah',false)", "on": "S.open('ah',true)", "matter": ""}[state]
    pg.evaluate("()=>{const S=STATE;S.base();const w=document.getElementById('win');w.style.width='1920px';w.style.height='936px';" + js +
                ";const pm=document.getElementById('pm');if(pm)pm.style.transform='translate(393.4px,13.5px)';}")
    pg.screenshot(path=out + "-rebuild.png")
    b.close()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", out + "-rebuild.png", "-i", cap, "-filter_complex",
    "[0]scale=1568:764,format=rgb24,split[a1][a2];[1]scale=1568:764,format=rgb24,split[b1][b2];[a1][b1]blend=all_mode=difference[d];[a2][b2]vstack[v]", "-map", "[v]", out + "-stack.png", "-map", "[d]", out + "-diff.png"], check=True)
print("ok")
