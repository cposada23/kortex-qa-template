---
description: Read CHAT-HANDOFF.md and propose the next step
agent: agent
---

<!--
  agent: agent (not "ask"). The previous "ask" mode read only files
  open in editor tabs and honored .gitignore for discovery, so
  CHAT-HANDOFF.md (gitignored on purpose) was silently invisible
  and this prompt would always reply "No CHAT-HANDOFF.md found"
  even when the file existed.
-->

# Resume from handoff

You are a new chat session. The engineer wants to pick up where the previous chat left off without you replaying history.

## Input

1. **Read `CHAT-HANDOFF.md` at the workspace / repo root** using the read_file tool with the explicit relative path `CHAT-HANDOFF.md`. Do not rely on file picker discovery — `CHAT-HANDOFF.md` is gitignored on purpose and the picker may hide it.

2. If `read_file CHAT-HANDOFF.md` fails:
   - Try once more with the absolute path resolved from the workspace root.
   - If it still fails, tell the engineer **explicitly** what you tried and what to check:

     ```
     No CHAT-HANDOFF.md found at the workspace root.
     Tried: <relative path you used>, <absolute path you used>.
     Possible causes:
       1. `/chat-handoff` was never invoked in the previous chat.
       2. `/chat-handoff` was invoked but Copilot silently failed
          to write (rare — check for write-permission errors).
       3. You opened a different workspace than the previous chat
          was in.
     To verify: run `ls CHAT-HANDOFF.md` in the terminal. If it
     exists, paste the output here and I'll resume manually. If
     it doesn't, start fresh with /session-start.
     ```

3. Read the file in full. Pay special attention to:
   - **Next exact action** (this is what the engineer expects you to start with).
   - **Files in focus** (open these immediately).
   - **Do not redo** (don't re-verify or re-run things already done).
   - **Risks / gotchas** (avoid these mistakes).

4. Also read `AGENTS.md` for the canonical project context.

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
