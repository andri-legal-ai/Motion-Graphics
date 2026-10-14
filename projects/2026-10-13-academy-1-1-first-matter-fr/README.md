# Andri Academy 1.1 French · Premier dossier, du début à la fin

French version of 1.1 "Your first matter, start to finish" (13 Oct 2026), built 1:1 on the German 1.1 (v7): same beats in the same
order, look, camera, captions, cursor, mascots, title card layout, letter scene and end card. Only the language changes. The narration
is written natively in French (`script-fr.md`, `narration-fr.txt`), every screen comes from Andri staging (13 Oct 2026), and every
interface text that staging still shows in English is translated with Andri's own French dictionary first.

Delivered: `~/Desktop/Andri Academy videos (French)/1.1.mp4` · timestamps: `~/Desktop/Andri Academy timestamps (French)/1.1 timestamps.txt`

## What is where

- `script-fr.md`: French narration and every on-screen text next to the German, typed requests, chapters.
- `demo-files-fr/`: the seven files uploaded in staging, taken unchanged from Bennett's `Mock Case Nair - DE FR NL.zip` →
  `Mock Case (Français, Suisse)` (extracted into `case-zip/`, read only as data). Swiss case: Tribunal des prud'hommes de Genève,
  Aldridge Vine Avocats SA, Calderdale Logistique SA, Bowater Sykes Avocats SA, CHF.
- `staging-snapshot/`: DOM snapshots of live staging (`raw/`), localised by `localize.py` (Aldridge Vine / AF, my matter
  "Academy 1.1 FR v2" shown as "Nair c. Calderdale Logistique SA"). `snap.js` is the injector (kept in staging localStorage
  `snap11fr`), `clipq.sh` splits the clipboard queue (Bennett's clipboard is backed up and restored each time).
  `i18n-en-fr.json`: Andri's English/French dictionary pulled from the app bundle (8,352 keys, the object around `emailDraft:{`).
  `tr-fr-manual.json`: my French for the texts Andri's dictionary doesn't cover.
- `plates/capture.mjs`: renders the snapshots to 2x plates, sprites, hover crops and rects (`plates/rects.js`);
  `plates/tr-fr.json` = Andri's dictionary + my table (`merge_tr.py`); `make_letter.py` marks the letter; `fix_para.py` measures the
  cited passage from pixels.
- `app.js` + `build/index.html`: the canvas animation (the German 1.1 engine; `SEGS` is the time map shared with `audio/mix.py`).
- `audio/narration-fr.mp3` (ElevenLabs), `audio/fr/*.wav` per line (cut at the pauses, found with word timings),
  `audio/mix.py` → `audio/mix-fr.wav` (-14 LUFS).
- Render: `node ../../_toolkit/render.mjs build --out vN.mp4 --audio "$PWD/audio/mix-fr.wav"`, then add chapters from `chapters.ffmeta`.
- `check/transcribe_fr.py`: my copy of the toolkit transcriber with a word matcher that keeps French accents.

## What staging shows in French (13 Oct 2026)

- Company → Language → French → Update Company reloads the app in French: top bar (Dossiers, Missions, Boîte de réception,
  Explorer), matters list, Cabinet pages and the New matter dialog once a jurisdiction is chosen.
- Matter screens follow the matter's jurisdiction, not the firm language: a United Kingdom matter stays English inside
  (Knowledge Base, chat, Example questions, file summaries and tags, Jobs), a Belgium matter came out Dutch. Switzerland is still
  greyed out in the Jurisdiction list. Everything left in English is translated in the rebuild (Bennett, 13 Oct).
- Andri answers French questions in French; its reasoning rows came out partly in English.

## Calls I made

- Jurisdiction: the default United Kingdom, as in the German 1.1 (shown as "Royaume-Uni"). Belgium was tried first in my own
  matter "Academy 1.1 FR" and made the matter screens Dutch, so it wasn't used; that matter is left untouched in staging.
- HR email: the zip's `19_E-mail_Retour.eml` is Priya's own email; the one matching the German `20_Email_HR_Rückkehr` (Sandra
  Okeke's reply) is `20_E-mail_RH_Fonction.eml`, so that is the seventh case file.
- Translations: Andri's own French wherever its dictionary has the string (6,076 entries), my French in its terms for the rest
  (tags, step names, the six example questions, file summaries, the opening lines of the reasoning rows, dates). Where Andri's
  dictionary has two words for one English label, the screen uses the one the app uses there: rail tooltip "Traitements"
  (`common.jobs`), Jobs panel title "Travaux" (`jobs.title`).
- Cut, never reworded: the memory-lookup rows (the staging account's memories), the reasoning row about the staging matter's
  UK jurisdiction instructions, the reasoning row about the staging firm and the signer, and Andri's two questions before the letter
  (answered in staging: Me Adam Frith signs; keep the 19 March 2026 position with bracketed placeholders). Long answers are shortened
  by whole blocks (SWOT: first four blocks; @ answer: first three; letter reply: first block).
- Source step: the click goes to Andri's citation of `09_Lettre_de_licenciement` in the SWOT answer, because that is a citation
  staging opens at a highlighted passage (the decision's citation in the same answer opens the document without a highlight).
- Callouts follow the real letter: Modèle du cabinet (Aldridge_Vine_Modele_de_lettre.docx), Numéro de cause (cause n°
  C/18542/2025-4, 03_Reponse.pdf), La décision (décision incidente notifiée le 19 mars 2026, 05_Decision_incidente_Tribunal.pdf).
- Language step: the English "before" pages and the French "after" page are real staging captures (not mapped from another
  language). The Save button sits below the window, so the page scrolls 140 px before Update Company.
- Tempo: the German 1.2x app timeline. The French lines are shorter, so the stretches where Andri works or the camera holds play a
  little faster (`SEGS`); gaps between lines are 3.3 to 4.6 s, always while something moves; captions start with their line.
- Title "Premier dossier, / du début à la fin." (the 1.2 layout's 128 px line "Votre premier dossier," ran into the mascot).
- End card: "Andri Academy · À suivre : Approfondi ou Plan" (Andri's French labels for In-Depth and Plan).
- Demo matters in the list in French; dates in French ("29 sept. 2026", "13 oct. 2026").
- Left in staging: my matters "Academy 1.1 FR" (Belgium test, empty) and "Academy 1.1 FR v2" (the video's run), for Bennett to delete.
