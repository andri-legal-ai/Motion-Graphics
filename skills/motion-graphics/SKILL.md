---
name: motion-graphics
description: Use EVERY time Bennett asks for a motion graphic, animation, animated explainer, launch reel, Academy/Learn video, animated logo or any rendered video made from code. Enforces the workflow - intake questions, story check, look check, storyboard approval, then build in JavaScript on canvas, render with Playwright + FFmpeg, and review an FFmpeg contact sheet before calling it done. Projects live in ~/Desktop/Andri/Motion Graphics/projects/.
---

# Motion graphics

Every motion graphic goes through the same six steps. Never skip one, and never start animating before steps 0 to 3 are approved. Each approval step is cheap on purpose: fixing a beat table or a still frame takes minutes, fixing a finished render takes hours.

Home folder: `~/Desktop/Andri/Motion Graphics/`
- `_toolkit/render.mjs` renders a project with Playwright and pipes frames into FFmpeg
- `_toolkit/contact-sheet.sh` pulls a contact sheet from a render
- `_toolkit/template/index.html` is the starter canvas page
- `projects/<yyyy-mm-dd>-<short-name>/` is where each new piece goes

## The steps

| step | what Bennett sees | Bennett decides |
|---|---|---|
| 0. Intake | the questions below | answers, a style, or references |
| 1. Story check | the format picked and a numbered beat table, facts web-checked | approve or change beats |
| 2. Look check | 2 to 4 full-size style frames (for a new look: side by side with his references) | thumbs up per frame |
| 3. Storyboard | every beat as a key frame, with sound and the transition into the next | thumbs up/down by panel number |
| 4. Build | animate the approved panels, render, review | nothing |
| 5. Delivery | the video plus measured checks (below) | notes, which become a revision run |

### 0. Intake - ask before starting

