---
description: End-of-day wrap — append journal entry, update TODOs, surface dirty files
agent: agent
---

# Session end

You are the QA engineer's end-of-day scribe. Your job is to
close the session cleanly so tomorrow morning's `/session-start`
has a clean slate to read.

## Input

1. The engineer's brief summary of the session (ask if not
   already given).
2. [../../JOURNAL.md](../../JOURNAL.md) — to append.
3. [../../TODO.md](../../TODO.md) — to update.
4. Output of `git status --short` (ask the user to paste, or
   suggest they run it) — to surface dirty files.
5. `teams/<active>/inbox/INBOX.md` for each active team (read
   `teams/active-team.txt` for the list) — to triage if anything
   was added today.
6. Current git branch. If it is `session/*`, this prompt should
   prepare the branch for merge back to `main`.

## Process

1. Ask the engineer (one short message):
   - "One-line summary of what you got done today?"
   - "Anything decided? Anything blocked?"
   - "What's the very next thing for tomorrow?"
2. Compose the JOURNAL entry per the format below.
3. Update `TODO.md`:
   - Move completed items out (delete them — git is the audit
     trail).
   - Add any new TODOs the engineer mentions.
   - Move any newly-blocked items to the **Blocked** section.
4. Surface dirty git files. For each, suggest a category:
   - "Want to commit now?" (most likely)
   - "Want to keep editing tomorrow?"
   - "Want to discard?" (rare)
5. If inbox has items from today, suggest triage routes for each
   (promote to story / promote to knowledge / delete).
6. Ask the engineer: "Will you resume tomorrow in a **different
   chat session** (new Copilot/Claude/Codex window)?" If yes,
   suggest invoking `/chat-handoff` after this prompt completes
   — it writes `CHAT-HANDOFF.md` at the repo root with the
   current goal, files in focus, decisions made, and next exact
   action so the new chat can pick up without replaying history.
   If they'll resume in this same chat, skip the handoff (the
   conversation context is enough).
7. Ask the engineer whether the session is ready to consolidate
   into `main`. If yes, run or ask them to run:
   `node scripts/session-branch-finish.mjs -m "session: YYYY-MM-DD - <one-line summary>"`
   This validates, commits the session branch, switches to `main`,
   merges with `--no-ff`, and deletes the session branch.

## Output — JOURNAL entry to append

```markdown
## YYYY-MM-DD HH:MM — <one-line summary>

STATE: <where things stand at end-of-day>
DID: <what changed since last entry>
DECISIONS: <choices made, or "none">
BLOCKERS: <what's stuck and on whom, or "none">
NEXT: <very next action for tomorrow>
```

Append the block to `JOURNAL.md` before the closing
`<!-- entries below -->` marker (or at the bottom if the marker
isn't there).

## Output — TODO.md update

Modify in place. Keep the three sections: Active / Blocked /
Watching.

## Output — chat summary

After the edits, print:

```markdown
Session closed.

JOURNAL: appended entry for <YYYY-MM-DD>.
TODO: <N> open, <N> blocked, <N> watching.

Dirty files (consider committing):
- <file>
- <file>

Inbox: <N> items remain unprocessed.

Suggested commit message:
> session: YYYY-MM-DD — <one-line summary>

If on a session branch and the engineer approves consolidation:
> node scripts/session-branch-finish.mjs -m "session: YYYY-MM-DD - <one-line summary>"

<If the engineer is resuming tomorrow in a different chat:>
Next: invoke `/chat-handoff` to write CHAT-HANDOFF.md so the
new chat picks up cleanly.
```

## Hard rules

- Do NOT auto-merge without explicit engineer approval.
- If the engineer approves consolidation, use
  `scripts/session-branch-finish.mjs`; do not improvise git
  merge commands.
- Do NOT modify history in `JOURNAL.md` (only append).
- If the engineer says "blocked" but doesn't say on whom or why,
  ask. Vague blockers are useless.

## Example

Engineer input: "Finished AC audit for TEAM-1234, sent questions
to dev. Started designing test cases for TEAM-1235 but got
pulled into a prod incident at 3pm. Tomorrow: resume TEAM-1235."

Output entry:

```markdown
## 2026-05-20 18:30 — finished TEAM-1234 audit, started TEAM-1235, prod incident at 3pm

STATE: TEAM-1234 questions sent, awaiting dev reply. TEAM-1235 test case design 30% done.
DID: ac-audit.md complete for TEAM-1234; first 3 test cases drafted for TEAM-1235.
DECISIONS: none
BLOCKERS: TEAM-1234 awaiting dev clarification on date-range semantics.
NEXT: Resume test case design for TEAM-1235.
```
