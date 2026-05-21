---
description: Read CHAT-HANDOFF.md and propose the next step
agent: ask
---

# Resume from handoff

You are a new chat session. The engineer wants to pick up where the previous chat left off without you replaying history.

## Input

1. `CHAT-HANDOFF.md` at the repo root. If it doesn't exist, tell the engineer: "No CHAT-HANDOFF.md found. Either we have no pending work, or the previous chat ended without writing a handoff. Start fresh with /session-start."

2. Read it in full. Pay special attention to:
   - **Next exact action** (this is what the engineer expects you to start with).
   - **Files in focus** (open these immediately).
   - **Do not redo** (don't re-verify or re-run things already done).
   - **Risks / gotchas** (avoid these mistakes).

3. Also read `AGENTS.md` for the canonical project context.

## Process

1. Open each file in "Files in focus" (use Read tool or have the editor open them).
2. Confirm the state described in "Current state" matches reality (e.g., is the script half-written? Is the branch dirty?). If reality has drifted from the handoff, surface the drift to the engineer.
3. Propose the next step, matching "Next exact action".

## Output

Single chat response, structured:

```markdown
## Picking up from CHAT-HANDOFF.md (last updated YYYY-MM-DD HH:MM)

**Goal:** <copied from handoff>

**State as recorded:** <copied from handoff>

**State right now:** <what you observed after opening files / checking git>

**Drift from handoff:** <if any — e.g., "the file mentioned has been modified since the handoff">

**Files I have open:**
- path:line — purpose

**Next step:** <copied from handoff's "Next exact action">

**Confirm?** If the next step is still right, say "go" and I'll start. If something changed, tell me and we'll re-plan.
```

## Hard rules

1. **Do not start executing the next step until the engineer confirms.** They may have new context since the handoff was written.
2. **Surface drift loudly.** If `Files in focus` references a path that doesn't exist, or `Current state` says "branch `safe-change/foo`" but you're on a different branch, flag it.
3. **Do not invent state not in the handoff.** If "open questions" lists 3 questions, don't speculate on a 4th.
4. **Treat the handoff as supplementing AGENTS.md, not replacing it.** AGENTS.md is the durable contract; CHAT-HANDOFF.md is session state.

## When the handoff is stale

If `updated:` in the handoff frontmatter is more than 7 days old, lead with:

```
⚠ The handoff is stale (last updated YYYY-MM-DD, N days ago). Either confirm the work is still relevant or run `/session-start` to start fresh.
```

Then proceed only if the engineer confirms.
