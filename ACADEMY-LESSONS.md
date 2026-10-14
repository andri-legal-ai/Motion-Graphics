# Andri Academy: lessons from Bennett's feedback

Things Bennett corrected while 2.1 ("The whole letter, in one request") went from v1 to v8 on 8 Oct 2026, plus the rules for planning videos. Read this with `ANDRI-ACADEMY-PROJECT.md` before every video. Each point is something that went wrong once; don't repeat it.

## The benchmark

- **1.1 is the benchmark** ("basically perfect", Bennett). When in doubt about look, motion, captions, cursor, transitions or pacing, match 1.1 first and 1.2 second.

## Rule one: never infer, never skip (Bennett's main feedback, 8 Oct 2026)

These are teaching videos. The viewer only knows what the video shows or says. Before anything appears that depends on earlier work, the video must **show it or say it**:
- **Names and facts in a request.** If the request names a client (Priya Nair), a judgment or a schedule of loss, first show where Andri gets them. In 2.1 that's the matter's Knowledge Base: the case file in the "employment" folder (scroll to the judgment and the schedule of loss) and the firm's letter template. The narration says it plainly: "Everything for this matter is already in its Knowledge Base... Andri reads them all. So Andri already knows the client and the case."
- **Anything in a list or picker** (the template in the @ list, a specialist, a memory) must already have been seen, or be named in one line.
- **Showing beats explaining.** A short, accurate look at the real screen (a few seconds, real file names from staging) is better than a sentence alone. Don't re-teach the how (uploading is 1.1); just show that it's there.
- **Check every typed request and every narration line:** "Would a new user know where this comes from?" If not, add the beat before it.

## Accuracy: check, never assume

- **Go back into staging while producing**, not only before the storyboard. Before animating each beat, open that exact screen again and compare: labels, icons, layout, order, what appears when. Click through it yourself so you know how it moves.
- **Measure the real UI, don't eyeball it.** Read the live styles in Chrome (corner radius, border, background, shadow, header alignment, widths relative to the chat box). In 2.1 the @ list had square corners, a centred header and the wrong width until it was rebuilt from the measured values (16px radius, 1px #CCC1B3 border, #EBE5DB, left-aligned header, 85% of the chat box width).
- **Every click must land on the real target.** A click on the @ list header instead of the template row was called sloppy. After each render, pull a frame at the exact moment of every click and check it.
- **Test the interaction you show.** If the video clicks something, confirm in staging that clicking does it (it did for the @ list row, which was first tested with Enter).
- **Small states matter.** With text in the chat box, a pencil and a bookmark appear before the laptop and mic. After an @ pick, the @ button gets a highlighted square plus the "1" badge. Mentions are green chips. Missing details like these make the video look fake.
- **Image corners:** when capturing a rounded element as a plate, hide what's behind it and turn off its CSS shadow, then draw the shadow on the canvas. Otherwise the corners come out square (see `known-issues/`).

## Never leave anything to assumption

- If something appears that the viewer didn't see set up (a template in the @ list, a memory, a connected mailbox), say where it came from in one short narration line, for example "Once your firm's template is in the Knowledge Base, type the at sign and pick it". Add a brief ring on the relevant button.
- Don't re-show what an earlier video teaches (uploading to the Knowledge Base is 1.1). Mention it instead. Keep overlap small, but never so small that a step seems to come from nowhere.
- Use the mock case (Nair v Calderdale Logistics) for examples whenever an example helps, which is most of the time.

## Narration

- **Hover looks and tooltips (Bennett, 13 Oct 2026, 1.1 German):** when the cursor rests on a control, show Andri's real hover look (rail icons turn white with a ring and show a white tooltip 8 px to the right; yellow buttons lighten with a shadow). Only while hovering: tooltips disappear at the click. Capture the hover state from the snapshot's own CSS (`hoverCrop` in the 1.1 DE `plates/capture.mjs`), don't invent it.

