# Kortex-QA Template

A portable, local-first second brain for QA automation engineers.
Designed primarily for GitHub Copilot, the content is plain
markdown so any AI agent (Claude, Codex, ChatGPT, etc.) can read
it. One brain per client engagement.

**Status:** v1.8.0 — team-centric architecture, single-home test
cases with immutable IDs (validator now errors on duplicates),
link integrity validator, **autonomous session-end + per-session
log** (`sessions/<id>.md`, keyed by the session branch, committed
to history — the gitignored `CHAT-HANDOFF.md` is retired),
prior-brain import skill, full playbook set, Copilot prompt
library, pre-commit hook running 3 checks (frontmatter + INDEX
drift + link integrity) plus a strict-PII secret gate on
session-finish, AI cred read restrictions, client-bootstrap with 4
import scenarios. Built and packaged 2026-05-20 → 2026-05-21
inside the upstream Kortex repo `mykortex`, extracted to its own
repo for cloning.

---

## What you're looking at

A `git`-tracked folder you clone (or copy) per client engagement.
Inside, you'll find:

- A **team-centric QA architecture**: per-team folders carry
  everything team-specific (stories, test cases, bugs, reviews,
  ceremonies, environments, automation, members, workflow, deploy,
  inbox); five global zones (`knowledge/`, `playbooks/`, `scripts/`,
  `templates/`, `.github/`) sit alongside.
- Pre-wired **Copilot configuration** in `.github/` — 5 scoped
  instruction files (`applyTo:` globs) + 15 skills (+4 coming in
  v2), generated into `.github/prompts/` from `.agents/skills/`.
- **Zero-dependency Node.js scripts** for scaffolding (new story,
  test case, bug, team), snapshots, validation, and index building.
- **A complete playbook set** for the core daily loop, peer review,
  automation flow, snapshot cadence, and client rotation.
- **Templates** the scaffold scripts use to stamp out new stories,
  test cases, and bugs.
- **An example team** (`teams/example-team/`) with one story
  end-to-end, one library test case, one bug, one retro, and two
  automation playbook patterns — so a new clone has something to
  read before you start your own work.

You bring: a SUT (system under test) repo, an automation repo,
your Jira credentials, and your client's environment access.

---

## Why this exists

The author's previous QA brain was a single chat thread he re-loaded
each day. It worked, but:

- Context grew unmanageable past ~50 stories.
- Re-pasting the same context every morning wasted 10+ minutes.
- Knowledge wasn't searchable outside that one chat surface.
- Migrating between clients meant copy-pasting selectively into a
  new thread.

Kortex-QA solves these by making the brain a **filesystem of
small, agent-readable markdown files** with strict schemas, indexed
by zone, that Copilot reads via `@workspace` and reusable prompts.

---

## Quick start (per client)

> **Node ≥ 20 is required** (Playwright 1.61 dropped Node 18).

```bash
# 1. Clone or copy this template to a new folder on the client-issued machine.
cp -r kortex-qa-template ~/work/kortex-qa-<client-slug>
cd ~/work/kortex-qa-<client-slug>

# 2. Initialize. The doctor preflight runs automatically at the end
#    (Node/git/zip, agent surfaces, corporate-proxy/TLS network checks).
node scripts/init.mjs <client-slug>
# Re-run the preflight anytime:
node scripts/doctor.mjs

# 3. (Optional) Open the multi-root workspace in VS Code.
code <client-slug>-qa.code-workspace

# 4. (Optional) If you belong to more than one team, register them now.
node scripts/new-team.mjs <other-team-slug>
node scripts/switch-team.mjs <primary-team-slug>   # sets the default scaffold target

# 5. Capture your first Jira ticket.
node scripts/new-story.mjs TEAM-1234 search-filter-empty-input
# (or invoke the story-intake skill and paste the ticket body)

# 6. Daily — start with the session-start skill:
#    Copilot Chat: /session-start · Claude Code: session-start skill
#    other agents: see "Works with any agent" below
/session-start
# ... work ...   (drop /session-note checkpoints whenever context is at risk)
/session-end
```

