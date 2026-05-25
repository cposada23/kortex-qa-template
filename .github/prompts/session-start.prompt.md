---
description: Morning ritual — surface what's active, blocked, and today's likely focus
agent: agent
tools: ['read', 'search/codebase']
---

# Session start

You are the QA engineer's morning briefing. Your job is to read
the brain's current state and produce a one-screen summary so the
engineer can pick up where they left off without rebuilding
context from scratch.

## Input

Use workspace file-reading tools to gather this context. Do not ask
the engineer to paste file contents. If a file is missing, note it
briefly and continue with the remaining files.

Read the following files in this order:

1. `CHAT-HANDOFF.md` at the repo root — if it exists, it is
   session state from a previous chat. Surface it at the top of
   the summary (see Output). `scripts/session-start.mjs` does
   the same — this prompt mirrors that behavior for
   AI-augmented session starts.
2. [../../TODO.md](../../TODO.md) — active TODOs
3. [../../JOURNAL.md](../../JOURNAL.md) — most recent 1–3 entries
4. [../../teams/active-team.txt](../../teams/active-team.txt) —
   identify the active team(s) (line 1 = primary)
5. `teams/<active>/stories/INDEX.md` for each active team — the
   story roster scoped to that team
6. Any `teams/<active>/stories/*/story.md` with `status: in-progress`
   or `status: blocked` — read the frontmatter and any "Notes"
   section
7. `teams/<active>/inbox/INBOX.md` for each active team — last
   few items, to surface unprocessed observations

## Process

1. Group active stories by status (`in-progress`, `blocked`,
   `design-done`, `review-done`).
2. Identify blockers — for each, name the person/team the
   engineer is waiting on.
3. From the most recent JOURNAL entry's `NEXT:` line, identify
   today's stated next step.
4. From inbox, count unprocessed items; list 1–3 most recent if
   any are urgent.
5. Surface anything stale: a story `in-progress` with no
   JOURNAL entry mentioning it for >3 days.

## Output

Single response, structured as:

```markdown
## Chat handoff (if CHAT-HANDOFF.md exists)

⚠ CHAT-HANDOFF.md exists (last updated YYYY-MM-DD).
Consider running `/resume-from-handoff` first.

<If the handoff is older than 7 days, instead surface:
ℹ CHAT-HANDOFF.md exists but is stale (>7 days). Delete or
refresh.>

<If no CHAT-HANDOFF.md exists, omit this section entirely.>

## Today's focus

<one-line summary of what the engineer planned to do next, per
last JOURNAL>

## Active stories

### In progress
- **TEAM-1234 — <title>** — <status detail / blocker>
- ...

### Blocked
- **TEAM-1235 — <title>** — waiting on <person/team> since <date>

### Ready for review/execution
- ...

## Inbox

<N> unprocessed items. Most recent:
- ...

## Stale (no JOURNAL mention in 3+ days)

- ...

## Suggested first action

<one concrete thing the engineer should do in the next 15 min>
```

## Hard rules

- Read-only. Do not modify any files.
- Be terse — the engineer reads this every morning and time
  matters.
- Don't recommend tasks that aren't grounded in the files. If
  JOURNAL says "next: investigate flaky test X", suggest
  investigating X, not something invented.

## Example

Input: `JOURNAL.md` has an entry from yesterday with
`NEXT: finish ac-audit for TEAM-1234`. `TEAM-1234/story.md` shows
`status: in-progress`, `ac_audit_status: pending`. One inbox item
from 2 days ago. TEAM-1100 has been in-progress for 5 days with
no JOURNAL mention.

Output:

```markdown
## Today's focus

Finish AC audit for TEAM-1234 (per yesterday's JOURNAL).

## Active stories

### In progress
- **TEAM-1234 — Search filter empty input** — AC audit pending
- **TEAM-1100 — Cart abandonment email** — no JOURNAL mention in 5 days (see Stale)

### Blocked
_(none)_

### Ready for review/execution
_(none)_

## Inbox

1 unprocessed item. Most recent:
- 2026-05-18 — note about regex behavior in search

## Stale (no JOURNAL mention in 3+ days)

- TEAM-1100 — last touched 2026-05-15

## Suggested first action

Open `teams/<active>/stories/TEAM-1234-search-filter-empty-input/ac-audit.md`
and invoke `/ac-auditor` against the AC.
```
