# Kortex-QA — Agent Context

> **Read this first.** Everything in this folder is a personal,
> Copilot-readable QA brain for one engagement. This file is the
> canonical agent context for every AI tool that touches it.

You are an AI assistant working inside a **Kortex-QA brain**: a
local, Copilot-driven, markdown-first second brain for a solo QA
automation engineer. Your job is to help the owner design, audit,
and execute QA work for one client engagement at a time.

This file is the single source of truth for every AI agent that
opens this brain — Copilot (the primary surface), Claude, Codex,
Gemini, Cursor, etc. GitHub Copilot supports `AGENTS.md` natively
since November 2025; others read it by convention or via per-agent
wrapper files that delegate here:

- `.github/copilot-instructions.md` — Copilot-specific wrapper with
  prompt list + idiosyncrasies; defers to this file for canonical
  rules. **Primary surface — the engineer uses Copilot daily.**
- `CLAUDE.md` — one-line wrapper for Claude Code.
- `GEMINI.md` — one-line wrapper for Gemini.
- `.agents/permissions.yml` — declares what each agent can write
  (cross-AI policy; secrets are always denied).

We do **not** use symlinks because the brain must work on Windows
without `git config core.symlinks=true`. Each wrapper is a regular
file with a single sentence pointing at this one.

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

## Architecture — team-centric with shared/ (v1.7)

The brain is organized around **teams**. You may belong to one team
or to multiple teams concurrently (or rotate across teams over
time). The architecture supports all three.

**Three scopes** divide what lives where:

1. **Client-wide** (`shared/`) — facts true for EVERY team on this
   client engagement: env URLs, test users, dataset filters, deploy
   cadence. Default home for these things.
2. **Team-specific** (`teams/<slug>/`) — stories, bugs, test cases,
   ceremonies, members, workflow. Always per-team because the work
   itself is per-team.
3. **Per-team override of a client-wide asset** (`teams/<slug>/<asset>`)
   — optional. Drop a file with the same name as the shared one if
   ONLY this team uses a different env/users/filters/deploy.

### `shared/` — client-wide content

```
shared/
├── README.md
├── environments/        Local / dev / qa setup, per env, sections for UI / API / DB
├── users.md             Test user accounts, naming convention
├── filters.md           Recurring test datasets / magic strings
└── deploy.md            Deploy cadence + ownership across envs
```

### `teams/<slug>/` — team-scoped content

Each team gets one folder containing **only the truly team-specific
stuff** (no env duplication):

```
teams/<slug>/
├── AGENTS.md           Team-scoped agent context
├── README.md, INDEX.md
├── members.md          Roster
├── workflow.md         Jira board, DoR, DoD
├── ceremonies-info.md  Sprint cadence
├── stories/            One folder per Jira ticket
├── test-cases/<area>/  All test cases for the team (single home)
├── bugs/               Bug registry, linked from stories
├── reviews/            Peer reviews of others' test cases
├── ceremonies/         Meeting notes (sprint-planning/, daily-standups/, reviews/, retrospectives/)
├── automation/         Playwright meta-knowledge
├── inbox/              Team-specific captures
└── environments/       (override only — README explains; empty by default)
```

Plus two special files at the `teams/` level:
- **`teams/active-team.txt`** — line(s) listing currently active
  team slug(s). First line = primary (default target for scaffolds).
  Read all lines for default `/session-start` scope.
- **`teams/_template-team/`** — scaffold copied by
  `node scripts/new-team.mjs <slug>` when adding a team. Does NOT
  contain env/deploy/users/filters by default; new teams inherit
  from `shared/`.

### Global zones (cross-team, not client-wide)

```
knowledge/    SYNTHESIS ZONE    Distilled lessons. Portable across teams AND across clients.
playbooks/    WORKFLOW DOCS     How-to guides for the core daily loop.
scripts/      TOOLING           Node.js .mjs scripts (zero-dep, Windows-safe).
templates/    SCAFFOLD SOURCES  Used by new-story.mjs, new-team.mjs, etc.
.github/      COPILOT WIRING    copilot-instructions.md + instructions/ + prompts/
.agents/      CROSS-AI POLICY   permissions.yml + README explaining multi-AI policy
```

Top-level meta: `AGENTS.md` (this file), `CLAUDE.md` / `GEMINI.md`
(wrappers), `README.md`, `INDEX.md`, `TODO.md`, `JOURNAL.md`, `VERSION`.

### Why this split

- "What's the QA env URL?" → one place: `shared/environments/qa.md`.
  No more guessing which team folder to read first; no more silent
  drift between team copies.
- Team override stays cheap: drop `teams/<slug>/environments/qa.md`
  and the resolver picks it. Zero config.
- Stories / bugs / test cases stay team-isolated (still no cross-team
  leakage).
