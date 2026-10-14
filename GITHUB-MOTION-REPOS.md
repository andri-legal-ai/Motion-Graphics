# 15 GitHub motion repos: what's in them and what we take

Source: post by @RoundtableSpace (0xMarioNawfal), "15 GitHub repos that turn Opus 5.5 into a full motion-design studio", https://x.com/RoundtableSpace/status/2109958757891346459 (saved 13 Oct 2026). The t.co links in the post were resolved to the real repos below, and each repo's README and main rule files were read.

**Short version:** most of these repos use the same method we already use: one HTML page where every frame is worked out from the time, rendered with Playwright and FFmpeg, checked on a contact sheet. Our `motion-graphics` skill follows almost exactly the flow of #6 (`animate`): intake, story check, look check, storyboard, build, review. So nothing here needs installing for the Academy videos. The value is in their **rules and numbers**, collected in section 2.

---

## 1. The 15 repos

Stars and dates as of 13 Oct 2026. "Fit" means how useful it is for Andri work.

| # | Repo | What it really is | Fit |
|---|---|---|---|
| 1 | [AbubakrChan/product-launch-motion](https://github.com/AbubakrChan/product-launch-motion) (208★) | Paste a website URL, get a 60 fps launch film cut to music. "One shape, never cut": a button morphs into a loader, a tick, a slider, a chart. Cursor drives every change. Has a spring code library (`references/technique.md`). | **High for social launch reels.** Too fast for Academy. |
| 2 | [charlie947/motion-graphics-skills](https://github.com/charlie947/motion-graphics-skills) (252★) | 15 skills: brand-intake, launch-video, apple-launch-film, animated-chart, milestone-reveal, reel-export, and more. `brand-intake` writes a `brand.md` + `MOTION.md` every other skill reads first. | **Medium.** `animated-chart` and `reel-export` useful for LinkedIn. The brand file idea is the main takeaway. |
| 3 | [howseen-ai/claude-motion-design](https://github.com/howseen-ai/claude-motion-design) (493★) | One big skill, same HTML + Playwright + FFmpeg stack as ours. Best "what goes wrong" table of the lot, a "remake mode" that copies a reference launch video shot by shot, and a list of tricks borrowed from every other repo. | **High as a reference.** Its rules are in section 2. |
| 4 | [nateherkai/hyperframes-student-kit](https://github.com/nateherkai/hyperframes-student-kit) (1.4k★) | Edits your own camera footage: cuts silences and mistakes, plans hook and payoff, adds captions and 406 ready-made motion "cards". Built on HyperFrames + GSAP. | **Medium.** Useful if Andri ever films people talking (founder videos, webinars cut into Shorts). |
| 5 | [Barty-Bart/motion-graphics](https://github.com/Barty-Bart/motion-graphics) (645★) | 6 single-job skills: B-roll timed to your words, cutting a person out of the background, three explainer styles, sound effects. `explainer-default` is a calm product demo: real UI rebuilt and filmed up close. | **High.** `explainer-default` is the closest public match to our Academy look. |
| 6 | [cth9191/animate](https://github.com/cth9191/animate) (620★) | Canvas animation with 7 drawn styles (cut paper, ink, riso, pixel...). Intake, story check, look check, storyboard. This is the flow our skill uses. Has a `craft.md` of hard-won rules. | **Medium.** We already have its process. Its `craft.md` narration rules are worth having. |
| 7 | [whaleyxbt/claude-motion](https://github.com/whaleyxbt/claude-motion) (380★) | Taste rules **with numbers** (easing curves, spring settings, stagger, reading holds), a self-review loop, and a sound-effect engine that generates clicks, pops and whooshes in code (no licences). Built on Remotion. | **High.** Its numbers are the backbone of section 2. |
| 8 | [haidrrrry/claude-remotion-skill](https://github.com/haidrrrry/claude-remotion-skill) (408★) | 10 rules against "flat AI motion": never linear, entrances move 2 to 3 things at once, stagger, exits faster than entrances, render then check frames. Remotion only. | **Low.** Same rules as #7, less detail. |
| 9 | [motiondivision/motion](https://github.com/motiondivision/motion) (34k★) | Motion (formerly Framer Motion), the animation library for websites in React, Vue and plain JavaScript. | **For the website, not videos.** A question for whoever builds andri.ai. |
| 10 | [199-biotechnologies/motion-dev-animations-skill](https://github.com/199-biotechnologies/motion-dev-animations-skill) (172★) | Teaches Claude to use #9 well: scroll effects, springs, hover. Not updated since March. | **Website only.** |
| 11 | [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) (62k★) | HeyGen's open-source renderer: write HTML, it makes a deterministic MP4. Has a desktop app, Studio preview and a block catalogue. | **Optional.** Does what our `_toolkit/render.mjs` does, with more features. Worth it only if our renderer starts to limit us. |
| 12 | [remotion-dev/remotion](https://github.com/remotion-dev/remotion) (64k★) | Videos written in React. **Needs a paid company licence above a team-size threshold**, so check before Andri uses it. | **Low.** We don't use React for video. |
| 13 | [remotion-dev/skills](https://github.com/remotion-dev/skills) (5.1k★) | Official Remotion skills for Claude Code (create, render, captions, maps). | **Low**, same reason as #12. |
| 14 | [greensock/gsap-skills](https://github.com/greensock/gsap-skills) (16k★) | Official skills for GSAP, the timeline animation library. All GSAP plugins (SplitText, MorphSVG) are now free, including commercial use. | **Website mostly.** Useful if we ever want SVG shape morphs. |
| 15 | [LottieFiles/motion-design-skill](https://github.com/LottieFiles/motion-design-skill) (2.2k★) | No code, just principles: Disney's 12 animation principles rewritten for interfaces, plus timing and easing tables. | **High as a cheat sheet.** Its numbers are in section 2. |

**Which to reach for:**
- Academy and Help videos: keep our skill. Borrow from #5 `explainer-default`, #7 and #15.
- A short, punchy launch reel for LinkedIn or X: #1 is the strongest model (one morphing shape, cursor, beat-synced sound).
- Cutting real footage of a person talking: #4, or #5 `motion-broll`.
- Animating andri.ai itself: #9, #10, #14 (engineering's call, not ours).

---

## 2. Rules and numbers worth stealing

Jargon in one line each: **easing** is how a move speeds up and slows down; a **spring** is easing that behaves like a real spring (can overshoot a touch, then settle); **stagger** is the small delay between items that appear one after another; **LUFS** is a loudness measure (online video aims for about -14).

### Timing (the biggest gap in our work so far)

| Rule | Number | From |
|---|---|---|
| Hold after any text settles, before it moves again | at least 1 s for a short phrase, plus 0.25 s for each word past three, 2 s for the final line | #7 |
| Exits are faster than entrances | exit = about half to 75% of the entrance | #7, #15 |
| Stagger | words 0.09 s apart, list items 0.2 to 0.25 s, total stagger under 0.5 s | #7, #15 |
| Typing on screen | about 25 to 28 characters a second (0.035 s per character), caret blinks about 2.4 times a second | #5, #7 |
| Pause after a result appears so it can be read | 0.5 s | #5 |
| Something new on screen | every 2 to 4 s, or it feels dead | #6 |
| Next scene starts before the last one has fully left | overlap, never a gap (a gap reads as "loading") | #7 |
| Durations by element | button 120 to 180 ms, card 200 to 350 ms, dialog 300 to 400 ms, page change 400 to 600 ms, big reveal 600 to 1200 ms | #15 |
| "Premium" personality | slower (350 / 500 / 800 ms) and **zero overshoot** | #15 |

### Easing and springs

- Never linear on anything that starts or stops. Linear is only for constant drift, rotation and progress bars.
- Entrance curve `cubic-bezier(0.16, 1, 0.3, 1)`, exit `cubic-bezier(0.6, 0, 0.9, 0.35)`, move between two states `cubic-bezier(0.65, 0, 0.35, 1)` (#7).
- Springs with damping 0.72 to 0.9 for UI (a tiny overshoot at most), 1.0 for camera and text (no overshoot) (#1, #3). Calm camera moves: damping 0.95 or more, or a plain ease over 0.6 to 1.2 s (#5).
- A spring that has to *arrive* at a moment must start about 0.3 s earlier (#1).
- Zoom in "log space": going 1x to 2x should feel like 2x to 4x. Linear zoom feels wrong (#1, #3). Never zoom in then straight back out (#3). Relevant to the 5.1 zoom lag we hit.
- Camera rule: put a point of the world on a point of the screen, not "zoom around a point", or the subject slides away under the caption (#6).

### Cursor (we show every click, so this matters)

- A normal macOS arrow on gentle curves, arriving a beat before it clicks (#5).
- Press: a small dip in size (about 16%) and a soft ripple on the clicked control. Hover states change before the click (#1, #5).
- Optional: tilt slightly with speed, faint trail when moving fast (#1). Probably too much for Academy.

### Layout and reading

- One thing at a time: one line of text plus one UI element, never more. Text scene, then UI scene (#5).
- Text never moves while it is meant to be read (#7).
- Keep important things 60 px or more from the frame edge (#7). Matches our "rings cut at the window edge" issue.
- Phone test: shrink the contact sheet to 360 px wide; the key message must still read (#6, #7).
- Frame 0 is a real image, never black or empty: X, Slack and LinkedIn use it as the thumbnail (#3, #7). Our yellow title card already does this.
- Rebuilt UI beats screenshots for sharpness, but use the real labels, colours, fonts and corner radii (#5). This is our staging-DOM method.

### Narration (from #6 `craft.md`)

- The voice is the clock. Each new picture beat starts about 0.3 s after a sentence ends.
- The payoff (the result appearing, the tick) lands in the pause *before* the line that names it, not under speech.
- On-screen captions: at least 0.7 to 1.25 s each, no faster than about 3.5 words a second (#3, #6).

### Sound

- Most code-made videos are silent, and sound is what makes them feel produced (#7).
- Click on each cursor press, soft whoosh on a big move, light tick per completed step, gentle chime on the end card. Continuous drift stays silent. "Accent, don't narrate" (#5, #7).
- Music bed for a calm demo: 100 to 110 BPM, soft piano or plucks, quiet (#5). Duck it under narration.
- Loudness -14 LUFS, true peak under -1 dB (#7). Already in our skill.
- #7 has a free sound engine (`sfx/` folder, plain Python, no samples, no licences). Worth trying if we add UI sounds to Academy videos.

### Checking the work

- Pull a contact sheet frame 0.3 s *after* each beat so motion has settled; scrub transitions every 0.2 s (#7).
- **The judge is not the builder:** have a separate read-only agent critique the contact sheet, and a fresh agent say what the video is about from the frames alone. If it can't, the video fails (#3).
- Score each shot out of 10; fix only shots at 7 or below, don't touch shots at 9 or more (#3). Similar to our critique loop.
- Scan the final MP4 for one-frame flashes (a frame different from both neighbours) (#3).
- "Fix one thing only" prompt for late notes: name the one problem, keep the motion and timing exactly as they are, say what changed (#2).

### Render quality (things our `_toolkit/render.mjs` doesn't do yet)

- **Motion blur:** render 4 slightly offset sub-frames per frame and blend them with FFmpeg `tmix`. Makes fast moves look filmed. Never blur across a hard cut. Only blur fast moves; blurred text that should be read looks bad (#1, #3, #5).
- **2x supersampling** (`deviceScaleFactor: 2`, then scale down) for razor-sharp text. Cheaper than motion blur on mostly still screens (#3).
- **Parallel workers:** split the frames across 4 to 8 browser pages. A 60 s final at 60 fps with blur can take 20 to 60 min on a laptop otherwise (#5).
- **Embed fonts** as base64 so a render never silently falls back to another font (#5).
- Deterministic Chromium flags for pixel-identical reruns: `--deterministic-mode --run-all-compositor-stages-before-draw --disable-threaded-animation --font-render-hinting=none --force-color-profile=srgb` (#3).

### Look bans everyone agrees on

Bouncy easing, glows, particle bursts, gradients on UI, emoji, purple-to-blue backgrounds, typewriter text as a gimmick, a lone centred title on a gradient as a whole shot, everything fading in at once, more than one accent colour, invented numbers or testimonials. Our Andri rules already cover most of these.

---

## 3. Not for us (and why)

- **Music-first, cut on every beat** (#1, #3): great for 20 s launch reels, wrong for calm narrated teaching.
- **Remotion** (#7, #8, #12, #13): React-based and needs a company licence above a size threshold. Our canvas route does the same without it.
- **Exaggeration and overshoot over 10%** (#15 "playful"): the premium/Apple look we want uses zero.
- **AI-generated people's faces** in fake UIs (#3): don't use them in anything Andri publishes.
- **Remake mode** (#3), copying a competitor's launch video shot by shot: fine for study, never for publishing.

---

## 4. What was done with this (13 Oct 2026)

Bennett: implement it, but don't change the videos much; keep it as notes for when videos are made.

1. **Rules noted, not imposed.** The polish rules from section 2 are in `andri-style.md`, with the approved videos and `ACADEMY-LESSONS.md` taking priority. The skill points to it with "polish, don't restyle".
2. **Renderer:** `_toolkit/render.mjs` got two opt-in options. Without them it renders exactly as before (checked: same pixel hash on an 11.1 slice). `--workers 4` splits the render across browser pages (about 1.5x faster on a 10 s test, picture the same to the eye, PSNR 55 dB). `--blur n` adds motion blur, but on 11.1 it made the fast cursor show as 4 copies (n=4) or a faint smear (n=16), so it stays off for Academy and Help videos. 2x supersampling was dropped: our plates are already captured at 2x and 3x.
3. **`andri-style.md` and `andri-components.md` written** from the approved videos, the lessons and the 11.1 code.
4. **Sound effects:** not added. Academy stays narration only unless Bennett asks for a test.
