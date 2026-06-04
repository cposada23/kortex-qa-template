---
title: "Playbook — Session end"
type: playbook
status: active
language: en
tags: [playbook, ceremony, daily]
updated: 2026-06-04
---

# Playbook — Session end

The end-of-day wrap. **Autonomous** — no interview, no questions.
You invoke `/session-end` and it does the whole close in one shot,
then prints the result. Your job is to read the printout, not to
answer prompts.

## When

Last thing before logging off, after the last meeting and the
last code/test push. **Not** while still in the middle of
something — finish the active task or park it cleanly first.

## What "autonomous" means

The old flow asked you three questions (summary / decisions /
next). It no longer does. `/session-end` **infers** every field
itself from:

- **today's session log** (`sessions/<id>.md`) — the Handoff and
  Note blocks you dropped during the day,
- **the chat conversation** you just had,
- **`git diff main...<session-branch>`** and the git log,
- **`TODO.md`**.

It then redacts, writes, validates, commits, merges, and reports.
There is no approval step — the printout is informative, not a
gate.

## Steps

1. **Invoke `/session-end` in Copilot Chat.** First thing it does
   is a **HARD-STOP guard**: if you are not on a `session/*`
   branch it stops loudly with the remedy ("you are on `main`;
   today's work was not isolated"). Do not proceed past that — fix
   the branch situation first.
2. **Let it run.** With the guard passed, autonomously it:
   - **Redacts.** Re-reads its own draft and strips any
     credential / PII per the AGENTS.md AI-read restrictions
     *before* anything is written. This matters more than it used
     to: the session log is committed to history, so a leaked
     secret would persist.
   - **Closes the session log.** Appends a `## Bridge-out HH:MM`
     block (STATE / DID / DECISIONS / BLOCKERS / NEXT) to
     `sessions/<id>.md` and flips that file's frontmatter
     `status: open → closed`.
   - **Appends to `JOURNAL.md`.** A synthesized block stamped with
     the session **start** date (parsed from the session id, so a
     past-midnight session still files under the day it began).
     The `NEXT:` line is mandatory — it cascades through fallbacks
     (latest "next exact action" → top Active TODO → prior NEXT if
     still open → "review backlog") so it is never empty.
   - **Updates `TODO.md`** — removes done items, moves blocked
     ones.
   - **Rebuilds indexes** via `node scripts/build-index.mjs`.
   - **Consolidates the branch.** Runs
     `node scripts/session-branch-finish.mjs -m "session: <start-date> - <summary>"`,
     which validates (frontmatter + links + INDEX drift + the
     **strict-PII secret gate** — a blocking re-scan of the
     session files), commits the `session/*` branch, switches to
     `main`, merges `--no-ff`, and deletes the branch. **Auto-merge
     is the default** — it does not wait for you.
3. **Read the printout.** `/session-end` prints a diffstat, the
   JOURNAL block it wrote, and the merge result. This is for your
   awareness; you don't approve it.
4. **If it ABORTS, react.** If `session-branch-finish` fails any
   validation, trips the secret gate, or hits a merge conflict, it
   **preserves the `session/*` branch** and reports the failure
   **loudly**. Read the error, fix the cause (e.g. remove the
   flagged secret, resolve the conflict), and re-run. Nothing was
   merged to `main`, so you've lost nothing.
5. **Optionally snapshot** if a milestone hit (story closed,
   sprint ended, big test pass):
   ```bash
   node scripts/snapshot.mjs
   ```
   The ZIP lands in `versions/`. The per-session logs are
   git-tracked, so they ride along inside `.git/` automatically.
   Drag-and-drop into Teams (or wherever your backup channel is)
   at your discretion.

## Mid-day checkpoints feed the close

You don't have to remember the whole day at 17:30 — the
autonomous close reads what you already wrote:

- **`/session-note`** drops a lightweight `## Note HH:MM` block
  (current focus / decision / blocker / next micro-step) into
  today's session log. Use it whenever you finish a chunk or
  context is about to be lost.
- **`/chat-handoff`** writes a fuller `## Handoff HH:MM` transfer
  block into the same file when you're switching chat surfaces
  mid-task.

The more of these you leave during the day, the sharper the
inferred Bridge-out at night. They are the input, not extra work.

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

- The JOURNAL entry always gets a `NEXT:` line — the prompt
  guarantees it via the cascade fallback (latest "next exact
  action" → top Active TODO → prior NEXT if still open → "review
  backlog"). It is never blank.
- Run `/session-end` **only** from a `session/*` branch. On `main`
  the prompt hard-stops; obey it — a close from `main` means the
  day was never isolated.
- The merge is automatic. Trust it for routine days. The safety
  net is the validation + secret gate inside
  `session-branch-finish`, which **preserves the branch on any
  failure** rather than merging a broken state.
- If the day went sideways and you genuinely don't want it on
  `main`, don't invoke `/session-end` at all — manually
  `git switch main` and delete the `session/*` branch after
  confirming you don't need its changes.
- Don't let a session close describe an abandoned task as "done."
  The redaction-and-infer step reads what you actually wrote in
  the session log, so honest mid-day Notes / Handoffs produce an
  honest Bridge-out. Mark blockers truthfully during the day.

## What to do if the autonomous close gets a field wrong

The JOURNAL is append-only — don't rewrite the entry it produced.
If it's materially wrong, append a *new* JOURNAL entry that
supersedes it (and fix the source: leave better `/session-note`
and `/chat-handoff` blocks during the day so the inference has
more to work with). If a pattern emerges — it keeps missing
BLOCKERS, mis-stamps the date — refine
`.github/prompts/session-end.prompt.md`.

## What to do if it ABORTS

`session-branch-finish` is a gate, not a formality. It aborts on:

- **Frontmatter / link / INDEX-drift failure** — fix the flagged
  file, then re-run `/session-end`.
- **Strict-PII secret gate** — a credential or PII pattern was
  found in a session file. Remove it (or mark a genuine false
  positive per the validator's docs), then re-run.
- **Merge conflict** — `main` moved under you. Resolve the
  conflict on the preserved `session/*` branch, then re-run.

In every case the branch survives and `main` is untouched. Nothing
is lost.

## Why this ritual exists

Most context loss happens not because you forgot, but because
yesterday's tail wasn't cleanly tied off. The autonomous close
removes the friction that made people skip the wrap: there's no
interview to sit through, so the discipline cost drops to "invoke
one prompt and read the result."

Two properties keep the trail honest:

- The JOURNAL grows append-only and is never edited retroactively
  (if a past entry was wrong, append a new entry that supersedes
  it).
- The per-session log (`sessions/<id>.md`) is committed and merged
  to `main`, so the granular record of *this* session is
  discoverable by every AI surface — not stuck in gitignored
  ephemeral state.