- **German and Dutch videos: everything in the language except Andri's own interface (Bennett, 12 Oct 2026, 1.1 German v1).** v1 sent an English Example question (and got an English answer), and its letter scene had no voice. The user's messages, the questions, Andri's answers, the mock case, matter names and every on-screen text must be in the language; only what the app itself shows in English after setting its language stays English. Keep the slow 1.1 tempo (v1 felt fast after idle stretches were cut).
- **German and Dutch scripts: rewrite, never translate word for word (Bennett, 12 Oct 2026).** Keep what each line means and its step, but say it the way a native speaker naturally would. Literal translations "sound off". The same goes for on-screen text (title, captions, callouts, end card).

- **Pronounce "Andri" exactly as in 1.1 and 1.2:** spell it "Andri" in the script and generate the **whole script in one take** (voice "UK voice voice to use for ANDRI vids", Eleven v4).
  - Never respell it. "Andree" came out as "André".
  - Never patch in a single-line regeneration. A lone "Let Andri help you" take sounded Spanish.
- **End the opening question with the payoff.** 2.1's "Still building client letters in Word, one paragraph at a time?" became "... Let Andri help you." The title card then pushes into the app as soon as that line ends.
- **The ElevenLabs editor is shared by every session.** Before typing, read and save the script that's there. After typing, check your text landed word for word (compare it with JavaScript) before pressing Generate. Then restore the other script and check it too. Typing sometimes doesn't land at all; click directly on a line of text first.
- There's no speech-to-text tool on this Mac. Split a take at its pauses (ffmpeg silencedetect), and tell Bennett what to listen for, because you can't hear it.

## Pace and camera

- **Slower than your instinct.** The first cuts of 2.1 felt rushed even after two speed-ups. The final version plays the whole app part about 1.3× slower than the first cut: calmer typing, cursor moves, panels and gaps between lines. Narration lines keep their natural speed.
- **Length is free.** Videos don't need to match each other's length. 2.1 ended at 1:37 once the case-file step was added, because the topic needed it.
- **After a zoom on typing, zoom back out to the full Andri screen** for the next step (in 2.1 the @ step plays at full screen, not zoomed).
- **The window exit before the end card is a plain fade.** A transparency bug once made the window vanish in one frame; check the last two seconds before the end card in every render.

## Title card

- **Copy 1.2's layout exactly:**
  - "ANDRI ACADEMY · x.y" at x 122, y 392.
  - Title in Neco 500, 128px, at y 530.
  - Second line in Neco 400, 84px, at y 640.
  - Mascot at 1180, 330, width 640.
- 2.1's first title was off-centre and too big on both lines until it matched.

## Planning: the video briefs

- `andri-academy-videos.html` holds detailed briefs, not scripts: what must be shown, in order, with exact on-screen names, demo setup, what to leave out, and what's unconfirmed. Every claim in it was tested in staging on 8 Oct 2026. Whoever makes a video re-checks staging anyway.
- If the brief and staging disagree, staging wins. Note the difference for Bennett.

## Process reminders that saved time

- Re-check each changed part with stills (`stills.mjs`) before a full render: a full render takes about 15 to 18 minutes.
- After every render: a contact sheet of the whole video, then frames at every click and every transition.
- Close your Chrome tabs when you're done, and never type in another session's staging conversation. In 2.1, staging twice opened on the 2.2 session's conversation; always switch to your own first.

## More from the 2.1 build

- **Show staging as it should be, not as it happens to be.** Other sessions add test items to the shared matter (in 2.1, a "21_Letter_Bowater_Sykes_Remedy.docx" that the 2.2 session had uploaded). Leave anything another session added out of the rebuild, so counts match (Knowledge Base 22). Always replace the staging account's traces: the "B" avatar becomes "AF", "Bennet law" becomes "Aldridge Vine".
- **Small chrome details differ per page.** On the matter chat page, the first rail icon is Open Timeline. On the Knowledge Base page it's the Chat icon. The Knowledge Base toolbar has a list/grid toggle. The Inbox count goes up with each Document Ready. Check these per screen.
- **Narration should match the action.** Say "type the at sign" while the @ is being typed, and "the judgment" while it's ringed. Time the rings to the words, not the other way round.
- **Adding a beat late without re-timing everything:** in 2.1 the case-file step was inserted after the video was built. The app time was frozen during the new beat (a pause segment in the time map: `toLogical`/`toReal` in the 2.1 `app.js`). The new beat was drawn in real time, then pushed across to the existing chat scene. Captions, chapters, clicks and narration were shifted with the same map. Reuse that pattern instead of rewriting timings by hand.
- **Staging opens the last conversation used**, which may be another session's. Before typing anything, open your own conversation from the Conversations list.
- **Delivery folders:** videos go in `~/Desktop/Andri Videos/Andri Academy/English/` (videos only). Timestamps files, the README table and the website ending reference go in `~/Desktop/Andri Videos/Andri Academy/English/Timestamps/`. Re-read the README just before adding your row; rows have gone missing during reorganisations.

