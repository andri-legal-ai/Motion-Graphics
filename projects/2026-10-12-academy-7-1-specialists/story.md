# Academy 7.1 · Your firm's experts, on call

Format: how-to walkthrough, same look as 1.1 and 1.2 (centred app window, cream to gold gradient, one caption pill per step, Aldridge Vine demo firm). No welcome intro. Brief says 2:12; length follows the topic.

Source: `andri-academy-videos.html` → 7.1 (Chapter 7 · Specialists and Actions). Learning goal: "The viewer builds a specialist from the firm's own models, then one per team." Next video: 7.2 "Actions: write a brief once, use it in chat and workflows".

## Decisions (Bennett, 12 Oct 2026)

- Build for real in shared staging: firm folder "Employment: models and precedents" (Aldridge_Vine_Letter_Template.docx, Aldridge_Vine_Memo_Template.docx, 12_Skeleton_Argument.docx) and the "Employment law" specialist. Left in place at the end; Bennett deletes them.
- Test chat: my own new conversation "Academy 7.1" in Nair v Calderdale Logistics.
- "One per team": narrated over real screens only, no invented cards.
- Screens: live staging DOM snapshots (4.1/5.1 method), not video-1.1/src.

## Checked in Andri staging, 12 Oct 2026

| Step in the brief | What staging shows |
|---|---|
| Explore → Specialists | Explore menu: Case law, Actions, Specialists ("Colleagues Andri consults, built from your files"), Workflows; hovering Specialists shows a preview panel with example rows. Specialists page: "0 of 15 specialists", info icon, "New specialist". |
| Empty page | "No specialists yet" / "A specialist is a colleague Andri consults. Choose a slice of your knowledge base, and Andri studies it, writes the specialist its own brief, and asks it whenever a matter calls for what it knows." / "Add the first specialist" / example cards Employment law, Corporate governance, Data protection / footer "A specialist advises Andri with direction and references. It never drafts for you." |
| New specialist | Panel slides in from the right (list narrows). "Specialists › New specialist". Intro: "Name it, say when Andri should consult it, and choose what it learns from. Andri studies those files and writes the specialist its own brief." |
| Name | Placeholder "Employment law"; hint "A short name, two or three words at most." After typing, the hint changes to "Andri will consult it as employment-law" and the specialist is then shown as "employment-law". |
| When should Andri consult it? | "One line. This is the only thing Andri reads when it decides whether to ask this specialist, so say what it knows and when it is the right one." Counter "0 / 300". |
| Notes for the build (optional) | "Read once, while the specialist is being built. It shapes the brief and is not consulted afterwards." |
| What it learns from | "Files and folders from your knowledge base. A folder brings everything inside it. At most 100 files and 256 MB in total." Picker: search, breadcrumb "Knowledge base", the folder row with a choose circle and an open chevron. Choosing the folder: chip "Employment: models and precedents ×", "A folder brings everything inside it, now and later.", "0 of 100 files chosen · 1 folder", Clear. Build specialist enabled. |
| Build | Panel switches to the specialist: avatar "EL", "employment-law", Building badge, the consult line, tabs Build / Details. "Andri is reading every file this specialist will know and writing the brief it works from. This takes a few minutes. You can leave this page; the build carries on." Live steps: "Started with 3 documents" (the three files), Thinking, Running code. List row: EL, Building, "1 folder"; counter "1 of 15 specialists". Toast "employment-law is being built". |
| Ready | About 6 minutes later: Ready badge; the consult line is rewritten by the build ("Knows Aldridge Vine LLP's house letter and memo templates (structure, tone, fixed text, conventions) and the Nair v Calderdale Logistics redundancy/maternity matter, including its ET skeleton. Consult to shape or check a firm letter or memo, or for the Nair files' facts and positions."); "The brief" (editable textarea, 6,801 / 40,000) "The specialist's own instructions, written by the build. Edit them and it follows yours instead."; Details: Chosen 1 folder, Studied 3 files, Version v1; header buttons Rebuild, Delete, Close. |
| It works | In my conversation in Nair: "Draft a short letter to Ms Nair explaining what the tribunal can award her for unfair dismissal." Andri drafted it on the firm's letter format by searching company documents itself, without consulting the specialist. The follow-up "Check that letter against our firm's house style before it goes out." made Andri consult it on its own: step "Consulting @employment-law", then "The draft does not yet match the house style… I checked it against the firm's Aldridge Vine letter template using the employment-law specialist…" with a list of departures. The video shows that pair (the brief's "same drafting question again" did not trigger a consult in staging). |
| Ask it directly | Typing @ opens the list on Matter Documents; ←/→ steps through Matter Documents, Company Documents, Document Tags, Actions, Assignments, Threads, Specialists (← once from the first section reaches Specialists). Specialists shows "employment-law" with its line. Picking it gives a yellow chip "@[S:employment-law]". "what are the four headings in our memo template?" → "Consulting @employment-law", then "Yes, the memo template has four headings… Background, Issues, Analysis, Recommendation (singular)". |
| One per team | Not built (one set of firm files). Narrated over the real Specialists page (1 of 15). |

