# Staging measurements, 12 Oct 2026 (my tab, viewport 1920 x 936; earlier screenshots at 1470 x 835)

Colours as read from computed styles (oklab converted to sRGB).

## Global
- body bg #f2efe9, ink #241e19, muted #494746, Rethink Sans; headings "fontHeading" (Neco).
- Top bar: 0,0,W,68, bg #f2efe9, bottom border 1px #ccc1b3. Logo img 16,17.5 32x32.
- Nav links at x 76 (Matters 72.9w), 150.9 (Assignments 106.1w), 259 (Inbox 82.7w), padding 0 12px, 14px/20px w500 #494746.
  Inbox badge circle 18x18 #f8e37c at 311.7,25; "9" 10.5px w700.
  Active "Actions" w600 #241e19 at 355.7,24 + chevron-down 14px at 409.8,27 (opacity .6); underline span 343.7,67 92.1x2 #241e19 radius 2 2 0 0.
- Right side (1920 wide): sliders icon 20px at 1503,23.5 (box 40 at 1493.4,13.5); firm chip 1541.4,15.5 109.6x36 bg rgba(36,30,25,.03) 1px rgba(204,193,178,.7) r12, building-2 15px #494746 + "Bennet law" 13px w600; divider 1px x22 #ccc1b3 at 1659; grip 20px (1678); circle-help 16 (1728); graduation-cap 16 (1776); theme button 40x40 at 1816 bg #f2efe9 2px #ccc1b3 r12 shadow, sun 16; avatar 28x28 at 1870,19.5.
- At 1470 wide (screenshots): sliders 1053, firm chip 1083..1188, divider 1198, grip 1226, help 1273, cap 1320, theme 1372, avatar 1420 (all centres, y 33).

## Actions page
- Tabs: wrap 16,84 256.6x36 bg rgba(36,30,25,.03) 1px rgba(204,193,178,.7) r12 p3.
  Selected tab: white r8, shadow inset 0 1px 0 rgba(255,255,255,.6), 0 1px 2px rgba(35,30,25,.04), 0 0 0 1px rgba(204,193,179,.5); label 13px w500 #241e19; count badge 18x18 #f8e37c r6 10.5px w700.
  Unselected: label 13px w500 #494746, count 11px w600 rgba(73,71,70,.8).
  All 20,88 (62.6 wide with badge); Personal label 96.6; Company label 185.8.