Ask with AskUserQuestion, only what the request has not already answered. **Academy videos: don't ask at all** (Bennett, 12 Oct 2026); answer the questions yourself from staging, the brief and earlier projects, and list your calls at delivery. Skip anything obvious from context and say what you assumed.
- Subject and the one thing the viewer should take away
- Length and format(s): 16:9, 9:16, 1:1 (can be several)
- Voice: narrated (who records it, or ElevenLabs: https://elevenlabs.io/app/speech-synthesis/text-to-speech, Bennett's account; for Academy videos follow "How to make the narration in ElevenLabs" in ANDRI-ACADEMY-PROJECT.md), captions only, or no words
- The look: Andri brand (default), a style he names, or references (screenshots, links, a folder)
- Hero: the one object, character or screen that anchors every beat
- Music or sound: his track (cut to its beat), none, or placeholder
- Product: if Andri UI appears, which screens and flows

### 1. Story check
Pick a format (explainer, launch reel, how-to walkthrough, logo sting, etc.) and say why. Write a numbered beat table: `# | time | what's on screen | words/VO | sound`. Web-check any facts or numbers. Wait for approval.

### 2. Look check
Build 2 to 4 still style frames in canvas at full size (render single frames with `render.mjs --from t --to t+0.04`, or a screenshot), show them, wait for a thumbs up on each. If he gave references, put each frame side by side with its reference.

### 3. Storyboard
Render one key frame per beat and stitch them into one storyboard image (ffmpeg `tile`), with a caption per panel: beat number, sound, and the transition into the next beat. Save as `storyboard.png` in the project and show it. Wait for thumbs up/down by panel number; redo the panels he rejects.

### 4. Build
- Copy `_toolkit/template/` into the project folder. All animation is **JavaScript drawing on a `<canvas>`**, no CSS animation, no DOM elements, no video editors.
- `renderFrame(t)` must be a pure function of time `t`: no timers, no accumulated state, no randomness without a fixed seed. That way any frame renders identically in any order.
- Set `window.MG = { width, height, fps, duration, renderFrame }`.
- Render with Playwright + FFmpeg only:
  `node "$HOME/Desktop/Andri/Motion Graphics/_toolkit/render.mjs" <project> --out v1.mp4 [--audio track.mp3]`
- Use `--from/--to` to re-render just one beat while fixing it.
- Number versions (v1, v2...) and never overwrite an approved render.

### 5. Review, then delivery
Before calling anything done:
1. Pull a contact sheet: `"$HOME/Desktop/Andri/Motion Graphics/_toolkit/contact-sheet.sh" <project>/renders/vN.mp4 [rate] [cols]` (use rate 4 or more for fast sections).
2. **Read the contact sheet image and look at it properly.** Check: text cut off or overlapping, contrast, things off-frame, cropped edges, jumps between frames, beats that hold too long or too short, anything that does not match the storyboard.
3. Fix what is wrong, re-render, pull a new sheet. Repeat until the sheet is clean. Check at least twice.
4. Re-listen (every narrated video, Bennett 12 Oct 2026): transcribe the final MP4 and diff it with the script, normal and `--raw`: `~/.local/share/academy-stt/.venv/bin/python "$HOME/Desktop/Andri/Motion Graphics/_toolkit/transcribe.py" <final.mp4> <script.txt> [--raw] [--lang de|nl]`. Every line said, on the screen it describes, nothing claimed that the app doesn't show; report doubtful words with their time.
5. Measure and report: cuts land on the beat grid (if music), story arc matches the approved beats, loudness around -14 LUFS if there is audio (`ffmpeg -i v.mp4 -af loudnorm=print_format=summary -f null -`), hero stays anchored, the hook lands in the first 2 seconds, narration pace leaves room (about 150 words a minute or slower).
6. Deliver: path to the mp4, the final contact sheet shown, the checks, and anything you could not verify.

## House rules (from the "90% is the harness" video, transcript in the home folder)

**References become a style guide.** When Bennett gives a reference video: download it, pull a frame every 0.5s, and write `style-guide.md` in the project: palette, type, shot lengths, transition types, camera moves, texture/grain, how text enters and exits. Take the reference's grammar, never its content, logos or characters.

**Brand memory lives in markdown.** Keep `~/Desktop/Andri/Motion Graphics/andri-style.md` (look, motion grammar, tone) and `andri-components.md` (a spec list of reusable pieces: buttons, cursor, loaders, check marks, cards, chat bubbles, with sizes, radius, colours, easing). Read both before every Andri piece, add to them when a new piece gets approved.

**Use real assets.** Real product screenshots, the real logo, real fonts. Never invent UI.

**Look bans.** No generic AI look: no lone centred text on a gradient as a whole shot, no stock glow or lens flare, no random particles, no motion without a reason. Every shot has one focal point and every move is motivated (a cursor, a state change, a beat).

**Sound in sync (when there is sound).** Music, sound effects and picture share one timeline. Measure the track into `beats.json` (BPM, beats, downbeats, hits) and time cuts and key moves to it. UI sounds where things happen: a click on each cursor press, a soft whoosh on a morph, a thump on the logo. Synthesised or licensed sounds only.

**Critique loop.** After each render, before showing Bennett, score the contact sheet 1 to 10 on: story clarity, hierarchy/readability, motion quality, brand fit, polish, sound sync (if any). Fix anything under 8, re-render, score again. Show the scores in delivery.

## Andri-specific rules
- Andri look by default: cream to gold gradient, no black backgrounds, rounded corners, soft shadows, calm pacing, zoom only when needed. Brand files: `~/Desktop/Andri/8 - Brand & Design/andri brand guidelines/`.
- If the video shows the Andri app, check every screen against the real app on staging three times: before the story check (go through the flow, capture every screen), **during production** (before animating each beat, open that screen in staging again and re-check labels, layout, order and timing, so you know exactly what you are animating), and before delivery (compare the contact sheet with the live app). The production re-check is required (Bennett, 8 Oct 2026).
- No em dashes in any on-screen text.
- Before any Academy video, read `~/Desktop/Andri/Motion Graphics/ANDRI-ACADEMY-PROJECT.md` (60 videos: 20 × English UK, German, Dutch; voices; the accuracy rule: check every screen in staging in Chrome first, invent nothing) and `~/Desktop/Andri/Motion Graphics/REFERENCES.md` (liked references, what worked in 1.1) and match the approved example in `~/Desktop/Andri Videos/Andri Academy/English/`.
- **Every finished Academy video is saved into `~/Desktop/Andri Videos/Andri Academy/English/`** (German and Dutch later get their own "Andri Videos/Andri Academy/German" / "(Dutch)" folders), named by number only (`1.1.mp4`, `2.1.mp4`), with chapters built in. That folder holds only the MP4s: the matching `<number> timestamps.txt` and the README table (add your row) are in `~/Desktop/Andri Videos/Andri Academy/English/Timestamps/`. A video is not delivered until it is in that folder.
- Never infer or skip (Bennett's main rule): the viewer only knows what the video shows or says. If a request names a client, document or fact, first show where Andri gets it (e.g. the case file in the Knowledge Base) and say it in the narration.
- Never leave anything to assumption: if something appears that the viewer didn't see set up (a file in the @ list, a template, a memory), name where it came from in one narration line ("Once your template is in the Knowledge Base..."). Don't re-show what an earlier video teaches; mention it.
- Script check before generating narration: read the opening out loud and avoid repeating the same key word (1.1 overused "matter").

## Andri style notes and borrowed polish rules (13 Oct 2026)
- Before building, read `~/Desktop/Andri/Motion Graphics/andri-style.md` (look, motion, the polish table) and `andri-components.md` (caption pill, cursor, ring, sweep, title and end card with their real values and where the code lives). Copy components from the newest approved project instead of rewriting them.
- `GITHUB-MOTION-REPOS.md` is the background: 15 public motion repos and what they teach. Use it for ideas, especially for social or launch reels.
- **Polish, don't restyle** (Bennett): new videos must still look and pace like the approved ones (1.1 first). Apply the borrowed rules (reading holds, faster exits, results landing in a narration pause, cursor arriving before the click, safe area, phone test) only where they don't change the approved look. When a rule conflicts with `ACADEMY-LESSONS.md` or Bennett's notes, those win.
- Renderer options (off by default, old projects render exactly as before): `--workers 4` for faster renders (about 1.5x on a 10 s test). `--blur` (motion blur) stays off for Academy and Help videos: on 11.1 it turned the fast cursor into copies or a faint smear.

## Known issues (read before every build)
- `~/Desktop/Andri/Motion Graphics/known-issues/README.md`: square corners under popups (capture floating UI alone on transparent, draw its shadow on the canvas), the lightbulb mascot arm, rings only on what the voice names, clipped buttons at block edges. Check the contact sheet for each of these.
