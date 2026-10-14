# Known issues, and how to avoid them

Bennett has caught these in renders. Check for every one before calling a video done.

## 1. Square, darker corners under a rounded popup

![bad](<square-corners-under-popup (bad).png>)
![fixed](<square-corners-under-popup (fixed).png>)

**What you see:** a dialog, popup, card or toast has rounded corners, but a square darker (or lighter) patch shows behind each corner, or a faint straight line runs along its edge.

**Why:** the popup was screenshotted in place from the rebuilt Andri page. A screenshot is always a rectangle, so its corners keep whatever sat behind the popup (the dim overlay, the page) and its CSS shadow gets cut off at the box edge. Drawn on the canvas, those corners no longer match.

**How to avoid it (every floating piece of UI):**
- Capture it **alone**: hide everything else on the page, make the popup's parents' backgrounds transparent, and turn its CSS `box-shadow` off. Its corners must come out fully transparent. Check: the four corner pixels of the PNG have alpha 0.
- Draw the shadow **on the canvas** instead (a rounded rectangle with `shadowBlur`, drawn just under the sprite).
- In the 2.2 project this is the `FLOAT` list in `plates/capture.mjs` and `floatShadow()` in `app.js`. Copy both into new projects.
- Zoom shots on a popup: crop to the popup's own edges with its own corner radius, never to a box with a slice of the window around it.

## 2. Lightbulb mascot arm

The lightbulb pose (`andri-idea-lightbulb.svg`) has the left arm traced as one shape with a sun ray, so it looks like an arrow at the shoulder. Use the waving pose on title cards.

## 3. Highlight rings nobody explains

A gold ring only goes on something the voice is naming at that moment, and only on a small control or label (a button, a tag, a status). Never on empty space or a whole panel.

## 4. Cut-off UI at the edge of a captured block

A row of buttons under a message (for example "Edit In Drafts") can get clipped at the bottom of its captured block. Check the edges of every revealed block in the stills.

## 5. Small parts cut off at the edge of a captured item

**What you see:** a round button or icon is cut flat on one side. In 3.1 it was the expand button on the memory step rows and the bookmark and ✕ circles above each user message.

**Why:** an item's capture box was taken from the element's own outline (`getBoundingClientRect`), but some of its children stick out past that outline.

**How to avoid it:** measure each item as the union of its own rect and all its children's rects, plus 2px (see the item rects in the 3.1 `plates/capture.mjs`). Check the edges of every item in a zoomed still.

## 6. Dark strip at the edge of a zoom

**What you see:** a thin darker band along one side of a zoomed shot.

**Why:** the zoom box reached past the 1440 x 860 app window, so it showed what sits outside the window.

**How to avoid it:** keep every zoom box inside the window (x + width ≤ 1440, y + height ≤ 860).

## 7. Text showing through from the layer underneath

**What you see:** two texts on top of each other in a field, for example "9 October 2026" with "Select date" showing through it (4.2).

**Why:** a filled-in state (a sprite) is drawn over the empty state, and the field has no background of its own, so the empty state's placeholder shows through.

**How to avoid it:** give every field, box and card in the rebuild its real opaque background (`background:#fff`), even where staging's looks transparent. In stills, check every field that changes state.

## 8. Doubled screen during a cross-fade

**What you see:** the same heading twice, at two sizes or places, for a few frames (4.2: "Good afternoon" while the Timeline panel closed).

**Why:** two full-screen plates with different layouts were cross-faded.

**How to avoid it:** cut instantly wherever the app switches instantly (panels, viewers). Cross-fade only plates with the same layout.

## 9. A blank frame when content leaves

**What you see:** a near-empty chat for a moment after a card or picker disappears.

**Why:** the content below moved up, but the scroll eased to its new position afterwards.

**How to avoid it:** change the scroll in the same frame the content leaves (a keyframe of about 0.02 s), and pull stills a few frames either side of every disappearance.

## 10. A highlight ring cut off at the window edge

**What you see:** the gold ring around a control is missing its top (or side) edge. In 8.1 v3 it was the ring on "Assignments" in the top bar: the tab's box starts at the very top of the window, so the ring's top line fell outside the window and was clipped (Bennett, 12 Oct 2026).

