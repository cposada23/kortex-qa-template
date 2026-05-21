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

## Architecture — team-centric (v1.1)

The brain is organized around **teams**. You may belong to one team
or to multiple teams concurrently (or rotate across teams over
time). The architecture supports all three.

### `teams/<slug>/` — team-scoped content

Each team gets one folder containing **everything team-specific**:

```
teams/<slug>/
├── AGENTS.md           Team-scoped agent context
├── README.md, INDEX.md
├── members.md          Roster
├── workflow.md         Jira board, DoR, DoD
├── deploy.md           Deploy procedures
├── ceremonies-info.md  Sprint cadence
├── stories/            One folder per Jira ticket
├── test-cases/library/ Reusable test cases (per area)
├── bugs/               Bug registry, linked from stories
├── reviews/            Peer reviews of others' test cases
├── ceremonies/         Meeting notes (sprint-planning/, daily-standups/, reviews/, retrospectives/)
├── environments/       Local / dev / qa setup, users, filters
├── automation/         Playwright meta-knowledge
└── inbox/              Team-specific captures
```

Plus two special files at the `teams/` level:
- **`teams/active-team.txt`** — line(s) listing currently active
  team slug(s). First line = primary (default target for scaffolds).
  Read all lines for default `/session-start` scope.
- **`teams/_template-team/`** — empty scaffold copied by
  `node scripts/new-team.mjs <slug>` when adding a team.

### Global zones (cross-team)

```
knowledge/    SYNTHESIS ZONE    Distilled lessons. Portable across teams AND across clients.
playbooks/    WORKFLOW DOCS     How-to guides for the core daily loop.
scripts/      TOOLING           Node.js .mjs scripts (zero-dep, Windows-safe).
templates/    SCAFFOLD SOURCES  Used by new-story.mjs, new-team.mjs, etc.
.github/      COPILOT WIRING    copilot-instructions.md + instructions/ + prompts/
```

Top-level meta: `AGENTS.md` (this file), `README.md`, `INDEX.md`,
`TODO.md`, `JOURNAL.md`, `VERSION`.

### Why team-centric (cf. v1.0 flat-10-zone)

- "What's the ceremony for my current team?" → one-folder jump:
  `teams/<active>/ceremonies/`.
- Multi-team support: zero cross-team leakage in stories, ceremonies,
  envs, bugs. Each team's content is physically isolated.
- The `knowledge/` zone is the only zone designed to cross teams
  (and clients) — and it must be sanitized before traveling. See
  [playbooks/team-knowledge-promotion.md](playbooks/team-knowledge-promotion.md).

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
2. **Working hours** — edit stories, capture in the active team's
   `inbox/`, run scripts, draft test cases. Use the prompts listed
   below as you work.
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

## Compliance, Org Policy & Platform Philosophy

### 1. Platform invariant: Windows-First, cross-platform always

The primary work environment is **Windows with PowerShell**. Scripts,
paths, and instructions optimize for that.

