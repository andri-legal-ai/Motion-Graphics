# Academy 9.2 · LegalSense, linked once

How this video is built (12 Oct 2026):

1. `staging-snapshot/raw/*.html` are DOM snapshots of Andri staging taken by SNAP92 (`staging-snapshot/snap92.js`) in my own tab,
   queued in the page and saved with one download (`grab.sh` splits the batch). `localize92.py` makes them local pages (fonts,
   Aldridge Vine, AF, the LegalSense logo as `integration-legalsense.png`). The Knowledge Base page is 9.1's snapshot of the same day.
2. `node plates/capture.mjs [regex]` renders 2x plates and `plates/rects.json`, plus the LegalSense intro scenes stepped frame by
   frame (`plates/frames/s1..s3`, 4.8 s loops, only the app's `emt-` animations stepped).
3. `app.js` draws everything on one canvas (`build/index.html`); timings at the top (`VO`, `T`, `SHOTS`, `CAP`).
4. Audio: one ElevenLabs take (`audio/narration-uk-9.2.mp3`) cut into `audio/uk/N*.wav`; `zsh audio/mix.sh` gives `audio/mix-uk-14.wav`.
5. Render: `node "$HOME/Desktop/Andri/Motion Graphics/_toolkit/render.mjs" build --out vN.mp4 --audio "$PWD/audio/mix-uk-14.wav"`,
   then `node chapters.mjs` and mux `chapters.ffmeta` in.

Nothing was changed in staging (nothing saved, connected or sent). See `story.md` for the calls made and `staging-notes.md` for what staging shows.
