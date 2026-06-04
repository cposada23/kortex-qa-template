# sessions/

Per-session logs. One file per session, **keyed by the session (the
branch), not by the calendar date** — so forgetting to close a session,
or a session that crosses midnight, never splits or orphans the record.

```
sessions/<session-id>.md      # <session-id> == branch name minus "session/"
```

## Lifecycle

1. **`/session-start`** (via `scripts/session-branch-start.mjs`) creates the
   session branch `session/YYYYMMDD-HHMM[-slug]` and this file with
   `status: open`.
2. During the day, blocks accumulate:
   - **`/chat-handoff`** appends `## Handoff HH:MM` — full transfer state so
     another chat / AI surface resumes mid-task. Read back by
     `/resume-from-handoff`.
   - **`/session-note`** appends `## Note HH:MM` — a lightweight checkpoint
     so context is never lost even if the chat dies.
3. **`/session-end`** appends the final `## Bridge-out HH:MM`
   (STATE / DID / DECISIONS / BLOCKERS / NEXT), flips `status: closed`,
   appends a synthesized entry to `JOURNAL.md`, then validates and merges
   the session branch to `main`.

## Why committed (not gitignored)

These files are committed on the session branch and merged to `main`. That
keeps them discoverable by every AI surface (Copilot / Claude / Codex) —
unlike the retired gitignored `CHAT-HANDOFF.md`, which the file picker hid.
Because they are committed, the **redaction policy is load-bearing**: never
paste credentials or customer PII into a Handoff/Note block. The session
close runs the secret scan in blocking mode over `sessions/`
(`validate.mjs sessions --strict-pii`) — a detected secret aborts the merge.

`sessions/` is intentionally **not** indexed by `build-index.mjs` (it is an
operational log, like `JOURNAL.md`). Do not add it as a zone.