- **Path separators:** normalize internally — Node's `path.join()` /
  `path.sep` always; never hardcode `/` or `\` in script logic.
- **Shells:** any inline shell snippet that ships in docs or scripts
  must be PowerShell-safe (quoting, env-var syntax). Bash equivalents
  are documented alongside when relevant.
- **Cross-platform:** the brain must work on macOS and Linux
  identically. The owner uses macOS for personal QA projects inside
  their main `mykortex` graph; cross-platform parity is not optional.

If a script or doc adds a Windows-only or Unix-only step, mark it
explicitly with the alternative for the other platform.

### 2. Local-only Git (no push, offline-first)

This brain runs as **local Git only** on the client-issued machine.
There is no remote origin. `git push` is not used and is not
supported by the workflow.

- Git is the within-laptop history / undo buffer.
- ZIPs under `versions/` are the cross-laptop / disaster-recovery
  channel (see [playbooks/version-snapshot.md](playbooks/version-snapshot.md)).
- A push command is a sign someone wired a remote by mistake.
  Remove the remote, don't push.

### 3. Local credentials & environment variables

Because the brain never leaves the laptop, the owner **may store
real test credentials in local env files** (e.g., `.env`,
`.env.local`, `client-secrets/*.env`) for daily SUT testing and
Playwright runs.

- **OK:** real usernames, passwords, API tokens, base URLs in a
  local `.env` that scripts and Playwright fixtures read via
  `process.env.*`.
- **NOT OK:** real credentials inside tracked `.md` files (stories,
  test cases, `environments/users.md`, etc.). Those stay
  placeholders or roles-only. Git history is forever — even
  without a remote, a leaked cred in a tracked file requires
  history rewriting to remove.
- **Gitignored, snapshot-INCLUDED.** Credential files MUST be in
  [.gitignore](.gitignore) (so git can't track them) but are
  intentionally **kept inside** the ZIP snapshots written by
  `scripts/snapshot.mjs`. Rationale: the snapshot ZIP is personal
  cross-laptop recovery (the owner DMs it to themselves on Teams,
  never shares it). On a laptop swap, the ZIP restores the working
  brain *with* creds intact — no re-collection from password
  managers / vault systems.
- **Snapshot ZIPs are never shared.** This is a hard rule, not a
  preference. If the ZIP ever needs to be handed to anyone (IT,
  another QA, a client manager), the owner first extracts to a
  staging copy, deletes every `.env`/`.secrets`/`client-secrets/`
  file, and zips the staging copy fresh. The original ZIP stays
  private.
- **AI agents do NOT read these files.** See §7 below — this is
  the load-bearing protection layer for cred files.

### 4. Single-client by design

One Kortex-QA clone serves **one client engagement** at a time. No
`clients/` sub-folder, no multi-tenancy. Rotation between clients
means **wipe and re-clone**, not switch-context. The constraint is
intentional: client data isolation is easier when the filesystem
itself enforces "one client per folder." Full off-boarding ritual:
[playbooks/client-rotation.md](playbooks/client-rotation.md).

Within a client, multi-team is fully supported via
`teams/active-team.txt`.

### 5. Hard content rules (independent of credential policy)

- **No client identifiers in `knowledge/`.** That zone is the only
  one designed to travel across clients. Everything else stays
  with the client clone. Promotion to `knowledge/` requires the
  sanitization checklist in
  [playbooks/team-knowledge-promotion.md](playbooks/team-knowledge-promotion.md).
- **No credentials in tracked `.md` files.** Even in a local-only
  repo, mixing creds into stories/test-cases/bugs/reviews makes
  them un-shareable with peers down the line. Keep them in `.env`.
- **`validate.mjs` runs automatically at commit time.** The
  pre-commit hook installed by `node scripts/install-hooks.mjs`
  runs `validate.mjs` + `build-index.mjs --check` before every
  commit. Even without a push concern, this matters: once a stray
  credential or schema drift lands in local git history, removing
  it requires a history rewrite. Catching at commit time keeps
  history clean. Bypass with `git commit --no-verify` (sparingly).
- **Also run `validate.mjs` manually before snapshotting.** The
  hook covers commits, not the moment of `node scripts/snapshot.mjs`.
  A snapshot taken between commits could carry uncommitted
  drift.

### 6. Org policy pre-flight (run before first commit on a new client)

Confirm with the client (or your direct manager) that the
following are permitted on the client-issued machine. The template
*assumes* they are; if any aren't, see the adaptation table in
[README.md](README.md) §"Org policy fit":

1. GitHub Copilot on client artifacts (per Copilot data policy).
2. Local Git on the client-issued machine.
3. Local ZIP backups in the user profile / Teams archive.
4. Node.js 18+ installed (Playwright requires it; the scripts are
   zero-dep ESM modules).

### 7. AI agents must NOT read credential files

The §3 policy allows real credentials in local `.env`-style files.
Those files are gitignored *and* kept in snapshot ZIPs (personal
recovery). The remaining concern is **AI assistants accidentally
ingesting them** — once a credential lands in an AI context window,
it may be logged, used to train a future model, or surfaced in a
later conversation. This rule keeps that surface area at zero.

**You (the AI agent) MUST NOT read, open, paste, summarize, or
otherwise process the contents of any file matching these patterns:**

- `.env`, `.env.local`, `.env.*`
- `.secrets`
- `client-secrets/**`
- `versions/*.zip`, `versions/*.tar.gz` (snapshot ZIPs may contain
  the above)
- `.cache/**` (may include prior agent transcripts with sensitive
  content)

**Even if the owner asks:**

- "Show me what's in `.env`" → reply "I can't read credential
  files per the AGENTS.md §7 rule. Open it yourself in the editor."
- "Help me debug why `process.env.QA_USER` is undefined" → fine,
  but don't `cat .env`. Ask the owner to verify their `.env` has
  `QA_USER=...` without disclosing the value.
- "Append `NEW_TOKEN=xyz` to `.env`" → fine *only* if the owner
  pasted the literal token text. Never invent or read existing
  values.

**Enforcement layers:**

- `.aiexclude` in the repo root (Gemini Code Assist convention).
- This rule in `AGENTS.md` (Claude, Codex, Copilot, Cursor — they
  all read this file).
- `.github/copilot-instructions.md` §"AI model read restrictions"
  (Copilot-specific reinforcement).
- VS Code per-user settings (`github.copilot.advanced.fileFilters`)
  are not portable; this rule is the portable substitute.

If a model violates this rule (you find evidence in chat logs),
the file goes in the "rotate this credential immediately" bucket.

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