- Search: label 280.6,84 240x36 white 1px #ddd3c6 r12 shadow 0 1px 2px rgba(0,0,0,.05); search icon 16 #494746 at +13; input text 14px; placeholder "Search actions...".
- Info button 36x36 r8 (icon info 18 #494746); Create Action button 137.6x36 #f8e37c r12, plus 16 + "Create Action" 14px w600. Right edge = W-24. When panel open: info + create move left to end at list right edge (list 16..762 at 1470).
- List card (section): 16,132 to bottom (W-32 wide; bottom 16 from window bottom) white 1px rgba(204,193,178,.8) r16 shadow 0 1px 2px rgba(35,30,25,.06), 0 12px 32px -12px rgba(35,30,25,.18).
  Section header h2 "Personal"/"Company" 12.5px w500 Neco #494746 at x 37 (y 141 text), count badge 18x18 #f8e37c r6 (10.5 w700) at +8.
  Row: button 27,169 (W-?)x60 r12 padding 10 14; title 13.5px/20.25 w600; desc 12.5px/16.25 #494746 (one line, ellipsis). Selected row: white + shadow 0 1px 2px rgba(35,30,25,.08), 0 8px 24px -12px rgba(35,30,25,.25), 0 0 0 1px rgba(204,193,179,.8). Hover row: bg #f2efe9-ish (light beige, seen in screenshot).
  Building row: title "Remedy check" (as typed), desc "Andri is making this action", spinner disc right (Andri spark, yellow ring).
- Empty state (Personal 0 tab, 1920): icon box 44x44 r12 bg rgba(36,30,25,.04) with zap icon (#494746), centred, top 316.9 (card top 132);
  h "Brief Andri once, run it in any matter" 13.5px/20.25 w500 at y 368.9; p 300 wide centred 12.5px/18.75 #494746 at 397.1 (4 lines):
  "Describe a task the way you would brief a junior colleague: what to do, what to read, what the result should look like. Andri follows it the same way every time."
  button "Create your first action" 173.8x32 #f8e37c r8 12.5px w600 (+ plus icon) at y 488.1;
  example grid 560x125.8 at y 560.1, 1px #ccc1b3 r12, 3 cells white, padding 16: title 12.5px/18.75 w500, text 11.5px/17.25 #494746:
   Contract review: "Flag the clause types you care about and check them against your standard positions."
   Client intake: "Check that the documents a new client sends line up, and run the conflict check your firm runs."
   Due diligence checklist: "Work through a document set against your firm's checklist and report what is missing."
  footer "Actions are briefs. Write one once, then run it from any matter's chat with @." 11.5px #494746 at y 717.9.
  (vertical centre of the group = card centre)

## Side panel (aside) 
- 1920: list 16..1013, panel 1021..1904 (883 wide), top 84, bottom 920 (H-16). 1470: list 16..762, panel 771..1439.
- aside white 1px rgba(204,193,178,.8) r16 shadow 0 1px 2px rgba(35,30,25,.1), 0 24px 60px -12px rgba(35,30,25,.35).
- Header row (height ~52, border-bottom): crumbs at x+13: "Actions" 12.5px w500 #494746, chevron-right 12 rgba(73,71,70,.6), current 12.5px w500 #241e19 (y 101 at top 84).
  Icons right: copy, share-2, trash-2 (16px #494746 in 32x32 r8 buttons, 34 apart), divider 1x18 #ccc1b3, x 18px. Close at right-38.
  Shared action: share button gone. Share click -> header shows "Cancel" (outlined button) + yellow "Share with company" (share-2 icon) confirm. Delete click -> "Cancel" + red "Delete" (trash icon) confirm.
- Detail: title h2 20px/25 w600 Neco ls -.2 at +33,157; "What you asked for" 13.5 w500 at 202; p 13.5/21.6 rgba(36,30,25,.85) at 230; "Skill Definition" 13.5 w500 at 293.4;
  box at 321.7: bg rgba(36,30,25,.02) 1px rgba(204,193,178,.7) r12 padding 14 16; inside h1 12.5px/15 w700 Neco; p 12.5/20 rgba(36,30,25,.85); h2 12.5/15.6 w700 Neco;
  table th 11.5/18.4 w700 centred, td 11.5/18.4; li 12.5/20 with strong; pre code 11.5/18.4 ui-monospace bg rgba(36,30,25,.05) r8 p10.
  Details: "Details" 13.5 w500; key 11.5 #494746 (104 wide), value 12.5 #241e19: Scope Personal/Company, Output "Answers in the chat", Created, Last Updated.

## New action form (1920 viewport; panel x 1021..1904, content x 1054..1871 = panel+33, width panel-66)
- Header 52 high, border-bottom 1px rgba(204,193,178,.6). Crumbs "Actions" > "New action". Only an x (no copy/share/delete).
- Step switcher: centred, top 155 (panel top+71), 36 high, wrap bg rgba(36,30,25,.03) 1px rgba(204,193,178,.7) r12; active pill #f8e37c r8 28h shadow 0 1px 2px rgba(35,30,25,.04), 13px w600; others 13px w500 #494746.
  Pill widths: "1. Workflow" 92, "2. Data & Files" 107.3, "3. Expected Output" 138.6 (padding 12). Labels x: 1302.9 / 1396.9 / 1506.7 (wrap x 1286.9, w 351.1).
- Step 1: label "Action Name" 12px/18 w600 at +121 (y205); input 36h at y229, bg rgba(36,30,25,.02) 1px rgba(204,193,178,.8) r12 pad 0 12, 14px; focused border rgba(75,67,61,.51).
  placeholder "e.g., Review Contract, Due Diligence Check" (#494746); help "A short, descriptive name for your action" 11.5px #494746 at 271.
  label "What should this action do?" at 304.3; textarea 328.3 .. 820.4 (bottom = panel bottom - 99.6), bg rgba(36,30,25,.03), pad 10 12, 14px/22.4.
  placeholder: 'Describe in detail what you want this action to do. For example:\n\n"Review a legal contract and identify key clauses, potential risks, and important dates. Highlight any unusual terms or conditions that might need attention."'
  under: "Be specific about inputs, outputs, and any particular style or format" 11.5px #494746 at 826.3; right: "100 more characters needed" 11px #96732c -> once 100+: "179 / 60,000" #494746.
  Next button 79.1x36 r12 #f8e37c at bottom (y 861 = panel bottom - 59), "Next" + arrow-right 16; disabled opacity .6.
- Step 2: "What data or files does it need?" 12px w600 at 205; p 11.5px/17.25 #494746 (2 lines at 1920): "Select knowledge base documents that this action should use as reference material, formulas, calculation models, templates, or data it needs to do its job."
  search label (white, 1px #ddd3c6, r12, 36h) at 277.5 "Search documents..."; list box at 321.5 .. 703.3 bg rgba(36,30,25,.02) 1px rgba(204,193,178,.8) r12; row: folder icon 14 #494746 at +15,+14; name 13px/19.5 at +37; chevron-right 14 at right-29.
  Firm KB (12 Oct, added by another session for 7.1): folder "Employment: models and precedents" -> 12_Skeleton_Argument.docx, Aldridge_Vine_Memo_Template.docx, Aldridge_Vine_Letter_Template.docx (checkbox 14 r6 1px #ccc1b3, word icon, name, eye icon right).
  "0 / 5 selected" 11.5px at 711.3; label "How should these documents be used?" 12px w500 #494746 + "(Optional)" rgba(73,71,70,.7); textarea 70h at 766.5 placeholder "e.g., Focus on sections 3-5 of the calculation model, use the formulas from the spreadsheet to validate totals...".
  Back button 81.2x36 outlined 1px #ccc1b3 r12 (arrow-left 14) at left; Next right.
- Step 3: "What output do you expect?"; p "Select documents that show what the final result should look like. This helps Andri match the exact format, structure, and style you need." (1 line at 1920, 2 at 1470)
  hint box at 260.3, 62.7h, bg rgba(150,115,44,.08) 1px rgba(150,115,44,.28) r12; message-square 16 #96732c at +13,+14; b "This action will answer directly in chat" 12px w600; p "No document output needed? Leave this empty and the action will produce text analysis." 11.5px #494746.
  search at 336.9; list 380.9..703.3; "0 / 3 selected"; label "What should the output look like?" (Optional); textarea placeholder "e.g., Always generate 2 PDFs, follow the same heading structure as the example, use formal language..."
  Back + "Create Action" (plus icon) 137.6x36 #f8e37c.

## Explore menu, Actions hovered (1920 viewport, menu at 343.7,16 676x338; same box as 4.1 X-explore: menu-relative = minus (343.7,16))
- menu white 1px #ccc1b3 r16 shadow 0 1px 2px rgba(35,30,25,.1), 0 12px 32px -10px rgba(35,30,25,.34). Trigger label inside top-left: on Matters page "Explore", on /actions "Actions" (chevron-up).
- hover highlight: 354.7,138 284x73 bg rgba(231,227,218,.6) r12 (Actions item: title 366.7,147.5 14px w600; desc 12px/16.5 #494746 2 lines).
- preview panel 648.7,63 360x279.5 bg #f2efe9 1px rgba(204,193,178,.7) r12; inner card 659.7,74 338x233.7 white r10 shadow 0 1px 2px rgba(35,30,25,.04);
  header row 26h "Actions" 11px w600 with zap 12 #494746 at x+10, bottom border rgba(204,193,178,.6);
  "Personal" 11px w500 #494746 at 666.7,101.8 (h19, text pad 8); row "Review contract" 11.5px w600 at 674.7,127.8 / "Checks a contract against your standard terms" 10.5px #494746 at 143.3;
  "Company" at 160.8 (h25); highlighted row 666.7,185.8 324x40 bg rgba(229,218,205,.45) r8 (cycles): "Due diligence check" / "Reads the file for risks and missing points";
  "Extract key dates" 232.8 / "Lists every deadline and date in a document" 248.3; "Compare versions" 272.8 / "Shows what changed between two versions" 288.3.
  footer 649.7,307.7 358x33.8 "Describe a task once, then call it in any chat." 11.5px/15.8 #494746 padding 8 12 10.
## Build in progress (live): list "Personal 1" section, row "Remedy-check" + desc, spinner disc right (964,187 in row 27,169: right-38, top+18); panel crumbs "Actions › Personal";
  How Andri built this: brain 20 #96732c at panel+17,+80; h2 16px/24 w600 Neco at +49,+69; sub 12px #494746 "Remedy-check · ● Working now" (dot 6 #96732c);
  timeline: line x panel+37 1px rgba(150,115,44,.5); small step dot 8 (bg #f2efe9, 1.5px rgba(220,206,188,.6)) + label 12px #494746 ("Running code", "Using tools") at x+57;
  Thinking card: x panel+57, w (panel-57-25), white 1px rgba(220,206,188,.5) r12, padding 15 17: "Thinking" 13px w600, time 11px #494746 right ("1m ago"), text 14px/22.75 #494746. Ring dot 14 (bg #f2efe9, 2px #96732c) at x+30.5 level with card title.
  last row: dot 8 #96732c + "Running code" rgba(36,30,25,.8) = current. Toast bottom-right: 356x73 white 1px rgba(204,193,179,.7) r12 shadow 0 4px 12px rgba(0,0,0,.1), info 17 #587e77, text 13px w500 2 lines "Action creation started. This may take a moment...".
  Thinking texts seen (no em dashes): "Since there are no input documents, I should quickly search to verify the current 2025 figures."
   "Working through the award calculation with someone born 1980-03-15 against an effective date of 2025-06-30, at age 45. ..."
   "The description looks clean without any angle brackets, and the example JSON total, claimed of 18200 checks out correctly. The SKILL.md example looks fine too, so I'm ready to finalize the output."

## Matter chat (Nair, my conversation "Academy 7.2"; 1920 viewport, chat column 464..1524; 4.1 snapshot has the 1470 layout)
- Header pill: Conversations 11 | ● Academy 7.2 (white, 1px rgba(204,193,178,.85) r8, 12px w600; count 10px w700 bg rgba(36,30,25,.07) r6; dot 6 #6b5b6e; name 12px w500 rgba(36,30,25,.8)). Knowledge Base 23 (22 + another session's 21_Letter).
- User row: bookmark circle 28 (#f2efe9, 1px #ccc1b3), x circle 28 (rgba(166,64,48,.1), 1px rgba(166,64,48,.4), x #a64030), "12 October 2026 11:28" 12px w500 #494746, avatar 24 (AF in video).
  bubble: bg rgba(248,227,124,.9) r 16 16 12 (16 16 4 16?) shadow 0 1px 3px rgba(0,0,0,.1), 0 1px 2px -1px rgba(0,0,0,.1), padding 13 16; mention chip "@Remedy-check" 16px/24 w600 #241e19 bg rgba(36,30,25,.09) r6 (135.4 wide).
  collapse button 28 circle under bubble right (chevron-right #494746) at bubble right-40, +61.
- Step rows (as 4.1 M-thread c8..c20): row box x col-8 (456 at 1920), h33, bg rgba(242,239,232,.3) 1px rgba(220,206,188,.4) r12; timeline dot 16 (white, 2px rgba(99,131,99,.7)) inner 8 rgba(99,131,99,.5); line 1px rgba(220,206,188,.6);
  circle-check 15.4 #638363; label 11px w600; chips 10px w500 pill. "Search case documents" + chip "by_title" (bg rgba(248,227,124,.1), 1px rgba(248,227,124,.3), text rgba(36,30,25,.65)) + italic "05_Tribunal_Judgment" rgba(36,30,25,.3); second line "1 hits" 10px w500 #638363 + chip "05_Tribunal_Judgment" (bg rgba(99,131,99,.08) 1px rgba(99,131,99,.25)) + count "2" bubble. Row h60.
  "Load Case Documents" + "1 hits" (h51.5); "Execute Command" + "1 hits". Thinking row: dot yellow (bg rgba(248,227,124,.15) 2px rgba(248,227,124,.9), inner rgba(248,227,124,.75)); chevron-right 12, lightbulb 12, "Thinking" 10.5px w500 ls .26 rgba(36,30,25,.8), circle-check 12; text 10px/13.75 rgba(36,30,25,.4) one line.
  Sequence in staging: Accessing memories (memories), (Case: remedy hearing gap = other session's memory, leave out), Personal user, Firm company, Review case summary (chevron), Discover case files *, Thinking, Accessing memories Personal working preferences, Firm house style, Search case documents by_title 05_Tribunal_Judgment, Load Case Documents, Execute Command, Thinking, Execute Code, Search case documents (21_Letter..., 09_Dismissal_Letter, 06...)...
- Answer: h1 "Remedy Check: [user icon]Priya Nair v [user icon]Calderdale Logistics Limited (1803442/2025)" 24px/28.8 w700 Neco ls -.24; person links #96732c underlined with user icon 14.
  h2 "1. Case Summary" 20.8px/26 w600 Neco; li 16px/26 #2e2924 (x col+24); dates #96732c underlined with calendar-clock 14; doc link #638363 underlined with file-text 14 (e.g. 05_Tribunal_Judgment).
  Tables: wrapper overflow-x auto padding 0 8; table 15.2px/21.71 #2e2924 border-collapse, outer rounded 16 (visible); th bold bg #f0ede6; th/td 1px #e6decf padding 7.6; v-align middle.
  Remedy Table columns at 1920 (1078 wide, overflows): No. 39 | Head of loss 99 | Claimed 83 | Linked claim 122 | Support status 91 | Judgment basis (para) 174 | Other side's argument 289 | Risk rating 73 | Action 107.
- Chat box (docked): 848 wide at 1920 (4.1: 720 at 1470), white 1px rgba(248,227,124,.8) r24 + focus shadow; with a mention: border rgba(99,131,99,.7), shadow 0 0 0 2px rgba(99,131,99,.25), 0 0 0 3px rgba(248,227,124,.12), 0 12px 28px -14px rgba(0,0,0,.4).
  chip text in box: "@[A:Remedy-check]" 16px/24 #638363 bg rgba(99,131,99,.16) r2 (153.4 wide); @ button bg rgba(248,227,124,.15) r8 28x28 + badge "1" 14x14 #f8e37c 9px at (+16,-2). With text: pen-line + bookmark icons appear before laptop.
- @ picker (Actions list): 720 wide (85% of box) x152, left = box left + 64 (centred), bottom = box top - 10; bg #ebe5db 1px #ccc1b3 r16 shadow 0 18px 44px -18px rgba(35,30,25,.34), 0 2px 6px -2px rgba(35,30,25,.1).
  header 45h: sliders-horizontal 14 #638363 at +13,+14; "Actions" 12px w500; kbd "←/→" 10px mono bg #e7e3da 1px #ccc1b3 r4 (32x20) + "Next: Assignments" 10px w500 #494746 + chevron-right 14 at right-30.
  row 58h bg #e5dacd (highlighted): icon sliders 14 #638363 at +13; "Remedy-check" 12px w500; tag "Company" 12px w500 bg rgba(220,206,188,.2) r4 (65.9x20) at +8; desc 12px #494746 "Compare the schedule of loss with the tribunal judgment. For..." (ellipsis at ~346 wide).
  footer: circle 20 bg rgba(150,115,44,.1) with sliders 12 #96732c, "Use ↑↓ to navigate, Enter to select" 11px w500.
  Matter Documents view (first): header "Matter Documents" (file-text #638363) + "Next: Company Documents"; rows: folder "employment" 22/09/2026 14:41 (+ "all" and "Tab >" pills); "This Week (1)" 21_Letter... (other session, leave out); "September 2026 (2)": Aldridge_Vine_Letter_Template.docx [DOC] Letter 22/09/2026 14:43, Aldridge_Vine_Memo_Template.docx [DOC] Memo 22/09/2026 14:43 (eye icons right).
  Order with →: Matter Documents → Company Documents → Document Tags → Actions → Assignments.

## Workflow builder (Explore → Workflows → New Workflow; not saved). 1920 viewport (offsets relative to panel/card)
- Builder card (aside) 16,84 to W-16, H-16; white r16; header row: chevron-left 16 + "Workflows" 12.5px w500 #494746 at 33/55, "Untitled Workflow" 13.5px w600 at 129.7 (y 101); right: "Save Draft" (save icon 14, 1px #ccc1b3 r8 104.5x32) and "Publish" (#f8e37c r8 64.8x32), divider 1x18.
- Canvas card 27,137 (to right panel-8), bg #f2efe9 1px rgba(204,193,178,.8) r16, dotted grid (#ccc1b3 dots); "+ Add Node" 91.6x32 #f8e37c r8 12.5px w600 at +11,+11; "Settings" 91.7x32 outlined (settings-2 icon 14). Zoom controls 34x100 white r12 bottom-left (zoom-in, zoom-out, maximize-2 in rgba(229,218,205,.6) square).
- Start card "Build your workflow" (520 wide) centred when empty: h2 15px w600 Neco, p 13px/21.1 #494746, 5 rows (36 icon box bg rgba(248,227,124,.15) 1px rgba(248,227,124,.4) r8; title 13.5 w500; sub 11.5 #494746; arrow-right 14): When an email arrives / When I click Run / On a schedule / Before a deadline / Start from a template; footer p 11.5px on rgba(36,30,25,.03).
- Right panel 460 wide (W-27-460 .. W-27), white 1px rgba(204,193,178,.8) r16; node list: section "AI Processing" 11px w500 + "Let Andri analyse, classify, or generate content" 10px rgba(73,71,70,.7); rows 32 icon boxes; "Run Prompt · Send a prompt to Andri and get a text response"; "Run Action · Execute a custom action from your action library" (circle-play); hover row bg rgba(36,30,25,.05) r8.
- Node on canvas: white card r16 ~434x218 (1470 screenshot): circle-play in grey square, "Run Action" label, big "Run Action" title, pill "! Not configured" (#96732c on #f2efe9-ish). Toast "Run Action added" (circle-check).
- Configure panel: header 52 (border-bottom): chevron-left 16, icon square 28 bg rgba(220,206,188,.3) r8 with circle-play 14, "Configure: Run Action" 13px w600, x 16.
  "Display name" 12.5px w500; input 36h bg #f2efe9 1px #ccc1b3 r12 value "Run Action"; "This label appears on the workflow canvas." 11px #494746.
  info box 115.6h bg rgba(88,126,119,.05) 1px rgba(88,126,119,.15) r8: info 14 #587e77; "Actions are reusable skills from your library" 12px w500; text 11px/15.1 #494746: "Select an action you've built in the Action Library. It receives the full workflow context including any files from previous steps. The action runs its own processing logic and can produce output files, text summaries, or both. If the trigger was an email with attachments, those files are bundled and passed to the action automatically."
  "Action to run *" 12.5 w500; select 42h bg rgba(231,227,218,.4) 1px #ccc1b3 r8 "Select an action from your library" 14px #494746 + chevron-down 16.
  Dropdown below select (+4): white 1px #ccc1b3 r12 shadow 0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1); search row 45h (search 16, "Search actions..." 14px); item 57h bg #e5dacd r8 (inset 4): building-2 16 #494746 at +38, "Remedy-check [0f3c9b3j]" 14px w500, desc 11px #494746 one line.
  then "Input files" label + "Select which files from upstream steps to pass into this action. These become the reference documents the action processes."; "Additional instructions (optional)" + textarea 112h placeholder "Focus specifically on section 3.2 regarding liability clauses and cross-reference with the attached precedent document."
  Footer 56h: Cancel (outlined) + Save Draft (#f8e37c).
