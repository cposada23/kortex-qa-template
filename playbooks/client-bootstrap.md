---
title: "Playbook — Client bootstrap (clone to first story)"
type: playbook
status: active
language: en
tags: [playbook, bootstrap, onboarding, client]
updated: 2026-05-21
---

# Playbook — Client bootstrap

How to take this template from a fresh `git clone` to a working
brain on a new client-issued machine. The mirror image of
[client-rotation.md](client-rotation.md) — that one handles
**off-boarding**, this one handles **on-boarding**.

## Relationship to scripts

| Script | What it does in this flow |
|---|---|
| [../scripts/init.mjs](../scripts/init.mjs) | Renames `.code-workspace`, writes `.client-slug`, optionally scaffolds the first team, installs the pre-commit hook. |
| [../scripts/install-hooks.mjs](../scripts/install-hooks.mjs) | Writes `.git/hooks/pre-commit` (called automatically by `init.mjs`; idempotent if you call again). |
| [../scripts/new-team.mjs](../scripts/new-team.mjs) | Scaffold an additional team beyond the first one. |
| [../scripts/switch-team.mjs](../scripts/switch-team.mjs) | Set primary team, add a secondary, or list active teams. |
| [../scripts/new-story.mjs](../scripts/new-story.mjs) | Scaffold a story folder under the active team. |

## Pre-flight checklist (before you clone anything)

Run through these on the client-issued machine **once**. If any
fails, see the adaptation table in [../README.md](../README.md)
§"Org policy fit" before proceeding.

1. **Node.js 18+** — `node --version`. If missing, install via the
   org-approved package manager (Windows: winget / Chocolatey;
   macOS: Homebrew; Linux: distro package).
2. **Git** — `git --version`. On Windows, this also installs Git
   Bash (MINGW sh), which the pre-commit hook needs.
