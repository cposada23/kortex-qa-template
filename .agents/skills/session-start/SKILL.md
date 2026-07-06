---
name: session-start
description: Start or reuse the day's session branch and log file, then read the brain's state and produce a one-screen morning briefing; use at the start of each QA work session.
---

<!--
  No tool restrictions declared on purpose — restricting the agent
  to a fixed tool list has bitten before. Earlier versions limited
  this prompt to `['read', 'search/codebase']`, which blocked Copilot
  from running `node scripts/session-branch-start.mjs` even though
  the prompt body explicitly told it to (Copilot would respond with
  "I cannot execute terminal commands with the available tools").
  Read-only discipline is enforced socially via "Hard rules" below.
-->


# Session start

You are the QA engineer's morning briefing. Your job is to (1) make
sure today's work is isolated on a session branch with its own
committed log file, then (2) read the brain's current state and
produce a one-screen summary so the engineer can pick up where they
left off without rebuilding context from scratch.

## Input

Before reading state, isolate the session in git. This is the ONLY
write this prompt performs.

1. Check the current branch (`git branch --show-current`).
2. **If the current branch is `main`**, run:
   `node scripts/session-branch-start.mjs`
   This atomically creates the branch `session/YYYYMMDD-HHMM[-slug]`
   AND its log file `sessions/<session-id>.md` (`status: open`). The
   script prints `Session log: sessions/<id>.md`.
3. **VERIFY you ended up on a `session/*` branch** — run
   `git branch --show-current` again and confirm it now starts with
   `session/`. If it does NOT, **HARD-STOP loudly** (see Output →
   "Branch isolation failed"). Do not read any further state and do
   not let the engineer start the day believing they are isolated
   when they are still on `main`.
4. **If already on `session/*`**, reuse it — run
   `node scripts/session-branch-start.mjs` anyway (it is idempotent:
   it reuses the branch and re-creates the log file only if missing,
   printing `Already on session branch: ...`).
5. **If on any other branch** (not `main`, not `session/*`), stop and
   ask the engineer whether to finish/discard that branch first. Do
   not create a session branch on top of it.

Use file-reading tools to gather the rest of the context.
Do not ask the engineer to paste file contents. If a file is
missing, note it briefly and continue with the remaining files.

Read the following, in this order:

1. **`sessions/<session-id>.md`** for the session you are now on —
   read its last block (`## Handoff` / `## Note` / `## Bridge-out`)
   so you can pick up mid-thought.
2. **The open-session scan** — `scripts/session-start.mjs` already
   prints every session whose frontmatter is still `status: open`
   (the "previous session was never closed" detection, sorted by id
   so it is immune to mtime). Either run
   `node scripts/session-start.mjs` and read its output, or scan
   `sessions/*.md` yourself for `status: open`. Surface every open
   session at the top of the summary and offer **close-or-continue**
   (see Output → "Open sessions").
3. `TODO.md` — active TODOs.
4. `JOURNAL.md` — most recent 1–3 entries
   (the last entry's `NEXT:` line is today's stated next step).
5. `teams/active-team.txt` —
   identify the active team(s) (line 1 = primary).
6. `teams/<active>/stories/INDEX.md` for each active team — the
   story roster scoped to that team.
7. Any `teams/<active>/stories/*/story.md` with `status: in-progress`
   or `status: blocked` — read the frontmatter and any "Notes"
   section.
8. `teams/<active>/inbox/INBOX.md` for each active team — last few
   items, to surface unprocessed observations.

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
## Open sessions (if any sessions/*.md has status: open)

⚠ Open session: <session-id> — never closed, open since YYYY-MM-DD.
Last block: <## Handoff / Note / Bridge-out HH:MM>.
→ Continue on its branch, or run `/session-end` there to close it.

<List every open session, oldest first. If the only open session is
the one you just started/reused, that's expected — note it as
"current session" rather than a warning. If no other session is
open, omit this section entirely.>

## Today's focus

<one-line summary of what the engineer planned to do next, per the
last JOURNAL NEXT: line and the current session's last block>

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

If branch isolation failed (step 3 above), output ONLY this and stop:

```markdown
## ⛔ Branch isolation FAILED

I tried to start the session branch but you are still on `main`.
Your work would NOT be isolated — a full day of edits on `main`
bypasses the session log and the merge-back ritual.

Remedy: run `node scripts/session-branch-start.mjs` yourself and
read its error output (likely a dirty working tree — commit or
clean it first), then re-invoke `/session-start`.

I have NOT read any further state. Fix the branch first.
```

## Hard rules

- Read-only **except** creating the session branch + log file via
  `node scripts/session-branch-start.mjs`. No other writes.
- **Always verify you are on a `session/*` branch after starting.**
  Never proceed with the briefing from `main` — hard-stop instead.
- Be terse — the engineer reads this every morning and time
  matters.
- Don't recommend tasks that aren't grounded in the files. If
  JOURNAL says "next: investigate flaky test X", suggest
  investigating X, not something invented.

## Example

Input: on `main` with a clean tree.
`node scripts/session-branch-start.mjs` creates
`session/20260520-0915` and `sessions/20260520-0915.md`; the
follow-up `git branch --show-current` returns `session/20260520-0915`.
One older session `sessions/20260518-1400.md` is still `status: open`.
`JOURNAL.md` last entry has `NEXT: finish ac-audit for TEAM-1234`.
`TEAM-1234/story.md` shows `status: in-progress`,
`ac_audit_status: pending`. TEAM-1100 has been in-progress for 5 days
with no JOURNAL mention.

Output:

```markdown
## Open sessions

⚠ Open session: 20260518-1400 — never closed, open since 2026-05-18.
Last block: ## Note 16:20.
→ Continue on its branch, or run `/session-end` there to close it.

(Current session 20260520-0915 just started — that's the one you're on.)

## Today's focus

Finish AC audit for TEAM-1234 (per yesterday's JOURNAL NEXT).

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
