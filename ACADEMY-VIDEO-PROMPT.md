Make Andri Academy video [NUMBER] in English (UK voice).

What the number means: [NUMBER] is the video's number in the video briefs, ~/Desktop/Andri/Motion Graphics/andri-academy-videos.html. Open that file and:
- In the "All 20 videos" table, find the row with your number (e.g. 2.1): that gives your title, target length and status.
- Then read your video's own section: the element with id "v" + your number with a dash, e.g. id="v2-1" for 2.1, id="v4-2" for 4.2. Follow its detailed instructions.
- Also search the whole file for your number: the notes at the top ("What the staging check found", "Wrong in the current scripts", "Set up before filming") may say something about your video. If its status is "Fix before filming", do those fixes first.
- The next row in the table is the next video: use its title for your end card line ("Andri Academy · Next: <title>").

Read first, then follow:
- ~/Desktop/Andri/Motion Graphics/ANDRI-ACADEMY-PROJECT.md (rules, voices, demo data, opening and ending, delivery)
- ~/Desktop/Andri/Motion Graphics/ACADEMY-LESSONS.md (every correction Bennett has made so far; don't repeat them)
- ~/Desktop/Andri/Motion Graphics/REFERENCES.md
- ~/Desktop/Andri Videos/Andri Academy/English/Timestamps/README.md (what I like and what to avoid). Watch 1.1.mp4 and 1.2.mp4 in ~/Desktop/Andri Videos/Andri Academy/English/: they are the reference for look, pace, captions, title card, exit and end card. Pacing matters: engaging but never too fast (1.1, 1.2 and 2.1 are good examples). Length follows your topic, not 1.1's length: as long as it needs to explain it properly, no padding, no rushing.
- Use the motion-graphics skill.
- Reuse, don't reinvent: the 1.2 project ~/Desktop/Andri/Motion Graphics/projects/2026-10-08-academy-1-2-in-depth-or-plan/ (app.js engine, plates/capture.py, audio mix, stills.mjs, chapters) and the Andri screen rebuild in ~/Desktop/Andri/5 - Marketing/Videos/Andri Learn Video Designs/video-1.1/src/ (index.src.html, s12.src.html, build.py).

Process, no shortcuts: check every screen and flow in Andri staging in Chrome first (invent nothing, show nothing outdated) → answer your own questions (staging, the brief, earlier projects; list your calls at delivery, don't ask me) → image storyboard like 1.1 and 1.2 → then build without waiting for approval → after every render, contact sheets of the whole video → fix → deliver.

Other Claude sessions are making other Academy videos at the same time, so:
- Work only in your own folder: ~/Desktop/Andri/Motion Graphics/projects/<today>-academy-[NUMBER]-<short-name>/. Copy what you need; never edit the 1.1 or 1.2 projects or anyone else's. In video-1.1/src make your own s[NUMBER].src.html; don't change index.src.html, s12.src.html or build.py.
- Staging: never work in the same staging place as another session. Use your own new Chrome tab (never use, reload or close other tabs) and your own new conversation named "Academy [NUMBER]". Never type in or change another conversation, and never change the shared Nair v Calderdale Logistics matter, its documents, memory or firm settings: if your video needs that, create your own demo matter or item named with your number. Never click Execute on a plan. On screen, the firm is always the demo firm Aldridge Vine. Full rules: "Working in parallel" in ANDRI-ACADEMY-PROJECT.md.
- Narration: ElevenLabs web app at https://elevenlabs.io/app/speech-synthesis/text-to-speech (my account, already signed in; go ahead without asking me). Follow "How to make the narration in ElevenLabs" in ANDRI-ACADEMY-PROJECT.md: voice "UK voice voice to use for ANDRI vids", Eleven v4, same settings as 1.1 and 1.2. Generate only your lines, then move your download out of ~/Downloads into your project straight away (check the file name and History text match your script).
- Deliver the video to ~/Desktop/Andri Videos/Andri Academy/English/ as [NUMBER].mp4 (that folder holds only the videos). Put "[NUMBER] timestamps.txt" in ~/Desktop/Andri Videos/Andri Academy/English/Timestamps/ and add only your own row to the table in the README there and to the status table in ANDRI-ACADEMY-PROJECT.md: re-read each file just before editing, and don't change other rows.
