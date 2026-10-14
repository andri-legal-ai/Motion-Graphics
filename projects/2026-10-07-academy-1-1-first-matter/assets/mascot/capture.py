"""Renders the mascot poses (their own SVG animations: breathe, blink, wave) to PNG frame sequences.

The end pose is captured with its tick badge hidden; the canvas draws and animates the tick itself.
Output: assets/mascot/<pose>/f000.png ... and assets/mascot/mascot.json (frame counts, badge position).
"""
import json, pathlib, re
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
SRC = pathlib.Path("/Users/bennettnittke/Desktop/Andri/5 - Marketing/Videos/Andri Learn Video Designs/mascots")
FPS = 30
POSES = {  # only re-render what is passed on the command line, else all
  # name: (svg, seconds, knockout colour, clip width or None, hide selector)
    "wave": ("andri-waving-hello", 4.0, "#F7E17E", None, None),
    "idea": ("andri-idea-lightbulb", 4.0, "#F7E17E", None, None),
    "point": ("andri-presenting-feature-tiles", 4.0, "#F5EDD3", 748, None),
    "done": ("andri-success-checkmark", 8.0, "#F3EBD6", None, ".p-success-badge"),
    "disc": ("andri-success-checkmark", 8.0, "#F3EBD6", None, "only:1"),   # the original cream disc, alone
    "tick": ("andri-success-checkmark", 8.0, "#F3EBD6", None, "only:3"),   # the original green tick, alone
}


def svg(name, ko, clip_w):
    s = (SRC / f"{name}.svg").read_text()
    m = re.search(r'<rect x="0\.0" y="0\.0" width="1342\.0" height="894\.0" fill="(#[0-9a-f]{6})"/>', s)
    s = s.replace(m.group(0), "").replace(f'fill="{m.group(1)}"', f'fill="{ko}"')
    s = re.sub(r"<\?xml[^>]*\?>", "", s)
    if clip_w:
        i = s.index("</style>") + 8
        s = s[:i] + f'<defs><clipPath id="cut"><rect x="0" y="0" width="{clip_w}" height="894"/></clipPath></defs><g clip-path="url(#cut)">' + s[i:].replace("</svg>", "</g></svg>")
        s = re.sub(r'viewBox="[^"]+"', f'viewBox="0 0 {clip_w + 12} 894"', s, 1)
    return re.sub(r'\swidth="\d+"\s+height="\d+"', "", s, 1)


meta = {}
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    import sys
    for pose, (name, secs, ko, clip_w, hide) in POSES.items():
        if len(sys.argv) > 1 and pose not in sys.argv[1:]: continue
        w = 900
        pg = b.new_page(viewport={"width": w, "height": 900}, device_scale_factor=1)
        pg.set_content(f"<html><body style='margin:0;background:transparent'><div id='m' style='width:{w}px'>{svg(name, ko, clip_w)}</div></body></html>")
        pg.evaluate("document.querySelector('#m svg').style.width='100%';document.querySelector('#m svg').style.height='auto'")
        if hide and hide.startswith("only:"):
            k = int(hide.split(":")[1])
            pg.evaluate(f"document.querySelector('#m svg').style.visibility='hidden';const g=[...document.querySelectorAll('.p-success-badge')];g[{k}].style.visibility='visible';g[{k}].querySelectorAll('*').forEach(e=>e.style.visibility='visible')")
            hide = None
        if hide:
            # badge parts: 0 ring outline + hand (kept), 1 cream disc, 2 glove (kept), 3 green tick
            meta_badge = pg.evaluate(f"""()=>{{const g=[...document.querySelectorAll('{hide}')];const r=g[1].getBoundingClientRect();
                const s=document.querySelector('#m svg').getBoundingClientRect(); g[1].style.visibility='hidden'; g[3].style.visibility='hidden';
                return [(r.left-s.left)/s.width,(r.top-s.top)/s.height,r.width/s.width,r.height/s.height];}}""")
        out = HERE / pose; out.mkdir(exist_ok=True)
        n = int(secs * FPS)
        for i in range(n):
            pg.evaluate("t=>{for(const a of document.getAnimations()){a.pause();a.currentTime=t*1000;}}", i / FPS)
            bb = pg.evaluate("()=>{const r=document.querySelector('#m svg').getBoundingClientRect();return {x:r.left,y:r.top,width:r.width,height:r.height}}")
            pg.screenshot(path=str(out / f"f{i:03d}.png"), clip=bb, omit_background=True)
        size = pg.evaluate("()=>{const r=document.querySelector('#m svg').getBoundingClientRect();return [r.width,r.height]}")
        meta[pose] = {"frames": n, "fps": FPS, "size": size}
        if hide:
            meta[pose]["badge"] = meta_badge
        pg.close()
    b.close()
old = json.loads((HERE / "mascot.json").read_text()) if (HERE / "mascot.json").exists() else {}
old.update(meta)
(HERE / "mascot.json").write_text(json.dumps(old, indent=1))
print(meta)
