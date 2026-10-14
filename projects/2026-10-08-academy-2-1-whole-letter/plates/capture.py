"""Captures the Andri screens for Academy 2.1 as 2x plates plus element rects.

Source: the 2.1 rebuild of real Andri staging (video-1.1/build/s21.html, from src/s21.src.html), built on the
1.1 and 1.2 rebuilds. All text is copied from the staging run of 8 Oct 2026 (Nair v Calderdale Logistics,
conversation "Client letter"); the staging account name is replaced by the demo firm Aldridge Vine.
Output: plates/*.png and plates/rects.js (app pixels, window = 1440 x 860).
"""
import json, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
SRC = pathlib.Path("/Users/bennettnittke/Desktop/Andri/5 - Marketing/Videos/Andri Learn Video Designs/video-1.1/build/s21.html")
IDS = ["btnKB", "cbox", "go", "atb", "railJobs", "inboxN", "mcard", "dcard", "dopt0", "dopt1", "dopt2", "dother", "bpanel", "dpanel", "dpN", "dpBar", "toast", "mp", "mpRow", "disc", "kbN"]
RECTS = """ids => { const o={}; for (const id of ids){ const e=document.getElementById(id); if(!e || getComputedStyle(e).display==='none') continue;
  const r=e.getBoundingClientRect(); if(r.width) o[id]=[r.left,r.top,r.width,r.height]; } return o; }"""
FULL = {"x": 0, "y": 0, "width": 1440, "height": 860}
ITEMS = ["w_ub"] + [f"w_s{i}" for i in range(9)] + ["w_t1", "w_t2", "w_wait", "w_banner", "w_t3", "w_s9", "w_t4", "w_doc", "w_reply",
         "c_ub", "c_s0", "c_s1", "c_t1", "c_doc", "c_reply", "c_edit"]
HIDE_UI = "for (const id of ['thread','fadebot','cbox','disc']) document.getElementById(id).style.visibility='hidden';"
# word boxes of typed text inside the chat box (relative to the box), so the canvas can type it in place
WORDS = """([html]) => { const cb=document.getElementById('cbox'), tx=document.getElementById('ctx');
  tx.innerHTML = html; const c=cb.getBoundingClientRect(); const out=[];
  tx.querySelectorAll('span[data-w]').forEach(s => { const r=s.getBoundingClientRect(); out.push({t:s.textContent, x:r.left-c.left, y:r.top-c.top, w:r.width, h:r.height, chip:s.dataset.w==='c'}); });
  const lines=[...new Set(out.map(o=>Math.round(o.y)))].length; tx.innerHTML=''; return {words:out, lines, box:[c.left,c.top,c.width,c.height]}; }"""


def wrap(text, chip=None):
    import html
    parts = [f'<span data-w="t">{html.escape(w)}</span>' for w in text.split(' ') if w]
    s = ' '.join(parts)
    if chip:
        s += f' <span data-w="c" class="chipg">{html.escape(chip)}</span>'
    return s


