"""Captures the Andri app screens as still image plates (2x) plus element rects.

The screens are the rebuild of real Andri staging (video-1.1/build/v7a.html). Each plate is one
static UI state; everything that moves is drawn later on the canvas in index.html.
Output: plates/*.png and plates/rects.json (all rects in app pixels, window = 1440 x 860).
"""
import json, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
SRC = pathlib.Path("/Users/bennettnittke/Desktop/Andri/5 - Marketing/Videos/Andri Learn Video Designs/video-1.1/build/v7a.html")
DSF = 2
RECT_IDS = ["btnNew", "dlg", "dlgIn", "btnCreate", "btnKB", "btnUp", "btnEmail", "kbTbl", "railChatKB", "pick", "pickUp",
            "eqBtn", "eqp", "eqPick", "cbox", "go", "thread", "mcard", "srcP", "srcPara", "srcHl", "srcClose", "mp", "mp2",
            "railJobs", "tipJobs", "btnOpen", "ctx", "atb", "disc"]

CLEAN = """
for (const s of ['#cur','#ripple','#chip','#grain','#bg','.masc','#wires','.callout','#endc','.kt','.eyebrow','#letter','#reveal','#kMail','.panel'])
  document.querySelectorAll(s).forEach(e=>{e.style.visibility='hidden'});
const w=document.getElementById('win'); w.style.transform='none'; w.style.clipPath='none'; w.style.filter='none';
document.getElementById('winwrap').style.filter='none'; document.getElementById('winwrap').style.opacity=1; document.getElementById('winwrap').style.visibility='visible';
document.body.style.background='transparent'; document.documentElement.style.background='transparent';
"""

RECTS = """ids => { const o={}; for (const id of ids){ const e=document.getElementById(id); if(!e) continue;
  const r=e.getBoundingClientRect(); o[id]=[r.left,r.top,r.width,r.height]; } return o; }"""


