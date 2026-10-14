# Andri Academy 2.2 · Reply to a letter from the other side

English (UK), 1920×1080, 60 fps, about 1:34. Same look and engine as the approved 1.1 and 1.2.

- `story.md`: the approved beats, what staging showed, the production re-check.
- `narration-uk.txt`: the script as narrated (ElevenLabs, "UK voice voice to use for ANDRI vids", 8 Oct 2026). `audio/narration-uk.mp3` is the take used; `audio/uk/L1-L10.wav` are its lines.
- `assets/21_Letter_Bowater_Sykes_Remedy.docx`: the letter from the other side, written for this video and uploaded to Nair in staging.
- `staging-captures/`: every screen from the real run in staging (thread "Reply to Bowater Sykes").
- `plates/`: the screens as 2x plates, captured from the rebuild `video-1.1/build/s22.html` (source `src/s22.src.html`) by `plates/capture.mjs`.
- `app.js`: the whole video, drawn on one canvas. Scene times hang off the narration starts (`VO`).
- `mix.mjs`: builds `audio/mix-uk.wav` (voice, clicks, whooshes, -14 LUFS). `stills.mjs`: single frames for checking.
- Render: `node "$HOME/Desktop/andri code /Motion Graphics/_toolkit/render.mjs" build --out vN.mp4 --audio audio/mix-uk.wav`, then the contact sheet.
- `chapters.txt`: timestamps for the Academy page.
