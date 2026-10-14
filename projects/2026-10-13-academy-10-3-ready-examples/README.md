# Academy 10.3 · Start from a ready example: overnight redline, new client intake

How this video is built (13 Oct 2026), on the 10.2 pipeline:

1. `staging-snapshot/raw/*.html`: DOM snapshots of Andri staging taken in my own tab (`inject103.js`, stored in staging localStorage `snap103`, downloaded as `academy103-batch*.html` by one real click on its small "dl" button and split by `grab103.sh`). `raw/wintake.html` holds the text of every step of both examples. `localize103.py` makes local pages (Aldridge Vine, AF / Adam Frith, "(Academy 10.3)" dropped, my matter "Academy 10.3" shown as "New client enquiries"). `nair_row.html` is the real Nair v Calderdale Logistics row from the 10.2 snapshot (12 Oct).
2. `node plates/capture.mjs [regex]` renders the plates at 1440 x 860 (canvas plates at 3x for the camera moves) and `plates/rects.json`; hover looks with a real mouse over the snapshot (CDP emulates a mouse device, since Tailwind wraps hover styles in `@media (hover: hover)`); the typing into the scope question as a frame sequence (`plates/seq/scope_*`, the text reflows); the publish explainer as frames (`plates/seq/pub1_*`, `pub2_*`). Fixes are commented there.
3. `app.js` draws everything on one canvas (`build/index.html`). The narration is one ElevenLabs take (`audio/narration-uk-10.3.mp3`) cut by sentence (`audio/sentences.json`, `audio/uk/S*.wav`, word times in `build/cues.js`); every action is timed from those words; the gaps between sentences are in `GAPS`.
4. Audio: `zsh audio/mix.sh` (cue times from the page via `audio/clicks.mjs`) → `audio/mix-uk-14.wav`.
5. Render: `node "$HOME/Desktop/Andri/Motion Graphics/_toolkit/render.mjs" build --out vN.mp4 --audio "$PWD/audio/mix-uk-14.wav"`, then `node chapters.mjs` and mux `chapters.ffmeta`. `./check-pauses.sh` finds still-and-silent stretches. `node tools-storyboard.mjs` builds `storyboard.png`.

Left in staging for Bennett to delete: the published workflow "Employment intake to advice (Academy 10.3)" and the matter "Academy 10.3". Nothing was sent, connected or activated (Activate stays disabled without a connected mailbox).
