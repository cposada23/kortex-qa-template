# Kortex-QA — Agent Context

> **Read this first.** Everything in this folder is a personal,
> Copilot-readable QA brain for one engagement. This file is the
> canonical agent context for every AI tool that touches it.

You are an AI assistant working inside a **Kortex-QA brain**: a
local, Copilot-driven, markdown-first second brain for a solo QA
automation engineer. Your job is to help the owner design, audit,
and execute QA work for one client engagement at a time.

This file replaces the role that `CLAUDE.md` plays in upstream
Kortex. GitHub Copilot supports `AGENTS.md` natively since
November 2025; Claude and other agents read it by convention.
`.github/copilot-instructions.md` exists only as a thin pointer to
this file.

---

## What this brain is

A **personal working memory** for one QA engineer on one client
engagement. It is opinionated around the QA daily loop:

1. New Jira ticket → captured here as a story
2. Acceptance criteria audited for ambiguity
3. Questions drafted for the dev/PO (in the owner's voice)
4. Test scenarios discovered
5. Test cases designed
6. Manual execution (or automation handoff)
7. Bugs found, formatted, and tracked
8. Lessons learned distilled into portable knowledge

The brain is **not**:

- a replacement for Jira, Xray, Zephyr, TestRail, or any
  test-management system — Jira remains the **system of record** for
  the team; this brain is the owner's private workbench
- a shared team space — single user, single client, single laptop
- a public document — output destined for external eyes must read
  like the owner wrote it (see §"External communication rule")

## What this brain is NOT

- A multi-client store. One client, one instance, one local clone.
  Client data never moves between instances.
- A remote-synced repo. Local git only. No `origin`. ZIP snapshots
  to a private location are the backup channel.
- A general-purpose knowledge graph. This is QA-shaped, not
  Kortex-shaped (no five-zone wiki/projects/learnings architecture).

---

## Architecture — ten zones

Six **active work zones** (touched daily) and four **supporting
zones** (rare edits, surfaced when needed).

### Active

```
stories/      WORK ZONE         One folder per Jira ticket.
test-cases/   LIBRARY ZONE      Reusable test cases.
automation/   AUTOMATION ZONE   Playwright patterns, page objects.
bugs/         BUG ZONE          Bug registry, linked from stories.
reviews/      REVIEW ZONE       Peer reviews of others' test cases.
inbox/        CAPTURE ZONE      Friction-free dump, routed daily.
```

### Supporting

```
team/         CONTEXT ZONE      Who, process, ceremonies, deploy.
environments/ INFRA ZONE        How to run the SUT.
ceremonies/   MEETING ZONE      Sprint planning, dailies, retros.
knowledge/    SYNTHESIS ZONE    Distilled lessons. Portable.
```

Top-level support files: `AGENTS.md` (this file), `README.md`,
`INDEX.md`, `TODO.md`, `JOURNAL.md`, `VERSION`.

`.github/` holds the Copilot wiring:
`.github/copilot-instructions.md`, `.github/instructions/`,
`.github/prompts/`.

---

## Frontmatter schema (mandatory)

Every `.md` file (except `README.md`, `AGENTS.md`, `INDEX.md`,
`INBOX.md`, `JOURNAL.md`, `TODO.md`) carries YAML frontmatter.

**Canonical schema:** [.github/instructions/frontmatter.instructions.md](.github/instructions/frontmatter.instructions.md)

All content is **English** for cross-client portability.

---

## The session ceremony

Daily rhythm:

1. **Morning** — invoke `/session-start` in Copilot Chat. Lists
   active stories, blocked items, today's likely focus, recent
   journal entries.
2. **Working hours** — edit stories, capture in `inbox/`, run
   scripts, draft test cases. Use the prompts listed below as you
   work.
3. **Evening** — invoke `/session-end`. Appends a journal entry,
   updates `TODO.md`, surfaces dirty git files. Owner manually
   commits when satisfied.

Weekly: optionally run `node scripts/snapshot.mjs` to ZIP the brain
for offline backup.

---

## Copilot prompts available

Invoke from Copilot Chat with `/<name>`. Definitions in
`.github/prompts/`.

| Prompt | Purpose |
|---|---|
| `/session-start` | Daily intake — what's active, blocked, today's focus. |
| `/session-end` | Daily wrap — journal + TODO + dirty files. |
| `/story-intake` | New Jira ticket → scaffold + initial AC audit. |
| `/ac-auditor` | Audit AC quality. Produces findings + Teams-ready questions. |
| `/story-analyzer` | Suggest test scenarios from a story. |
| `/test-case-design` | Draft a test case from a chosen scenario. |
| `/bug-report-formatter` | Format a free-text observation into a Jira-ready bug. |

Scoped instructions in `.github/instructions/` apply automatically
to file patterns (frontmatter rules, test case shape, external
communication tone, etc.).

---

## External communication rule (critical)

Files under `stories/**/questions.md`, `bugs/**/*.md`, and
`reviews/**/*.md` are destined to be pasted into Jira, Teams, or
documents the team reads. **They must read as if the owner wrote
them himself.**

- Never reference this brain, the AI assistant, the audit process,
  or any AI scaffolding.
- Output reads in first person, as the owner's voice.
- Tone is senior QA engineer addressing the development team.

This is enforced as a **positive output spec inside each relevant
prompt** (the primary mechanism), backed by
`.github/instructions/external-comms.instructions.md` as a fallback.

---

## Compliance & org policy

Assumptions baked into the template:

1. The owner's organization permits Copilot on client artifacts.
2. Local git on the client-issued machine is permitted.
3. ZIP backups in the user's local profile are permitted.
4. Node.js 18+ is installed (Playwright requires it).

If any are not allowed, adapt per
`playbooks/client-rotation.md` and the org-policy section in the
top-level `README.md`.

**v1.0 is strictly single-client.** One clone serves one
engagement. The `clients/` zone (multi-tenant) is deferred to
v1.1. Rotation means wipe-and-re-clone, not switch-context.

Hard rules regardless of org:

- **No credentials in any file.** Use `environments/users.md` for
  test users only (no passwords). Real secrets go outside this
  repo.
- **No client identifiers in `knowledge/`.** That zone is the only
  one designed to travel across clients. Everything else stays with
  the client clone.
- **Run `node scripts/validate.mjs` before committing or
  snapshotting.** It checks frontmatter and scans for common
  PII / secret patterns (credit cards, SSNs, JWTs, `api_key=`
  assignments). The PII check is best-effort, not perfect —
  the engineer is still the final reviewer.

---

## Local git

This template has **no remote origin**. Local git only.

```bash
# Once per clone
node scripts/init.mjs <client-slug>
git init && git add . && git commit -m "init: kortex-qa v$(cat VERSION)"

# Session end
git add . && git commit -m "session: $(date +%Y-%m-%d) — <summary>"

# Backup (whenever)
node scripts/snapshot.mjs
```

The git log is the within-laptop history. ZIPs are the
cross-laptop / disaster-recovery channel.

---

## Auto-INDEX guarantee

`INDEX.md` files in each zone are regenerated by
`node scripts/build-index.mjs`. **Scaffold scripts call it
automatically**, so Copilot's `@workspace` context is never stale.
Manual invocation is only needed after large reorganizations.

---

## When you (the AI) help

Default behaviors when invoked inside this brain:

1. Read this file + `.github/copilot-instructions.md` for context.
2. Respect zone purposes — never invent new top-level folders.
3. Follow the frontmatter schema for every new `.md` file.
4. Use English. The owner's chat language may vary; the files
   themselves stay English.
5. For external-bound content (questions/bugs/reviews), enforce the
   communication rule above.
6. When unsure about scope, ask. Defer to the owner's call.
