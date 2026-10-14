# Academy 7.1 · Your firm's experts, on call

How this video is built (12 Oct 2026):

1. `staging-snapshot/raw/academy71-*.html` are staging pages (full DOM plus all CSS) copied from my Chrome tab by the `SNAP71` helper (kept in staging's localStorage key `snap71`). The tab was set to 1470 x 835 with `FIT71()` first, so script-sized parts (the specialist panel, the chat) lay out as in a 1470 window. Each copy went through the clipboard: `staging-snapshot/g.sh <name>` saves Bennett's clipboard, waits for the copy, writes the file and restores the clipboard.
2. `python3 staging-snapshot/localize71.py raw/x.html x.html` maps fonts to `assets/fonts` and swaps in the demo values (Aldridge Vine, AF, "Letter to Ms Nair").
3. `node plates/capture71.mjs [regex]` renders the 2x plates and `plates/rects.json` / `rects.js`. The form's scrolling part is stitched from its top and bottom (`tallA`, `tallB`); earlier chat states remove later turns from a finished snapshot.
4. `app.js` draws everything on one canvas (`build/index.html`); timings at the top (`VO`, `T`, `CAP`, `SHOTS`).
5. Audio: `audio/narration-uk-7.1.mp3` is one ElevenLabs take, cut into `audio/uk/L*.wav`; `zsh audio/mix.sh` places lines and clicks from app.js and loudnorms to about -14 LUFS (`mix-uk-14.wav`).
6. Render: `node "$HOME/Desktop/Andri/Motion Graphics/_toolkit/render.mjs" build --out vN.mp4 --audio "$PWD/audio/mix-uk-14.wav"`, then `node chapters.mjs` and mux `chapters.ffmeta`.

Staging items left behind (Bennett to delete): firm folder "Employment: models and precedents" (3 files) in Company › Knowledge base, the specialist "employment-law", conversation "Academy 7.1" in Nair.