**Why:** the ring is drawn a few pixels outside the element's box. If the box touches the window edge, part of the ring lands outside the app window and is cut away.

**How to avoid it:** ring the label, not the full-height tab (for the top bar, a box around the text only), and keep the ring inside the window: clamp the ring rectangle to the window minus 3 px (`ring()` in the 8.1 `app.js` does this). In stills, check every ring near the top bar and the window edges.

## 11. A button from a hidden dialog still showing

**What you see:** a lone button (9.2: the yellow "Next") floating on the dimmed page, under or beside a different dialog.

**Why:** the "page under the scrim" plate hid the dialog with `visibility: hidden`, but the button sets its own `visibility`, so it stayed visible.

**How to avoid it:** hide with `opacity: 0` (or `display: none` when the layout doesn't matter). In stills, check the dimmed page around every dialog.

## 12. Layers showing through the window fade

**What you see:** during the fade before the end card, the page under a panel or dialog shows through it for a moment.

**Why:** the window was faded by giving each stacked plate (page, scrim, dialog, panel) the same `globalAlpha`, so the lower ones show through the upper ones.

**How to avoid it:** draw the whole window on its own canvas and fade that one picture (`OFF` in the 9.2 `app.js`). Check frames in the last second before the end card.

## 13. Soft, blurry app screens

**What you see:** text in the app window looks fuzzy, especially in zooms (6.1, first two deliveries).

**Why:** the screens were 1x JPEG screenshots, about 1500 px wide, stretched to fill a 1920 frame and zoomed up to 1.6x on top.

**How to avoid it:** capture at retina 2x with lossless tiles (4 `zoom` captures of the viewport quarters, stitched; see the 6.1 `hd/stitch.sh`). Show plates 1:1 (camera scale 1.0) and cap zooms at about 1.2x. Park the mouse in a corner before every capture.

## 14. Clicks that land on nothing

**What you see:** the cursor's click ring lands beside a button, on empty space, or on a control that isn't on screen (6.1: Allow, "Ask Andri…", a deselect click, a Done click).

**Why:** click targets were measured on an earlier capture, or the click belonged to a step the plates never show.

**How to avoid it:** re-measure every target on the final plates. Drop clicks that don't change anything the viewer can see. Check a 360x200 close-up around the cursor at every click (6.1 `check/clicks.mjs`).

## 15. A double line along the top of a menu

**What you see:** a thin light line just outside a menu's top border, so the edge looks doubled (11.1, the Role menu; Bennett, 13 Oct 2026).

**Why:** the menu sprite is cut to the union of its parts, which can sit a few px outside the menu's own border (the Radix popper wrapper adds a gap). `floatShadow()` draws its white shadow card 2 px inside the sprite box, so the card pokes out above the real border.

**How to avoid it:** measure the menu's own outline (`[role=listbox]` / `[role=menu]`, plus its border radius) and draw the shadow card on that (`lb` / `lbR` in the 11.1 `plates/capture.mjs` and `floatShadow()` in its `app.js`). Check a 6x close-up of every menu's top edge.

## 16. A ring much wider than the words it names

**What you see:** the gold ring around a title runs far past the text into empty space (10.3 v4, "Blank Workflow"; Bennett, 13 Oct 2026: "this highlight is too big and looks off").

**Why:** the ring was drawn on the text element's box. Titles in staging are often block elements that stretch to fill their row, so the box is several times wider than the words.

**How to avoid it:** ring the words, not the element: measure the text with a Range over its text node (`range.getBoundingClientRect()`), or give the ring an explicit width as the other titles in the 10.3 `app.js` do. In stills, compare every ring's width with its words.

## 17. A ring left behind when the content scrolls

**What you see:** a faint gold box around the wrong text, or around nothing, while a list or panel scrolls (10.3 v3; Bennett: "this weird box that appears when you scroll").

**Why:** a ring was still fading out when the scroll started. The content moved, but the ring stayed where it was drawn.

**How to avoid it:** end rings before a scroll, or move them by the same offset as the content and clip them to the scroll box (`dy` in the 10.3 `drawApp`). Pull stills a few frames into every scroll.