## From the 3.1 build (memory, 8 Oct 2026)

- **Test in your own matter, then check the reply is true on Nair.** Andri's answers depend on what the matter holds. In an empty test matter it said "I hold one note on this case" and "Case memory is empty again", which would be false on Nair. Show the real reply, trim only words that wouldn't hold on Nair, and tell Bennett what you trimmed.
- **Andri pushes back on past dates.** The brief's example "the remedy hearing is on 11 May 2026" gets a reply saying the date has passed. Pick example facts that are still true today (3.1 used "Ms Nair prefers email, not phone calls").
- **Things the brief doesn't know yet:** the In-Depth Mode icon is now a brain with a cog (lucide `brain-cog`), and the matter header has a brain button, "This matter's brain" (`brain-circuit`), between search and Knowledge Base. The 1.1 rebuild still shows the old ones; add them in your own `s<number>.src.html`.
- **Memory steps in chat:** saving shows "Remembered · Case · <note name>", asking shows "Accessing memories", and forgetting shows "Forgot · Case · <note name>". While Andri works, a yellow "Accessing memories" row with a spinner shows first, then the finished row takes its place.
- **Vercel toolbar on staging.** One misclick on its pop-ups at the bottom right turns on comment mode. Escape doesn't turn it off. After that, a click plus Return posts a Vercel comment the whole team can see, instead of sending a chat message. In 3.1 this happened once and Bennett had to delete the comment. Reload your tab if a "Start a new thread" box ever appears. Before sending, check that the focused element is the "Ask Andri..." textarea and that your text is in it, then send with the send button.
- **Auto mode may block staging writes** (new matter, chat messages). Ask Bennett once in chat which messages you need to send and where. Don't look for a way around the block.
- **Icons the rebuild doesn't have** (brain, brain-cog, building-2, monitor, plug, bell, moon...): fetch them with `npm pack lucide-static` into your own project and inline them with your own copy of the build script (3.1: `plates/build31.py`). That leaves `build.py` and the shared `icons/` folder untouched.
- **No Python Playwright on this Mac.** The 1.2 `capture.py` won't run. Use the Node version: `plates/capture.mjs` and `plates/pw.mjs` in the 3.1 or 2.2 project.
- **Check the gaps in the final MP4, not just the mix:** `ffmpeg -i 3.1.mp4 -vn -af silencedetect=n=-35dB:d=1.0 -f null -`. Every line must be there, and gaps between lines should be about 1 s or less (the fade into the end card may be longer). Cut lines with `-ss`/`-t` before `-i`, and check each line's mean volume.
- **Say where everything comes from, even across videos.** 3.1 shows Personal and Firm memories it never creates on screen, so the voice says how they get there ("Tell Andri 'always ask me before you create a document', and it's kept here"). Mentioning another video's topic in one line is fine; leaving the viewer to guess is not.

## From the 4.2 build (Timeline and Simulate, 9 Oct 2026)

