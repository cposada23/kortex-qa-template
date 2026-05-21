# Kortex-QA Template

A portable, local-first second brain for QA automation engineers.
Designed primarily for GitHub Copilot, the content is plain
markdown so any AI agent (Claude, Codex, ChatGPT, etc.) can read
it. One brain per client engagement.

**Status:** v1.0.0 — built 2026-05-20 in safe-change branch
`safe-change/kortex-qa-template` of the upstream Kortex repo
`mykortex`.

---

## What you're looking at

A `git`-tracked folder you clone (or copy) per client engagement.
Inside, you'll find:

- A **ten-zone QA-shaped architecture** (`stories/`, `test-cases/`,
  `bugs/`, `automation/`, plus six supporting zones).
- Pre-wired **Copilot configuration** in `.github/` (instructions
  + reusable prompts).
- **Zero-dependency Node.js scripts** for scaffolding, snapshots,
  and index building.
- **Playbooks** for the core QA daily loop.
- **Templates** the scaffold scripts use to stamp out new stories,
  test cases, and bugs.

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

```bash
# 1. Clone or copy this template to a new folder on the client-issued machine.
cp -r kortex-qa-template ~/work/kortex-qa-<client-slug>
cd ~/work/kortex-qa-<client-slug>

# 2. Initialize.
node scripts/init.mjs <client-slug>

# 3. (Optional) Open the multi-root workspace in VS Code.
code <client-slug>-qa.code-workspace

# 4. Capture your first Jira ticket.
node scripts/new-story.mjs TEAM-1234 search-filter-empty-input
# (or invoke /story-intake in Copilot Chat and paste the ticket body)

# 5. Daily — in Copilot Chat:
/session-start
# ... work ...
/session-end
```

End-of-day: `git add . && git commit -m "session: $(date +%F)"`.

Weekly: `node scripts/snapshot.mjs` to ZIP the brain to
`versions/` for offline backup.

---

## Architecture overview — team-centric (v1.1)

Read [AGENTS.md](AGENTS.md) for the full breakdown.

### Team-scoped content (`teams/<slug>/`)

Each team you belong to (or rotate through) gets its own folder
containing **everything team-specific**: stories, test cases,
bugs, peer reviews, ceremony notes, environments, automation
patterns, members, workflow, deploy procedures, and a team-scoped
inbox.

| Sub-zone | Purpose |
|---|---|
| `stories/` | One folder per Jira ticket (this team's). |
| `test-cases/library/` | Reusable test cases for this team's SUT. |
| `bugs/` | Bug registry for this team. |
| `reviews/` | Your peer reviews of this team's test cases. |
| `ceremonies/` | This team's meeting notes. |
| `environments/` | This team's local / dev / qa setup. |
| `automation/` | This team's Playwright patterns. |
| `inbox/` | This team's free-form captures. |
| `members.md`, `workflow.md`, `deploy.md`, `ceremonies-info.md` | Team-level meta files. |

Plus `teams/active-team.txt` (currently active team slug(s);
first line = primary) and `teams/_template-team/` (empty scaffold
copied by `node scripts/new-team.mjs <slug>`).

### Global zones (cross-team)

| Zone | Purpose |
|---|---|
| `knowledge/` | Distilled lessons. **The only portable zone** — must be sanitized before traveling across teams or clients. |
| `playbooks/` | Long-form workflow docs (session-start/end, story-intake, day-in-the-life, etc.) |
| `scripts/` | Node.js tooling (zero-deps). |
| `templates/` | Source files for scaffolds. |
| `.github/` | Copilot wiring. |

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
| `/bug-report-formatter` | Found a defect, need a Jira-ready report. |

---

## Org policy fit

The template assumes the engineer's organization permits:

1. **GitHub Copilot on client artifacts** (per the org's Copilot
   data policy).
2. **Local git** on the client-issued machine.
3. **Local ZIP backups** (`versions/` folder).
4. **Node.js 18+** installed (Playwright requires it; the scripts
   are zero-dep ESM modules).

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
  relax the policy. **Risk accepted for v1.0** — see
  `scripts/snapshot.mjs` error messages for fallback guidance.

This template cannot override organizational policies. It can only
adapt to them.

## v1.0 acceptance bar — what "ready" means

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
5. **Format a bug** — `/bug-report-formatter` outputs a
   Jira-ready paste block; no AI scaffolding language leaks.
6. **End a day** — `/session-end` appends a journal entry and
   suggests a commit message.
7. **Snapshot for backup** — `node scripts/snapshot.mjs`
   produces a ZIP in `versions/` (or fails with a clear next
   step on locked-down Windows).
8. **Rotate clients** —
   [playbooks/client-rotation.md](playbooks/client-rotation.md)
   walks through wiping a client clone safely.

If any of these breaks on a new client setup, the template
needs a v1.0.x patch, not a v1.1 deferral.

## v1.0 is single-client only

Each Kortex-QA clone serves **one client engagement** at a time.
There is no `clients/` subfolder. When you rotate to a new
client, you **wipe and re-clone** per the
[client-rotation playbook](playbooks/client-rotation.md) — you do
not run two engagements in the same brain.

Multi-client / freelance scenarios (one brain serving many
clients in parallel) are explicitly deferred to v1.1. The
constraint is intentional: client data isolation is easier when
the filesystem itself enforces "one client per folder."

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

---

## Multi-tool workspace

`kortex-qa.code-workspace` (renamed on init to
`<client-slug>-qa.code-workspace`) is a VS Code multi-root workspace
template. It expects three roots:

1. **This brain** (Kortex-QA folder)
2. **The SUT repo** (system under test — set the path post-clone)
3. **The automation repo** (set the path post-clone)

Opening the workspace gives you one window with all three
contexts. Copilot reads instructions from this folder's `.github/`
regardless of which root you're editing.

---

## Versioning

Each template clone tracks its own SemVer in the `VERSION` file.
v1.0.0 ships:

- 10 zones + READMEs
- 5 instructions + 7 prompts (Copilot wiring)
- 5 full playbooks + 4 stubs
- 8 Node `.mjs` scripts
- 1 example story end-to-end + 1 library test case + 1 example
  bug + 1 example retro

v1.1 (planned, post-real-usage):

- 5 more prompts (test-case-reviewer, automation-from-test-case,
  sprint-planning-intake, retro-intake, question-generator)
- 4 more full playbooks
- A `clients/` zone (gated by `multi-client: true` flag) for
  freelance engagements

---

## License & ownership

Personal template. Adapt freely. The template itself ships zero
client-identifying content; what you put in each clone is yours
(and your client's, per their policy).

---

## Related reading

- [AGENTS.md](AGENTS.md) — the canonical agent context (read this
  before doing anything)
- [playbooks/session-start.md](playbooks/session-start.md) — the
  morning ritual
- [playbooks/story-intake.md](playbooks/story-intake.md) — what to
  do when a new Jira ticket is assigned
- [playbooks/client-rotation.md](playbooks/client-rotation.md) —
  the compliance-critical hand-off ritual