`/session-start` creates the `session/YYYYMMDD-HHMM` branch **and**
its per-session log `sessions/<id>.md` (status `open`) atomically,
then verifies you landed on `session/*`. During the day,
`/session-note` and `/chat-handoff` append `## Note` / `## Handoff`
blocks to that log. `/session-end` is **autonomous** — no
interview: it infers the wrap from the session log + chat + git
diff + TODO, redacts secrets, closes the log, appends the JOURNAL,
and runs `node scripts/session-branch-finish.mjs`, which validates
(including a strict-PII secret gate), commits the session branch,
merges it `--no-ff` into `main`, and deletes the branch. Auto-merge
is the default; on any failure the branch is preserved and the
abort is reported loudly.

Weekly: `node scripts/snapshot.mjs` to ZIP the brain to
`versions/` for offline backup. See
[playbooks/version-snapshot.md](playbooks/version-snapshot.md) for
cadence guidance.

---

## Architecture overview — team-centric with shared/ (v1.7)

Read [AGENTS.md](AGENTS.md) for the full breakdown.

### Client-wide content (`shared/`)

Everything that's true for EVERY team on this client: env URLs,
test users, dataset filters, deploy cadence. One place, no
duplication, no drift between team copies.

| File | Purpose |
|---|---|
| `environments/local.md`, `dev.md`, `qa.md` | Per-env setup with sections for UI / API / DB. |
| `users.md` | Test user accounts + naming convention. |
| `filters.md` | Recurring test datasets + magic strings to find a scenario. |
| `deploy.md` | Deploy cadence and ownership across envs. |

If ONE team has its own env / users / filters / deploy (e.g. owns a
separate microservice), drop a file with the same name at
`teams/<slug>/<asset>` — the resolver picks team override > shared.
Full rule: [shared/README.md](shared/README.md).

### Team-scoped content (`teams/<slug>/`)

Each team you belong to (or rotate through) gets its own folder
containing **only the truly team-specific stuff**: stories, test
cases, bugs, peer reviews, ceremony notes, automation patterns,
members, workflow.

