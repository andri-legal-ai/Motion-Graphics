"""Builds build/index.html from src/index.src.html.

- Cleans the mascot SVGs (removes the yellow background, recolours the
  knock-out fills to the scene background) and inlines them, so their
  built-in CSS animations can be driven frame by frame.
- Inlines the Lucide icons used by the rebuilt Andri screens.
"""
import re, pathlib

HERE = pathlib.Path(__file__).resolve().parent
# shared, read-only: the 1.1 rebuild's assets, icons and mascots
ROOT = pathlib.Path.home() / "Desktop/Andri/5 - Marketing/Videos/Andri Learn Video Designs/video-1.1"
MASCOTS = ROOT.parent / "mascots"
EXTRA_ICONS = HERE / "icons"  # icons the 1.1 rebuild doesn't have (from lucide-static)
BG = "#D6CFBB"


def mascot(name, clip_w=None):
    s = (MASCOTS / f"{name}.svg").read_text()
    m = re.search(r'<rect x="0\.0" y="0\.0" width="1342\.0" height="894\.0" fill="(#[0-9a-f]{6})"/>', s)
    bg = m.group(1)
    # knock-out fills follow --ko, so the mascot blends into whatever panel he stands on
    s = s.replace(m.group(0), "").replace(f'fill="{bg}"', f'style="fill:var(--ko,{BG})"')
    s = re.sub(r"<\?xml[^>]*\?>", "", s)
    if clip_w:
        cid = f"cut-{name}"
        i = s.index("</style>") + 8
        s = (s[:i] + f'<defs><clipPath id="{cid}"><rect x="0" y="0" width="{clip_w}" height="894"/></clipPath></defs>'
             f'<g clip-path="url(#{cid})">' + s[i:].replace("</svg>", "</g></svg>"))
        s = re.sub(r'viewBox="[^"]+"', f'viewBox="0 0 {clip_w + 12} 894"', s, 1)
    s = re.sub(r'\swidth="\d+"\s+height="\d+"', "", s, 1)
    return s


def icon(name):
    f = EXTRA_ICONS / f"{name}.svg"
    s = (f if f.exists() else ROOT / "icons" / f"{name}.svg").read_text()
    s = re.sub(r"<!--.*?-->", "", s, flags=re.S)
    s = re.sub(r'\s*class="[^"]*"', "", s)
    s = re.sub(r'\s(width|height)="24"', "", s)
    return " ".join(s.split())


import sys
name = sys.argv[1] if len(sys.argv) > 1 else "v7a-de"
v1 = (HERE / "index-de.src.html").read_text()
src = (HERE / f"{name}.src.html").read_text()
if True:
    css = v1[v1.index("<style>") + 7:v1.index("</style>")]
    app = v1[v1.index("<!-- ===== the Andri window ===== -->"):v1.index("<!-- letter, floats out of the window -->")]
    letter = v1[v1.index('<div class="letter" id="letter">'):v1.index('<svg class="wires" id="wires">')]
    src = src.replace("{{V1CSS}}", css).replace("{{V1APP}}", app).replace("{{V1LETTER}}", letter)
src = re.sub(r"\{\{M:([\w-]+)(?::(\d+))?\}\}", lambda m: mascot(m.group(1), int(m.group(2)) if m.group(2) else None), src)
src = re.sub(r"\{\{I:([\w-]+)\}\}", lambda m: icon(m.group(1)), src)
icon_svg = " ".join((ROOT / "assets" / "Andri-Logo-Icon-Andri-Yellow.svg").read_text().split())
icon_svg = icon_svg.replace("fill: #f7e17e;", "fill: var(--rayc,#F7E17E);")
icon_svg = __import__("re").sub(r"<\?xml[^>]*\?>", "", icon_svg)
src = src.replace("{{ICON}}", icon_svg)
src = src.replace("{{LOGO}}", " ".join((ROOT / "assets" / "andri-logo.svg").read_text().split()))
(HERE / "build").mkdir(exist_ok=True)
(HERE / "build" / f"{name}.html").write_text(src)
print("built", len(src))
