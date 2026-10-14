# Academy 9.1 · Email in Andri: three ways in

How this video is built (12 Oct 2026):

1. `staging-snapshot/raw/*.html` are DOM snapshots of Andri staging (Nair v Calderdale Logistics), saved by SNAP91 in my own tab;
   `localize91.py` makes them local pages (fonts, icons, Aldridge Vine, AF, adam.frith@aldridgevine.co.uk).
2. `node plates/capture.mjs [regex]` renders 2x plates and `plates/rects.json`, plus the "How it works" scenes stepped frame by frame
   (`plates/frames/h1..h5`). Edits made there are commented: another session's upload hidden, Priya added to Who may send on screen only,
   the slides show Priya's return-to-work email instead of the app's Hartley sample, the Inbox shows only the Nair notifications.
3. `app.js` draws everything on one canvas (`build/index.html`); timings at the top (`VO`, `T`, `SHOTS`, `CAP`).
4. Audio: one ElevenLabs take (`audio/narration-uk-9.1.mp3`) cut into `audio/uk/N*.wav`; `zsh audio/mix.sh` gives `audio/mix-uk-14.wav`.
5. Render: `node "$HOME/Desktop/andri code /Motion Graphics/_toolkit/render.mjs" build --out vN.mp4 --audio "$PWD/audio/mix-uk-14.wav"`,
   then `node chapters.mjs` and mux `chapters.ffmeta` in.

Nothing was changed in staging (nothing saved, sent or connected).
