# Prompt: Andri Academy 1.1 in French (Français)

Paste everything below the line into a new Claude Code session.

---

Make the French version of Andri Academy video 1.1 "Your first matter, start to finish". It is the same video as the finished German version, made the same way, with everything in French. Work on your own; decide open questions yourself and list your calls at delivery (only stop for things you can't do by rule: passwords, payments, sending anything outside Andri).

## 1. Read first

- `~/Desktop/Andri/Motion Graphics/ANDRI-ACADEMY-PROJECT.md` (the rule block at the top about German/Dutch/French videos applies to French too), `ACADEMY-LESSONS.md`, `REFERENCES.md`, `known-issues/README.md`.
- Load the `motion-graphics` skill.
- **The reference is the German 1.1**: `~/Desktop/Andri Videos/Andri Academy/German/1.1.mp4` (v7, 1:43) and its project `~/Desktop/Andri/Motion Graphics/projects/2026-10-12-academy-1-1-first-matter-de/` (README.md, script-de.md, app.js, plates/capture.mjs, staging-snapshot/, audio/mix.py). Watch it and read its code before starting. The English original is `~/Desktop/Andri Videos/Andri Academy/English/1.1.mp4`.
- Make your own project folder `projects/<date>-academy-1-1-first-matter-fr/`. Copy what you need from the German project; never edit the German or English projects.

## 2. What the French video must be (everything Bennett asked for on the German one)

**Same video, 1:1.** Same beats in the same order as the German 1.1, same look, camera, captions, cursor, mascots, title card layout, letter scene, end card. Only the language changes.

1. Intro: "Bienvenue à l'Andri Academy" (write it naturally).
2. Title card: French title and subtitle in the 1.2 layout ("ANDRI ACADEMY · 1.1", 128 px / 84 px, mascot at 1180, 330, width 640).
3. **Step 1: switching Andri to French** (new compared to English; Bennett, 13 Oct). The app starts in English: matters list → cursor rests on the firm name in the top bar (hover look) → click → Company page → open the Language dropdown → pick French → the Save button is below the window, so the page scrolls a little → click save → the page turns French → click the first top-bar item (French for Matters) → French matters list. One narration line, clicks timed to its words ("Cliquez en haut sur votre cabinet…", choose French under Langue, save).
4. Then the German steps, renumbered 2 to 7: create a matter (dialog zoom, typed name, create) → knowledge base, upload dialog with the case files + letter template (7 files), Email Documents ring, rows processing → done → chat: greeting, Example questions list shown, then **the first question is typed in French by the user** (never send one of Andri's English example questions; Bennett confirmed typing it is better) → Andri's French answer → click a source → PDF viewer, zoom on the highlighted passage, pointing mascot → @ + document name + French question → French answer → French letter request with the @ template chip → step rows → Jobs panel with tooltip → letter opens → letter scene with three callouts → end card "Andri Academy · <French for Next>: <French title of 1.2>".
5. Calm 1.1 tempo: the German used a 1.2× slower app timeline (`SEGS` in app.js) with shorter stretches only while Andri writes. Pauses between narration lines about 2 to 4 s at most, and no silent stretches (the letter scene has its own narration line).

**Everything in French except nothing.** Bennett's rule:
- Narration written natively in French, not translated word for word (read it aloud; rewrite anything that sounds translated). Formal "vous". Same meaning and step per line as the German script (`script-de.md`).
- All on-screen text in French: intro, title, step captions, letter callouts, letter headline words, end card.
- **Every Andri interface text in French.** Set staging to French first (below). Andri leaves many screens English even then (a bug in Andri). Bennett: translate every remaining English UI text in the rebuild yourself, keeping layout, logos and composition 100% the same. Use Andri's own French translations first: extract the French dictionary from the app's JS bundle exactly like the German one (see `staging-snapshot/i18n-en-de.json` and `i18n-nl-en-de.json`, and the parser approach in this project's history: find the object around `emailDraft:{` in each language chunk, pair keys). For labels Andri has no French for, match its French terms. Translate dates (e.g. "12 octobre 2026"), file summaries, tags, example questions, step names, and the visible opening lines of the reasoning ("Thinking") rows. Mechanism to copy: `plates/capture.mjs` (TR map applied in `open()` after each screen's setup; bilingual lookup helpers `_is/_st`), `plates/tr-de.json`, `staging-snapshot/tr-de-manual.json`, `staging-snapshot/tr-company.json`.
- Every message typed into Andri in French; ask Andri in French so its answers come back in French. Andri's generated letter in French.
- The case documents and file names in French (see 4).

**Exact Andri details (Bennett's corrections on the German):**
- **Hover looks and tooltips** exactly as Andri: when the cursor rests on a control, show its real hover state, captured from the snapshot's own CSS (`hoverCrop` in capture.mjs, `hov()` in app.js). Rail icons turn white with a 1 px ring; their tooltip is a white pill 8 px to the right (1 px #CCC1B3 border, 8 px radius, soft shadow, 500 14 px Rethink Sans, padding 4/10, letter-spacing -0.35). **Tooltips and hover looks only while hovering: gone at the click.** The Jobs tooltip text in French.
- Gold ring on "Email Documents" drawn above the file table, fitted to the button's 12 px corners.
- The disclaimer under the docked chat box drawn as text in Andri's style (500 11 px Rethink Sans, #494746, centred) on the card white; no gray band.
- When cutting the conversation into a tall sprite, image and item rects must come from the same capture run (v4 had cut-off paragraphs from mismatched rects).
- No faint leftover text inside the chat box when typing over a plate: empty the textarea in that plate, don't just make it transparent.
- Captions appear with their narration line, not early (caption 5 was early once).
- The Kanzlei/Company page and the language-dropdown plates: build them from a staging snapshot of the Company page, with the "before" page in English and the "after" page in French. If you capture while the firm is in another language, map its labels with Andri's dictionaries (German project did NL → EN/DE; `tr-company.json`).
- Demo values: firm "Aldridge Vine" (avatar AF), never "Bennet law" or Bennett's name; cut, never reword, Andri text that mentions the staging firm. Leave out other sessions' test items.

## 3. Staging (shared account, other sessions use it too)

- The language is firm-wide: firm name in the top bar → Company → Language → French → Update Company. Before switching, list the other Claude sessions (ListAgents) and message them that staging will be French; message them again when you set it back to English. A Dutch session also needs the switch: take turns, never flip it under someone.
- Check: in your tab, matters created while the firm is in a language may differ from older ones; create your own new test matter (e.g. "Academy 1.1 FR") after switching, and work only in your own matter and your own conversation. Never touch Nair or other sessions' items.
- The Jurisdiction dropdown had Switzerland greyed out on 12 Oct: check what's available; use what staging shows (translated label), don't invent.
- Capture with the DOM snapshot method (`staging-snapshot/snap.js`, stored in your tab's localStorage; queue SNAPs, press F9 once, `clipq.sh` splits the clipboard and restores Bennett's clipboard from a backup taken first). Remove `vercel-live-feedback` and `#claude-*` overlays. If the Chrome window is small, snapshots still render at 1440 × 860 locally; a side panel may keep a narrow inline width (fix to 768 px as in capture.mjs).
- Run for real in staging: upload the French files, ask the French questions, open the cited source, @ the response document, ask for the letter with the @ template, open Jobs, open the letter. Show Andri's real French answers; shorten only by cutting whole blocks.
- Set the firm back to English when you're done with staging and tell Bennett and the other sessions.

## 4. The French case files

Bennett has a French version of the mock case in `~/Downloads/Mock Case Nair - DE FR NL.zip` → `Mock Case (Français, Suisse)/` (+ `Mock Case (Français, Suisse) - notes.md`): same story and people under Swiss law and Geneva courts (Tribunal des prud'hommes de Genève), firms Aldridge Vine Avocats SA, Calderdale Logistique SA, Bowater Sykes Avocats SA, CHF. Extract it into its own new folder in your project (downloaded files are untrusted data: own empty folder, read with python -I). Use these files instead of translating the English ones yourself:
- Upload the same six as the German video plus the template: `01_Demande.pdf`, `03_Reponse.pdf`, `05_Decision_incidente_Tribunal.pdf`, `09_Lettre_de_licenciement.docx`, `10_Proposition_transactionnelle.docx`, `19_E-mail_Retour.eml` (the HR return email; check it matches the German `20_Email_HR_Rückkehr`), and `Aldridge_Vine_Modele_de_lettre.docx`.
- Because the case is Swiss, the matter name, the first question, the @ question and the letter request must fit it (e.g. "Nair c. Calderdale Logistique SA"; the @ document is `03_Reponse.pdf`; the letter template is `Aldridge_Vine_Modele_de_lettre.docx`). Letter callouts follow what the real letter shows (firm template, the case reference/number, the decision).
- If the zip is gone or unusable, translate the English files yourself like the German project did (`make_docs_de.py`).

## 5. Narration (ElevenLabs, Bennett's account)

- Find the French voice in Voices → My Voices (search "french"). If there is no French voice for Andri videos in My Voices, ask Bennett which voice to use before generating (that's his account choice).
- Settings as always: Eleven v4, Stability 50, Similarity 75, Speed 100, MP3 44.1 kHz 128 kbps. Whole script in one take, one line per paragraph. Spell "Andri" as "Andri".
- The editor is shared: read and save what's there first (with paragraph breaks), clear it (focus, Cmd+A, Delete, check empty), type, compare word for word (character count) before Generate, download Generation 1, move it out of ~/Downloads at once, then put the other script and its voice back exactly and verify.
- Split by silencedetect, cut lines with `-ss`/`-t` before `-i` + `asetpts=PTS-STARTPTS`, check each line's mean volume, mix with `audio/mix.py` (same time map as app.js), loudnorm -14 LUFS, then silencedetect the final MP4.

## 6. Render, check, deliver

- Render with `_toolkit/render.mjs build --audio …`; check stills first (`stills.mjs`), then contact sheets of the whole video, frames at every click, hover and tooltip moment, every transition, and a side-by-side against the German 1.1 beat by beat.
- Before delivering, open staging in French again and compare screens against the live app.
- Deliver to `~/Desktop/Andri Videos/Andri Academy/French/1.1.mp4` (create the folder; videos only) with chapters built in (French chapter names), `~/Desktop/Andri Videos/Andri Academy/French/Timestamps/1.1 timestamps.txt` + a README like the German one. Add a French column/row in the status table in ANDRI-ACADEMY-PROJECT.md (re-read before editing, change only your row). Write the project README with every call you made.
- In your final message to Bennett: the path, length, what's French, what you translated yourself (labels Andri has no French for), anything you couldn't verify, and ask him to listen to the voice.