- The `knowledge/` zone remains the only zone designed to cross
  clients — and still requires sanitization per
  [playbooks/team-knowledge-promotion.md](playbooks/team-knowledge-promotion.md).

---

## Shared vs team resolution

**Convention without config:** for any client-wide asset
(`environments/`, `users.md`, `filters.md`, `deploy.md`), the
presence of an override file at the team path IS the switch.

| Asset | Default location | Team override |
|---|---|---|
| local env | `shared/environments/local.md` | `teams/<slug>/environments/local.md` |
| dev env | `shared/environments/dev.md` | `teams/<slug>/environments/dev.md` |
| qa env | `shared/environments/qa.md` | `teams/<slug>/environments/qa.md` |
| test users | `shared/users.md` | `teams/<slug>/users.md` |
| filters / datasets | `shared/filters.md` | `teams/<slug>/filters.md` |
| deploy procedures | `shared/deploy.md` | `teams/<slug>/deploy.md` |

**Resolution rule:** check the team folder first; fall back to
`shared/` if not present.

**For agents (you):** when the engineer asks "what's the QA URL?"
for a given team, read `teams/<slug>/environments/qa.md` if it
exists, else `shared/environments/qa.md`. Surface the source ("from
team override" vs "from shared client-wide") so the engineer can
confirm.

**For scripts:** use [scripts/lib/resolve-shared.mjs](scripts/lib/resolve-shared.mjs).
API:
```js
import { resolveSharedWithSource } from './lib/resolve-shared.mjs';
const { source, path } = resolveSharedWithSource(repoRoot, teamSlug, 'environments/qa.md');
// source: 'team' | 'shared' | 'missing'
```

**When to put something in shared/ vs team:**

- Same URL/user/filter for every team on this client → `shared/`.
- One team owns a separate microservice / different SSO realm /
  different qa env → that team gets an override file. Everyone else
  still reads `shared/`.
- The work itself is team-specific (stories, bugs, test cases,
  ceremonies, members, workflow) → `teams/<slug>/` always. No
  shared/ equivalent.

---

## Frontmatter schema (mandatory)

Every `.md` file (except `README.md`, `AGENTS.md`, `INDEX.md`,
`INBOX.md`, `JOURNAL.md`, `TODO.md`) carries YAML frontmatter.

**Canonical schema:** [.github/instructions/frontmatter.instructions.md](.github/instructions/frontmatter.instructions.md)

All content is **English** for cross-client portability.

---

## The session ceremony

Daily rhythm — built around one **per-session log file** that is born
when the session starts and closed when it ends (see "Per-session log"
below):

1. **Morning** — invoke `/session-start` in Copilot Chat. If on `main`,
   it runs `node scripts/session-branch-start.mjs`, which atomically
   creates the `session/*` branch **and** the session log
   `sessions/<id>.md` (status `open`). The prompt **hard-stops loudly
   if it did not end up on a `session/*` branch** — so you never spend
   a full day on `main` believing you were isolated. It then surfaces
   any still-open session (the "previous session not closed" detection)
   and offers close-or-continue, and reads the last `JOURNAL.md` entry
   plus the open session's last block. Read-only except for creating
   the branch + file.
2. **Working hours** — edit stories, capture in the active team's
   `inbox/`, run scripts, draft test cases. Use the prompts below. Drop
   `/session-note` checkpoints (a `## Note HH:MM` block) or
   `/chat-handoff` transfers (a `## Handoff HH:MM` block) into today's
   session log whenever you want to pin context so it is never lost.
3. **Evening** — invoke `/session-end`. It is **autonomous**: no
   interview, no approval gate. It hard-stops loudly if you are not on a
   `session/*` branch, then **infers** the wrap fields from today's
   session log + the chat + `git diff main...<branch>` + git log + TODO,
   applies the redaction policy, appends a `## Bridge-out HH:MM`
   STATE/DID/DECISIONS/BLOCKERS/NEXT block (flipping the log's
   frontmatter to `closed`), appends a synthesized `JOURNAL.md` entry,
   updates `TODO.md`, regenerates indexes, and **auto-merges** the
   session branch to `main` via `node scripts/session-branch-finish.mjs`
   — which validates (including a blocking strict-PII secret gate)
   before committing and merging. If that finish step aborts, the branch
   is preserved and the failure is reported loudly.

Weekly: optionally run `node scripts/snapshot.mjs` to ZIP the brain
for offline backup. Because `sessions/*.md` are committed, every
session log rides along inside the snapshot automatically.

---

## Copilot prompts available

Invoke from Copilot Chat with `/<name>`. Definitions in
`.github/prompts/`.

| Prompt | Purpose |
|---|---|
| `/session-start` | Daily intake — creates the `session/*` branch + log if on `main`, surfaces open sessions, what's active/blocked, today's focus. |
| `/session-end` | Autonomous daily wrap — infers the bridge-out, appends it to the session log + JOURNAL, updates TODO, rebuilds indexes, and auto-merges the branch (strict-PII secret gate, no approval prompt). |
| `/chat-handoff` | Append a `## Handoff HH:MM` transfer block (full schema) to today's session log before switching chats or surfaces. |
| `/session-note` | Append a lightweight `## Note HH:MM` checkpoint (focus / decision / blocker / next micro-step) to today's session log. |
| `/resume-from-handoff` | Read the latest Handoff/Note block from the most recent open session log; confirm drift, propose the next step. |
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

### 8. Per-session log (sessions/)

Session continuity lives in a **committed per-session log file**, not
in an ephemeral root file. Each session owns exactly one log:
`sessions/<session-id>.md`, where `<session-id>` is the session branch
name minus the `session/` prefix (branch `session/20260604-0930-flaky`
→ file `sessions/20260604-0930-flaky.md`). The file is **keyed by
session (the branch), not by date** — which is what makes it survive a
forgot-to-close session and a session that crosses midnight (one stable
file, never split or orphaned).

**Why committed (not gitignored).** A gitignored root handoff file is
invisible to every AI surface that wasn't the one that wrote it, and
easy to lose. The session log instead is created on the session branch
and merged into `main`, so it is discoverable by Copilot, Claude, Codex,
and Gemini alike, and it rides along inside snapshot ZIPs automatically
(per §3) without any special-casing.

**File shape.** Frontmatter: `title: "Session <id>"`, `type: session`,
`status: open | closed`, `language: en`, `tags: [session]`,
`updated: <start-date>`, `branch: session/<id>`. Body opens with
`# Session <id>` and then accumulates timestamped blocks:

- `## Handoff HH:MM` — full transfer schema (Current goal / Current
  state / Files in focus / Decisions made / Open questions / Risks /
  Next exact action / Do not redo / Useful commands run), appended by
  `/chat-handoff` before switching chats or surfaces.
- `## Note HH:MM` — lightweight checkpoint (current focus / decision /
  blocker / next micro-step), appended by `/session-note` on demand so
  context is never lost between compactions.
- `## Bridge-out HH:MM` — the end-of-day wrap (STATE / DID / DECISIONS /
  BLOCKERS / NEXT), appended by `/session-end`, which also flips the
  frontmatter `status` to `closed`.

**Lifecycle.**

- `node scripts/session-branch-start.mjs` (driven by `/session-start`)
  creates the branch and the log (`status: open`) atomically and prints
  `Session log: sessions/<id>.md`. On "already on a session branch" it
  reuses the branch and ensures the file exists.
- `/session-start` and `node scripts/session-start.mjs` scan
  `sessions/*.md` for `status: open` and surface **every** open session
  (sorted by id, immune to mtime) — this is the "previous session not
  closed" detection that replaced the old single-file notice.
- `/resume-from-handoff` reads the latest `## Handoff` (or `## Note`)
  block from the most recent **open** session log. No gitignored-picker
  workaround anymore — the file is committed and visible.
- `/session-end` is autonomous and **auto-merges**: it appends the
  bridge-out block, flips `status` to `closed`, then runs
  `node scripts/session-branch-finish.mjs`, which runs `validate.mjs`,
  `validate-links.mjs`, `build-index.mjs --check`, and a **blocking
  strict-PII secret gate** (`validate.mjs sessions --strict-pii`) before
  it commits, switches to `main`, merges `--no-ff`, and deletes the
  branch. On any failure the branch is preserved for cleanup. Local-only;
  never pushes.

**Redaction rule (load-bearing).** Every block written into a session
log — Handoff, Note, or Bridge-out — is committed to history, so it
must be re-read and stripped of any credential or PII before it is
written, per the §7 AI-read restrictions. `/chat-handoff`,
`/session-note`, and `/session-end` each carry this redaction policy,
and `session-branch-finish.mjs` enforces it a second time at the
strict-PII gate. A leaked secret in a committed log requires a history
rewrite to remove — exactly the cost §3 and §7 exist to avoid.

---

## Local git

This template has **no remote origin**. Local git only.

```bash
# Once per clone
node scripts/init.mjs <client-slug>
git init && git add . && git commit -m "init: kortex-qa v$(cat VERSION)"

# Session end
node scripts/session-branch-finish.mjs -m "session: YYYY-MM-DD - <summary>"

# Backup (whenever)
node scripts/snapshot.mjs
```

The git log is the within-laptop history. `main` should represent
only consolidated end-of-session states; daily work happens on
`session/*` branches. ZIPs are the cross-laptop /
disaster-recovery channel.

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
