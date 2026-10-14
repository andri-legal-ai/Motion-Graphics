# Kinetic text style (from the BaseNet NL video, 13 Oct 2026)

Bennett loved this text style. **Use it for every motion graphic except the Academy videos** (the Academy keeps its own calm
title card and caption pill). Source project: `projects/2026-10-12-basenet-nl/` (v8). Reference it came from:
https://prompt-motion.com/twoclipping-6dd14e (`reference-notes.md`).

Code: `kinetic-text.js` (copied from that project's `app.js`; needs `ctx`, `P`, `E`, `cl`, `L`, `rr`, `font` from the same engine).

## The pieces

| Piece | What it looks like | Code |
|---|---|---|
| Big headline | Rethink Sans 700, letter-spacing -3.5 %, ink `#231E19`, centred, 1–2 lines, 84–132 px | `KF()`, `layout()` |
| Word in | each word rises about half its size from below while it fades in and goes from blurred (9 px) to sharp; quintic ease out, about 0.55 s; timed to the word in the voice | `kword()` |
| Word out | rises upward while it blurs and fades; cubic ease in, 0.35–0.38 s, words 0.03 s apart | `kword()`, `kcard({ outAt })` |
| **Never a mask** | letters are always whole; no clipping box (Bennett: cut-off letters ruin it) | |
| Accent word | Andri yellow `#F7E17E` block (radius 12) sweeps in left to right behind one key word, 0.45 s | `accentRect()`, `highlight()` |
| Accent out | the block leaves *with* its word: wipes away from the left, rises and fades with the text (never lingers) | `kcard()` |
| Block → window | the other words leave first, then the yellow block grows into the app window (same radius and shadow as the window, so no flicker at the hand-off) | `morphBlock()` |
| Small subline | Rethink 500, 34 px, `#6B655E`, fades in under the headline | `kcard({ sub })` |
| Kicker | small caps label above, Rethink 600, 26–30 px, letter-spacing 4 px, `#6B655E` (e.g. "NU HET BELANGRIJKSTE", "LIVE WEBINAR") | `moment2()`, `outro()` |
| **Checklist** (bullets) | headline with accent on top, then lines that rise in one by one as the voice names them, each with a yellow circle and ink tick that pops in (`E.back`); Rethink 600 44 px | `moment3()` |
| Logo lockup | Andri icon pops, wordmark wipes in out of a blur, then "×" and the partner mark pop; everything fades out together at the end | `logoLockup()`, `outro()` |

## Rules
- 2–4 text moments per video, not more; the rest stays product / app.
- Background stays the Andri cream-to-gold; no black, no particles, no glows.
- Text leaves fully before the next thing comes in (no overlap of two cards).
- Anything that fades must respect the parent alpha (the end-card fade bug in v4).