def main():
    out = {}
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome", headless=True, args=["--allow-file-access-from-files"])
        pg = b.new_page(viewport={"width": 1440, "height": 860}, device_scale_factor=DSF)
        pg.goto(SRC.as_uri()); pg.wait_for_function("window.READY===true")

        def state(t, js=""):
            pg.goto(SRC.as_uri()); pg.wait_for_function("window.READY===true")
            pg.evaluate(f"t=>{{frame(t);frame(t);}}", t)
            pg.evaluate(CLEAN)
            if js:
                pg.evaluate(js)

        def plate(name, t, js="", clip=None):
            state(t, js)
            pg.screenshot(path=str(HERE / f"{name}.png"), clip=clip or {"x": 0, "y": 0, "width": 1440, "height": 860}, omit_background=True)
            out[name] = pg.evaluate(RECTS, RECT_IDS)

        def sprite(name, t, sel, js=""):
            state(t, js)
            el = pg.locator(sel)
            el.screenshot(path=str(HERE / f"{name}.png"), omit_background=True)
            bb = el.bounding_box()
            out[name] = {"box": [bb["x"], bb["y"], bb["width"], bb["height"]]}

        # 1 matters list
        plate("list", 7.2)
        # 2 New Matter dialog: empty with placeholder; enabled with no text (text is drawn on canvas)
        plate("dlg0", 8.95, "document.getElementById('dlgIn').classList.add('f')")
        plate("dlgE", 9.0, "document.getElementById('dlgTx').innerHTML='';document.getElementById('btnCreate').classList.add('on')")
        # 3 new empty matter
        plate("m0", 12.6)
        # 4 knowledge base, empty; file picker sprites
        plate("kb0", 14.05, "document.getElementById('pick').style.visibility='hidden'")
        sprite("pick0", 14.7, "#pick", "document.querySelectorAll('#pick .pr').forEach(r=>r.classList.remove('on'))")
        sprite("pick1", 15.2, "#pick", "document.querySelectorAll('#pick .pr').forEach(r=>r.classList.add('on'))")
        # 5 knowledge base rows: processing (no spinner drawn, it is animated on canvas) and done
        rows_js = """(done)=>{document.getElementById('pick').style.visibility='hidden';
          document.querySelectorAll('.kbr').forEach(r=>{r.style.opacity=1;r.style.transform='none';
            r.querySelector('.spin').style.display='none'; r.querySelector('.status').style.display=done?'inline-flex':'none';
            r.querySelector('.sum').style.opacity=done?1:0; r.querySelectorAll('.tg').forEach(g=>{g.style.opacity=done?1:0;g.style.transform='none'});});}"""
        state(20.0); pg.evaluate(f"({rows_js})(false)")
        pg.screenshot(path=str(HERE / "kbProc.png"), clip={"x": 0, "y": 0, "width": 1440, "height": 860}, omit_background=True)
        state(20.0); pg.evaluate(f"({rows_js})(true)")
        pg.screenshot(path=str(HERE / "kbDone.png"), clip={"x": 0, "y": 0, "width": 1440, "height": 860}, omit_background=True)
        out["kbRows"] = pg.evaluate("""()=>[...document.querySelectorAll('.kbr')].map(r=>{const a=r.getBoundingClientRect();
            const s=r.querySelector('.status').getBoundingClientRect(); return {row:[a.left,a.top,a.width,a.height], status:[s.left,s.top,s.width,s.height]};})""")
        out["kbDone"] = pg.evaluate(RECTS, RECT_IDS)
        # 6 matter with documents: greeting, example questions button, cbox empty
        plate("m1", 24.0, "document.getElementById('eqBtn').classList.remove('hot')")
        plate("m1hot", 25.9, "document.getElementById('eqBtn').classList.add('hot');document.getElementById('eqp').style.visibility='hidden'")
        sprite("eqp0", 26.0, "#eqp", "document.getElementById('eqp').style.opacity=1;document.getElementById('eqp').style.transform='none';document.getElementById('eqPick').classList.remove('hot')")
        sprite("eqp1", 27.0, "#eqp", "document.getElementById('eqp').style.opacity=1;document.getElementById('eqp').style.transform='none';document.getElementById('eqPick').classList.add('hot')")
        # 7 conversation frame (thread drawn separately), docked chat box, empty
        plate("chat", 30.0, "document.getElementById('thread').style.visibility='hidden';document.getElementById('fadebot').style.visibility='hidden';"
                            "document.getElementById('cbox').style.visibility='hidden';document.getElementById('disc').style.visibility='hidden'")
        sprite("cboxDock", 30.0, "#cbox", "document.getElementById('ctx').innerHTML='';document.getElementById('cph').style.display='block';document.getElementById('go').classList.remove('on');document.getElementById('atn').style.display='none'")
        sprite("cboxDockOn", 30.0, "#cbox", "document.getElementById('ctx').innerHTML='';document.getElementById('cph').style.display='none';document.getElementById('go').classList.add('on');document.getElementById('atn').style.display='none'")
        sprite("cboxDockAt", 30.0, "#cbox", "document.getElementById('ctx').innerHTML='';document.getElementById('cph').style.display='none';document.getElementById('go').classList.add('on');document.getElementById('atn').style.display='grid'")
        sprite("cboxDock2", 30.0, "#cbox", "const c=document.getElementById('ctx');c.innerHTML='<span style=\"color:transparent\">x<br>x</span>';document.getElementById('cph').style.display='none';"
                                          "document.getElementById('go').classList.add('on');document.getElementById('atn').style.display='grid';"
                                          "const cb=document.getElementById('cbox');cb.style.height=(98+c.offsetHeight-27)+'px';c.innerHTML='';document.getElementById('disc').style.display='none';")
        sprite("disc", 30.0, "#disc", "document.getElementById('disc').style.visibility='visible'")
        out["chatDock"] = pg.evaluate(RECTS, RECT_IDS)
        sprite("cboxMid", 24.0, "#cbox", "document.getElementById('ctx').innerHTML='';document.getElementById('cph').style.display='block';document.getElementById('eqBtn').classList.remove('hot')")
        sprite("cboxMidOn", 24.0, "#cbox", "document.getElementById('ctx').innerHTML='';document.getElementById('cph').style.display='none';document.getElementById('go').classList.add('on');document.getElementById('eqBtn').classList.add('hot')")
        out["m1"] = pg.evaluate(RECTS, RECT_IDS)
        # thread content as one tall sprite (all items revealed) + item rects relative to it
        tall_js = """()=>{const th=document.getElementById('thread'), tin=document.getElementById('tin');
          for (const id of ['cbox','disc','fadebot','eqp','mp','mp2','srcP']) { const e=document.getElementById(id); if(e) e.style.display='none'; }
          const win=document.getElementById('win'); win.style.overflow='visible'; win.style.height='2600px';
          const mc=document.getElementById('mcard'); mc.style.overflow='visible'; mc.style.bottom='auto'; mc.style.height='2500px';
          th.style.overflow='visible'; th.style.bottom='auto'; th.style.height='2400px'; th.style.visibility='visible'; th.style.opacity=1;
          tin.style.transform='none'; tin.querySelectorAll('*').forEach(e=>{e.style.opacity='';});
          [...tin.children].forEach(e=>{e.style.opacity=1;e.style.transform='none'}); tin.querySelectorAll('.step,.ans>*').forEach(e=>{e.style.opacity=1;e.style.transform='none'});
          document.getElementById('ans1').style.opacity=1; document.getElementById('docCk').style.opacity=1;}"""
        items = ["ub1", "steps1", "ans1", "ub2", "steps2", "ans2", "ub3", "steps3", "cite1", "ansP", "ansA1"]
        for name, card_w in (("thread", None), ("threadNarrow", 790)):
            pg.set_viewport_size({"width": 1440, "height": 2600})
            state(34.0)
            if card_w:
                pg.evaluate(f"document.getElementById('mcard').style.right=(1440-56-{card_w})+'px'")
            pg.evaluate(f"({tall_js})()")
            el = pg.locator("#tin"); el.screenshot(path=str(HERE / f"{name}.png"), omit_background=True)
            bb = el.bounding_box()
            out[name] = {"box": [bb["x"], bb["y"], bb["width"], bb["height"]],
                         "items": pg.evaluate("""(ids)=>{const t=document.getElementById('tin').getBoundingClientRect();const o={};
                            for(const id of ids){const e=document.getElementById(id); if(!e) continue; const r=e.getBoundingClientRect(); o[id]=[r.left-t.left,r.top-t.top,r.width,r.height];}
                            o.steps1_children=[...document.getElementById('steps1').children].map(e=>{const r=e.getBoundingClientRect();return [r.left-t.left,r.top-t.top,r.width,r.height]});
                            o.steps3_children=[...document.getElementById('steps3').children].map(e=>{const r=e.getBoundingClientRect();return [r.left-t.left,r.top-t.top,r.width,r.height]});
                            o.ans1_children=[...document.getElementById('ans1').children].map(e=>{const r=e.getBoundingClientRect();return [r.left-t.left,r.top-t.top,r.width,r.height]});
                            return o;}""", items)}
            pg.set_viewport_size({"width": 1440, "height": 860})
        # 8 source viewer open (card narrow) and the panel with/without highlight
        plate("split", 40.0, "document.getElementById('thread').style.visibility='hidden';document.getElementById('fadebot').style.visibility='hidden';"
                             "document.getElementById('cbox').style.visibility='hidden';document.getElementById('disc').style.visibility='hidden';"
                             "document.getElementById('srcP').style.visibility='hidden'")
        out["splitDock"] = pg.evaluate(RECTS, RECT_IDS)
        sprite("cboxSplit", 40.0, "#cbox", "document.getElementById('ctx').innerHTML='';document.getElementById('cph').style.display='block';document.getElementById('go').classList.remove('on')")
        sprite("src0", 40.0, "#srcP", "document.getElementById('srcP').style.transform='none';document.getElementById('srcHl').style.backgroundSize='0% 100%'")
        sprite("src1", 40.0, "#srcP", "document.getElementById('srcP').style.transform='none';document.getElementById('srcHl').style.backgroundSize='100% 100%'")
        out["src"] = pg.evaluate("""()=>{const p=document.getElementById('srcP').getBoundingClientRect();const r=document.getElementById('srcPara').getBoundingClientRect();
            const c=document.getElementById('srcClose').getBoundingClientRect(); return {panel:[p.left,p.top,p.width,p.height], para:[r.left-p.left,r.top-p.top,r.width,r.height], close:[c.left-p.left,c.top-p.top,c.width,c.height]}}""")
        # 9 @ menus
        for nm, t, sel, row in (("mp0", 46.2, "#mp", False), ("mp1", 47.2, "#mp", True), ("mp2a", 55.1, "#mp2", False), ("mp2b", 55.2, "#mp2", True)):
            sprite(nm, t, sel, f"const m=document.querySelector('{sel}');m.style.opacity=1;m.style.visibility='visible';m.style.transform='none';"
                                f"m.querySelector('.row').style.background='{'#D8CEBB' if row else '#E1D9CA'}'")
        # 10 Jobs page
        plate("jobs", 58.2, "document.getElementById('tipJobs').style.visibility='hidden'")
        out["jobsR"] = pg.evaluate(RECTS, RECT_IDS)
        # 11 the letter, marks off/on
        pg.set_viewport_size({"width": 1440, "height": 1300})
        for nm, on in (("letter0", False), ("letter1", True)):
            state(62.0, "const l=document.getElementById('letter');l.style.visibility='visible';l.style.opacity=1;l.style.left='0px';l.style.top='0px';l.style.transform='none';"
                        + "".join(f"document.getElementById('{m}').style.backgroundSize='{'100%' if on else '0%'} 100%';" for m in ("lm1", "lm2", "lm3")))
            pg.locator("#letter").screenshot(path=str(HERE / f"{nm}.png"), omit_background=True)
        out["letter"] = pg.evaluate("""()=>{const l=document.getElementById('letter').getBoundingClientRect();const o={box:[l.left,l.top,l.width,l.height]};
            for(const m of ['lm1','lm2','lm3']){const r=document.getElementById(m).getBoundingClientRect();o[m]=[r.left-l.left,r.top-l.top,r.width,r.height];} return o;}""")
        b.close()
    (HERE / "rects.json").write_text(json.dumps(out, indent=1))
    print("plates:", len(list(HERE.glob("*.png"))))


main()
