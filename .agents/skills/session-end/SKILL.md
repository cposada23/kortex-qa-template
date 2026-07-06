---
name: session-end
description: Close the work session autonomously at end of day — infer the Bridge-out from the day's artifacts, append the JOURNAL entry, update TODOs, rebuild indexes, and auto-merge the session branch to main.
---

<!--
  No tool restrictions declared on purpose — restricting the agent
  to a fixed tool list would block the node scripts this prompt MUST
  run (build-index, session-branch-finish). Write discipline is
  enforced socially via "Hard rules" below.
-->


# Session end

You are the QA engineer's end-of-day scribe, and you run
**autonomously**. There is NO 3-question interview and NO handoff
suggestion. You INFER everything you need from the day's artifacts,
write the close-out, and consolidate the session branch into `main`
by default — then report what you did. The engineer reads the result;
they do not approve it step by step.

## Input — gather, do not ask

1. **Current git branch** (`git branch --show-current`).
   - The session id is the branch name minus the `session/` prefix
     (branch `session/20260604-0930-flaky` → id
     `20260604-0930-flaky` → file
     `sessions/20260604-0930-flaky.md`).
   - The **session START date** is the `YYYYMMDD` prefix of that id
     (e.g. `20260604` → `2026-06-04`). You stamp the JOURNAL entry
     with this date, NOT today's wall-clock date — a session that
     crossed midnight still lands under the day it started.
2. **Today's session file** `sessions/<session-id>.md` — read every
   `## Handoff HH:MM` and `## Note HH:MM` block. These are the
   richest source of STATE / DECISIONS / NEXT.
3. **The chat conversation** — what was actually done, decided, and
   left open since the session started.
4. **`git diff main...<branch>`** and **`git log main..<branch>`** —
   the concrete file-level record of what changed on this branch.
5. `TODO.md` — to reconcile (remove done, move
   blocked).
6. `JOURNAL.md` — to append (never edit
   history; the convention is newest-first: insert the new entry
   immediately BELOW the `<!-- entries below -->` marker, above any
   older entries — or at the bottom of the file if the marker is
   absent).
7. `teams/<active>/inbox/INBOX.md` for each active team (read
   `teams/active-team.txt`) — note anything added today, but do not
   block the close on triaging it.

## Process

### 0. Hard-stop if not isolated

Run `git branch --show-current` FIRST. If it does **not** start with
`session/`, STOP immediately and output ONLY the "Not on a session
branch" block (see Output). Do nothing else — no JOURNAL, no merge.
A day's work that lands directly on `main` was never isolated, and
silently writing a Bridge-out for it would hide that.

### 1. Infer the fields

From the inputs above, synthesize:

- **STATE** — where things stand at end-of-session.
- **DID** — what changed since the last JOURNAL entry (cross-check
  the chat against `git diff main...<branch>`).
- **DECISIONS** — choices made, or "none".
- **BLOCKERS** — what's stuck and on whom, or "none". If a blocker is
  vague in the source material, write what you know and mark it
  `(owner unclear)` rather than inventing a cause.
- **NEXT** — the very next action. This line is **mandatory**. Use
  this cascade fallback, in order, until one yields a value:
  1. the latest explicit "next exact action" from the session file's
     Handoff/Note blocks or the chat;
  2. else the top item in TODO.md → Active;
  3. else the prior JOURNAL entry's `NEXT:` line **if that work is
     still open**;
  4. else `review backlog`.

### 2. Apply the redaction policy (load-bearing)

Both the session file (committed to permanent history) and the
JOURNAL get merged to `main`, and with this autonomous flow **no
human reviews the diff before it lands**. Before writing anything,
re-read your own draft and strip:

- Real credentials, API tokens, passwords from `.env`-style files.
- Long verbatim excerpts from client-sensitive data.
- Customer PII.
- Anything the AGENTS.md §7 (AI-read credential restrictions)
  excludes.

Summarize instead of quoting — "verified `.env` has `QA_USER` set",
never "`QA_USER=joe@acme.com`". The session-close script also runs
`validate.mjs sessions --strict-pii` as a BLOCKING gate, so a leaked
secret will abort the merge — but redact at write time so it never
reaches that gate.

### 3. Write the Bridge-out block + close the session file

Append to `sessions/<session-id>.md`:

```markdown
## Bridge-out HH:MM

STATE: <where things stand at end-of-session>
DID: <what changed since the last entry>
DECISIONS: <choices made, or "none">
BLOCKERS: <what's stuck and on whom, or "none">
NEXT: <very next action>
```

Then flip the file's frontmatter `status: open` → `status: closed`.

### 4. Append the JOURNAL entry

Append a synthesized block (same five fields) to `JOURNAL.md`,
stamped with the **session START date** (step Input.1), before the
`<!-- entries below -->` marker:

```markdown
## YYYY-MM-DD HH:MM — <one-line summary>

STATE: <...>
DID: <...>
DECISIONS: <...>
BLOCKERS: <...>
NEXT: <mandatory — per the cascade in step 1>
```

### 5. Update TODO.md

Modify in place. Keep the three sections: **Active / Blocked /
Watching**. Remove items finished today (git is the audit trail),
move newly-blocked items to **Blocked**, add any new actionable
items surfaced in the chat or session file.