## Beats (v1, 1:56)

| # | Time | On screen | Narration (UK voice) |
|---|---|---|---|
| 0 | 0:00 | Title card "ANDRI ACADEMY · 7.1", "Your firm's experts," / "on call." Waving mascot; pushes up 0.5 s after the line. | "Still pasting your firm's own clauses over Andri's, by hand? Give Andri a colleague who already knows them." |
| 1 | 0:09 | Company › Knowledge base › Employment: models and precedents: the three files (highlights), ring on Knowledge base. | "A specialist learns from files you choose. Here, Aldridge Vine's letter and memo templates and a skeleton argument sit in one folder, in the Company Knowledge Base." |
| 2 | 0:20 | Explore menu → Specialists; empty page (highlights on the first sentence and the footer). | "Open Explore, then Specialists. A specialist is a colleague Andri consults. It gives direction and references, and never drafts for you." |
| 3 | 0:30 | New specialist → panel; "Employment law" typed, hint changes. | "Click New specialist, and give it a short name. Employment law." |
| 4 | 0:35 | Consult line typed, counter 95 / 300, gentle zoom, highlight on the help line. | "Then the most important line: when should Andri consult it? This is the only thing Andri reads when it decides whether to ask, so say what it knows." |
| 5 | 0:45 | Build note typed. | "Notes for the build are optional. Andri reads them once, while it builds." |
| 6 | 0:50 | Form scrolls; folder chosen; chip; "now and later" line highlighted. | "Now choose what it learns from. Pick the folder, and everything inside comes with it, now and later." |
| 7 | 0:57 | Build specialist → Building, steps stream; highlight "This takes a few minutes…". | "Click Build specialist. Andri reads every file and writes the specialist its own brief. It takes a few minutes, and you can leave the page." |
| 8 | 1:06 | Ready: ring on Ready, highlights on the rewritten line and "Edit them…". | "When it's ready, Andri has rewritten the consult line from what it read, and the brief it wrote is yours to edit." |
| 9 | 1:13 | Matters → Nair → the letter ("Dear Ms Nair" highlighted); request typed and sent; Consulting @employment-law; the answer, template link highlighted. | "Back in a matter, Andri has just drafted a letter to Ms Nair. Ask it to check the letter against your house style." / "Andri consults the specialist by itself, and comes back with every change the firm's letter template asks for." |
| 10 | 1:28 | @ → Matter Documents → Specialists (ring) → chip, question, answer ("memo template" highlighted). | "To ask it yourself, type the at sign, and pick it from Specialists." / "It answers straight from your firm's memo template." |
| 11 | 1:37 | Explore → Specialists: 1 of 15; ring New specialist; highlight the consult line. | "Add one specialist per team, or a playbook with your negotiation positions. Keep each consult line to its own area, so Andri always asks the right colleague." |
| End | 1:49 | Window fades; end card "Andri Academy · Next: Actions: write a brief once, use it in chat and workflows". | "Your firm's know-how, on call in every matter." |

Demo swaps in the rebuild: "Bennet law" → "Aldridge Vine", user avatar/initials → AF, Inbox count → 1, conversation name "Academy 7.1" → "Letter to Ms Nair", "Added by" (off screen) → Adam Frith. The Matters list shows only Nair.

Staging items left behind (for Bennett to delete): firm folder "Employment: models and precedents" (3 files) in Company › Knowledge base; specialist "employment-law"; conversation "Academy 7.1" in Nair (3 turns).
