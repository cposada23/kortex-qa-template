---
description: Compact the current chat state into CHAT-HANDOFF.md for context transfer to a fresh chat
agent: agent
---

# Chat handoff

You are compacting the current chat session into a single file the engineer (or a new chat) can read to resume context without replaying history.

## When to invoke

The engineer is about to:
- Start a new chat because this one is full.
- Stop for the day mid-task and pick up later.
- Hand off to themselves in a different surface (Copilot Chat ↔ Claude ↔ Codex).

## Input

The current chat history. Read the entire conversation back to the most recent goal-setting message. If a previous `CHAT-HANDOFF.md` exists at the repo root, read it too — the new handoff may need to reference or supersede it.

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

Never include in `CHAT-HANDOFF.md`:
- Real credentials, API tokens, passwords from `.env` files.
- Long verbatim excerpts from client-sensitive data.
- Customer PII.
- Any content the AGENTS.md §7 (AI read restrictions) excludes.

If the chat involved reading those files, summarize without quoting (e.g., "verified .env has QA_USER set" — never "QA_USER=joe@acme.com").

## Output

Write to `CHAT-HANDOFF.md` at the repo root. Frontmatter:

```yaml
---
title: "Current chat handoff"
type: reference
status: active
language: en
tags: [handoff, session]
updated: YYYY-MM-DD
---
```

Body sections in this exact order:

```markdown
# Chat handoff — YYYY-MM-DD HH:MM

## Current goal
<one-sentence what we're trying to achieve>

## Current state
<2-4 sentences on where the work stands>

## Files in focus
- path:line — why it matters
- path:line — pending change / decision

## Decisions made
- <each decision in a single line>

## Open questions
- <questions the new chat needs to resolve>

## Risks / gotchas
- <traps the new chat must not fall into>

## Next exact action
<the very next concrete step>

## Do not redo
- <things already verified to save the new chat time>

## Useful commands run
- `node scripts/validate.mjs` — passed
- ...
```

## Hard rules

1. **`CHAT-HANDOFF.md` is gitignored.** It's session state, not knowledge. Don't try to commit it.
2. **It IS included in snapshot ZIPs** — personal recovery if you swap laptops mid-task.
3. **Overwrite freely.** Each `/chat-handoff` invocation replaces the file. The previous handoff is preserved in the snapshot ZIPs, not in `CHAT-HANDOFF.md`.
4. **"Next exact action" is mandatory.** Without it, the handoff is decorative.
5. **Apply the redaction policy.** Re-read your own draft and remove any creds or PII before saving.

## After saving

In chat, summarize:

```
Handoff written to CHAT-HANDOFF.md (updated YYYY-MM-DD HH:MM).

Goal: <one line>
Files in focus: <N>
Open questions: <N>
Next: <one line>

To resume in a new chat: paste this prompt or invoke /resume-from-handoff.
```
