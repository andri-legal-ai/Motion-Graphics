# Andri Academy 1.1 Dutch · Uw eerste zaak, van begin tot eind

Dutch version of 1.1 "Your first matter, start to finish" (13 Oct 2026). Same story, look, captions, camera and end card as the
English reference; the narration is written natively in Dutch (`script-nl.md`, `narration-nl.txt`), and every screen comes from
Andri staging in Dutch. New in this version: a short first step that shows how to switch Andri to Dutch, and Jurisdiction →
Nederland in the New Matter dialog (Bennett, 13 Oct: that makes the matter screens fully Dutch).

Delivered: `~/Desktop/Andri Videos/Andri Academy/Dutch/1.1.mp4` (v7) · timestamps: `~/Desktop/Andri Videos/Andri Academy/Dutch/Timestamps/1.1 timestamps.txt`

## What is where

- `script-nl.md`: Dutch narration and on-screen text next to the English, plus what staging shows in Dutch.
- `demo-files-nl/` + `make_docs_nl.py`: the mock case written in Dutch (ET1 verzoekschrift, ET3 verweerschrift, uitspraak,
  ontslagbrief, schikkingsvoorstel, HR e-mail, Aldridge Vine briefsjabloon). Same people, facts and dates; UK statute names in English.
  Reusable for the other Dutch videos.
- `staging-snapshot/`: DOM snapshots of live staging (`raw/`), localised by `localize.py` (Aldridge Vine / AF, my matter
  "Academy 1.1 NL" shown as "Nair / Calderdale Logistics"). `inject.js` is the snapshot tool (kept in staging localStorage
  `snap11nl`, loaded as an inline script because the page CSP blocks eval), `grab.sh` splits the downloaded batches.
- `plates/capture.mjs`: renders the snapshots to 2x plates and rects; `plates/make_letter.py` marks the letter.
- `app.js` + `build/index.html`: the canvas animation. Built on the German 1.1 engine; two beats are inserted into its timeline
  (`INS`: hold, lang, jur). `window.MIX` exports voice, click, whoosh and chapter times; `audio/events.mjs` writes them to
  `audio/events.json` for `audio/mix.py`.
- `audio/narration-nl.mp3` (ElevenLabs, "Devin dutch narration Andri", Eleven v4, s50 sb75 sp100, one take, Generation 1),
  `audio/nl/*.wav` per line, `audio/mix-nl.wav` (-14 LUFS).
- Render: `node ../../_toolkit/render.mjs build --out vN.mp4 --audio "$PWD/audio/mix-nl.wav"`, then add chapters from `chapters.ffmeta`.

## What staging shows in Dutch (13 Oct 2026)

- Company → Language is firm-wide and needs Update Company; saving reloads the page in the new language ("Company Updated" toast
  shows in the old language just before). The dropdown alone does not switch anything.
- With the firm in Dutch, the top bar, matters list and Company pages are Dutch, but the New Matter dialog is English until
  Jurisdiction is set to Netherlands; then the dialog and everything inside that matter is Dutch (Goedemorgen, Kennisbank,
  Voorbeeldvragen, Diepgaande modus, Taken, Dutch document summaries and tags, Dutch example questions).
- Andri's step rows are Dutch; its visible reasoning ("Nadenken") came out partly in English.

## Calls I made

- Language step: English matters list → firm button (Aldridge Vine) → Company → Language → Dutch → Update Company → Dutch page →
  Zaken. Shown as staging does it, with the page scroll to reach Update Company.
- First question: the Dutch SWOT example from Voorbeeldvragen (like the English 1.1), because the examples are now generated in Dutch.
- Left out (cut, never reworded): Andri's English "Nadenken" rows; the two questions Andri asked before writing the letter
  (because the 11 May 2026 remedy hearing has passed: I answered "no decision or settlement yet" and "signed by Adam Frith");
  the "Zo heeft Andri dit gemaakt" panel that opens by itself (the video goes to Taken, as the narration says). Long answers are
  shortened by whole blocks.
- Everything on screen is Dutch apart from the English start of the language step (Bennett, 13 Oct: every interface text in the
  language): the SWOT answer is shown up to its first paragraph (with the judgment link), leaving out Andri's English SWOT headings
  ("Strengths" ...), and the "Geheugen raadplegen" step rows are cut because they show the staging account's English memory names.
- Title card uses the waving mascot only (known-issues #2: no lightbulb pose).
- End card: "Volgende: Diepgaande modus of Plan" (Dutch UI name of In-Depth; check when 1.2 Dutch is made).
- Matter name in the video: "Nair / Calderdale Logistics". My test matter "Academy 1.1 NL" is left in staging for Bennett to delete.