| Sub-zone | Purpose |
|---|---|
| `stories/` | One folder per Jira ticket (this team's). |
| `test-cases/<area>/` | All test cases for this team's SUT (single home, organized by area). |
| `bugs/` | Bug registry for this team. |
| `reviews/` | Your peer reviews of this team's test cases. |
| `ceremonies/` | This team's meeting notes (daily, planning, review, retro). |
| `automation/` | This team's Playwright patterns. |
| `inbox/` | This team's free-form captures. |
| `members.md`, `workflow.md`, `ceremonies-info.md` | Team-level meta files. |
| `environments/` | Empty by default (README explains override). |

Plus `teams/active-team.txt` (currently active team slug(s);
first line = primary) and `teams/_template-team/` (empty scaffold
copied by `node scripts/new-team.mjs <slug>`).

The owner can belong to one team or many at once. `session-start`
defaults to **all** active teams (so you see the full picture on a
50/50 split); scaffold scripts default to the **first** line (the
primary) and accept `--team <slug>` to override.

### Global zones (cross-team, not client-wide)

| Zone | Purpose |
|---|---|
| `knowledge/` | Distilled lessons. **The only portable zone across clients** — must be sanitized before traveling. |
| `playbooks/` | Long-form workflow docs (session-start/end, story-intake, ac-audit, test-case-design, peer-review, automation-flow, version-snapshot, client-rotation, day-in-the-life, team-onboarding, team-knowledge-promotion). |
| `scripts/` | Node.js tooling (zero-deps). |
| `templates/` | Source files for scaffolds. |
| `.github/` | Copilot wiring (primary AI surface). |
| `.agents/` | Cross-AI portability (permissions, README explaining multi-AI policy). |

### Top-level files

| File | Purpose |
|---|---|
| `AGENTS.md` | Canonical agent context. AI tools read this first. |
| `README.md` | This file. Human onboarding. |
| `INDEX.md` | Auto-generated full file map. |
| `TODO.md` | Active TODOs across zones. |
| `JOURNAL.md` | Append-only daily log. |
| `VERSION` | SemVer of the template clone. |

---

## Copilot integration

GitHub Copilot discovers everything via three layers:

1. **`.github/copilot-instructions.md`** — repo-wide entry point.
2. **`AGENTS.md`** — full agent context (Copilot supports this
   natively since Nov 2025).
3. **`.github/instructions/*.instructions.md`** — scoped rules
   applied automatically via `applyTo:` globs.

Reusable prompts in `.github/prompts/` are invoked from Copilot
Chat with `/<name>`:

| Prompt | When |
|---|---|
| `/session-start` | First thing in the morning. |
| `/session-end` | Last thing before logging off. |
| `/story-intake` | New Jira ticket arrives. |
| `/ac-auditor` | AC needs scrutiny. Produces Teams-ready questions. |
| `/story-analyzer` | Need scenario ideas for a story. |
| `/test-case-design` | Drafting a test case from a scenario. |
| `/test-case-reviewer` | Peer review pass on an existing test case (yours or a teammate's). |
| `/automation-from-test-case` | Translate a manual test case into a Playwright skeleton. |
| `/bug-report-formatter` | Found a defect, need a Jira-ready report. |
| `/sprint-planning-intake` | Capture a sprint-planning meeting into `ceremonies/sprint-planning/`. |
| `/retro-intake` | Capture a retrospective into `ceremonies/retrospectives/`. |
| `/question-generator` | Standalone "dev/PO question generator" — when AC isn't the source (verbal clarification, design doc, etc.). |
| `/session-note` | Lightweight mid-day checkpoint — appends a `## Note HH:MM` block (focus / decision / blocker / next micro-step) to today's session log `sessions/<id>.md`. |
| `/chat-handoff` | Append a `## Handoff HH:MM` transfer block to today's session log `sessions/<id>.md` when switching chat surfaces mid-task. |
| `/resume-from-handoff` | Resume from the latest `## Handoff` (or `## Note`) block in the most recent open session log. |

---

## Works with any agent

Every workflow is a **canonical skill** in `.agents/skills/<name>/SKILL.md`.
`node scripts/sync-agents.mjs` generates the per-agent adapters from
them — **edit the canonical, never the adapter** (adapters carry a
DO-NOT-EDIT banner; the pre-commit hook blocks drift).

| Agent | Reads | Verified |
|---|---|---|
| GitHub Copilot | `.github/prompts/` (generated) + `.github/copilot-instructions.md` | structural ✅ (live pending) |
| Claude Code | `CLAUDE.md` (imports `AGENTS.md`) + `.claude/skills/` (generated) | structural ✅ (live pending) |
| Cursor | `AGENTS.md` natively + `.cursor/mcp.json` | structural ✅ (live pending) |
| Codex | `AGENTS.md` + `.agents/skills/` | structural ✅ (live pending) |
| Gemini CLI | `GEMINI.md` + the Skills index table inside `AGENTS.md` | structural ✅ (live pending) |

MCP config follows the same pattern: `.mcp.json` is the source;
`.vscode/mcp.json` and `.cursor/mcp.json` are byte-copies emitted by
the same script. We deliberately do NOT ship `.cursorrules` — Cursor
reads `AGENTS.md` natively; zero redundant files.

---

## Org policy fit

The template assumes the engineer's organization permits:

1. **GitHub Copilot on client artifacts** (per the org's Copilot
   data policy).
2. **Local git** on the client-issued machine.
3. **Local ZIP backups** (`versions/` folder).
4. **Node.js 20+** installed (Playwright 1.61 dropped Node 18; the
   scripts are zero-dep ESM modules).

If any are restricted, adapt:

- **Copilot blocked:** stop using `.github/prompts/`; the markdown
  brain still works as a manual reference.
- **No local git:** delete `.git`; lose snapshot/restore but keep
  structure.
- **No ZIPs allowed:** edit `scripts/snapshot.mjs` to write to an
  IT-managed location, or disable it.
- **PowerShell Execution Policy blocks scripts (Windows
  corporate):** `snapshot.mjs` may not produce a ZIP. Either zip
  manually via Explorer, install Git Bash to get `zip`, or have IT
  relax the policy. See `scripts/snapshot.mjs` error messages for
  fallback guidance.

This template cannot override organizational policies. It can only
adapt to them.

## Acceptance bar — what "ready" means

A real QA cloning this template can do the following in their
first week without maintainer help:

1. **Start a day** — `/session-start` produces a useful summary
   from the brain's current state.
2. **Intake a Jira story** — `/story-intake` scaffolds the folder
   and runs an AC audit; the questions section is Teams-ready.
3. **Create test cases** — `/story-analyzer` →
   `/test-case-design` produces well-formed test case files
   without breaking INDEXes.
4. **Record execution** — `execution-log.md` updates per run,
   linked bugs cross-reference cleanly.
5. **Review peer test cases** — `/test-case-reviewer` produces a
   structured review pass that lands in `teams/<slug>/reviews/`.
6. **Hand a manual test case to automation** —
   `/automation-from-test-case` emits a Playwright skeleton that
   compiles and runs against a known-good selector.
7. **Format a bug** — `/bug-report-formatter` outputs a
   Jira-ready paste block; no AI scaffolding language leaks.
8. **End a day** — `/session-end` runs autonomously (no
   interview): it infers the wrap, appends a journal entry, closes
   the per-session log, and consolidates the `session/*` branch
   back into `main` via an automatic `--no-ff` merge (preserving
   the branch and reporting loudly if any validation or the
   strict-PII secret gate fails).
9. **Capture ceremonies** — `/sprint-planning-intake` and
   `/retro-intake` produce structured meeting notes in the right
   folder.
10. **Snapshot for backup** — `node scripts/snapshot.mjs`
    produces a ZIP in `versions/` (or fails with a clear next
    step on locked-down Windows).
11. **Rotate clients** —
    [playbooks/client-rotation.md](playbooks/client-rotation.md)
    walks through wiping a client clone safely.

If any of these breaks on a new client setup, the template
needs a patch release, not a deferral to the next minor.

## Single-client by design

Each Kortex-QA clone serves **one client engagement** at a time.
There is no `clients/` subfolder. When you rotate to a new
client, you **wipe and re-clone** per the
[client-rotation playbook](playbooks/client-rotation.md) — you do
not run two engagements in the same brain.

This is intentional: client data isolation is easier when
the filesystem itself enforces "one client per folder." Within a
client, multi-team is fully supported (see `teams/active-team.txt`).

---

## Compliance — what travels, what doesn't

When rotating clients, **only `knowledge/` travels** to the next
engagement, and only after sanitization (no client names, no
internal URLs, no Jira keys, no logs/screenshots, no
domain-revealing facts). The full sanitization checklist lives in
[playbooks/client-rotation.md](playbooks/client-rotation.md).

Everything else — stories, test cases, bugs, reviews, ceremonies,
environments, team — stays with the client clone. When the
engagement ends, archive a final ZIP and delete the clone.

### Credentials and snapshots — read this once

Two policies that sit next to each other:

- **`.env` files (and `.secrets`, `client-secrets/`) ARE
  intentionally included in the snapshot ZIP** written by
  `scripts/snapshot.mjs`. The snapshot is a personal cross-laptop
  recovery archive (the owner DMs it to themselves on Teams, never
  shares it). On a laptop swap, the ZIP restores the brain *with*
  credentials intact — no re-collection from password managers.
- **The snapshot ZIP is never shared with anyone.** Hard rule. If
  it needs to be handed to anyone (IT, another QA, a client
  manager), extract to a staging copy first, delete every
  `.env`/`.secrets`/`client-secrets/` file, and re-zip the
  staging copy. The original ZIP stays private.
- **AI agents do NOT read credential files** — see AGENTS.md §7.
  The `.aiexclude` file enforces this for Gemini Code Assist; the
  AGENTS.md / `.github/copilot-instructions.md` rules cover the
  rest. Real cred files exist on disk and scripts read them via
  `process.env`, but no AI assistant opens them.
- **`.env` is `.gitignored`.** So nothing lands in git history,
  even local-only.

---

## Multi-tool workspace

`kortex-qa.code-workspace` (renamed on init to
`<client-slug>-qa.code-workspace`) is a VS Code multi-root workspace
template. It starts with one root:

1. **This brain** (Kortex-QA folder)

After opening it, add the SUT repo and automation repo via VS Code's
**File → Add Folder to Workspace...** and save the workspace. Avoid
placeholder roots that point to non-existent folders; Copilot works
best when every workspace root resolves to a real path.

---

## Versioning

Each template clone tracks its own SemVer in the `VERSION` file.

**v1.0.0** (2026-05-20) — flat 10-zone architecture, 5 Copilot
instructions, 7 prompts, 5 full playbooks + 4 stubs, 6 scripts, an
example story end-to-end.

**v1.1.0** (2026-05-21) — team-centric restructure (everything
team-specific moves under `teams/<slug>/`), multi-team support
(`active-team.txt`, `new-team.mjs`, `switch-team.mjs`),
day-in-the-life playbook, team-onboarding and
team-knowledge-promotion playbooks.

**v1.2.0** (2026-05-21) — playbook set completed (peer-review,
automation-flow, version-snapshot promoted from stub to full),
extended Copilot prompt library (5 new prompts:
test-case-reviewer, automation-from-test-case,
sprint-planning-intake, retro-intake, question-generator).

**v1.2.1 / v1.2.2** (2026-05-21) — sync passes: day-in-the-life
narrative updated with the 5 new prompts;
`.github/copilot-instructions.md` rewritten to reflect
team-centric architecture (was the last v1.0 artifact untouched
by the v1.1 restructure).

**v1.3.0** (2026-05-21) — Windows-First / PowerShell-primary
platform policy made explicit (cross-platform parity preserved);
local-only Git formalized; `.env` files permitted for daily SUT
testing; `zoneName` ReferenceError in `build-index.mjs` fixed
(latent bug surfaced by external audit).

**v1.4.0** (2026-05-21) — pre-commit hook (`scripts/install-hooks.mjs`
installs a Git pre-commit that runs `validate.mjs` +
`build-index.mjs --check`) so schema / INDEX drift can't land in
local history even without a remote. Snapshot policy refined:
`.env` files **stay in** the snapshot ZIP for personal cross-laptop
recovery — the ZIP is personal and never shared. AI read
restrictions formalized: `.aiexclude` file + AGENTS.md §7 + Rule 9
in `copilot-instructions.md` to keep credential files out of AI
context windows.

**v1.5.0** (2026-05-21) — Codex audit pass: Copilot prompt schema
synced from `mode:` to `agent:` (the legacy key triggers a
deprecation warning in current Copilot Chat); 6 prompts had
pre-team-centric path drift (`stories/INDEX.md`, `bugs/`,
`test-cases/library/` at repo root) corrected to
`teams/<active>/...`; `build-index.mjs --check` is now truly
read-only (computes diff in memory, returns `would-update` /
`would-create` instead of writing then failing); `validate.mjs`
exit code reconciled with its own documentation (PII warnings
exit 0 unless `--strict-pii`, so the pre-commit hook doesn't
silently block on heuristic false positives);
`automation_status` vocabulary unified across frontmatter
instructions, prompts, playbooks, example team, and templates
(`auto-soon | auto-eventually | automated | manual-only |
not-feasible`).

**v1.5.1** (2026-05-21) — `client-bootstrap.md` playbook
(clone-to-first-story + 4 import scenarios for previous-brain
migration) + final prose-level drift fix in
`.github/instructions/*.md` (Codex micro-pass: `applyTo:` globs
were correct but examples below still showed v1.0 paths).

**v1.5.2** (2026-05-21) — split `init-client` from
`create-first-team` in the bootstrap playbook. Step 3 now does
client-level setup only; new Step 4 creates the first team
explicitly (`new-team.mjs team-a` + `switch-team.mjs team-a`)
with an ASCII tree showing the resulting filesystem. Added a
"Mental model — client vs team" section up front. Concrete
example pair `client-a` + `team-a` runs through the whole
playbook.

**v1.6.0** (2026-05-21) — structural refactor + chat handoff +
import skill. Test cases now live in a **single home** at
`teams/<team>/test-cases/<area>/` (no story-local subfolder, no
library/ split) with immutable IDs (`TC-<AREA>-<NNN>`). Stories
link via `linked_test_cases:` + `linked_bugs:` frontmatter
(canonical) plus markdown links in the body (navigation).
`scripts/new-test-case.mjs --link-story <TICKET>` + the
equivalent flag on `new-bug.mjs` auto-update both sides. NEW
`scripts/validate-links.mjs` checks ID integrity (runs in the
pre-commit hook). NEW `CHAT-HANDOFF.md` + `/chat-handoff` +
`/resume-from-handoff` workflow for context transfer between
chat sessions. NEW `scripts/import-prior-brain.mjs` for bulk
migration of a prior markdown brain with confidence scoring +
staging + bulk approval. `review_status:` field on stories and
TCs replaces dual-source review state (frontmatter is now
canonical; `reviews/<TICKET>.md` files are optional supporting
prose). v1.5 → v1.6 migration is one-shot via
`scripts/migrate-v1.5-to-v1.6.mjs` (idempotent). Cross-validated
by 3 external LLMs; owner overrode the "defer import skill"
recommendation because there's a real prior brain to bring over
today.

**v1.6.1** (2026-05-21) — critical fixes from external review.
`validate-links.mjs` now ERRORS on duplicate IDs (previously
silently allowed two files with `id: TC-AUTH-001`, breaking
`linked_test_cases:` semantics). example-team's leftover library
TC migrated up to single-home (closes a TC-AUTH-001 collision
that would surface on the first `new-test-case.mjs auth ...`
invocation). 11+ doc files swept for stale `test-cases/library/`,
`stories/<TICKET>/test-cases/`, and `bugs.md` references.
`new-story.mjs` regex widened to accept multi-segment Jira keys
(`TEAM-EXAMPLE-001`, `ACME-PROJ-9001`) matching what
`validate-links.mjs` already did in v1.6.0.

**v1.6.2** (2026-05-22) — QA audit fixes before team handoff.
Aligned the test-case contract across frontmatter instructions,
Copilot instructions, prompt examples, templates, example files,
and `validate.mjs`: lifecycle is now `draft | active | retired`,
automation status uses the v1.6 vocabulary, and peer review lives
in `review_status:`. Added explicit `level: ui | api | contract`
so `/automation-from-test-case` no longer depends on an undeclared
field. Tightened validator checks for type-specific required
fields and vocabularies. Swept active docs for lingering `library/`
and stale script/prompt counts.

**v1.8.0** (2026-06-04) — autonomous session-end + per-session
log. Session state now lives in `sessions/<id>.md`, keyed by the
session branch (`session/<id>` → `sessions/<id>.md`), not by date —
one stable file that survives a forgotten close and a past-midnight
session without splitting or orphaning. The file is **committed on
the session branch and merged to `main`**, so every AI surface can
discover it (the old gitignored, ephemeral `CHAT-HANDOFF.md` is
**retired** — no handoff file is written anywhere anymore).
`/session-start` now creates the branch + log atomically and
hard-stops if it didn't land on `session/*`, and "pops" any still-
open session (open-session detection replaces the forgot-to-handoff
edge). `/session-end` is now **autonomous** — no 3-question
interview: it infers STATE/DID/DECISIONS/BLOCKERS/NEXT from the
session log + chat + `git diff main...<branch>` + TODO, applies a
redaction pass, closes the log, appends the JOURNAL (NEXT line
guaranteed via a cascade fallback), rebuilds indexes, and
auto-merges via `session-branch-finish` — which adds a **blocking
strict-PII secret gate** and preserves the branch on any failure.
NEW `/session-note` prompt drops a lightweight `## Note` checkpoint
into the session log mid-day; `/chat-handoff` and
`/resume-from-handoff` now read/write the per-session log instead
of a root file. `sessions/` is intentionally not indexed by
`build-index` (operational log, like JOURNAL.md). Windows-first,
local-only git, no remote — the committed session logs ride along
in snapshot ZIPs automatically.

Future versions (real-usage-driven): a `clients/` zone gated by
`multi-client: true` for parallel freelance engagements, plus
whatever the first month of real use surfaces.

---

## License & ownership

Personal template. Adapt freely. The template itself ships zero
client-identifying content; what you put in each clone is yours
(and your client's, per their policy).

---

## Related reading

- [AGENTS.md](AGENTS.md) — the canonical agent context (read this
  before doing anything)
- [playbooks/client-bootstrap.md](playbooks/client-bootstrap.md) —
  **start here on a new laptop:** clone → init → first team →
  first story + 4 scenarios for importing from a previous brain
- [playbooks/day-in-the-life.md](playbooks/day-in-the-life.md) —
  end-to-end walkthrough of a full QA day with the brain
- [playbooks/session-start.md](playbooks/session-start.md) — the
  morning ritual
- [playbooks/story-intake.md](playbooks/story-intake.md) — what to
  do when a new Jira ticket is assigned
- [playbooks/client-rotation.md](playbooks/client-rotation.md) —
  the compliance-critical hand-off ritual
