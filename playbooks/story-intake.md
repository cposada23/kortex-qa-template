---
title: "Playbook — Story intake"
type: playbook
status: active
language: en
tags: [playbook, story, ac, jira]
updated: 2026-05-20
---

# Playbook — Story intake

The workflow from "a Jira ticket landed on me" to "I have
Teams-ready questions for the dev/PO". ~10–20 minutes per story
depending on AC complexity.

## When

Triggered by any of:

- Sprint planning assigned you a ticket for the new sprint.
- Mid-sprint, a new ticket got assigned to the team and you're
  on the QA subtask.
- Refinement / grooming added a ticket you should look at early.

## Steps

### 1. Scaffold the story folder

Two paths:

**A. Via Copilot Chat (preferred for first-time interaction with
the ticket):**

Invoke `/story-intake`. Provide the ticket URL, key (e.g.
`TEAM-1234`), a 2–6 word slug, priority, and sprint. The prompt
will create the folder, fill `story.md`, and run an initial AC
audit in one motion.

**B. Via the CLI (preferred when you already know the AC and
just want the structure):**

```bash
node scripts/new-story.mjs TEAM-1234 search-filter-empty-input
```

Then open `story.md` and paste the ticket body manually.

### 2. Fill `story.md`

The required sections:

- `## Summary` — one paragraph in the team's voice. Often a
  copy from the ticket; trim if verbose.
- `## Acceptance criteria` — paste verbatim from Jira. Don't
  rewrite. Audit happens in `ac-audit.md`.
- `## Out of scope` — what the ticket explicitly excludes.
- `## Dependencies` — other tickets, infra, etc.
- `## Notes` — your running notes. Start empty.

Set frontmatter:

- `status: in-progress` (or `backlog` if not yet started)
- `priority:`, `sprint:` to match the ticket
- `ac_audit_status: pending` (will flip to `done` after the audit)

### 3. Run the AC audit

Invoke `/ac-auditor` (or it auto-runs as part of `/story-intake`).

The audit:

- Categorizes findings (ambiguity, missing constraints,
  untestable phrasing, hidden assumptions, missing negative paths,
  cross-cutting concerns)
- Assigns severity to each finding
- Drafts Teams-ready questions for dev/PO

Output lands in `ac-audit.md`.

### 4. Decide: ask now, or design now?

Look at the findings:

- **Blockers exist** → send the questions to the dev/PO first.
  Don't proceed to test case design until you have answers.
  Update `status: blocked` if waiting blocks all forward motion.
- **Only important / minor findings** → proceed to test case
  design. Note the questions and ask asynchronously in the
  background.

### 5. Send questions externally

Open `ac-audit.md` → `### Questions for dev/PO`. Copy verbatim.
Paste into:

- **Teams DM to the dev** (the lead dev on the ticket — see
  `team/members.md` for who).
- **Or as a Jira comment** on the ticket itself, if the team's
  convention is to keep discussion there.

**No mention of the brain, the audit, or AI** — the questions
must read as your own. (This is enforced by the prompt; double-
check the output.)

### 6. Update the story status

After clarification answers arrive:

- Append the answers to `ac-audit.md` in a `## Update YYYY-MM-DD`
  section.
- If AC changed materially, update the `## Acceptance criteria`
  section of `story.md` to reflect the resolved understanding.
- Flip `ac_audit_status: done`.
- Move to `/story-analyzer` for scenario discovery, then
  `/test-case-design` for each chosen scenario.

## Common AC smells

Surface these explicitly in the audit:

- **"Should be fast / intuitive / secure"** — untestable. Push
  for a measurable target.
- **"Recent / latest / current"** — what's the cutoff? Ask.
- **"All users see X"** — across all roles? On all devices?
  Real-time? Ask.
- **"The system should handle Y"** — what's "handle"? Graceful
  failure? Silent retry? Loud error?
- **No mention of negative paths** — what happens on bad input?
  On network failure?
- **No mention of edge values** — what's the min / max input
  size? Date range?
- **Cross-cutting silence** — accessibility? i18n? mobile?
  Real-time vs eventual consistency? Concurrency?

## Hard rules

- AC are captured verbatim in `story.md`. Never edit them there;
  re-audit in `ac-audit.md` instead.
- The questions section of `ac-audit.md` is externally-visible.
  Apply external-comms rules — first person, no AI scaffolding.
- Don't skip the audit because the AC "looks fine." The 5-minute
  audit catches the issue that would have cost an hour during
  execution.
- If the ticket has zero AC, that itself is the finding. Escalate
  to PO with a refinement request.

## When the story is not yours but the AC is concerning

If you're assigned to *review* someone else's test cases (the
team's test-case-review subtask), and you notice the AC is weak:

- Don't write your AC audit in `reviews/<TICKET>.md` — that file
  is for reviewing the test cases, not the AC.
- Instead, flag the AC issue to the author of the story directly
  (Teams DM or Jira comment, in your voice). The author should
  re-audit and update their `ac-audit.md`.
