# Andri in BaseNeQXt (Dutch, for Timothy's BaseNet launch; not an Academy video)

How to connect BaseNet to Andri and what Andri does with it, in Dutch only (voice, text, captions, UI, typed questions).
Brief: Timothy's "video-brief-andri-in-baseneqxt.html" (Slack #claude-chat-marketing). Look: the Academy videos (11.1 engine),
plus Bennett's reference https://prompt-motion.com/twoclipping-6dd14e for the opening, three big text moments and the outro
(`reference/style-guide.md`).

## What is where
- `audio/script-nl.txt` (v2, 13 Oct, rewritten around the real flow on staging), `audio/tts-nl.txt` (IPA tags: BaseNeQXt "Base-Next",
  BaseNet "Base-Net"), `audio/narration-nl.mp3` (ElevenLabs "Devin dutch narration Andri", Eleven v4, s50 sb75 sp100, one take,
  Generation 1, 2:07), `audio/split.py` → `audio/nl/L01..L20.wav`, `audio/words.json` (word times), `audio/cues.mjs` + `audio/mix.py`
  → `audio/mix-nl.wav` (-14 LUFS). The first script and take are in `audio/v1-old/`.
- `staging-snapshot/raw/` DOM snapshots (13 Oct), `localize.py` → `loc/`. `inject.js` is the snapshot tool.
- `plates/capture.mjs` → plates (2x) and `rects.js`. `app.js` + `build/index.html` = the canvas animation.
- Render: `node ../../_toolkit/render.mjs build --out vN.mp4 --audio "$PWD/audio/mix-nl.wav" --workers 8`.

## Where the screens come from
- Timothy's staging account (firm in Dutch). BaseNet was signed in by Bennett with BaseNet's own test login (Claude never typed it).
- My matter "De Vries / Bakker" (Nederland), made with the New matter dialog's "BaseNet-dossier (optioneel)" field, linked to test
  dossier D100009. Its question "Hoe is de zorg voor de kinderen verdeeld? Geef een kort overzicht." and the real answer.
  Two files (File_01, File_02) synced to Andri for real.
- Writing to BaseNet (save a document, hours, agenda) comes from Timothy's test matter on the same dossier (E2E-FLOW-C, 9 Oct):
  the auto-mode safety check blocked me from writing hours myself, so nothing new was written to BaseNet.
- The empty Kennisbank with "Aanmelden bij BaseNet" and its form: Bennett's account (NL matter, before sign-in).

## Calls I made (shown to Bennett at delivery)
- Shown as firm "Van Hoven & Partners", lawyer Sanne van Hoven (SH); the BaseNet test login name and Timothy are replaced.
- The test team's own files in the dossier (loop-*, E2E-*, Test*, flynn@...) are left out of the lists; Andri's English
  "Nadenken" rows and memory rows are cut; answers are shortened by whole paragraphs (the save answer named a test file, so only
  its steps are shown; the hours answer's second paragraph named the test login).
- Gmail and Outlook rows in Koppelingen show "Niet gekoppeld" (staging's own SharePoint state) instead of the staging account's
  expired logins.
- The sign-in username "s.vanhoven" is a demo value; the password shows as dots.
- "Memo" is said by voice; the screen shows "Document in BaseNet opslaan" (a letter saved to the dossier in the test matter).

## Staging cleanup (after Bennett's OK)
- My test matter "De Vries / Bakker" in Timothy's account (two conversations, two synced files). Bennett's account: "Rijnveld
  Distributie B.V. / Verhoef". Both can be deleted; deleting is permanent, so Bennett decides.