- **Don't zoom where the text is already readable.** In 4.2 the answer's flagged points and table were readable at the normal window size; Bennett: "no point zooming in and out there". Zoom only on small things (a chip, a form field, a picker).
- **To point at a phrase the voice names, use the yellow highlight sweep, never an underline.** It's the same mark as 1.1's source passage: `#F8E37C`, drawn over the text with `globalCompositeOperation = 'multiply'`, sweeping left to right in about 0.8 s, timed to the words. Gold rings stay for small controls only.
- **Panels open and close instantly in the app, so cut, don't cross-fade.** A 0.2 s blend between "Timeline open" and "Timeline closed" showed the greeting twice, at two sizes. Blend only where the app itself animates.
- **The typed text must still be in the box when the cursor clicks send.** Put the click a frame or two before the switch to the sent state, then check the still at every send.
- **When something leaves the thread, move the scroll in the same frame.** After you answer Andri's questions, the "Waiting for your input" line and the question card disappear. If the scroll eases afterwards, you get blank frames.
- **Other sessions' uploads change the counts in shared staging.** In 4.2 a letter uploaded by another session added three events to the Timeline (31 instead of 28) and one file to the Knowledge Base (23 instead of 22). Find what it added (sort events by date, look for the new file) and leave it out of the rebuild.
- **Andri pushes back on dates that have passed, so plan for it.** "Write my hearing notes" made Andri ask which hearing (11 May 2026 has passed) and where to put the notes. Showing that question step is good teaching ("If something is unclear, Andri asks first"). Expect it, and pick answers that stay true.
- **Simulate is shared per matter, and it's slow.** Ask Bennett before restarting it. The judge's turn takes about 6 minutes in staging, so start it early and capture other screens while it runs. On 9 Oct the Claimant's turn ended without a submission (reported to Bennett), so check what a turn actually produced before showing it.
- **Every word in a rebuild must come from staging.** Don't fill a section with "…" or write an event description yourself. Pull the real text (long pages: read them in chunks of about 1,000 characters, because the browser tool cuts longer output), then shorten by cutting, never by rewording.
- **Tools that cost time on 4.2:**
  - ElevenLabs: selecting the old text and typing replaced only its first paragraph. Clear the editor first (focus it, Cmd+A, Delete, check it's empty), then type the script and compare it word for word.
  - The Chrome window can shrink to a phone-sized view (736×311) and won't resize. ElevenLabs still works through JavaScript: History → the item's "Download Audio" button.
  - `_toolkit/render.mjs` needs the folder that holds `index.html` (the project's `build/`), not the project folder.
  - In zsh mix scripts, write `${ms}[a$n]`, not `$ms[a$n]`. Without the braces zsh reads an array index, and ffmpeg fails with "more than one stream".

## From the 7.1 build (Specialists, 12 Oct 2026)

- **Getting DOM snapshots out of Chrome:** fetch to localhost is blocked by CSP, and Chrome holds a page's automatic downloads after the first one. What worked: copy the snapshot to the clipboard from a real click on a small button the page script adds, save Bennett's clipboard first and put it back right after (`staging-snapshot/g.sh` in the 7.1 project).
- **A new Chrome window may not be 1470 wide, and resizing can fail.** Set `html` and `body` to 1470 x 835 in the page (`FIT71()`), wait a second, then snapshot: script-sized panels (the specialist panel, 46% of the width) recompute as at 1470.
- **The chat page keeps other conversations' threads hidden in the DOM.** Always search inside `.thread-pane-active`, or you pick up another session's thread or composer.
- **Remove `#claude-*` elements** (the extension's glow and phantom cursor) from snapshots.
- **Mention chips are an overlay, not the textarea.** Clearing the textarea value doesn't clear the chip; take an idle snapshot instead.
- **Typed text over a translucent composer:** reveal over a plate of the same page with the placeholder removed, not a flat colour (the composer blurs the thread behind it).
- **Specialists:** the build rewrites the "When should Andri consult it?" line, and a plain drafting request didn't make Andri consult the specialist; a house-style check did. The @ list opens on the section used last; ←/→ steps through sections, ending at Specialists.

## From the 8.1 build (Assignments, 12 Oct 2026)

- **Never name another video by its number** in the narration or on screen ("Video 11.1 covers seats"). The numbers change on the Academy website. Say the topic instead, or say nothing ("Seats are covered in their own video" is fine; "11.1" is not). The end card's "Next:" line uses the next video's title, never its number.
- **Tempo: slower than the first cut, again.** 8.1 v3 felt a bit too fast in most places (Bennett). v4 plays the whole app part 1.25x slower after the title card (a time warp in `logical` / `videoT`, as 2.1's 1.3x), with narration at its natural speed and each line centred on its action. Gaps of about 1.5 to 3 s are fine while something happens on screen (1.1 and 2.1 have the same); only a voice that stops over a still screen is a problem. Start slower next time: about 1.25x the speed that feels right while building.
- **Rings must not touch the window edge** (known-issues #10): ring the label, not a full-height top-bar tab, and clamp the ring inside the window.
- **Popovers in a DOM snapshot keep staging's window height.** A menu's position is frozen from the window it was captured in (723 px tall in 8.1); when the dialog re-centres at 860 px, the menu sits over its chip. Place each menu under its trigger again, with the gap staging had (`H.popTo()` in the 8.1 `plates/capture.mjs`).
- **Staging's Nair page opens the last conversation used**, which was another session's twice in 8.1. Switch to your own thread via Conversations → "From Andri" before reading or capturing.
- **Typing into a field: reveal over a placeholder-free plate of the same field, never a painted colour** (Bennett, 7.1 v2: "edges of box look a little off"). Capture the field with `placeholder = ''` and draw the whole field box from it, then the typed text from the filled plate.
- **Keyboard steps need showing too.** A switch the cursor can't explain (the @ list moving to Specialists with ←) confused Bennett; show a small keycap beside the app's own key hint and ring the hint before the screen changes.
- **Sudden pauses = picture still AND voice silent at the same time** (8.1 v4, Bennett). A gap between lines is fine while something moves; it feels like a stall when nothing moves either. Find them before delivery: silences from `silencedetect=n=-35dB:d=1.0`, still stretches from `mpdecimate` + `showinfo` (frames that don't change for over 1.2 s), and cut every overlap with a CUTS entry on that still moment (v5 removed five).
- **Typed text and UI edges at full size.** In v4 the matter search showed a sliver ("I") instead of "N": a reveal read a sprite as if it were a full-window plate. Sprite images are cropped to their own box, so read them with their box offset (`sregion()` in the 8.1 `app.js`). Put the caret at the end of the revealed text, and check one zoomed still per typed field.
- **Draw a floating sprite's shadow with its own CSS values.** The toast's shadow was drawn bigger and darker than staging's (`0 4px 12px rgba(0,0,0,.1)`, 12 px radius), so its corners looked off.

## From the 6.1 build (Andri in Word, 12-13 Oct 2026)

Bennett's main feedback on 6.1 was **quality**: the first two deliveries looked soft, and several clicks landed on nothing. Both are avoidable from the start.

**Capture sharp, every time (the biggest lesson):**
- **Never film with plain screenshots.** The browser tool's `screenshot` is a 1x JPEG; stretched to the 1920 frame it looks blurry. Capture at retina 2x instead: the `zoom` action on each quarter of the viewport, at full scale, returns lossless 2x PNG tiles; stitch the four into one plate (`projects/2026-10-12-academy-6-1-word/hd/stitch.sh`, and `stitchR.sh` when only the pane changed). Check `devicePixelRatio` is 2 first.
- **Show plates 1:1, never stretched.** Camera scale 1.0 with the window on whole pixels; cap any zoom at about 1.2x (`zoomOn(..., cap)`). Load 2x plates and draw them at app size (`region()` reads the plate's own scale).
- **Park the mouse in a corner before every capture** (hover at the bottom-right pixel). Then no pointer is baked into the plate and nothing needs painting out. Removing pointers afterwards smears text and leaves halos.
- **Film in one sitting, in a fixed window size.** Measure `innerWidth`/`innerHeight` before you start and keep them; other sessions resize the shared Chrome window.

**Clicks must land on something real:**
- **After any re-capture, re-measure every click target on the new plates.** In 6.1 the Allow button and the "Ask Andri…" field moved between the old and new captures, so the cursor clicked beside them.
- **Never click on nothing.** "Click beside the page to deselect" and "Done" clicks whose screen isn't shown look like mistakes. Let the cursor drift aside instead.
- **Check a close-up at every click, not the whole frame.** `projects/2026-10-12-academy-6-1-word/check/clicks.mjs` renders each click time and crops 360x200 around the cursor (app.js sets `window.__cur`). The full contact sheet is too small to catch a click 20 px off.
- **Change the screen 0.12 s after a click** (`drawApp(t - .12)`), so the button is still visible in the frame the cursor presses it.

**Transitions:**
- **Cross-fade whole screens, never a pane region, when the layouts differ.** Fading only the pane between two captures left a piece of the old dialog hanging outside it.
- **Show the in-between state the app really shows.** After Allow, the pane says "Opening secure sign-in…", not "Sign in" again. If no clean capture of it exists, build it from real pixels (6.1 undimmed the button from the dimmed capture).

**Word and the add-in:**
- **Word on this Mac is Word on the web** (Bennett's andriai.onmicrosoft.com account). The tenant's two deployed "Andri" add-ins are the live app (app.andri.ai).
- **Staging needs a sideload with its own Id.** `word-staging.andri.ai/manifest.xml` has the same Id as the live add-in, so Word silently keeps the live one. Give the copy a new `<Id>` (`addin/manifest-staging-academy.xml`); then it appears as a third "Andri". The upload (Add-ins > Advanced > Upload My Add-in > Browse) and the staging sign-in must be done by Bennett. Ask once, check straight away that a new entry appeared, and sign in to it before he leaves. The sideload is lost if the Word tab reloads or closes.
- **Pin the ribbon** (ribbon display options > Always show) and **turn Dark Mode off** before capturing.
- **Filter the pane's case list** (search "Nair") so other sessions' test matters never appear.
- **Real review flow:** the reply ends with an "Edits" card, then "Review and apply changes" opens Review edits (per edit: reject / Keep tracked / accept), then Done. Keep tracked writes the redline into Word under your Word name, and Word switches to its Review tab. Saving shows "Saving…" then "Saved to case files", and the draft gets a new version (v2).
- **Each Word document keeps its own conversation**; opening a case file replaces the open document.
- **Demo names on 2x plates:** draw replacements in the pane's own font. Rethink Sans is at `word-staging.andri.ai/assets/rethink-sans-latin.woff2`; convert it to TTF with fontTools for Pillow (`hd/prepN.py`).

**Shared staging:**
- **Agree a turn for the firm language before filming.** Other sessions switch it to German, French or Dutch. Tell them how long you need (6.1 needed about an hour) and tell them as soon as you're done.
- **Re-filming later can contradict the story.** By the time the web Drafts page could be re-filmed, the matter held both drafts, while the video at that point has saved only the letter. Capture each state in order, the first time.

## From the 9.2 build (LegalSense, 12 Oct 2026)

- **When the feature can't really be used in staging** (9.2: LegalSense needs 2FA and a real LegalSense installation; BaseNet isn't there at all): teach the setup from the real screens, and show the result only through the app's own explainer or sample, as the app shows it. Never fake a result on Nair. Mark the video as a placeholder in the status table, and hold its German and Dutch versions until it can be redone for real (Bennett accepted 9.2 this way).
- **Write each line for what the screen can actually do.** 9.2 says "Then save the installation", but Save stays disabled without 2FA, so the cursor closes the form instead. Check the script against the real state of every button before generating the narration; it's a cheap fix then and a regeneration later.
- **Cut long takes into sub-lines at their inner pauses.** One Enter between paragraphs in ElevenLabs gives 0.25 to 0.6 s pauses, enough to cut on. Splitting a line at its sentence breaks (N2a/N2b, N7a/b/c) lets each click land on the word that names it without re-timing the whole video.
- **Looping app scenes (adds to 10.2's note):** seek only the scene's own animations (`emt-*` in 9.2) and loop them at the app's loop length (4.8 s). Keep the slide text and the dialog entry finished, or the text blinks at every loop.
- **One download per site:** a second script-triggered download, even after navigating, is silently blocked. Use 10.2's real-click button, or queue everything and download once.
- **Small images behind Vercel SSO** (the LegalSense logo): draw it to a canvas in the staging tab, put the PNG data URL in an `<article>`, read it with `get_page_text`, and check the decoded PNG's checksums.
- Two render bugs from 9.2 are now known-issues #11 (a hidden dialog's button still showing) and #12 (stacked layers showing through the window fade).

## From the 10.2 build (Workflows, 13 Oct 2026)

- **Getting snapshots out of Chrome without the clipboard:** queue SNAPs in the page, then one real click on a small injected button downloads them all as one file (`academy102-batch*.html`); `grab.sh` splits it. Download before every navigation, or the queue is lost. Keep the injector in staging localStorage so it reloads with one `eval`. (The window.open bridge doesn't work: staging's COOP cuts the opener.)
- **Popovers and panels keep staging's window size.** Radix menus carry a fixed `translate()` and the workflows panel an inline `width: 1888px`. When re-rendering at 1440 x 860, put each menu back under the trigger it belongs to (skip triggers inside the menu itself, flip it above if it would run off the bottom) and let the panel width follow the window (`plates/capture.mjs`, `localize.py` in the 10.2 project).
- **Canvas apps (React Flow): draw the canvas yourself.** Hide nodes, edges and dots in the plates, capture each node alone at zoom 1 (3x, CSS shadow off, rects relative to the node itself, not the page), and draw dots, smoothstep edges, labels and nodes on the canvas. Then steps can land, be dragged and joined like in the app. Staging drops a new step over the one before it, slightly down and to the right.
- **App animations that loop (the publish explainer):** don't `finish()` them (it resets to the start state). Seek `document.getAnimations()` to fixed times and capture a frame sequence; play it in the video.
- **Activate needs a connected mailbox** for any workflow with Send Email ("cannot send from this matter yet"). We can't connect one in staging, so say it and stop on the dialog.

## From the 1.1 Dutch build (13 Oct 2026)

- **Staging language is firm-wide and shared by every session.** Company → Language → pick → Update Company (picking alone changes nothing); saving reloads the page in the new language. German, Dutch and French sessions switch the same setting, so message the other language sessions before switching and tell them when you are done. Bennett's browser also keeps `appLanguagePreference` in localStorage.
- **Matter screens follow the matter's Jurisdiction.** With the firm in Dutch, the New Matter dialog and everything inside a United Kingdom matter stayed English; Jurisdiction → Netherlands (or Belgium) made the dialog, chat, Kennisbank, Voorbeeldvragen, summaries and tags Dutch (Bennett's tip). Example questions are then generated in the language, so a translated video can pick one like the English does.
- **Take SNAPCSS on a page where the PDF viewer has loaded.** Taken on the Company page, the stylesheet lacked react-pdf's rules: the text layer (and the yellow citation marks) landed below the page and the passage zoom was blank.
- **Staging's CSP blocks `eval`, inline scripts are allowed:** load the snapshot tool from localStorage with a `<script>` element.
- **Popovers inside centred dialogs keep the 1920-wide position** (the Jurisdiction list sat 245 px to the right): move the Radix wrapper under its trigger in capture.mjs.
- **Andri's visible reasoning and some answer headings may come out in English** even when asked in Dutch; cut those blocks (never reword) so everything on screen is in the language.
- **Inserting new beats into an existing video:** splice them into the base timeline (`INS` in the 1.1 NL `app.js`: base time stands still while an insert plays) and export voice, click, whoosh and chapter times from the page (`window.MIX` → `audio/events.mjs`) so the mix can never drift from the picture.
- **zsh does not split `$VAR` into arguments:** use `${=VAR}` when passing a list of times to stills.mjs.

## From the 10.1 build (scheduled workflow, 13 Oct 2026)

- **Say "schedule" as SKED-yool, every time (Bennett, 7.2 and again 10.1).** Before every ElevenLabs generation, search the script for "schedul" and wrap each hit in `<phoneme alphabet="ipa" ph="ˈskɛdjuːl">schedule</phoneme>`. 10.1 v2 went out without it and had to be regenerated and re-rendered. Check by measurement (2.5 kHz high-pass, 5 ms RMS): a "k" shows a short silence and a burst after the "s"; "sh" is one long hiss.
- **A scheduled workflow activates at once.** No "Configure for this matter" dialog: Activate → toast "Workflow activated for this matter" → it moves to "Active". The matter's … menu has Pause workflow / Executions / Edit template / Deactivate.
- **Two projects with the same number confuse the source-code refresh.** `update-source-code.sh` copies the first `*-academy-<n>-*` folder; with two 10.1 folders it took the wrong one. Check `source code/<n>` after running it.

## From the 10.3 build (ready examples, 13 Oct 2026)

- **Workflow step settings only stick after the panel's own Save Draft.** Edit a step, close the panel, and the edit is gone. Show the Save Draft click in the video after every step edit.
- **Hover looks in snapshots:** Tailwind puts hover styles inside `@media (hover: hover)`, which headless Chromium reports as none, so a real mouse over the local page changed nothing. Emulate a mouse device over CDP (`Emulation.setEmulatedMedia` with `hover`/`pointer` features; `pageAt()` in the 10.3 `plates/capture.mjs`). Radix menu options highlight on focus, not hover: focus the option. Some yellow buttons (New Workflow, Publish) have no hover rule at all in staging's CSS; then nothing should change.
- **Typing into the middle of a text field reflows everything after it**, so a left-to-right reveal can't work. Capture the field every few letters as a frame sequence at the field's own scroll (`scopeType` in the 10.3 capture) and play it.
- **Highlighting a phrase inside a textarea:** a Range over the textarea's text node has no boxes. Measure with a mirror div laid over the textarea (same font, padding, width, scroll); skip textarea text nodes in the text walker.
- **Whisper without name hints hears "Andri" as "Andrew"** on a single sentence, also on the approved 1.1 (tested 13 Oct). That alone is not a pronunciation problem; compare with 1.1 before regenerating.
- **Scrolling a panel or list (Bennett, 10.3 v2):** staging's scroll boxes fade 20 px at their edges, and moving one capture past another drags that faded edge across the box (the filter line came out washed) or lets cards run past the pane border. Scroll mask-free captures inside the box's own rect and draw the edge fades on the canvas (`scrollStripNM()` in the 10.3 `app.js`); clip a list to inside its pane border.
- **A `{{variable}}` chip on screen needs a spoken line (Bennett, 10.3 v2: "you did not explain what that was").** If a ring lands on `{{steps.counter-edit.files}}` or `{{context.userEmail}}`, the voice says what it is ("the marked-up Word document from the counter-edit step", "your own address"), and the step it comes from is ringed too. Measure the chip itself, not its row.
- **Snapshots from a wide window keep one-line text boxes.** At 1920 the letter request and its @ chip fit on one line; at the video's 1440 the chip wraps and staging grows the chat box to two lines. Give the textarea its real height in capture.mjs, or the chip runs into the toolbar (Bennett caught it in 1.1 NL v5).
- **Small pieces cut from under a floating box carry its shadow.** The disclaimer under the chat box picked up the box's drop shadow as a grey band; hide the box and its shadow when capturing it, and key the line to text only (`plates/make_disc.py` in the 1.1 NL project).
- **Rings ride with a scroll (Bennett, 10.3 v3: "weird box that appears when you scroll").** A ring still fading out when its list scrolls stays put and frames the wrong text. Measure rings on the unscrolled plate, add the scroll offset, clip them to the scroll box, or end them before the scroll.
- **The drag-select cursor leads the highlight (10.3 v3: "highlighting backwards").** Don't tween the cursor straight from the first letter to the last: on a two-line selection that runs left while the highlight runs right. Put the cursor on the selection's head every frame.
- **Typed words stay highlighted while typing (Bennett, 10.3 v3).** Mark the typed text in the sweep yellow (multiply, #F8E37C) as it grows, measured per frame with a mirror div over the field, and fade it on Save.
- **Give each step the voice names its own moment, and keep the cursor off its name (Bennett, 10.3 v1: "you went over this one very quickly", the cursor covering "Compose email body").** Click a canvas step near its upper right corner, then move the cursor off the card so the step name stays readable, and hold each named step for at least a second and a half with its prompt highlighted.
- **`render.mjs build` writes to `build/renders/`**, not the project's `renders/` folder, when the page lives in `build/`. Move the file after each render, or you deliver an old one.
