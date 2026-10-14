# Academy 10.2 · Workflows: answer incoming emails automatically

Format: how-to walkthrough, same look as 1.1 and 1.2 (centred app window, cream to gold, one caption pill per step, Aldridge Vine). No welcome intro. App part 1.25x slower than feels right (8.1 lesson).

Source: `andri-academy-videos.html` → 10.2 (Chapter 10 · Workflows). Brief: "The viewer builds a workflow that reviews an incoming email's attachment and replies after approval." Opens on: "A client emails a contract. Someone has to read it, check it and reply." Next video: 10.3 "Start from a ready example: overnight redline, new client intake".

## Checked in Andri staging, 12 Oct 2026 (my own tabs, my own workflow and matter)

| Brief says | Staging shows (12 Oct) |
|---|---|
| Before you start: an Action with your checklist, a connected Outlook or Gmail | The Run Action list has one action, "Remedy-check [0f3c9b3j]" (made and shared in 7.2). No mailbox is connected anywhere in staging. |
| Trigger Email received: matter inbox, connected Gmail or Outlook | New Workflow → "Build your workflow" chooser → "When an email arrives". Panel "Configure: Email received": "This watches the matter inbox, not your personal email" (subject, sender, body text, all attachments), Inbox source: Andri inbox (default, "No external integration required") / Gmail / Outlook. "Email filters … Configured when activated in a matter". |
| Run Action → your checklist, on the email's attachments | Add Node → AI Processing → Run Action. New nodes land near the middle, over the others; you drag them and join handle to handle. Panel: "If the trigger was an email with attachments, those files are bundled and passed to the action automatically." Action to run → Remedy-check; "Text output" box appears. |
| Create Document: a short memo | Panel: Instructions for the document *, Document template (optional) from the company knowledge base: 12_Skeleton_Argument.docx, Aldridge_Vine_Memo_Template.docx, Aldridge_Vine_Letter_Template.docx. Reference files: Attach from previous step → Email file attachments. "Attach from previous step" only appears once the step is joined. |
| Pause / Approval | "Pause and wait for a team member to approve or reject". Who can approve: Any administrator / Any team member with matter access / A specific person → Approver (shows the email address with "(Admin)"), Summary for the approver *. Node has Approved and Rejected handles; the joined edge gets an "Approved" label. |
| Send Email to the sender, memo attached, from your own mailbox | "Emails are sent from the matter owner's own mailbox". Send from: Outlook (Microsoft 365) / Gmail (Google Workspace). To: Insert data → Sender email address {{trigger.email.from}}. Subject, Body, File attachments → Generated document files {{steps.create-document.files}}. Node shows "Limited recipients". |
| Publish, "Andri checks the steps" | Publish shows a two-step explainer: "Your workflow is published · Published workflows are templates. They don't run on their own." then "Activate in a matter · …recipients, filters, and any other matter-specific values." No step check message seen. The list then shows it under Personal, "Published". |
| Activate in the matter, the email filter | Matter → Workflows: "Available Workflow Templates" → Activate → "Configure for this matter": Email filters (Required; From a specific sender / Has PDF attachments / Subject contains keyword; "Built-in safety brakes"), Send from Outlook: "Not connected to this matter" + "Connect and turn on sending". Activate stays disabled: "Send Email: Outlook (Microsoft 365) cannot send from this matter yet". |

## Calls I made myself (listed at delivery)

- The memo goes to the client (it is attached to the reply), so the instruction reads "Write a short memo for the client on the document she sent…", in the Aldridge Vine memo template.
- No mailbox can be connected in staging (sign-in, not allowed), so the video stops at the Activate dialog: the voice says to connect Outlook with sending turned on, then click Activate. No "active" state is shown, because I could not see one.
- The workflow was built and published in staging as "Check and reply to client documents (Academy 10.2)" and switched on (dialog only) in my own matter "Academy 10.2"; on screen they show as "Check and reply to client documents" and Nair v Calderdale Logistics. Left in staging for Bennett to delete.
- The opening Workflows page is the empty state I saw first in staging ("Automate your legal workflows"), rebuilt from the published-list snapshot, since my own workflow now fills the list.
- The publish explainer's illustration shows the app's own sample matter; left as staging shows it.

## Beats (narration UK voice, about 120 wpm)

| # | On screen | Narration | Caption |
|---|---|---|---|
| 0 | Title card "ANDRI ACADEMY · 10.2", "Workflows: answer incoming" / "emails automatically." | "When a client emails you a document, someone has to read it, check it and reply. Here's how to build a workflow that does it for you." | |
| 1 | Matters → Explore menu, hover Workflows (preview), click → empty Workflows page → New Workflow → chooser. | "Open Explore, then Workflows, and click New Workflow." | 1 A new workflow |
| 2 | Chooser: click "When an email arrives" → trigger node + step list. | "Every workflow starts with a trigger. Choose When an email arrives." | |
| 3 | Click the trigger → its settings; ring the matter-inbox box; open Inbox source (Andri inbox, Gmail, Outlook). | "It fires when an email reaches the matter's own inbox, or a connected Gmail or Outlook, and it passes on the sender, the text and every attachment." | 2 The trigger |
| 4 | Save → step list → Run Action → node lands, drag below, join. | "Next, the check. From the list, add Run Action, drag it under the trigger and join the two." | 3 Check it |
| 5 | Run Action settings → Action to run → Remedy-check → Text output. | "Pick the action that holds your checklist. This firm made Remedy check once, under Explore, Actions. The email's attachments go to it automatically." | |
| 6 | Create Document added, joined; type the instruction; template list → Aldridge_Vine_Memo_Template.docx; attach Email file attachments. | "Then Create Document. Say what the memo should cover, and pick your firm's memo template, so it comes out in your house style." | 4 Write the memo |
| 7 | Pause / Approval added, joined; Who can approve → A specific person → Adam Frith; note typed. | "Nothing should go out unchecked. Add Pause / Approval, choose a specific person, Adam Frith here, and write a short note for the approval request." | 5 Approve it |
| 8 | Send Email added, joined from Approved; Outlook; To → Sender email address; subject, body; attach Generated document files. | "Last, Send Email, joined to the Approved side. It goes from your own Outlook or Gmail to whoever sent the email, with the memo attached." | 6 Reply |
| 9 | Close panel (fit view), rename, Publish → explainer 1 and 2. | "Name the workflow and click Publish. A published workflow is a template: it doesn't run on its own." | 7 Publish |
| 10 | Nair → Workflows → Activate → Configure for this matter; From a specific sender → priya.nair@outlook.com. | "To switch it on, open the matter, go to Workflows and click Activate. Add a filter, so only Ms Nair's emails start it." | 8 Switch it on |
| 11 | Scroll to Send from; ring "Not connected to this matter" and "Connect and turn on sending", then Activate. | "Andri replies from your own mailbox, so connect your Outlook to this matter with sending turned on. Then click Activate." | |
| 12 | Window fades; end card "Andri Academy · Next: Start from a ready example: overnight redline, new client intake". | "From then on, every document Ms Nair sends is checked, written up and answered, as soon as Adam approves." | |

Zoom only on: the trigger's matter-inbox box and Inbox source list (small text), the template list (file names), and the Send from rows in the Activate dialog.
