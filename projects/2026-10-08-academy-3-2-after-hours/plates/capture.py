"""Captures the Andri screens for Academy 3.2 as 2x plates plus element rects.

Source: the 3.2 rebuild (video-1.1/build/s32.html, from src/s32.src.html, built by plates/build32.py),
matched to the staging captures of 8 Oct 2026 in ../staging-captures. Window = 1440 x 860 app px.
Output: plates/*.png and plates/rects.js
"""
import json, pathlib, subprocess
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
subprocess.run(["/usr/bin/python3", str(HERE / "build32.py")], check=True)
SRC = pathlib.Path("/Users/bennettnittke/Desktop/Andri/5 - Marketing/Videos/Andri Learn Video Designs/video-1.1/build/s32.html")
IDS = ["tbSl", "tip", "pm", "nv0", "nv4", "tgR", "tgR_0", "tgR_1", "tgD", "tgD_0", "tgD_1", "qR", "qD", "lbR", "lbD", "fR", "fD", "pv", "pvMail", "pvProf", "htip"]
FULL = {"x": 0, "y": 0, "width": 1440, "height": 860}


def main():
    out = {}
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome", headless=True, args=["--allow-file-access-from-files"])
        pg = b.new_page(viewport={"width": 1440, "height": 860}, device_scale_factor=2)

        def state(js=""):
            pg.goto(SRC.as_uri()); pg.wait_for_function("window.READY===true")
            pg.evaluate("()=>{const S=STATE;S.base();" + js + "}")

        def plate(name, js=""):
            state(js); pg.screenshot(path=str(HERE / f"{name}.png"), clip=FULL, omit_background=True)
            out[name] = pg.evaluate("ids=>STATE.rects(ids)", IDS)

        def sprite(name, sel, js=""):
            state(js); el = pg.locator(sel); el.screenshot(path=str(HERE / f"{name}.png"), omit_background=True)
            bb = el.bounding_box(); out[name] = {"box": [bb["x"], bb["y"], bb["width"], bb["height"]]}
            out[name].update(pg.evaluate("ids=>STATE.rects(ids)", IDS))

        noscrim = "document.getElementById('scrim').style.display='none';"
        # floating UI is captured alone (known-issues 1): everything else hidden, backgrounds transparent, CSS shadow off;
        # the canvas draws the shadow, so the corners come out fully transparent
        alone = noscrim + """for (const e of [document.getElementById('win'), document.querySelector('.app')]) e.style.background='transparent';
          for (const c of document.querySelector('.app').children) if (c.id !== 'pz') c.style.visibility='hidden';
          document.getElementById('pm').style.boxShadow='none'; const h=document.getElementById('htip'); if (h) h.style.boxShadow='none';"""
        plate("m0")
        plate("m0hot", "S.hover()")
        # the modal, without the scrim (drawn on canvas), per page and state
        sprite("pmAns", "#pm", "S.open('ans');" + alone)
        sprite("pmOff", "#pm", "S.open('ah',false);" + alone)
        sprite("pmOn", "#pm", "S.open('ah',true);" + alone)
        # help tooltips (hover on the ? icons)
        sprite("tipD", "#htip", "S.open('ah',true);S.helpTip('D');" + alone + "document.getElementById('pm').style.visibility='hidden';")
        b.close()
    (HERE / "rects.json").write_text(json.dumps(out, indent=1))
    (HERE / "rects.js").write_text("window.RECTS_DATA=" + json.dumps(out) + ";\n")
    print("plates:", sorted(out))


main()
