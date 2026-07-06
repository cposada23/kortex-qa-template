---
name: chat-handoff
description: 'Append a "## Handoff HH:MM" block to the current session file so a fresh chat or another AI surface can resume context without replaying history.'
---
<!-- generated from .agents/skills/chat-handoff/SKILL.md — DO NOT EDIT. Run: node scripts/sync-agents.mjs -->

# Chat handoff

You are compacting the current chat session into a single block the engineer (or a new chat) can read to resume context without replaying history. You write it into **today's session file** so it is committed and discoverable by every AI surface — not into a gitignored root file.

## When to invoke

The engineer is about to:
- Start a new chat because this one is full.
- Stop for a while mid-task and pick up later.
- Hand off to themselves in a different AI surface (e.g., one AI chat ↔ Claude ↔ Codex).

## Input

1. **Derive today's session file.** Run `git branch --show-current`.
   The session id is the branch name minus the `session/` prefix; the
   file is `sessions/<session-id>.md` (branch
   `session/20260604-0930-flaky` → file
   `sessions/20260604-0930-flaky.md`).
   - If the current branch does NOT start with `session/`, stop and
     tell the engineer to run `/session-start` first — there is no
     session file to append to.
   - If the session file is missing (rare), tell the engineer to
     re-run `node scripts/session-branch-start.mjs` (idempotent — it
     recreates the file).
2. **The current chat history.** Read the entire conversation back to
   the most recent goal-setting message.
3. **The session file itself** — read any earlier `## Handoff` /
   `## Note` blocks so this handoff can reference or supersede them
   rather than repeat them.

## Process

1. Identify the **current goal** — one sentence. What is the engineer trying to achieve?
2. Identify the **current state** — where the work stands. Is something half-built? Is a decision pending? Is a script running?
3. List **files in focus** — paths the new chat will need to open immediately. Include the line range or section if narrow.
4. List **decisions made** in this session that the new chat must respect.
5. List **open questions** the new chat needs to resolve.
6. List **risks / gotchas** — things the new chat must not do (e.g., "don't re-run the migration, it's idempotent but slow").
7. **Next exact action** — the single most concrete step the new chat should take.
8. **Do not redo** — things already verified in this session.
9. **Useful commands run** — commands the new chat can re-run if needed.

## Redaction policy (load-bearing)

Never include in the session file:
- Real credentials, API tokens, passwords from `.env` files.
- Long verbatim excerpts from client-sensitive data.
- Customer PII.
- Any content the AGENTS.md §7 (AI read restrictions) excludes.

If the chat involved reading those files, summarize without quoting (e.g., "verified .env has QA_USER set" — never "QA_USER=joe@acme.com").

This block is now committed to permanent git history (the session file merges to `main`), so the policy is MORE load-bearing than before: a credential pasted here rides along forever and will trip the `validate.mjs sessions --strict-pii` secret gate at session close. Redact at write time.

## Output

**Append** a `## Handoff HH:MM` block to `sessions/<session-id>.md`. Do NOT overwrite the file and do NOT touch its frontmatter — `/session-end` flips `status` to `closed`, not this prompt. Append after the last existing block, in this exact section order:

```markdown
## Handoff HH:MM

### Current goal
<one-sentence what we're trying to achieve>

### Current state
<2-4 sentences on where the work stands>

### Files in focus
- path:line — why it matters
- path:line — pending change / decision

### Decisions made
- <each decision in a single line>

### Open questions
- <questions the new chat needs to resolve>

### Risks / gotchas
- <traps the new chat must not fall into>

### Next exact action
<the very next concrete step>

### Do not redo
- <things already verified to save the new chat time>

### Useful commands run
- `node scripts/validate.mjs` — passed
- ...
```

## Hard rules

1. **Write to the session file, not a root file.** `CHAT-HANDOFF.md` is retired and gone — never create it.
2. **Append, never overwrite.** The session file accumulates Handoff/Note/Bridge-out blocks across the day; earlier blocks stay.
3. **Do not change frontmatter.** Leave `status: open` alone — only `/session-end` closes the session.
4. **"Next exact action" is mandatory.** Without it, the handoff is decorative.
5. **Apply the redaction policy.** Re-read your own draft and remove any creds or PII before saving — this block is committed history.

## After saving

1. **Verify the write.** Read back `sessions/<session-id>.md` and
   confirm the new `## Handoff HH:MM` block is present at the end. If
   the read fails or the block is missing, surface that immediately —
   do NOT claim success. Retry with the absolute workspace path.

2. In chat, summarize:

   ```
   Handoff appended to sessions/<session-id>.md (## Handoff HH:MM).

   Goal: <one line>
   Files in focus: <N>
   Open questions: <N>
   Next: <one line>

   To resume in a new chat: open the SAME workspace, then invoke
   /resume-from-handoff. The session file is committed, so any AI
   surface can read it.
   ```