### 6. Rebuild indexes

Run `node scripts/build-index.mjs` to regenerate the INDEX.md files
(`sessions/` is intentionally not indexed — that's expected).

### 6b. Offer a SUT-map update (optional — never blocks the close)

If the session explored new SUT areas (a module, flow, or term not
yet in `knowledge/sut-map/`), add one line to the final report
offering — not forcing — a sut-map update: "Today touched <area>,
not yet in the SUT map — run the sut-map skill with this session as
context if worth capturing." Do NOT run it yourself and do NOT ask
before merging; the close stays autonomous.

### 7. Consolidate — auto-merge by default

Run:

```
node scripts/session-branch-finish.mjs -m "session: <start-date> - <one-line summary>"
```

This validates (`validate.mjs`, `validate-links.mjs`,
`build-index --check`, and the BLOCKING
`validate.mjs sessions --strict-pii` secret gate), commits the
session branch, switches to `main`, merges `--no-ff`, and deletes
the branch. **This is automatic — do NOT ask for approval.** It is
local-only and never pushes.

- **On success:** print the informative report below.
- **If the script ABORTS** (a validation failure, the secret gate,
  or a merge conflict): report it **LOUDLY** (see Output → "Merge
  aborted"). The script preserves the session branch on any failure,
  so nothing is lost — surface exactly what failed so the engineer
  can fix it and re-run.

## Output — informative report (do NOT ask for approval)

After a successful merge, print:

```markdown
✅ Session closed and merged to main: session/<session-id>

Session file: sessions/<session-id>.md (status: closed)

JOURNAL entry (stamped <start-date>):

## <start-date> HH:MM — <one-line summary>
STATE: ...
DID: ...
DECISIONS: ...
BLOCKERS: ...
NEXT: ...

TODO: <N> active, <N> blocked, <N> watching.

Diffstat (main...<branch> before merge):
<paste `git diff --stat main..<branch>` output, or the diffstat the
merge produced>

Merge: --no-ff into main, session branch deleted. Local-only, not pushed.
```

## Output — Not on a session branch (hard-stop)

```markdown
## ⛔ You are on `main` — work was NOT isolated

`/session-end` expects to run on a `session/*` branch. You are on
`main`, which means today's work bypassed the session log and the
merge-back ritual.

I have written NOTHING (no Bridge-out, no JOURNAL, no merge).

Remedy: review what landed on `main` with `git log`/`git status`,
commit it deliberately, and start tomorrow with `/session-start` so
the next session is isolated.
```

## Output — Merge aborted (loud)

```markdown
## ⚠ Session close ABORTED — branch preserved

I wrote the Bridge-out block, the JOURNAL entry, and the TODO update,
but `session-branch-finish.mjs` aborted before merging to `main`.

Reason: <validation failure | secret gate (validate.mjs sessions
--strict-pii) | merge conflict — paste the exact error>

Your branch `session/<session-id>` is PRESERVED — nothing was lost.
Fix the reported issue (e.g. redact a leaked secret, resolve the
conflict on main), then re-run:
> node scripts/session-branch-finish.mjs -m "session: <start-date> - <summary>"
```

## Hard rules

- **Autonomous.** No interview, no handoff suggestion, no approval
  gate on the merge. Infer, write, merge, report.
- **Hard-stop on `main`.** If not on `session/*`, write nothing and
  emit the loud stop block.
- **Redact before writing.** Re-read your own draft for creds/PII
  per AGENTS.md §7 before the block touches the session file or
  JOURNAL — these merge to permanent history with no human diff
  review.
- **NEXT is mandatory** — use the cascade fallback; never leave it
  blank or "TBD".
- **Stamp JOURNAL with the session START date**, not today's date.
- **Never edit JOURNAL history** — only append before the marker.
- **Do not improvise git merge commands** — always go through
  `session-branch-finish.mjs`.
- **Never push.** Everything here is local-only.

## Example

Branch: `session/20260604-0930-flaky-test`. The session file has a
`## Note 14:10` block noting "root-caused the flaky
TEAM-1234 search test to a race in the fixture; fix drafted, not yet
verified". `git diff main...<branch>` shows edits to
`teams/checkout/stories/TEAM-1234-search-filter/automation.spec.ts`.
TODO Active top item: "verify TEAM-1234 fixture race fix".

Inferred and written to `sessions/20260604-0930-flaky-test.md`:

```markdown
## Bridge-out 18:05

STATE: TEAM-1234 flaky search test root-caused to a fixture race; fix drafted, not yet re-run green.
DID: Edited automation.spec.ts fixture setup to await the seed before asserting; updated the story Notes.
DECISIONS: Use explicit await on fixture seed rather than a fixed sleep (deterministic, no flake budget).
BLOCKERS: none
NEXT: Re-run TEAM-1234 automation.spec.ts 20× to confirm the race is gone before marking the story execution-done.
```

JOURNAL entry stamped with the START date `2026-06-04` (not today),
TODO updated (the verify item stays Active until the re-run passes),
`build-index.mjs` run, then
`node scripts/session-branch-finish.mjs -m "session: 2026-06-04 - fixed TEAM-1234 flaky search test fixture race"`
merges to `main` and the report is printed.
