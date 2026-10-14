"""Builds video-1.1/build/s32.html: the shared build.py (unchanged) does the 1.1 parts, then the extra
Lucide icons (v0.460.0, in plates/icons) are inlined for the {{L:name}} placeholders."""
import pathlib, re, subprocess
HERE = pathlib.Path(__file__).resolve().parent
V11 = pathlib.Path("/Users/bennettnittke/Desktop/Andri/5 - Marketing/Videos/Andri Learn Video Designs/video-1.1")
subprocess.run(["/usr/bin/python3", str(V11 / "src" / "build.py"), "s32"], check=True)
def icon(n):
    s = (HERE / "icons" / f"{n}.svg").read_text()
    s = re.sub(r"<!--.*?-->", "", s, flags=re.S); s = re.sub(r'\s*class="[^"]*"', "", s); s = re.sub(r'\s(width|height)="24"', "", s)
    return " ".join(s.split())
out = V11 / "build" / "s32.html"
html = re.sub(r"\{\{L:([\w-]+)\}\}", lambda m: icon(m.group(1)), out.read_text())
out.write_text(html); print("s32 ok", len(html))
