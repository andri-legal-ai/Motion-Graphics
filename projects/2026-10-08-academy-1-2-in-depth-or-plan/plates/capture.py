"""Captures the Andri screens for Academy 1.2 as 2x plates plus element rects.

Source: the 1.2 rebuild of real Andri staging (video-1.1/build/s12.html, from src/s12.src.html),
built on the 1.1 rebuild. Text in the Plan screens is copied from the staging run of 8 Oct 2026.
The In-Depth conversation reuses the approved 1.1 plates (thread.png and its rects).
Output: plates/*.png and plates/rects.js (app pixels, window = 1440 x 860).
"""
import json, pathlib, shutil
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
SRC = pathlib.Path("/Users/bennettnittke/Desktop/Andri/5 - Marketing/Videos/Andri Learn Video Designs/video-1.1/build/s12.html")
P11 = pathlib.Path("/Users/bennettnittke/Desktop/andri code /Motion Graphics/projects/2026-10-07-academy-1-1-first-matter/plates")
IDS = ["cbox", "modeLbl", "go", "eqBtn", "disc", "mcard", "modemenu", "miDeep", "miPlan", "dcard", "dopt0", "dopt1", "dopt2", "dother",
       "dbar", "btCancel", "btEdit", "btExec", "ppanel", "ppHead", "thread"]
RECTS = """ids => { const o={}; for (const id of ids){ const e=document.getElementById(id); if(!e || !e.offsetParent && e.id!=='ppanel') continue;
  const r=e.getBoundingClientRect(); if(r.width) o[id]=[r.left,r.top,r.width,r.height]; } return o; }"""
FULL = {"x": 0, "y": 0, "width": 1440, "height": 860}