def main():
    out = {}
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome", headless=True, args=["--allow-file-access-from-files"])
        pg = b.new_page(viewport={"width": 1440, "height": 860}, device_scale_factor=2)

        def state(js="", h=860):
            pg.set_viewport_size({"width": 1440, "height": h})
            pg.goto(SRC.as_uri()); pg.wait_for_function("window.READY===true")
            pg.evaluate("()=>{const S=STATE;S.base();" + js + "}")

        def plate(name, js=""):
            state(js); pg.screenshot(path=str(HERE / f"{name}.png"), clip=FULL, omit_background=True)
            out[name] = pg.evaluate(RECTS, IDS)

        def sprite(name, sel, js=""):
            js += ";for (const id of ['thread','fadebot']) document.getElementById(id).style.visibility='hidden';"
            if sel == "#cbox": js += ";document.getElementById('disc').style.visibility='hidden';document.getElementById('greet').style.visibility='hidden';"
            state(js); el = pg.locator(sel); el.screenshot(path=str(HERE / f"{name}.png"), omit_background=True)
            bb = el.bounding_box(); out[name] = {"box": [bb["x"], bb["y"], bb["width"], bb["height"]]}
            out[name].update(pg.evaluate(RECTS, IDS))

        # 1. greeting (no chat box: the canvas draws it, because it grows while typing)
        plate("m1", HIDE_UI.replace("'thread',", ""))
        # chat box sprites at the greeting: empty, then 1 to 3 lines of (invisible) text, send button on
        sprite("cboxG0", "#cbox")
        for n in (1, 2, 3):
            sprite(f"cboxG{n}", "#cbox", f"S.lines({n},true)")
        sprite("cboxG3at", "#cbox", "S.lines(3,true);document.getElementById('atn').style.display='grid';document.getElementById('atb').classList.add('on')")
        sprite("disc", "#disc")
        # typed request: before the pick (with the typed @...), and after (with the chip)
        state("S.lines(3,true)")
        out["typeA"] = pg.evaluate(WORDS, [wrap(pg.evaluate("STATE.REQ + STATE.TYPEDAT"))])
        out["typeB"] = pg.evaluate(WORDS, [wrap(pg.evaluate("STATE.REQ").rstrip(), pg.evaluate("STATE.CHIP"))])
        # the @ list
        sprite("mp", "#mp", "const m=document.getElementById('mp');m.style.display='block';m.style.left='40px';m.style.top='40px';m.style.setProperty('box-shadow','none','important');for (const id of ['mcard','greet','cbox','disc']) document.getElementById(id).style.visibility='hidden';document.querySelectorAll('.nav,.rail').forEach(e=>e.style.visibility='hidden');document.getElementById('win').style.background='transparent';document.querySelector('.app').style.background='transparent'")
        # keep the rounded corners: clip the shadow area off by capturing the element only (omit_background keeps corners transparent)
        # 2. conversation frames (wide, then narrow next to the side panel), without the moving parts
        plate("chat", "S.docked();" + HIDE_UI)
        plate("split", "S.docked();S.narrow();" + HIDE_UI)
        for nm, js in (("cboxDock", "S.docked()"), ("cboxSplit", "S.docked();S.narrow()"), ("cboxSplitOn", "S.docked();S.narrow();S.lines(1,true)"),
                       ("cboxSplit2", "S.docked();S.narrow();S.lines(2,true)"), ("discSplit", None)):
            if js is None:
                sprite(nm, "#disc", "S.docked();S.narrow()"); continue
            sprite(nm, "#cbox", js)
        # the change request typed in the narrow chat box (grows upwards, bottom stays put)
        state("S.docked();S.narrow();S.lines(2,true)")
        out["typeC"] = pg.evaluate(WORDS, [wrap(pg.evaluate("STATE.CHANGE"))])
        # question cards (wide, docked)
        for n in range(3):
            for hot in (-1, 0):
                sprite(f"dq{n}{'hot' if hot == 0 else ''}", "#dcard", f"S.docked();S.dcardAt({n},{hot})")
        # tall conversation sprites with item rects (relative to the sprite)
        variants = {"wideQ": ("", ["c_ub", "c_s0", "c_s1", "c_t1", "c_doc", "c_reply"]),
                    "wideA": ("", ["w_wait", "w_banner"]),
                    "narrow": ("S.narrow();", ["w_wait", "w_banner"])}
        for nm, (pre, hidden) in variants.items():
            state("S.docked();" + pre + "".join(f"document.getElementById('{h}').style.display='none';" for h in hidden) +
                  """for (const id of ['cbox','disc','fadebot']) document.getElementById(id).style.display='none';
                  const win=document.getElementById('win'); win.style.overflow='visible'; win.style.height='3200px';
                  const mc=document.getElementById('mcard'); mc.style.overflow='visible'; mc.style.bottom='auto'; mc.style.height='3100px';
                  const th=document.getElementById('thread'); th.style.overflow='visible'; th.style.bottom='auto'; th.style.height='3000px';""", 3200)
            el = pg.locator("#tin3"); el.screenshot(path=str(HERE / f"{nm}.png"), omit_background=True)
            bb = el.bounding_box()
            out[nm] = {"box": [bb["x"], bb["y"], bb["width"], bb["height"]], "items": pg.evaluate("""ids=>{const t=document.getElementById('tin3').getBoundingClientRect();const o={};
                for(const id of ids){const e=document.getElementById(id); if(!e||getComputedStyle(e).display==='none') continue; const r=e.getBoundingClientRect(); o[id]=[r.left-t.left,r.top-t.top,r.width,r.height];} return o;}""", ITEMS)}
        # side panels and the toast
        sprite("bpanel", "#bpanel", "S.docked();S.narrow();document.getElementById('bpanel').style.display='block'")
        out["bpanel"]["items"] = pg.evaluate("""()=>{const t=document.getElementById('bpanel').getBoundingClientRect();const o={};
            document.querySelectorAll('#bpTl > div').forEach(e=>{const r=e.getBoundingClientRect(); o[e.id]=[r.left-t.left,r.top-t.top,r.width,r.height];});
            const h=document.getElementById('bpHead').getBoundingClientRect(); o.head=[h.left-t.left,h.top-t.top,h.width,h.height]; return o;}""")
        for v in (1, 2):
            sprite(f"dpanel{v}", "#dpanel", f"S.docked();S.narrow();document.getElementById('dpanel').style.display='block';S.page({v})")
            out[f"dpanel{v}"]["page"] = pg.evaluate("""()=>{const t=document.getElementById('dpanel').getBoundingClientRect();const r=document.getElementById('dpPage').getBoundingClientRect();return [r.left-t.left,r.top-t.top,r.width,r.height];}""")
        sprite("toast", "#toast", "document.getElementById('toast').style.display='block'")
        for n in (1, 2, 3):
            sprite(f"inbox{n}", "#inboxN", f"S.inbox({n})")

        # Knowledge Base (where the case file and the template come from): frames, the folder card, the tall folder table
        kbIds = ["kbFold", "kbTop", "kt0", "kbRailChat", "kbIn", "kbCrumb"]
        def kbstate(js):
            state("S.kbView('top');" + js)
        kbstate("document.getElementById('kbTop').style.visibility='hidden';document.getElementById('kbFold').style.visibility='hidden'")
        pg.screenshot(path=str(HERE / "kbFrame.png"), clip=FULL, omit_background=True); out["kbFrame"] = pg.evaluate(RECTS, kbIds)
        state("S.kbView('in');document.getElementById('kbIn').style.visibility='hidden'")
        pg.screenshot(path=str(HERE / "kbFrameIn.png"), clip=FULL, omit_background=True); out["kbFrameIn"] = pg.evaluate(RECTS, kbIds)
        state("S.kbView('top')")
        pg.screenshot(path=str(HERE / "kbTopFull.png"), clip=FULL, omit_background=True); out["kbTopFull"] = pg.evaluate(RECTS, kbIds)
        out["kbTopFull"]["kt0"] = pg.evaluate("()=>{const r=document.getElementById('kt0').getBoundingClientRect();return [r.left,r.top,r.width,r.height]}")
        pg.set_viewport_size({"width": 1440, "height": 1700})
        pg.goto(SRC.as_uri()); pg.wait_for_function("window.READY===true")
        pg.evaluate("()=>{const S=STATE;S.base();S.kbView('in');document.getElementById('win').style.height='1700px';}")
        el = pg.locator("#kbIn"); el.screenshot(path=str(HERE / "kbIn.png"), omit_background=True)
        bb = el.bounding_box()
        out["kbIn"] = {"box": [bb["x"], bb["y"], bb["width"], bb["height"]], "rows": pg.evaluate("""()=>{const t=document.getElementById('kbIn').getBoundingClientRect();const o={};
            document.querySelectorAll('#kbIn .r').forEach(e=>{const r=e.getBoundingClientRect(); o[e.id]=[r.left-t.left,r.top-t.top,r.width,r.height];}); return o;}""")}
        b.close()
    (HERE / "rects.json").write_text(json.dumps(out, indent=1))
    (HERE / "rects.js").write_text("window.RECTS_DATA=" + json.dumps(out) + ";\n")
    print("plates:", len(list(HERE.glob("*.png"))))


main()
