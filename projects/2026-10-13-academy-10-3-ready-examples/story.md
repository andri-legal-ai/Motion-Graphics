# Academy 10.3 · Start from a ready example: overnight redline, new client intake

Format: how-to walkthrough, same look as 1.1, 1.2 and 10.2 (centred app window, cream to gold, one caption pill per step, Aldridge Vine). No welcome intro.

Source: `andri-academy-videos.html` → 10.3 (Chapter 10 · Workflows). Brief: "The viewer starts from a ready-made workflow instead of building one." Opens on: "The other side's redline arrives at midnight." Watch first: 10.1. Next video: 11.1 "Before you invite a colleague".

## Checked in Andri staging, 13 Oct 2026 (my own tab; my own copy and matter)

| Brief says | Staging shows (13 Oct) |
|---|---|
| New Workflow → Start from a template → "Create a Workflow": Blank Workflow plus four Examples | Same. "Build your workflow" chooser → "Start from a template · Begin with one of the example flows and adapt it" → "Create a Workflow · Start from a template or build from scratch." Blank Workflow, then Examples. |
| Contract Redline Response (6 nodes), Daily Morning Briefing (3), Matter Status Memo (4), Intake to Advice: Full Case Workup (12) | Same names with "(Example)", same node counts (5, 2, 3 and 11 connections). At a 860 px tall window the fourth card runs under the bottom edge, so the list scrolls. |
| Redline: reviewed overnight, counter-proposals as tracked changes and comments in the same .docx | Email Received (filter: attachment filename ends with ".docx") → Conditional Check "Is this a contract redline?" (True only; False goes nowhere) → Run Prompt "Review redline against the case" (per change: clause, before → after, impact, risk High/Medium/Low, response) → Create Document "Counter-edit the redline in place" (new tracked changes or inline comments, ESCALATE comments, same file) → Run Prompt "Compose email body" → Send Email "Draft email response (pending review)" from Outlook to `{{context.userEmail}}` (the lawyer, not the other side), attachment `{{steps.counter-edit.files}}`. |
| Intake: in scope, complete, triage, dossier, lawyer approves, then advice and next-step letter; "logs the time"; out of scope or incomplete → the right message | Intake email arrives (filter: subject contains "intake") → "Is this a matter we handle?" (False → Send Email "Politely refer the matter elsewhere" to the sender) → Run Prompt "Run intake checks" → "Is the file complete enough to act on?" (False → Send Email "Ask the client for the missing pieces" to the sender) → "Triage the matter" → Create Document "Build the lawyer dossier" → Pause / Approval "Lawyer reviews the dossier" (any team member with matter access, 48 h expiry; Rejected goes nowhere) → Create Document "Draft the advice report" → Run Prompt "Draft the next-step correspondence" → Send Email "Send the advice report to the lawyer" (to `{{context.userEmail}}`, the draft letter in the body). **No time-logging step in staging: left out.** The scope question names the firm's "civil and commercial practice" (consumer, property, employment, contract, landlord and tenant). |
| Make it yours: open, adjust, Publish, activate in the matter | Panel edits only stick after the panel's own **Save Draft**. Publish shows the same two-step explainer as 10.2. The matter's Workflows page → Activate → "Configure for this matter": the example's subject filter "intake" comes pre-filled (with a "Subject-only filter: replies will re-fire" note), then Send from for each of the three Send Email steps: "Not connected to this matter · Connect and turn on sending". Activate stays disabled ("Politely refer the matter elsewhere: Outlook (Microsoft 365) cannot send from this matter yet"). |

## Calls I made myself (listed at delivery)

