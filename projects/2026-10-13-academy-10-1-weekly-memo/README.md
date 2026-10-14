# Academy 10.1 · Your weekly memo, and other ways to start a workflow

How this video is built (13 Oct 2026). Copied from the 10.2 project (`2026-10-12-academy-10-2-email-workflow`, not edited); 10.2's own files are kept aside as `*/old102/` and `app-10.2.js` for reference.

1. `staging-snapshot/raw/*.html`: DOM snapshots of Andri staging taken in my own tab: my own workflow "Weekly matter memo (Academy 10.1 WM)" (built and published for real), a fresh unsaved copy for the early states, and my own matter "Academy 10.1 WM" (activated for real). Saved by the injector (staging localStorage `snap101wm`) as downloads `acad101wm-batch*.html`, split by `grab.sh`. `localize.py` makes local pages (Aldridge Vine, AF, suffixes dropped, my matter shown as Nair v Calderdale Logistics, the Execution History panel width made to follow the window). The matters list, Explore menu, empty Workflows page and the publish explainer are 10.2's snapshots of the same screens.
2. `node plates/capture101.mjs [regex]` renders 2x plates at 1440 x 860 and `plates/rects.json`: builder plates with the canvas content hidden, node sprites, toasts, the explainer dialog alone as 100 ms frames (`plates/seq/`), and a rect for every control and phrase.
3. `app.js` draws everything on one canvas (`build/index.html`). Timings at the top (`VO`, `T`, `CAP`), in video seconds. The window fade is drawn on its own canvas (known-issues #12).
4. Audio: one ElevenLabs take (`audio/narration-uk-10.1.mp3`, UK voice, Eleven v4, sp100 s50 sb75), cut at its pauses (`audio/cuts.json` → `audio/uk/S*.wav`); `zsh audio/mix.sh` places them at `VO` with clicks and whooshes → `audio/mix-uk-14.wav`.
5. Render: `node "$HOME/Desktop/andri code /Motion Graphics/_toolkit/render.mjs" build --out vN.mp4 --audio "$PWD/audio/mix-uk-14.wav"`, then `node chapters.mjs` and mux `chapters.ffmeta` in. `./check-pauses.sh` finds still-and-silent stretches.

Left in staging for Bennett to delete: the published workflow "Weekly matter memo (Academy 10.1 WM)", in the matter "Academy 10.1 WM" (deactivated after delivery, so it no longer runs). Nothing was sent.