3. **GitHub Copilot enabled** — open VS Code, sign in, confirm the
   Copilot icon shows "Ready" (per the org's Copilot data policy).
4. **GitHub CLI (optional but recommended)** — `gh --version`. Lets
   you `gh repo clone` without HTTPS/SSH config.
5. **Org policy known** — confirmed with IT or your manager:
   Copilot on client artifacts ✅, local Git on the machine ✅,
   local ZIP backups (or alternative location) ✅.

If you're on Windows, also pin your PowerShell version:
`$PSVersionTable.PSVersion`. The template's scripts work on
Windows PowerShell 5.1 (default) and PowerShell 7+.

## Mental model — client vs team

The brain has **two slugs** the owner picks:

- **`<client-slug>`** — identifies the client engagement. Used in
  the local folder name, the workspace file, snapshot ZIP names,
  and the `.client-slug` file. **One per clone.**
- **`<team-slug>`** — identifies a team WITHIN the client. A single
  client engagement may have one or several teams (you can rotate
  across squads, or sit on two teams at once). Each team gets a
  folder under `teams/<team-slug>/`. **One or more per clone.**

This playbook uses **`client-a`** as the client and **`team-a`**
as the first team's slug to make the distinction concrete. In real
use, you'd pick names like `acme` (client) and `payments` (team).

---

## Step 1 — Clone the template

```powershell
# Windows PowerShell (or any shell)
cd ~\work    # or wherever your client engagements live

# Option A — via gh CLI
gh repo clone cposada23/kortex-qa-template kortex-qa-client-a

# Option B — via git directly
git clone https://github.com/cposada23/kortex-qa-template.git kortex-qa-client-a

cd kortex-qa-client-a
```

Replace `client-a` with your real client slug (e.g., `acme`,
`nova-bank`, `globex`). The slug should be short, kebab-case, and
unambiguous. It will appear in the workspace filename, snapshot
ZIP names, and the `.client-slug` file the scripts read.

## Step 2 — Reset Git history for this engagement

The clone arrived with the upstream template's `.git` history.
You want **fresh history** for your client engagement (so the
git log captures only this client's work, with no upstream
template churn):

```powershell
# Wipe the upstream history
Remove-Item -Recurse -Force .git    # PowerShell
# OR: rm -rf .git                   # macOS / Linux / Git Bash

# Start fresh
git init
```

The pre-commit hook (which lives under `.git/hooks/`) was wiped
with `.git`. You'll re-install it in the next step.

## Step 3 — Initialize the client

```powershell
node scripts/init.mjs client-a
```

This handles **client-level** setup only — it does NOT create any
team yet. What it does in one pass:

1. Renames `kortex-qa.code-workspace` → `client-a-qa.code-workspace`.
2. Writes `.client-slug` with content `client-a` (read by
   `snapshot.mjs` for ZIP naming).
3. Creates `versions/` and a `VERSION` file if missing.
4. **Calls `install-hooks.mjs`** — installs the pre-commit hook
   that runs `validate.mjs` + `build-index.mjs --check` on every
   commit.

After Step 3, `teams/` still contains only `example-team/` and
`_template-team/`. There is no team for `client-a` yet — Step 4
creates it.

You'll see this in the script output:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Initialized for client: client-a
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next steps:
  1. Open the workspace: code client-a-qa.code-workspace
  ...
```

### One-shot variant (combines Step 3 + Step 4)

If you already know your first team's slug, you can do both in
one command:

```powershell
node scripts/init.mjs client-a --first-team team-a
```

That internally calls `new-team.mjs team-a` and then
`switch-team.mjs team-a` so the team is scaffolded and active by
the time `init.mjs` finishes. Skip Step 4 if you used this.

## Step 4 — Create your first team for this client

```powershell
node scripts/new-team.mjs team-a
node scripts/switch-team.mjs team-a
```

`new-team.mjs team-a` does:

1. Copies `teams/_template-team/` → `teams/team-a/`.
2. Pre-fills the template's `members.md`, `workflow.md`,
   `deploy.md`, `ceremonies-info.md`, and `environments/*.md`
   with placeholder content you'll fill in later.
3. Calls `build-index.mjs teams` so `teams/INDEX.md` reflects the
   new team.

`switch-team.mjs team-a` writes `team-a` to the first line of
`teams/active-team.txt`, making it the **primary active team**.
Scripts like `new-story.mjs` default scaffolds to this team, and
`/session-start` defaults its scope to all active teams (so the
new team will show up in your morning summary).

After Step 4, the filesystem looks like:

```
kortex-qa-client-a/
├── .client-slug                  ← contains "client-a"
├── client-a-qa.code-workspace    ← renamed by init.mjs
├── teams/
│   ├── active-team.txt           ← line 1: "team-a"
│   ├── team-a/                   ← NEW, your first team
│   │   ├── AGENTS.md
│   │   ├── members.md            (placeholder, fill in later)
│   │   ├── workflow.md           (placeholder)
│   │   ├── deploy.md             (placeholder)
│   │   ├── ceremonies-info.md    (placeholder)
│   │   ├── stories/              (empty, ready for first story)
│   │   ├── test-cases/library/   (empty)
│   │   ├── bugs/                 (empty)
│   │   ├── reviews/              (empty)
│   │   ├── ceremonies/           (empty)
│   │   ├── environments/         (placeholders for local/dev/qa)
│   │   ├── automation/           (empty)
│   │   └── inbox/INBOX.md
│   ├── example-team/             ← shipped as reference (see below)
│   └── _template-team/           ← DO NOT EDIT (scaffold source)
└── (other repo files)
```

### What about `example-team/`?

The `example-team/` folder ships with one story end-to-end +
example test cases + bugs + a retro. It's there as a **reference**
to read while you set up your real work. Two options after Step 4:

- **Keep it.** It doesn't interfere — `team-a` is your primary,
  scripts default there. `/session-start` will list both teams
  but `example-team`'s stories are clearly tagged as examples.
- **Delete it.** Once you've read it: `Remove-Item -Recurse
  -Force teams\example-team` (PowerShell) or `rm -rf
  teams/example-team` (Bash). Then re-run
  `node scripts/build-index.mjs teams` so `teams/INDEX.md`
  forgets it.

### Adding more teams later

A single client engagement can have several teams. After `team-a`
is set up, add `team-b` whenever you need it:

```powershell
node scripts/new-team.mjs team-b
node scripts/switch-team.mjs team-b --add    # mark also-active (50/50 mode)
# OR
node scripts/switch-team.mjs team-b          # promote team-b to primary, team-a stays secondary
```

See [team-onboarding.md](team-onboarding.md) for the full
multi-team flow + when to keep two teams active vs switch primary
mid-sprint.

## Step 5 — First commit

```powershell
git add .
git commit -m "init: kortex-qa for client-a v$(Get-Content VERSION)"
# PowerShell — for Bash, swap to: git commit -m "init: kortex-qa for client-a v$(cat VERSION)"
```

The pre-commit hook will run. You should see:

```
→ Running Kortex-QA pre-commit checks...
✓ Frontmatter OK
✓ INDEX up-to-date
✓ pre-commit OK
```

If validation fails, fix the reported issue and re-stage. Don't
`--no-verify` past the hook on the first commit — that's the
moment to confirm everything's wired.

## Step 6 — Wire credentials (`.env`)

Real test credentials go in a **gitignored** `.env` file at the
repo root. The `.gitignore` already covers `*.env`, `*.env.local`,
`.secrets`, and `client-secrets/`. The `.snapshotignore`
**intentionally keeps these in the snapshot ZIP** (personal
recovery — see AGENTS.md §3).

```env
# .env — gitignored, never committed
QA_BASE_URL="https://qa.<client>.internal"
QA_USER="<your-test-user-email>"
QA_PASS="<your-test-user-password>"
QA_API_TOKEN="<token>"
# Add as many as your Playwright fixtures and manual TCs reference.
```

If the client uses multiple environments, create one `.env` per
env (e.g., `.env.dev`, `.env.qa`) and switch via
`process.env.NODE_ENV` or a similar convention in your automation
fixtures.

**AI agents will NOT read these files** per AGENTS.md §7 and the
`.aiexclude` file in the repo root. The creds exist on disk for
scripts and Playwright to read via `process.env.*`; they stay
out of AI context windows.

## Step 7 — Open the workspace

```powershell
code client-a-qa.code-workspace
```

VS Code opens with three folder roots:

1. **Kortex-QA (this brain)** — `kortex-qa-client-a/`
2. **SUT** — the system-under-test repo (set the path after
   opening: right-click the placeholder root → "Edit Workspace
   File" → update the SUT path).
3. **Automation** — the Playwright automation repo (same).

Confirm Copilot can read this folder:

- Open Copilot Chat. Type "What's the architecture of this brain?"
- It should mention team-centric layout, `teams/<slug>/`, and
  reference AGENTS.md. If it says something generic, check that
  `.github/copilot-instructions.md` is being picked up
  (`@workspace` should see it).

## Step 8 — Capture the first Jira story

Two paths — pick whichever fits the moment.

### Path A — scaffold-first

```powershell
node scripts/new-story.mjs TEAM-1234 search-filter-empty-input
```

Replace `TEAM-1234` with your real Jira ticket key and
`search-filter-empty-input` with a 2–6 kebab-case word slug.

The story lands under the **primary active team** (i.e.,
`teams/team-a/stories/TEAM-1234-search-filter-empty-input/`).
If you want it under a non-primary team, pass `--team`:

```powershell
node scripts/new-story.mjs TEAM-1234 search-filter-empty-input --team team-b
```

The scaffold includes `story.md`, `ac-audit.md`, `execution-log.md`,
`bugs.md`, and a `test-cases/` folder. Open `story.md` and paste
the Jira ticket body into the right sections (title, AC, summary,
dependencies).

Then run `/ac-auditor` in Copilot Chat to audit the AC.

### Path B — Copilot-first

In Copilot Chat:

```
/story-intake

[paste the Jira ticket body here]
```

The `/story-intake` prompt does scaffold + AC audit + drafts the
Teams-ready questions for the dev / PO in one pass. Faster when
you have the ticket body handy.

After either path, run `/session-start` tomorrow morning to see
the story in your active list.

## Step 9 — Take your first snapshot

After the first day of real work:

```powershell
node scripts/snapshot.mjs
# Writes versions/kortex-qa-<client>-v<VERSION>-<YYYYMMDD-HHMM>.zip
```

DM the ZIP to yourself on Teams (personal self-DM, not the
client's channels). This is your laptop-swap insurance. See
[version-snapshot.md](version-snapshot.md) for cadence, naming,
retention, and restore.

The ZIP includes `.env` and other gitignored cred files **by
design** — restoring on a new laptop brings the creds back so you
don't have to re-collect them from a password manager. The ZIP
is never shared with anyone but yourself.

---

## Importing from a previous brain

Four scenarios. Pick the one that matches yours.

### Scenario 1 — same client, different laptop

You're swapping laptops (broken hardware, IT refresh, etc.) and
the client engagement continues.

**What to do:** restore from the most recent snapshot ZIP, not
re-clone the template.

```powershell
# On the new laptop:
mkdir ~\work
cd ~\work

# Pull the ZIP from your Teams self-DM, save it locally.
# Then:
Expand-Archive .\kortex-qa-<client>-v<X.Y.Z>-<timestamp>.zip -DestinationPath kortex-qa-<client>
cd kortex-qa-<client>

# Re-init git locally (the ZIP intentionally excludes .git).
git init
node scripts/install-hooks.mjs
git add .
git commit -m "restore: from snapshot v<X.Y.Z>-<timestamp>"
```

Verify the restore:
```powershell
node scripts/validate.mjs     # should pass
node scripts/build-index.mjs  # should rebuild cleanly
```

The `.env`, all stories, test cases, bugs, ceremonies, and
team-scoped knowledge come back intact. You can resume mid-sprint.

Detailed checklist: [version-snapshot.md](version-snapshot.md)
§"Restore — when you actually need to roll back".

### Scenario 2 — new client, coming from a chat-thread brain

Your previous QA brain was a single Copilot / Claude chat thread
(the pre-template era). You want to bring the useful patterns
into the new clone.

**What to do:** bring **nothing** automatically. Copy-paste only
the **generic, sanitized patterns** into the right places by
hand.

Allowed transfers:

- **Anti-patterns and lessons learned** — sanitize (no client
  names, no internal URLs, no Jira keys, no domain-revealing
  facts) and write into `knowledge/patterns/<slug>.md` and
  `knowledge/lessons-learned.md`.
- **Playwright patterns** — sanitize and write into
  `knowledge/playwright/<slug>.md`.
- **General QA process improvements you discovered** — same.

NOT allowed (single-client design):

- Stories, test cases, bugs, reviews, ceremony notes from the
  prior client. Those belong to that client's data — even if you
  retyped them in your chat, the client may have IP claims on the
  test designs. Start fresh on the new client.
- Specific test data, user credentials, environment URLs from
  the prior client.

Use [team-knowledge-promotion.md](team-knowledge-promotion.md)
§"Sanitization checklist" — same shape as cross-team promotion.

### Scenario 3 — new client, coming from another Kortex-QA clone

You finished an engagement, kept the final ZIP, and now you're
starting a new client.

**What to do:** clone the template fresh (per Step 1 above) for
the new client. **Only `knowledge/` may travel** from the prior
clone, after sanitization.

```powershell
# In the new client's clone:
mkdir knowledge\ported-from-<prior-client>     # staging — will rename after sanitize

# Copy candidate knowledge files from the prior clone (extract from ZIP
# to a staging folder first; do NOT extract the whole ZIP on top of
# the new clone).
```

Sanitization checklist for each file before promotion:

- [ ] No client name, codename, or internal acronym
- [ ] No internal URL or hostname
- [ ] No Jira project key (TEAM-, ACME-, etc.)
- [ ] No real user email or test account
- [ ] No screenshot or PDF that contains client UI
- [ ] No SUT-specific terminology that only makes sense in that
      product

Files that pass: move from `knowledge/ported-from-<prior>/` into
`knowledge/patterns/` or `knowledge/playwright/` or
`knowledge/istqb/` as appropriate. Then `rm -rf
knowledge/ported-from-<prior>/`.

Stories, test cases, bugs, reviews, ceremonies from the prior
clone DO NOT travel. Same rule as Scenario 2.

### Scenario 4 — new client, coming from a non-Kortex source (Notion, OneNote, etc.)

Your previous QA system was a different tool entirely.

**What to do:** same as Scenario 2 — manual copy-paste of
**generic patterns only**, into `knowledge/`, after sanitization.
Stories and test cases for the new client get authored fresh per
`/story-intake` and `/test-case-design`.

If you need a one-time bulk import of historical TCs that are
genuinely reusable across clients (e.g., a personal library of
auth-flow tests you've built over years), do it as a
`knowledge/playwright/<pattern>.md` page, not as an army of
`test-cases/library/` entries. The library is per-team per-client
by design.

---

## What "ready to work" looks like

After Steps 1–9, you should be able to tick every box below. The
example assumes `client-a` (client slug) + `team-a` (team slug);
substitute your real slugs.

- [ ] `node scripts/validate.mjs` → green
- [ ] `node scripts/build-index.mjs --check` → no drift
- [ ] `git log --oneline` → at least one commit (the `init`
      commit), pre-commit hook ran cleanly
- [ ] `client-a-qa.code-workspace` opens in VS Code with three
      roots (brain + SUT + automation)
- [ ] `cat .client-slug` → prints `client-a`
- [ ] `cat teams/active-team.txt` → line 1 is `team-a` (your
      primary team)
- [ ] `ls teams/team-a/` → folder exists with the expected
      sub-zones (stories, test-cases, bugs, reviews, ceremonies,
      environments, automation, inbox, plus the meta files)
- [ ] `.env` exists with at least one cred (gitignored — verify
      with `git status` showing no `.env` modification)
- [ ] Copilot Chat answers a question about the brain referencing
      AGENTS.md or `.github/copilot-instructions.md`
- [ ] You can invoke `/session-start` and get a useful response
      (sparse the first morning; that's normal)

If any box is unchecked, walk back to the relevant step before
starting real work.

## Related

- [../README.md](../README.md) §"Quick start (per client)" — the
  short-form version of this playbook
- [day-in-the-life.md](day-in-the-life.md) — what a typical
  working day looks like once you're set up
- [team-onboarding.md](team-onboarding.md) — adding a second or
  third team after the first is working
- [version-snapshot.md](version-snapshot.md) — backup cadence and
  restore-from-ZIP procedure
- [client-rotation.md](client-rotation.md) — the opposite ritual
  (off-boarding, wiping the clone safely when the engagement ends)
- [../AGENTS.md](../AGENTS.md) — the canonical agent context (read
  during Step 6 verification)
