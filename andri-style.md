# Andri motion style

The house look and motion rules for every Andri video, in one place. Written 13 Oct 2026 from the approved Academy videos (1.1 is the benchmark, then 1.2), `ACADEMY-LESSONS.md`, `known-issues/README.md` and Bennett's notes. Read with `andri-components.md` before building.

**Order of authority:** Bennett's notes > `ACADEMY-LESSONS.md` and `known-issues/` > the approved videos > this file > `GITHUB-MOTION-REPOS.md`. The borrowed rules polish a video. They never restyle it to look different from the approved ones.

## Look

- Background: cream to gold, never black. Base `#F1EDE3`, slow drifting soft blobs in `#F9EFC2`, `#FFFFFF` and `#F3DD86`.
- Title card: yellow `#F7E17E`, waving mascot (never the lightbulb pose).
- Ink `#231E19` for all text. No grey text; a second headline line uses the same ink, lighter weight.
- Fonts: Neco (titles, captions, end card) and Rethink Sans (the app's own font). Load them from the project's `assets/fonts/`, never a fallback.
- App window 1440 x 860 in the middle of the 1920 x 1080 frame, rounded corners, soft shadow. Shown 1:1 from 2x plates of real staging snapshots, never stretched.
- One accent colour, gold/yellow, and it always means "look here": the caption number, the ring, the highlight sweep, the click ripple.
- No em dashes in on-screen text.
- Banned: glows, particles, gradients on UI, bouncy cartoon easing, emoji, a lone centred title on a gradient as a whole shot, invented UI, invented numbers.

## Motion

- **Calm.** Narration about 120 words a minute. Build the app part about 1.25x slower than feels right while building.
- **Every click shown, nothing implied.** The cursor is how every screen change happens.
- **Screen changes push across** like an app opening a page. Cut where the app itself cuts (panels, viewers). Cross-fade only screens with the same layout.
- **Zoom only to read something small** (a chip, a field, a picker), on a still moment, capped at about 1.2x, then back out to the full window. Never zoom in then straight back out.
- Camera zoom is interpolated in log space (it already is in 8.1 onward: `Math.exp(L(log a, log b, k))`).
- One thing moves at a time. Text never moves while it is meant to be read.
- Nothing hangs dead: a gap between narration lines is fine while something moves; picture still AND voice silent at the same time is a stall.

## Polish rules borrowed from the public repos

From `GITHUB-MOTION-REPOS.md`, checked against our approved videos. Use them when they fit; the approved look wins when they don't.

| What | Rule |
|---|---|
| Reading hold | After text or a result settles: at least 1 s, plus 0.25 s per word past three; 2 s for the last line before the end card. |
| Exits | About half to 75% of the entrance time. Things leave faster than they arrive. |
| Stagger | Words about 0.09 s apart (the title already does this), list items 0.2 s, whole stagger under 0.5 s. |
| Overlap | The next beat starts moving before the last one has fully left. No empty gap. |
| Easing | Never linear on anything that starts or stops. Linear only for typing progress, drift and spinners. |
| Overshoot | Zero on text, windows and camera. A small one (the `E.back` pop) only on small things: the caption pill, the ring, the tick. |
| Cursor | Arrives a beat before it clicks, rests (hover look shows), press dip, ripple. The screen changes about 0.12 s after the click. |
| Narration sync | Actions still happen as the voice names them ("type the at sign" while the @ is typed; ACADEMY-LESSONS wins here). Borrowed on top: a *result* (an answer, a document, a tick) lands in the short pause just before the line that talks about it, not in the middle of another sentence. |
| Safe area | Nothing important within 60 px of the frame edge; rings stay inside the app window. |
| Frame 0 | A real picture (the yellow title card), never black. It is the thumbnail on X, Slack and LinkedIn. |
| Phone test | Shrink the contact sheet to 360 px wide: the caption and the thing the voice names must still read. |

## Checking

- Contact sheet of the whole video, then frames 0.3 s after each beat, a close-up at every click, and frames either side of every transition and disappearance.
- **Judge is not the builder:** when there is time, ask a separate read-only agent to critique the contact sheet, and a fresh agent to say from the frames alone what the video teaches. If it can't, the video isn't clear yet.
- Late notes: fix one thing at a time and keep the rest of the motion and timing exactly as it is.
- Narration: silencedetect the final MP4, then transcribe it (normal and `--raw`) and diff against the script.
