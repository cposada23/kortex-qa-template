---
title: "Playbook — Session end"
type: playbook
status: active
language: en
tags: [playbook, ceremony, daily]
updated: 2026-05-20
---

# Playbook — Session end

The end-of-day wrap. ~5 minutes when discipline holds; longer
when you've been sloppy mid-session.

## When

Last thing before logging off, after the last meeting and the
last code/test push. **Not** while still in the middle of
something — finish the active task or park it cleanly first.

## Steps

1. **Snapshot mentally:**
   - One-line summary of what you got done today.
   - Any decisions? Anything blocked? On whom?
   - The very next thing for tomorrow.
2. **Invoke `/session-end` in Copilot Chat.** It will ask the
   three questions above and then:
   - Append a JOURNAL entry.
   - Update `TODO.md`.
   - Surface dirty git files.
   - Suggest a commit message.
3. **Review the JOURNAL append** in the diff. Edit if anything
   is off — the JOURNAL is read tomorrow by `/session-start`, so
   garbage in = garbage out.
4. **Triage any new inbox items** Copilot flags. Each gets one
   of:
   - **Promote** to a story / test case / bug / knowledge page.
   - **Park** (leave in inbox, but only if it's still maturing
     and < 7 days old).
   - **Delete** if it was noise.
5. **Commit.** Review the diff one more time, then:
   ```bash
   git add .
   git commit -m "session: $(date +%Y-%m-%d) — <one-line summary>"
   ```
6. **Optionally snapshot** if a milestone hit (story closed,
   sprint ended, big test pass):
   ```bash
   node scripts/snapshot.mjs
   ```
   The ZIP lands in `versions/`. Drag-and-drop into Teams (or
   wherever your backup channel is) at your discretion.

## What "milestone" warrants a snapshot

Routine end-of-day: no snapshot needed. Git is enough.

Snapshot when:

- A story closed cleanly (all test cases passed, PR merged,
  signed off by PO).
- A sprint ended.
- A bug you've been chasing for >2 days got resolved.
- You're about to do something risky (file moves, schema
  migration, etc.) — pre-snapshot is cheap insurance.
- End of the work week, regardless.

## Hard rules

- The JOURNAL entry must have a `NEXT:` line. Without it,
  tomorrow's `/session-start` has nothing to suggest. "Nothing
  obvious — review backlog" is a valid NEXT.
- Don't commit without reviewing the diff. Especially after a
  long session, you may have left scratch text in a file.
- Don't tag a session "done" if it's actually "abandoned mid-task."
  Mark blockers honestly. Future-you needs the truth.

## What to do if `/session-end` produces a poor JOURNAL

Edit it inline. The prompt is a starting point, not gospel. If a
pattern emerges (e.g. it keeps missing the BLOCKERS line),
refine `.github/prompts/session-end.prompt.md`.

## Why this ritual exists

Most context loss happens not because you forgot, but because
yesterday's tail wasn't cleanly tied off. Five minutes of
discipline at EOD saves twenty minutes of "where was I?"
tomorrow.

The JOURNAL grows append-only and never gets edited retroactively
(if a past entry was wrong, append a new entry that supersedes
it). This keeps the trail honest.
