# Academy 10.1 · Your weekly memo, and other ways to start a workflow

Format: how-to walkthrough, same look as 1.1 and 1.2 (centred app window, cream to gold, one caption pill per step, Aldridge Vine, Nair v Calderdale Logistics). No welcome intro. Built on the 10.2 project (copied, never edited).

Source: `andri-academy-videos.html` → 10.1 (Chapter 10 · Workflows). Goal: "The viewer builds a scheduled workflow and knows the other ways one can start." Opens on: "The same Monday memo, and hearing prep that always starts late." Next video: 10.2 "Workflows: answer incoming emails automatically".

Note: a second session also builds 10.1 (`projects/2026-10-12-academy-10-1-workflows`). Bennett asked for a separate version (13 Oct). Nothing of theirs is read or used.

## Checked in Andri staging, 13 Oct 2026 (my own tab, my own workflow and matter)

| Brief says | Staging shows (13 Oct) |
|---|---|
| Explore → Workflows, empty page, New Workflow | Same as 10.2 saw. Staging's list now holds 10.2's and my workflow, so the empty page is 10.2's rebuild of the first visit. |
| Chooser: five ways to start | "Build your workflow": When an email arrives / When I click Run / On a schedule ("Run weekly, daily, or at set intervals") / Before a deadline / Start from a template. |
| Every Monday | Trigger node "Scheduled". Panel "Configure: Scheduled": info "This runs automatically, so no one needs to click anything … It has access to all matter context at the time of execution." How often * (Every hour, Every 6 hours, Every day (default), Every week, Every month), Time of day * 09 : 00 24-hour; Every week adds "Day of the week *" = Monday (default). Common use case: "Generate a weekly matter status report every Monday morning". |
| Run Prompt: the instruction | "Configure: Run Prompt": "Your prompt receives the full workflow context", Prompt template * (placeholder is an email example), Insert data from previous step, File attachments, Boolean mode. New steps land over the last one; drag and join handle to handle. |
| Create Document | "Configure: Create Document": "The Word document is generated, then passed downstream", Instructions for the document *, Document template (optional), Reference files, Output filename. |
| Publish (Andri checks the steps) | Two-slide explainer "Your workflow is published · Published workflows are templates. They don't run on their own." / "Activate in a matter". No step check message. |
| Switch it on in the matter | Matter → Workflows: "Available Workflow Templates" → Activate. **A scheduled workflow activates straight away, no dialog**: toast "Workflow activated for this matter", section "Active · Running on this case. Each one fires when its trigger occurs.", row "Active · v1 · Scheduled · 3 nodes", sidebar badge 1. Menu: Pause workflow / Executions / Edit template / Deactivate. Executions: "Execution History", "No executions yet · Executions will appear here when the workflow is triggered." |
| Before a deadline | Deadline Approaching ("Fires on a specific date or before it"): "Andri monitors your matter dates and fires before the deadline … Set it to fire 14 days before a hearing to start preparation". Deadline date and Days before the deadline: "Configured when activated in a matter". |
| When a task is done | Assignment Updated ("Fires when an assignment on this matter is updated"); use case "Send an email to the partner when an assignment is marked done". |
| By hand | Manual Trigger ("Started by clicking Run in the UI"): "If you don't define any fields, the workflow starts immediately with one click." |

## Calls I made myself

- Separate version of 10.1, as Bennett asked; own folder, own staging items, own snapshot marker.
- The prompt says "in this matter", not "in Nair v Calderdale": a workflow is a template that can be switched on in any matter, and a scheduled run has the whole matter's context (staging's own line).
- Create Document: instruction only, no template list (10.2 teaches it).
- The brief's deadline and task chains are not built step by step: the video names each trigger over its real row in + Add Node with the app's own example (14 days before a hearing; email the partner when it's marked done). Their dates are set at activation, so a built chain would show nothing more.
- Brief's "Andri checks the steps" on Publish is not in staging (staging wins).
- The publish explainer is drawn from 10.2's snapshot of the same dialog (same text), over my own builder; re-publishing my workflow would have made a v2.
- Where the memo lands after a run is not shown (no run could happen before Monday); the voice says each run appears under Executions, which staging shows.
- My workflow "Weekly matter memo (Academy 10.1 WM)" is published and active in my own matter "Academy 10.1 WM" (shown as Nair v Calderdale Logistics); deactivated after delivery. Left for Bennett to delete (I may not delete).

## Beats (narration UK voice, about 120 wpm)

| # | On screen | Narration | Caption |
|---|---|---|---|
| 0 | Title card "ANDRI ACADEMY · 10.1", "Your weekly memo," / "and other ways to start a workflow." | N0 "Writing the same Monday memo every week? Build it once as a workflow, and Andri writes it for you." | |
| 1 | Matters → Explore → Workflows → empty page → New Workflow → chooser | N1 "Open Explore, then Workflows, and click New Workflow." | 1 A new workflow |
| 2 | Chooser; rings on the four starts as named; click On a schedule → node + list | N2 | 2 Choose how it starts |
| 3 | Click node → Configure: Scheduled; How often → Every week; Monday appears; ring Monday and 09:00 | N3 | 3 Every Monday |
| 4 | Save → list → Run Prompt lands, drag, join, open, type the prompt | N4 | 4 The instruction |
| 5 | Save → Create Document lands, drag, join, open, type | N5 | 5 The memo |
| 6 | Save → name "Weekly matter memo" → Publish → explainer slide 1 | N6 | 6 Publish |
| 7 | Close → Matters → Nair row Workflows → Activate → Active + toast → … → Executions | N7 | 7 Switch it on |
| 8 | … Edit template → builder → + Add Node; ring Deadline Approaching, Assignment Updated, Manual Trigger with description sweeps | N8–N10 | 8 Other ways to start |
| 9 | Window fades; end card "Andri Academy · Next: Workflows: answer incoming emails automatically" | N11 | |
