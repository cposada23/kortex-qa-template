---
description: Append a lightweight "## Note HH:MM" checkpoint to today's session file so context is never lost if the chat dies
agent: agent
---

<!--
  No `tools:` declared on purpose — that field restricts Copilot
  Agent to only the listed tools, which would block it from deriving
  the session id (git branch --show-current) and appending to the
  session file. The note is written to TODAY'S session file
  (sessions/<current-branch-id>.md), committed and discoverable by
  every AI surface.
-->


# Session note

You are recording a quick, on-demand checkpoint of where the work is right now. This is the lightweight cousin of `/chat-handoff` — no full transfer schema, just enough that if the chat dies or the engineer steps away, the thread is recoverable. Use it freely throughout the day.

## When to invoke

- Just made a decision worth remembering.
- About to try something risky and want a known-good checkpoint.
- Stepping away for a bit and don't want to lose the thread.
- The chat is getting long and you want a breadcrumb before it's full.

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
2. **The recent chat history** — enough to capture the current focus,
   any fresh decision, any blocker, and the next micro-step.

## Process

Pull from the chat (keep it short — this is a breadcrumb, not a handoff):

1. **Current focus** — one line: what you're working on right now.
2. **Decision** — any choice just made, or "none".
3. **Blocker** — anything stuck, or "none".
4. **Next micro-step** — the very next small thing to do.

## Redaction policy (load-bearing)

Never include in the session file:
- Real credentials, API tokens, passwords from `.env` files.
- Long verbatim excerpts from client-sensitive data.
- Customer PII.
- Any content the AGENTS.md §7 (AI read restrictions) excludes.

If the chat involved reading those files, summarize without quoting (e.g., "verified .env has QA_USER set" — never "QA_USER=joe@acme.com").

This note is committed to permanent git history (the session file merges to `main`) and is scanned by the `validate.mjs sessions --strict-pii` secret gate at session close. Redact at write time — re-read your own draft before saving.

## Output

**Append** a `## Note HH:MM` block to `sessions/<session-id>.md`. Do NOT overwrite the file and do NOT touch its frontmatter — append after the last existing block:

```markdown
## Note HH:MM

Focus: <one line — what's being worked on right now>
Decision: <choice just made, or "none">
Blocker: <what's stuck, or "none">
Next: <the very next micro-step>
```

## Hard rules

1. **Append, never overwrite.** The session file accumulates Note/Handoff/Bridge-out blocks across the day; earlier blocks stay.
2. **Do not change frontmatter.** Leave `status: open` alone — only `/session-end` closes the session.
3. **Keep it short.** A note is a breadcrumb. If you need the full transfer schema (files in focus, open questions, do-not-redo), use `/chat-handoff` instead.
4. **Apply the redaction policy.** Re-read your own draft and strip any creds or PII before saving — this is committed history.

## After saving

In chat, confirm tersely:

```
Note appended to sessions/<session-id>.md (## Note HH:MM).
Focus: <one line>. Next: <one line>.
```

## Example

Mid-afternoon, branch `session/20260604-0930-flaky-test`, the engineer just decided how to fix a race condition and is about to implement it.

Appended to `sessions/20260604-0930-flaky-test.md`:

```markdown
## Note 14:10

Focus: Fixing the flaky TEAM-1234 search automation test.
Decision: Await the fixture seed explicitly instead of a fixed sleep — deterministic, no flake budget.
Blocker: none
Next: Edit automation.spec.ts fixture setup to await the seed before the first assertion.
```