def main():
    out = {}
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome", headless=True, args=["--allow-file-access-from-files"])
        pg = b.new_page(viewport={"width": 1440, "height": 860}, device_scale_factor=2)

        def state(js=""):
            pg.set_viewport_size({"width": 1440, "height": 860})
            pg.goto(SRC.as_uri()); pg.wait_for_function("window.READY===true")
            pg.evaluate("()=>{const S=STATE;S.base();document.getElementById('kbN').textContent='6';" + js + "}")

        def plate(name, js=""):
            state(js); pg.screenshot(path=str(HERE / f"{name}.png"), clip=FULL, omit_background=True)
            out[name] = pg.evaluate(RECTS, IDS)

        def sprite(name, sel, js=""):
            state(js); el = pg.locator(sel); el.screenshot(path=str(HERE / f"{name}.png"), omit_background=True)
            bb = el.bounding_box(); out[name] = {"box": [bb["x"], bb["y"], bb["width"], bb["height"]]}
            out[name].update(pg.evaluate(RECTS, IDS))

        hide = "for (const id of ['thread','fadebot','cbox','disc']) document.getElementById(id).style.visibility='hidden';"
        # greeting (In-Depth, chat box in the middle) and the bare frames
        plate("m1")
        plate("chat", "S.docked();" + hide)
        plate("split", "S.docked();S.narrow();" + hide)
        # chat box sprites
        sprite("cboxMid", "#cbox")
        sprite("cboxMidOn", "#cbox", "document.getElementById('cph').style.display='none';document.getElementById('go').classList.add('on')")
        sprite("cboxDock", "#cbox", "S.docked()")
        sprite("cboxDockPlan", "#cbox", "S.docked();S.setMode('plan')")
        sprite("cboxDockPlanOn", "#cbox", "S.docked();S.setMode('plan');document.getElementById('cph').style.display='none';document.getElementById('go').classList.add('on')")
        sprite("cboxSplit", "#cbox", "S.docked();S.narrow()")
        sprite("disc", "#disc", "S.docked()")
        sprite("discSplit", "#disc", "S.docked();S.narrow()")
        # the mode menu (drawn above the mode label wherever the chat box is)
        for nm, hot in (("menu0", ""), ("menuDeep", "miDeep"), ("menuPlan", "miPlan")):
            sprite(nm, "#modemenu", "S.menuAt();" + (f"document.getElementById('{hot}').classList.add('hot')" if hot else ""))
        # discovery cards (wide layout, docked)
        for nm, q, n, hot in (("dq1", "Q1", 0, None), ("dq1hot", "Q1", 0, 2), ("dq2", "Q2", 1, None), ("dq2hot", "Q2", 1, 0)):
            sprite(nm, "#dcard", f"S.planThread();S.dcardAt(S.{q},{n});" + (f"document.getElementById('dopt{hot}').classList.add('hot')" if hot is not None else ""))
        # decision bar (narrow layout)
        sprite("dbar", "#dbar", "S.docked();S.narrow();S.dbarAt()")
        # plan thread: tall sprites with item rects (relative to the sprite)
        variants = {"planDisc": ("", ["p_work", "p_done"]), "planWork": ("", ["p_done", "p_wait", "p_banner"]), "planDone": ("S.narrow();", ["p_work", "p_banner"])}
        items = ["p_ub"] + [f"p_s{i}" for i in range(7)] + ["p_work", "p_done", "p_wait", "p_banner"]
        for nm, (pre, hidden) in variants.items():
            pg.set_viewport_size({"width": 1440, "height": 1600})
            pg.goto(SRC.as_uri()); pg.wait_for_function("window.READY===true")
            pg.evaluate("()=>{const S=STATE;S.base();S.planThread();" + pre + "".join(f"document.getElementById('{h}').style.display='none';" for h in hidden) +
                        """for (const id of ['cbox','disc','fadebot']) document.getElementById(id).style.display='none';
                        const win=document.getElementById('win'); win.style.overflow='visible'; win.style.height='1600px';
                        const mc=document.getElementById('mcard'); mc.style.overflow='visible'; mc.style.bottom='auto'; mc.style.height='1500px';
                        const th=document.getElementById('thread'); th.style.overflow='visible'; th.style.bottom='auto'; th.style.height='1400px';}""")
            el = pg.locator("#tin2"); el.screenshot(path=str(HERE / f"{nm}.png"), omit_background=True)
            bb = el.bounding_box()
            out[nm] = {"box": [bb["x"], bb["y"], bb["width"], bb["height"]], "items": pg.evaluate("""ids=>{const t=document.getElementById('tin2').getBoundingClientRect();const o={};
                for(const id of ids){const e=document.getElementById(id); if(!e||e.style.display==='none') continue; const r=e.getBoundingClientRect(); o[id]=[r.left-t.left,r.top-t.top,r.width,r.height];} return o;}""", items)}
        # plan panel: frame (header, empty body) and the tall scrolling content, full and with an empty flow
        sprite("ppFrame", "#ppanel", "S.docked();S.narrow();document.getElementById('ppanel').style.display='block';document.getElementById('ppin').style.visibility='hidden'")
        for nm, js in (("ppin", ""), ("ppinEmpty", "document.querySelectorAll('#ppFlow svg, #ppFlow .nd').forEach(e=>e.style.visibility='hidden');")):
            pg.set_viewport_size({"width": 1440, "height": 2200})
            pg.goto(SRC.as_uri()); pg.wait_for_function("window.READY===true")
            pg.evaluate("()=>{const S=STATE;S.base();S.docked();S.narrow();const pp=document.getElementById('ppanel');pp.style.display='block';pp.style.bottom='auto';pp.style.height='2100px';"
                        "document.getElementById('win').style.height='2200px';document.getElementById('win').style.overflow='visible';" + js + "}")
            el = pg.locator("#ppin"); el.screenshot(path=str(HERE / f"{nm}.png"), omit_background=True)
            bb = el.bounding_box()
            out[nm] = {"box": [bb["x"], bb["y"], bb["width"], bb["height"]], "items": pg.evaluate("""()=>{const t=document.getElementById('ppin').getBoundingClientRect();const o={};
                const R=e=>{const r=e.getBoundingClientRect();return [r.left-t.left,r.top-t.top,r.width,r.height]};
                o.sum=R(document.getElementById('ppSum')); o.flow=R(document.getElementById('ppFlow')); o.frame=R(document.getElementById('ppFrame'));
                o.nodes=[...document.querySelectorAll('#ppFlow .nd')].map(R); for(let k=0;k<4;k++) o['fr'+k]=R(document.getElementById('fr'+k));
                o.secs=[...document.querySelectorAll('#ppin .sec')].map(R); return o;}""")}
        b.close()
    # reused from 1.1: the In-Depth conversation (same rebuild, same CSS)
    shutil.copy(P11 / "thread.png", HERE / "thread.png")
    r11 = json.loads((P11 / "rects.json").read_text()); out["thread"] = r11["thread"]
    (HERE / "rects.json").write_text(json.dumps(out, indent=1))
    (HERE / "rects.js").write_text("window.RECTS_DATA=" + json.dumps(out) + ";\n")
    print("plates:", len(list(HERE.glob("*.png"))))


main()
