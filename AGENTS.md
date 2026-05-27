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

Daily rhythm:

1. **Morning** — invoke `/session-start` in Copilot Chat. Lists
   active stories, blocked items, today's likely focus, recent
   journal entries. Session work happens on a `session/*` branch
   created by `node scripts/session-branch-start.mjs`.
2. **Working hours** — edit stories, capture in the active team's
   `inbox/`, run scripts, draft test cases. Use the prompts listed
   below as you work.
3. **Evening** — invoke `/session-end`. Appends a journal entry,
   updates `TODO.md`, surfaces dirty git files. When satisfied,
   close with `node scripts/session-branch-finish.mjs -m
   "session: YYYY-MM-DD - <summary>"` to validate, commit, and
   merge the session branch into `main`.

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

### 8. Chat handoff continuity

`CHAT-HANDOFF.md` at the repo root is **session state**, not durable
knowledge. It exists when the engineer is mid-task and wants a new
chat to pick up where the last one left off.

**Behavior rules:**

- If `CHAT-HANDOFF.md` exists and the engineer says "resume",
  "continue", "pick up where we left off", or starts what looks
  like a new conversation, **read `CHAT-HANDOFF.md` first** before
  taking any action.
- The handoff supersedes prior conversation context. If
  `CHAT-HANDOFF.md`'s "Decisions made" contradicts something in
  your training memory, the handoff wins.
- If `CHAT-HANDOFF.md` is older than 7 days, surface that to the
  engineer ("the handoff is stale — should we discard it or update
  it?"). Don't blindly resume work that may have been overtaken by
  events.
- `CHAT-HANDOFF.md` is **gitignored** — never commit it. It IS
  included in snapshot ZIPs (personal recovery), per §3.
- The handoff complements but does NOT replace `AGENTS.md`.
  `AGENTS.md` is the durable contract; `CHAT-HANDOFF.md` is
  ephemeral session state.

**Workflow:**

- Generate via `/chat-handoff` prompt at end-of-session or before
  switching surfaces (Copilot ↔ Claude ↔ Codex).
- Consume via `/resume-from-handoff` prompt in the new chat.
- `session-start.mjs` surfaces a one-line notice when the file
  exists (and flags it stale when `updated:` > 7 days).

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
