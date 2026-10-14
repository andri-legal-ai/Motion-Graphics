# Academy 4.1 · Case law research, start to finish

How this video is built (9 Oct 2026):

1. `staging-snapshot/*.html` are the Andri screens read straight from staging's live DOM in Chrome (positions, fonts, colours as computed by the app), with demo values swapped in (Aldridge Vine, AF, the Nair matter). `common.css`, `review.css` and `chat.css` hold the computed styles. `make_review.py` writes the review-builder states from the same measurements.
2. `node screens/build.mjs [plateName]` turns them into pages (`screens/out/`) and renders 2x plates into `plates/` plus `plates/rects.json` (element positions the animation uses). Icons come from `icons/` (lucide-static 0.460).
3. `app.js` draws everything on one canvas (`build/index.html`). Timings are at the top (`VO`, `T`, `TH`, `SHOTS`, `CAP`).
4. Audio: `audio/uk/L*.wav` are the lines cut from one ElevenLabs take (`audio/narration-uk.mp3`); `zsh audio/mix.sh` places them, then a second loudnorm pass gives `audio/mix-uk2.wav` (about -14.5 LUFS).
5. Render: `node "$HOME/Desktop/Andri/Motion Graphics/_toolkit/render.mjs" build --out vN.mp4 --audio "$PWD/audio/mix-uk2.wav"`, then add chapters from `chapters.ffmeta`.

Unlike 1.1 to 3.2, this video does not use the hand-built rebuild in `video-1.1/src` (no `s41.src.html`): staging's own layout was captured instead, so every screen matches the live app.
Staging items left behind (own, named for this video): matter "Academy 4.1" (two reviews), and two conversations in Nair, "Academy 4.1" (the real Acas answer) and "Acas uplift" (empty).