- Two examples are shown, as the title says: the redline one is walked through (it can't be run: it needs a real incoming email); the intake one is walked through and then made our own.
- "Make it yours", done for real in staging on my copy: the scope question's practice area changed to "the firm's employment practice (for example: unfair dismissal, discrimination, redundancy and settlement agreements)" (Aldridge Vine is an employment practice, as in the 11.2 brief); the approval changed to a specific person, Adam Frith; renamed "Employment intake to advice"; published. Saved as "Employment intake to advice (Academy 10.3)" in staging, shown without the suffix.
- The matter: my own new matter "Academy 10.3", shown as "New client enquiries" (an intake workflow runs on the matter whose email address receives enquiries). The matters list shows only it and the demo matter Nair v Calderdale Logistics (real row from staging, 12 Oct).
- Activate can't be completed (no mailbox can be connected in staging), so the video ends on the dialog and the voice says to connect Outlook or Gmail with sending on, then click Activate. Same as 10.2.
- Priya Nair is named only as an example of who might write in ("Say a prospective client, like Priya Nair..."); nothing is run on her, no result is shown.
- "Logs the time" (brief) is not in staging's example, so it is not said.
- The opening Workflows list is the empty state (as in 10.2): other sessions' workflows are left out, and the examples open unsaved until published.
- Hover looks: staging's yellow buttons (New Workflow, Publish) have no hover style in its CSS, so they don't change; list rows, cards, menu options and Activate show staging's own hover look (captured with a real mouse over the snapshot).

## Beats (narration UK voice, one take)

| # | On screen | Narration | Caption |
|---|---|---|---|
| 0 | Title card "ANDRI ACADEMY · 10.3", "Start from a ready example" / "overnight redline, new client intake." | "The other side's redline lands at midnight. A ready-made workflow can have it reviewed and marked up by morning. Here's how to start from one, and make it your own." | |
| 1 | Matters → Explore → Workflows → New Workflow → chooser. | "Open Explore, then Workflows, and click New Workflow." | 1 Find the examples |
| 2 | Hover and click "Start from a template" → Create a Workflow. | "This time, choose Start from a template." | |
| 3 | Rings: Blank Workflow, then each example as named; the list scrolls to the fourth. | "Start blank, or from one of four examples: a contract redline response, a daily morning briefing, a matter status memo, and a full intake for new clients." | |
| 4 | Click Contract Redline Response → its six-step canvas; the camera moves in on the steps. | "Open the contract redline response. All six steps are already in place." | 2 Overnight redline |
| 5 | Click the trigger: its filter (attachment ends with ".docx"); click "Is this a contract redline?": its question highlighted. | "It starts when an email arrives with a Word document attached. First, Andri checks that it really is a contract with tracked changes." | |
| 6 | Click "Review redline against the case": its prompt highlighted. | "Then it reviews every change against the facts of your case, and rates the risk." | |
| 7 | Click "Counter-edit the redline in place": its instructions highlighted. | "Next, it counter-edits the redline in place: new tracked changes and comments, inside the same Word document." | |
| 8 | Click "Compose email body", then the Send Email step: To `{{context.userEmail}}`, attachment `{{steps.counter-edit.files}}`. | "Last, it writes a short covering note and emails it to you, with the document attached. Nothing goes back to the other side until you've checked it." | |
| 9 | Back to Workflows → New Workflow → Start from a template → Intake to Advice → its 12-step canvas. | "Now the intake example. Say a prospective client, like Priya Nair, emails in after her dismissal." | 3 New client intake |
| 10 | Camera follows the canvas: scope check, the refer-elsewhere email. | "Andri first checks the matter is one your firm handles. If it isn't, the client is politely referred elsewhere." | |
| 11 | Intake checks, the completeness check, the ask-for-missing-pieces email. | "Then it checks the file is complete. If something is missing, it asks the client for it." | |
| 12 | Triage, dossier. | "If everything is there, Andri triages the matter and builds a dossier for the lawyer." | |
| 13 | Lawyer reviews the dossier (Approved), advice report, next-step correspondence, send to the lawyer. | "Nothing is written for the client until the lawyer approves. Then Andri drafts the advice report and the next letter or email, and sends both to you to check." | |
| 14 | Open the scope check; select the practice-area words; type the employment practice; Save Draft. | "To make it yours, change what doesn't fit. Aldridge Vine only takes on employment work, so say that in the first check, and save." | 4 Make it yours |
| 15 | Open the approval; Who can approve → A specific person → Adam Frith; Save Draft. | "And send every approval to one person: Adam Frith." | |
| 16 | Rename "Employment intake to advice"; Publish → explainer 1 and 2 → Got it. | "Give it a name, and click Publish. It's now a template, ready to switch on in a matter." | 5 Publish |
| 17 | Matters → New client enquiries → Workflows → Activate. | "Go to the matter whose email address receives your enquiries, open its Workflows, and click Activate." | 6 Switch it on |
| 18 | The pre-filled "intake" subject filter; scroll to Send from: "Not connected to this matter", "Connect and turn on sending"; Activate. | "The example already listens for the word intake in the subject line. Connect your Outlook or Gmail with sending turned on, then click Activate." | |
| 19 | Window fades; end card "Andri Academy · Next: Before you invite a colleague". | "Start from an example, change what doesn't fit, and switch it on." | |
