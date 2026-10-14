# Remedy-check [0f3c9b3j], built 12 Oct 2026 in about 4.5 minutes (staging), Personal, then shared to Company
What you asked for
Compare the schedule of loss with the tribunal judgment. For each head of loss, say whether the judgment supports it, what the other side will argue, and the risk. Output a table.

Skill Definition
## Remedy Check (h1)
Tests each head of loss in a schedule of loss against the findings in an employment tribunal judgment and outputs a remedy table in markdown.
## Inputs (bulleted)
- Schedule of loss (or counter-schedule) - required.
- Tribunal judgment with written reasons - required. If only the judgment without reasons is supplied, proceed but rate every head that depends on findings of fact as no better than Medium and say so in the Summary.
- Which party the user acts for. Default: the claimant. If acting for the respondent, the Opposing argument column records the claimant's likely response instead.
## Terms
Use these terms consistently:
- head of loss: one line or category in the schedule.
- schedule: the schedule of loss under review.
- judgment: the tribunal judgment and its written reasons.
- foundation: the successful claim on which a head of loss depends.
- opposing party: the party the user does not act for.
- EDT: effective date of termination.
## Reference files
- reference/heads-of-loss.md - read in Step 2. For each head of loss: required foundation, findings to look for, standard opposing arguments, key authorities.
- reference/adjustments-and-limits.md - read in Step 4. Order of adjustments, statutory limits and Vento bands by effective date, recoupment.
## Workflow
Copy this checklist and tick it off:
(pre)
- [ ] 1. Map the judgment
- [ ] 2. Test each head of loss
- [ ] 3. Run the arithmetic check
- [ ] 4. Check adjustments and caps
- [ ] 5. Assign risk ratings
- [ ] 6. Produce the output
- [ ] 7. Verify
### Step 1. Map the judgment
Extract from the judgment, with paragraph numbers: ...
(Output format: ## Summary, ## Remedy table | No. | Head of loss | Amount claimed | Support status | Judgment reference | Opposing argument | Risk | Action |, ## Adjustments and caps, ## Arithmetic check, ## Points requiring instructions)
Details: Scope Personal · Output Answers in the chat · Created 12 Oct 2026 · Last Updated 12 Oct 2026
