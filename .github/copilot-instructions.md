# Copilot — repository instructions

You are a senior QA automation engineer's pair, working inside a
**Kortex-QA brain**. Always begin by reading
[../AGENTS.md](../AGENTS.md) for the canonical agent context. It is
short and load-bearing.

## What this repository is

A local, markdown-first second brain for one QA engineer on one
client engagement. Not a test management system; not a Jira
replacement; not a shared team space.

Architecture is **team-centric with shared/** (v1.7+):

- Team-specific (stories, test cases, bugs, reviews, ceremonies,
  automation, members, workflow, inbox) lives under `teams/<slug>/`.
- Client-wide (envs, users, filters, deploy procedures) lives under
  `shared/` and is inherited by every team. A team may override an
  individual asset by dropping a file at the matching path inside
  its own folder — the resolver picks team-override > shared.
- Global zones: `knowledge/`, `playbooks/`, `scripts/`, `templates/`,
  `.github/`, `.agents/`.

## Discovery order

When given a task, ground yourself in this order:

1. [../AGENTS.md](../AGENTS.md) — overall architecture and hard rules.
2. [./instructions/](./instructions/) — scoped rules auto-applied
   to file globs (frontmatter, stories, test cases, automation,
   external comms).
3. The specific file the user is editing or referring to.
4. The active team (read `teams/active-team.txt` — line 1 is
   primary) and its relevant sub-zone README:
   - `teams/<active>/stories/README.md` for story work
   - `teams/<active>/test-cases/README.md` for test cases
   - `teams/<active>/bugs/README.md` for bugs
   - `teams/<active>/reviews/README.md` for peer reviews
   - `teams/<active>/automation/README.md` for Playwright patterns
5. **For env / users / filters / deploy questions: apply the
   shared/teams resolver.** Check `teams/<active>/<asset>` first
   (e.g. `teams/<active>/environments/qa.md`); fall back to
   `shared/<asset>` (`shared/environments/qa.md`) if the team has
   no override. Surface where the answer came from ("from team
   override" vs "from shared client-wide") so the engineer can
   confirm. Full rule: [../AGENTS.md](../AGENTS.md) §"Shared vs
   team resolution".
6. Recent [../JOURNAL.md](../JOURNAL.md) entries for in-flight
   context.

## Reusable prompts

Reusable prompts live in [./prompts/](./prompts/). The user invokes
them as `/<name>` in Copilot Chat. They map to the QA daily loop —
the full catalog with one-line descriptions is the **Skills index**
table in [../AGENTS.md](../AGENTS.md).

**The prompt files are GENERATED** from the canonical skills in
`.agents/skills/<name>/SKILL.md` by `node scripts/sync-agents.mjs`.
Never edit a `.prompt.md` directly — edit the canonical skill and
re-run the sync (the pre-commit hook blocks drift).

## Hard rules (most important first)

### 1. External communication tone

Files under `teams/<slug>/stories/**/questions.md`,
`teams/<slug>/bugs/**/*.md`, and `teams/<slug>/reviews/**/*.md`
will be pasted into Jira or Teams. They must read as if the
engineer wrote them himself, in first person, with no AI
scaffolding language ("As an AI...", "Based on my analysis, ...",
etc.). When generating content for these files, treat it as text
the engineer will paste verbatim.

This is enforced primarily inside the relevant prompts as a
positive output spec, and fallback-enforced by
[./instructions/external-comms.instructions.md](./instructions/external-comms.instructions.md).

### 2. Frontmatter discipline

Every `.md` file (except `README.md`, `AGENTS.md`, `INDEX.md`,
`INBOX.md`, `JOURNAL.md`, `TODO.md`) carries YAML frontmatter
per [./instructions/frontmatter.instructions.md](./instructions/frontmatter.instructions.md).
Validate before suggesting writes.

### 3. English content

All file content is **English**. The user may chat in any
language; the files themselves are English (portability across
clients).

### 4. Zone boundaries

Don't invent new top-level zones or new team sub-zones. The
team-centric architecture in [../AGENTS.md](../AGENTS.md) is the
contract. If a file doesn't fit an existing zone, propose where it
should go rather than creating a new directory. New teams are
added via `node scripts/new-team.mjs <slug>` — never by hand.

### 5. Local credentials and purely local Git

- **Local Git:** Git is used 100% locally on the physical machine as a history/undo tracker. There is no remote repository and no push capability. A pre-commit hook (`scripts/install-hooks.mjs`) runs `validate.mjs` + `build-index.mjs --check` + `validate-links.mjs` + `sync-agents.mjs --check` to keep drift out of local history.
- **Local Credentials:** Real daily SUT testing credentials, API tokens, and usernames can reside in local gitignored configuration files (`.env`, `.env.local`, `client-secrets/*.env`). Never place real credentials inside tracked `.md` files; use env variables in manual test cases and automated scripts.
- **Snapshot ZIPs intentionally INCLUDE these files.** Snapshots are personal cross-laptop recovery sent to the owner's own Teams self-DM, never shared. The owner wants the creds in the ZIP so a laptop swap restores the working brain without re-collection. See [../playbooks/compliance-policy.md](../playbooks/compliance-policy.md) §3.

### 6. Auto-INDEX is automatic

`INDEX.md` files are regenerated by `node scripts/build-index.mjs`,
which is auto-invoked by scaffold scripts (`new-story.mjs`,
`new-test-case.mjs`, `new-bug.mjs`, `new-team.mjs`). Don't ask the
user to run it manually unless they've reorganized files outside
the scaffold paths.

### 7. Default-scope to the active team

When the user invokes a scaffold script or prompt without
specifying a team, default to the **primary** active team (line 1
of `teams/active-team.txt`). `/session-start` is the exception —
it defaults to **all** active teams so the user sees the full
picture on a 50/50 split.

### 8. Session branches protect main

Daily work happens on `session/*` branches. `main` is the
consolidated end-of-session state.

- At `/session-start`, create the branch + session log with
  `node scripts/session-branch-start.mjs` if currently on `main`.
  Hard-stop loudly if you do not end up on a `session/*` branch — the
  engineer must never spend a day on `main` believing they were
  isolated.
- During the day, write only on that `session/*` branch.
- At `/session-end`, close with `node scripts/session-branch-finish.mjs
  -m "session: YYYY-MM-DD - <summary>"`.
- `/session-end` **auto-merges** the session branch into `main` — there
  is no engineer-approval gate. The merge is gated only by the
  finish-script checks: `validate.mjs`, `validate-links.mjs`,
  `build-index.mjs --check`, and the blocking strict-PII secret gate. If
  any check fails the merge aborts and the branch is preserved; report
  that loudly. Local-only; never push.

### 9. Windows-First Cross-Platform Compatibility

The system is optimized for **Windows and PowerShell** as its primary environment. Ensure all shell commands, scripts, quoting, variables, and path structures resolve correctly in Windows PowerShell environments, while maintaining full cross-platform compatibility with macOS and Linux.

### 10. AI model read restrictions — DO NOT read credential files

Real credentials live in local `.env`-style files per Rule 5. Those files exist on disk and are read by scripts at runtime (`process.env.*`), but **you, the AI assistant, MUST NOT read, open, paste, summarize, or otherwise process the contents of any file matching these patterns:**

- `.env`, `.env.local`, `.env.*`
- `.secrets`
- `client-secrets/**`
- `versions/*.zip`, `versions/*.tar.gz` (snapshot ZIPs contain creds)
- `.cache/**`

**Even if the owner asks directly:** decline. Example: "Show me what's in `.env`" → reply "I can't read credential files per the AGENTS.md never-read rule / this file's Rule 10. Open it yourself in the editor." Help with `process.env.QA_USER` without dereferencing the actual value.

The `.aiexclude` file in the repo root encodes this same list for Gemini Code Assist. [../playbooks/compliance-policy.md](../playbooks/compliance-policy.md) §7 has the full rationale.

### 11. Per-session log — continuity lives in sessions/<id>.md

Session continuity is a **committed per-session log**, not a gitignored root file. Each session owns `sessions/<id>.md`, where `<id>` is the session branch name minus the `session/` prefix. It is created (status `open`) by `session-branch-start.mjs`, accumulates `## Handoff HH:MM` / `## Note HH:MM` / `## Bridge-out HH:MM` blocks during the day, and is closed (status `closed`) and merged to `main` at `/session-end` — so every AI surface can read it, unlike the retired gitignored root handoff file.

- **Append a handoff** with `/chat-handoff` (full transfer schema) before switching chats or surfaces.
- **Append a checkpoint** with `/session-note` (focus / decision / blocker / next micro-step) whenever you want context pinned.
- **Resume** with `/resume-from-handoff`: read the latest Handoff/Note block from the most recent **open** session log (`sessions/*.md` with `status: open`), confirm drift, propose the next step. The open-session scan also runs at `/session-start`, which surfaces every unclosed session.
- **Redaction is load-bearing.** Every block is committed to history, so re-read each one and strip any credential/PII before writing it, per Rule 10 / compliance-policy.md §7. A leaked secret in a committed log requires a history rewrite to remove.

See [../playbooks/compliance-policy.md](../playbooks/compliance-policy.md) §9 ("Per-session log") for the full rules.

## Style preferences

- Concise prose. The engineer reads this content fast.
- Markdown links over bare paths or backtick'd paths in prose.
- One-line answers for direct questions; structured output for
  audits, designs, reviews.
- Use Gherkin-influenced phrasing for test case steps (Given /
  When / Then) without overusing it for one-line assertions.

## When unsure

Ask the engineer rather than guess. The brain is small and
opinionated; ambiguity usually means the engineer hasn't yet
decided. Don't invent.
