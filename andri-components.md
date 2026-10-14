# Andri motion components

The reusable pieces of an Andri video, with their real values. Taken on 13 Oct 2026 from `projects/2026-10-13-academy-11-1-invite-colleague/app.js`, whose engine comes from 8.1 (after the approved 1.1, 1.2 and 5.1). **Copy the code from the newest approved project rather than rewriting it**; this file is the spec so you know what each piece should look like.

| Piece | Values | Code (11.1 `app.js`) |
|---|---|---|
| Background | `#F1EDE3` base; radial blobs `#F9EFC2` (top left), `#FFFFFF` (top right), `#F3DD86` (bottom), drifting with slow sines (0.09 to 0.12 rad/s, 40 to 60 px) | `background(t)` |
| Title card | `#F7E17E` fill. Tag "ANDRI ACADEMY · x.y" Rethink 600 22 px, `#494746`, 3 px letter spacing, at 122, 392. Line 1 Neco 500 128 px (shrinks to fit 1040 px) at y 530. Line 2 Neco 400 84 px at y 640. Words rise 44 px, 0.09 s apart, 0.5 s each. Waving mascot at 1180, 330, width 640. Pushes up out of frame over 0.8 s. | `title(t)`, `words()` |
| App window | 1440 x 860 plates at 2x, drawn 1:1 | `plate()`, `region()`, `sregion()` |
| Camera | Zoom in log space, eased `E.io`, clamped so the window edge never shows (known-issues #6), cap about 1.2x | `camera()`, `shot()`, `clampCam()` |
| Cursor | macOS arrow, fill `#1d1813`, 1.8 px white outline, soft shadow, about 34 px. Moves on `E.io` between targets. Press: scale 0.86 from 0.07 s before to 0.15 s after the click. Ripple: `#C9A733` 3 px ring, 9 to 35 px radius over 0.45 s, fading. | `cursor()`, `cursorPath()`, `CLICKS` |
| Gold ring | `#E9CD4F`, 3 px, 5 px padding, radius 10, pops in with `E.back` over 0.35 s, clamped inside the window (known-issues #10). Only on a small control the voice is naming. | `ring()` |
| Highlight sweep | `#F8E37C`, `multiply`, sweeps left to right in 0.8 s per line (lines 0.5 s apart), fades out over 0.35 s. For phrases the voice names; never an underline. | `sweep()` |
| Caption pill | White, 62 px tall, fully rounded, 1 px `#DDD1BE` border, shadow `rgba(35,30,25,.10)` blur 8 y 4. Centred at y 1022. Yellow `#F7E17E` number circle (radius 21) on the left, number Rethink 700 19 px. Text Neco 500 26 px `#231E19`. Pops open from the circle with `E.back` over 0.32 s; between steps the width morphs over 0.45 s, the number rolls, old text exits in 0.15 s, new text rises in. One pill per step, appearing as that step's narration starts. | `caption()`, `CAP` |
| Floating menus and dialogs | Captured alone with no CSS shadow; shadow drawn on canvas: white card, `rgba(35,30,25,.14)` blur 24 y 8 (strong: `.20`, 28, 10), on the menu's own outline (known-issues #1, #15). Opens with a fade and 6 px drop over about 0.18 s. | `floatShadow()`, `pop()` |
| Typing | Text revealed letter by letter over the field's own empty plate (never a painted colour), caret `#241E19` 1.4 px blinking at 2.2 Hz | `typeIn()`, `caret()` |
| Window fade before the end card | The whole window drawn on its own canvas and faded as one picture (known-issues #12) | `OFF` canvas |
| End card | Logo and mascot with the tick side by side, divider, line "Andri Academy · Next: <next title>" in Rethink 500 25 px. No video numbers, no clickable Up next card. | `endCard()` |
| Mascot | Frame sequences in `assets/mascot/<pose>/` (`wave`, `done`, `tick`, `disc`). Never the lightbulb pose. | `mascot()` |

## Engine habits

- `renderFrame(t)` is a pure function of time. `CUTS` lists still moments that were cut out; `logical()` / `videoT()` map between video time and app time (for the 1.25x slow-down and inserted beats).
- Easing set `E`: `out` (cubic), `q` (quintic out), `io` (cubic in-out), `qio`, `back` (small overshoot, for pops only).
- Voice, click and chapter times are exported from the page (`window.MIX`) so the mix can never drift from the picture (1.1 NL `app.js`).

## Add to this file

When Bennett approves a new reusable piece (a keycap, a toast, a scroll strip, a React Flow canvas), add a row with its values and the project it lives in.
