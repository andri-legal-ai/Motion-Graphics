# Motion Graphics

> **Every finished Academy video goes into `~/Desktop/Andri Videos/Andri Academy/English/`.** Each time a video is made here (1.1, 1.2, 2.1, 2.2 and so on), save the final MP4 into that folder, named by number only (`2.1.mp4`), with chapters built in. That folder holds only the videos. Put `2.1 timestamps.txt` in `~/Desktop/Andri Videos/Andri Academy/English/Timestamps/` and add the video's row to the README table there. The project folder in `projects/` keeps the source and draft renders only. A video is not finished until it is in that folder. (German, Dutch and French versions go into "Andri Videos/Andri Academy/German", "(Dutch)" and "(French)".)

Every motion graphic Claude makes for you lives here, one folder per piece in `projects/`.

To start one, just ask Claude for it (for example "make a 20s launch reel for the new Drafts feature, vertical"). The `motion-graphics` skill kicks in automatically and walks through:

0. Intake questions
1. Story check (beat table)
2. Look check (style frames)
3. Storyboard (approve panels by number)
4. Build (JavaScript on canvas, rendered with Playwright + FFmpeg)
5. Contact sheet review and delivery

`_toolkit/` holds the renderer, the contact-sheet script, the transcriber and the starter template. Don't move it.

**Re-listen every narrated video before delivering it** (Bennett, 12 Oct 2026). `_toolkit/transcribe.py` writes down what the finished MP4 actually says (faster-whisper, runs on this Mac, nothing uploaded) and compares it word for word with the script:

```
~/.local/share/academy-stt/.venv/bin/python "$HOME/Desktop/Andri/Motion Graphics/_toolkit/transcribe.py" <final.mp4> <script.txt>
~/.local/share/academy-stt/.venv/bin/python "$HOME/Desktop/Andri/Motion Graphics/_toolkit/transcribe.py" <final.mp4> <script.txt> --raw
```

Run it twice: the second run (`--raw`) gives no name hints, so a mispronounced "Andri" or name shows up. Add `--lang de`, `--lang nl` or `--lang fr` for German, Dutch and French. It prints the timed transcript and every word that differs, and saves `<video>.transcript.txt`. If the Python environment is missing: `uv venv ~/.local/share/academy-stt/.venv && uv pip install --python ~/.local/share/academy-stt/.venv/bin/python faster-whisper`.

`andri-style.md` (look, motion and polish rules) and `andri-components.md` (the reusable pieces with their real values) are the house notes: read both before building.

`GITHUB-MOTION-REPOS.md` covers the 15 public Claude motion-design repos (from the @RoundtableSpace post, 13 Oct 2026): what each one is, which fit Andri, and the timing, cursor, narration, sound and render rules worth borrowing.

`REJECTED.md` lists every video idea Bennett turned down and why. Read it before proposing a new video.

`REFERENCES.md` lists the motion videos Bennett liked (with links), what worked in Academy 1.1, and what to watch for next time. Read it before starting an Academy video.

Final approved example: `~/Desktop/Andri Videos/Andri Academy/English/`.

`ANDRI-ACADEMY-PROJECT.md` is the brief for the full Academy project: 20 videos in English (UK), German, Dutch and French (80 in total), how a translated version is made (top of that file), the voices, and the accuracy rule.

`known-issues/README.md` lists the render mistakes Bennett has caught (square corners under popups, lightbulb mascot, unexplained rings, clipped buttons, icons cut off at item edges, zooms past the window edge) with screenshots and how to avoid each. Read it before building.

`ACADEMY-LESSONS.md` collects every correction Bennett has made on Academy videos (accuracy, narration, pace, title card). Read it before each video.

`styles/kinetic-text/` is the kinetic text style from the BaseNet video (big headlines, highlight block, checklist). Bennett wants it for every motion graphic except the Academy.
