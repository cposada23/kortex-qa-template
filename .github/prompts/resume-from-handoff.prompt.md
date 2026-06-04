---
description: Read the latest Handoff/Note block from the most recent open session file and propose the next step
agent: agent
---

<!--
  agent: agent (not "ask"). Session files live in sessions/*.md and
  are committed to git, so the old "ask" gitignored-picker workaround
  is no longer needed — there is nothing hidden to discover. Plain
  read_file on the session file works on every surface.
-->

# Resume from handoff

You are a new chat session. The engineer wants to pick up where the previous chat left off without you replaying history. The transfer state lives in a **committed session file**, not a gitignored root file.

## Input

1. **Find the most recent OPEN session file.** Scan `sessions/*.md`
   (ignore `README.md`) for one with frontmatter `status: open`. If
   more than one is open, pick the one with the latest id (the
   `YYYYMMDD-HHMM` prefix sorts chronologically). Tip: `git branch
   --show-current` gives the current session's id directly when you
   are already on its branch — prefer that file.

2. **Read the latest `## Handoff HH:MM` block** in that file. If
   there is no Handoff block, fall back to the latest `## Note HH:MM`
   block. (Ignore any `## Bridge-out` block — that means the session
   was already closed.)

3. If no open session file exists, or it has no Handoff/Note block,
   tell the engineer **explicitly** what you found and what to do:

   ```
   No open session with a Handoff/Note block found.
   Scanned: sessions/*.md for status: open.
   Possible causes:
     1. /chat-handoff or /session-note was never invoked this session.
     2. The last session was already closed (status: closed) — its
        Bridge-out is in JOURNAL.md, not a live handoff.
     3. No session has been started — run /session-start first.
   To resume manually: tell me where you left off, or run
   /session-start to begin a fresh session.
   ```

4. Read the chosen block in full. Pay special attention to:
   - **Next exact action** (this is what the engineer expects you to start with).
   - **Files in focus** (open these immediately).
   - **Do not redo** (don't re-verify or re-run things already done).
   - **Risks / gotchas** (avoid these mistakes).

5. Also read `AGENTS.md` for the canonical project context.

## Process

1. Open each file in "Files in focus" (use the Read tool or have the editor open them).
2. Confirm the state described in "Current state" matches reality (e.g., is the script half-written? Is the branch dirty?). If reality has drifted from the handoff, surface the drift to the engineer.
3. Propose the next step, matching "Next exact action".

## Output

Single chat response, structured:

```markdown
## Picking up from sessions/<session-id>.md — ## Handoff HH:MM

**Goal:** <copied from the block>

**State as recorded:** <copied from the block>

**State right now:** <what you observed after opening files / checking git>

**Drift from handoff:** <if any — e.g., "the file mentioned has been modified since the handoff">

**Files I have open:**
- path:line — purpose

**Next step:** <copied from the block's "Next exact action">

**Confirm?** If the next step is still right, say "go" and I'll start. If something changed, tell me and we'll re-plan.
```

## Hard rules

1. **Do not start executing the next step until the engineer confirms.** They may have new context since the handoff was written.
2. **Surface drift loudly.** If `Files in focus` references a path that doesn't exist, or `Current state` says one branch but you're on another, flag it.
3. **Do not invent state not in the block.** If "open questions" lists 3 questions, don't speculate on a 4th.
4. **Treat the handoff as supplementing AGENTS.md, not replacing it.** AGENTS.md is the durable contract; the session block is session state.

## When the handoff is stale

If the session file's `updated:` frontmatter is more than 7 days old, lead with:

```
⚠ This open session is stale (last updated YYYY-MM-DD, N days ago).
Either confirm the work is still relevant, or run /session-end on its
branch to close it and start fresh with /session-start.
```

Then proceed only if the engineer confirms.
