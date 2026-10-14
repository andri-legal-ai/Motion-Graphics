# Andri Academy 1.1 German · Ihr erster Fall, von Anfang bis Ende

German version of 1.1 "Your first matter, start to finish" (12 Oct 2026). Same story, look, captions, camera and end card as the English reference; the narration is written natively in German (`script-de.md`), and every screen comes from Andri staging with the firm language set to German.

Delivered: `~/Desktop/Andri Academy videos (German)/1.1.mp4` · timestamps: `~/Desktop/Andri Academy timestamps (German)/1.1 timestamps.txt`

## What is where

- `script-de.md`: German narration and every piece of on-screen text, next to the English.
- `demo-files-de/` + `make_docs_de.py`: the mock case translated into German (ET1, ET3, judgment, dismissal letter, settlement letter, HR email, Aldridge Vine letter template). Same people, facts and dates; UK statute names kept in English. Usable for the other German videos.
- `staging-captures/`: screenshots and notes from staging in German mode (my own matter "Academy 1.1 DE").
- `staging-snapshot/`: DOM snapshots of live staging (`raw/`), localised by `localize.py` (Aldridge Vine / AF, matter "Nair ./. Calderdale Logistics", staging-firm mentions cut), `snap.js` is the injector, `clipq.sh` splits the clipboard queue.
- `plates/capture.mjs`: renders the snapshots to 2x plates and rects (`plates/rects.js`).
- `app.js` + `build/index.html`: the canvas animation (renderFrame(t)); `CUTS` removes idle stretches so the voice flows.
- `audio/narration-de.mp3` (ElevenLabs, "german voice for andri vids", Eleven v4, s50 sb75 sp100, one take), `audio/de/*.wav` per line, `audio/mix.py` → `mix-de.wav` (-14 LUFS).
- Render: `node ../../_toolkit/render.mjs build --out vN.mp4 --audio "$PWD/audio/mix-de.wav"`, then add chapters from `chapters.ffmeta`.

## What staging shows in German (checked 12 Oct 2026)

- German: top bar (Fälle, Aufgaben, Inbox, Entdecken), matters list (Fälle suchen..., Neueste zuerst, Neuer Fall, Fallname/Tags/Zusammenfassung/Erstellt, Zeilen pro Seite), Company pages.
- English, even with the firm set to German: everything inside a matter (New Matter dialog, chat, Knowledge Base, upload dialog, @ menu, Example questions, Jobs), document summaries and tags, example questions, Andri's step names. German translations for these exist in the app's code but are not used. Shown as staging has it (Bennett's call, 12 Oct).
- Andri answers German questions in German. The English example question got an English answer.

## Calls I made

- Same case, translated (not a new German case); file names German; statutes in English.
- Matter typed as "Nair ./. Calderdale Logistics" (German style).
- The letter template is uploaded with the six case files (seven files), so the viewer sees where it comes from before the @ list shows it.
- Andri's long answers are shortened by cutting whole blocks only. Staging-firm mentions in Andri's reasoning are cut, not reworded.
- Left out: the "Preparing chat" overlay after Create, the greeting's typing suggestion (hidden, its space kept), and the "How Andri built this" panel that opens by itself while the letter is written (the video goes to Jobs, as the narration says). Time is compressed as in English (the letter took about 3 minutes in staging).
- Callouts follow the letter's real references: Kanzleivorlage (Aldridge_Vine_Briefvorlage.docx), Aktenzeichen (03_ET3_Klageerwiderung.pdf), Das Urteil (05_Urteil_Arbeitsgericht.pdf).
- Title card uses the 1.2 layout (128 px / 84 px), so "von Anfang bis Ende." clears the mascot.
