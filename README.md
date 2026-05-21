# Kortex-QA Template

A portable, local-first second brain for QA automation engineers.
Designed primarily for GitHub Copilot, the content is plain
markdown so any AI agent (Claude, Codex, ChatGPT, etc.) can read
it. One brain per client engagement.

**Status:** v1.2.0 — team-centric architecture, full playbook set,
extended Copilot prompt library. Built and packaged 2026-05-20 →
2026-05-21 inside the upstream Kortex repo `mykortex`, extracted to
its own repo for cloning.

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
  instruction files (`applyTo:` globs) + 12 reusable prompts.
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

```bash
# 1. Clone or copy this template to a new folder on the client-issued machine.
cp -r kortex-qa-template ~/work/kortex-qa-<client-slug>
cd ~/work/kortex-qa-<client-slug>

# 2. Initialize.
node scripts/init.mjs <client-slug>

# 3. (Optional) Open the multi-root workspace in VS Code.
code <client-slug>-qa.code-workspace

# 4. (Optional) If you belong to more than one team, register them now.
node scripts/new-team.mjs <other-team-slug>
node scripts/switch-team.mjs <primary-team-slug>   # sets the default scaffold target

# 5. Capture your first Jira ticket.
node scripts/new-story.mjs TEAM-1234 search-filter-empty-input
# (or invoke /story-intake in Copilot Chat and paste the ticket body)

# 6. Daily — in Copilot Chat:
/session-start
# ... work ...
/session-end
```

End-of-day: `git add . && git commit -m "session: $(date +%F)"`.

Weekly: `node scripts/snapshot.mjs` to ZIP the brain to
`versions/` for offline backup. See
[playbooks/version-snapshot.md](playbooks/version-snapshot.md) for
cadence guidance.

---

## Architecture overview — team-centric

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
| `ceremonies/` | This team's meeting notes (daily, planning, review, retro). |
| `environments/` | This team's local / dev / qa setup. |
| `automation/` | This team's Playwright patterns. |
| `inbox/` | This team's free-form captures. |
| `members.md`, `workflow.md`, `deploy.md`, `ceremonies-info.md` | Team-level meta files. |

Plus `teams/active-team.txt` (currently active team slug(s);
first line = primary) and `teams/_template-team/` (empty scaffold
copied by `node scripts/new-team.mjs <slug>`).

The owner can belong to one team or many at once. `session-start`
defaults to **all** active teams (so you see the full picture on a
50/50 split); scaffold scripts default to the **first** line (the
primary) and accept `--team <slug>` to override.

### Global zones (cross-team)

| Zone | Purpose |
|---|---|
| `knowledge/` | Distilled lessons. **The only portable zone** — must be sanitized before traveling across teams or clients. |
| `playbooks/` | Long-form workflow docs (session-start/end, story-intake, ac-audit, test-case-design, peer-review, automation-flow, version-snapshot, client-rotation, day-in-the-life, team-onboarding, team-knowledge-promotion). |
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
| `/test-case-reviewer` | Peer review pass on an existing test case (yours or a teammate's). |
| `/automation-from-test-case` | Translate a manual test case into a Playwright skeleton. |
| `/bug-report-formatter` | Found a defect, need a Jira-ready report. |
| `/sprint-planning-intake` | Capture a sprint-planning meeting into `ceremonies/sprint-planning/`. |
| `/retro-intake` | Capture a retrospective into `ceremonies/retrospectives/`. |
| `/question-generator` | Standalone "dev/PO question generator" — when AC isn't the source (verbal clarification, design doc, etc.). |

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
8. **End a day** — `/session-end` appends a journal entry and
   suggests a commit message.
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
- [playbooks/session-start.md](playbooks/session-start.md) — the
  morning ritual
- [playbooks/story-intake.md](playbooks/story-intake.md) — what to
  do when a new Jira ticket is assigned
- [playbooks/day-in-the-life.md](playbooks/day-in-the-life.md) —
  end-to-end walkthrough of a full QA day with the brain
- [playbooks/client-rotation.md](playbooks/client-rotation.md) —
  the compliance-critical hand-off ritual
