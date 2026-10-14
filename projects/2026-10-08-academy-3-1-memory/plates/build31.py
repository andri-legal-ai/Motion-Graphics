"""Builds video-1.1/build/s31.html from video-1.1/src/s31.src.html.

Same steps as video-1.1/src/build.py (which stays untouched for the other sessions):
inlines the 1.1 CSS and Andri window, and the Lucide icons. Icons are looked up in
video-1.1/icons first, then in this project's icons/ (brain, brain-cog, building-2 ...).
"""
import re, pathlib

V11 = pathlib.Path("/Users/bennettnittke/Desktop/Andri/5 - Marketing/Videos/Andri Learn Video Designs/video-1.1")
MINE = pathlib.Path(__file__).resolve().parent.parent / "icons"


def icon(name):
    for d in (V11 / "icons", MINE):
        f = d / f"{name}.svg"
        if f.exists():
            s = f.read_text()
            s = re.sub(r"<!--.*?-->", "", s, flags=re.S)
            s = re.sub(r'\s*class="[^"]*"', "", s)
            s = re.sub(r'\s(width|height)="24"', "", s)
            return " ".join(s.split())
    raise SystemExit(f"missing icon {name}")


v1 = (V11 / "src" / "index.src.html").read_text()
src = (V11 / "src" / "s31.src.html").read_text()
css = v1[v1.index("<style>") + 7:v1.index("</style>")]
app = v1[v1.index("<!-- ===== the Andri window ===== -->"):v1.index("<!-- letter, floats out of the window -->")]
src = src.replace("{{V1CSS}}", css).replace("{{V1APP}}", app)
src = re.sub(r"\{\{I:([\w-]+)\}\}", lambda m: icon(m.group(1)), src)
(V11 / "build" / "s31.html").write_text(src)
print("built", len(src))
