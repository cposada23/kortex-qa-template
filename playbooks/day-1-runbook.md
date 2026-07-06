---
title: "Day-1 runbook — from clone to your first stories"
type: playbook
language: en
tags: [day-1, runbook, onboarding, quickstart]
updated: 2026-07-06
status: active
---

# Day-1 runbook — from clone to your first stories

The literal, copy-paste sequence from "I have the template" to "my
first real stories are captured, audited and covered". Every command
here was verified end-to-end on macOS on 2026-07-06 (full dry-run,
all steps green).

Two ways to consume this:

- **Agent-driven (preferred):** open the brain with any AI agent and
  the skills walk you through — this runbook then works as the map of
  what the agent is doing.
- **Manual (fallback):** if the client's agent is weak or the network
  is blocked, run every step yourself. Nothing below needs internet
  except installing the automation framework (step 9, optional day 1).

> **Day 0 first.** Before your first day, go through the
> "Corporate Mac checklist (day 0)" in
> [client-bootstrap.md](client-bootstrap.md) — the IT questions
> (proxy, VPN, permitted AI CLIs, Playwright downloads) are the #1
> source of day-1 blockers.

---

## Step 1 — Get the template onto the client machine

Copy the template folder (from your private channel — ZIP snapshot,
USB, whatever the client permits). Do NOT reuse another client's
clone: one clone = one client, always.

```bash
cp -R kortex-qa-template acme-brain    # or unzip the snapshot
cd acme-brain
rm -rf .git                            # drop the template's history
```

## Step 2 — Initialize for the client

```bash
node scripts/init.mjs acme --first-team pod-1
```

One command does all of this:

- stamps `.client-slug` and renames the workspace file
- resets `JOURNAL.md` (you don't inherit template history)
- writes `brain.config.json` (everything `tbd` — week-one fills it)
- scaffolds your first team (`teams/pod-1/`) and marks it primary
- rebuilds the INDEXes
- installs the pre-commit hook (5 checks)
- runs `doctor.mjs` — **read its output now**: it detects Node/git,
  agent surfaces, and classifies corporate-proxy/TLS problems before
  they bite. It ends with "Suggested surface: X".

If doctor flags network trouble, follow the fallback cascade in
[client-bootstrap.md](client-bootstrap.md) — the brain itself works
100% offline; only MCP/npx/Playwright wait for IT.

## Step 3 — First commit

```bash
git init
node scripts/install-hooks.mjs   # idempotent; needed after git init
git add . && git commit -m "init: kortex-qa for acme v$(cat VERSION)"
```

The hook runs validate + index + links + agent-sync + automation
checks on every commit from now on. If a commit is ever blocked, the
hook's output names the exact script to run.

## Step 4 — Open it with your agent

| Your agent | What to do |
|---|---|
| Claude Code | `claude` in the brain root — skills auto-discovered |
| Copilot (VS Code) | open the workspace; workflows are `/<name>` in chat |
| Cursor / Codex | open the folder — they read `AGENTS.md` natively |
| Gemini CLI / other | read the Skills index table in `AGENTS.md`, open the canonical skill it points to, follow it literally |
| No agent at all | this runbook + the playbooks are the manual path |

Sanity check: ask the agent "what skills do you have?" — it should
list 19, including `session-start`, `week-one` and `story-intake`.

## Step 5 — Start your first session

Run the **session-start** skill (or manually:
`node scripts/session-branch-start.mjs`). It creates a `session/*`
branch + a committed session log, and briefs you on the brain state.
All daily work happens on session branches — `main` only receives
end-of-session merges.

## Step 6 — Week-one discovery (days 1–5, reentrant)

Run the **week-one** skill. It reads `brain.config.json` + which
files already exist and resumes wherever you left off:

- **Day 1 — Access & people.** Request accesses (SUT repo, tracker,
  TMS, envs+VPN, CI, team channel); capture people into
  `teams/pod-1/members.md`, ceremonies into
  `teams/pod-1/ceremonies-info.md`.
- **Day 2 — Tool inventory.** Short interview (tracker? TMS? CI? how
  does the app run locally?) → `shared/tool-inventory.md` + update
  `brain.config.json` (`tms`, `tracker`, `ci`). **This unlocks
  automation-bootstrap later.**
- **Day 3 — Environments & data** → `shared/environments/*.md`,
  `shared/users.md`, `shared/filters.md`.
- **Day 4 — SUT map seeding** → `knowledge/sut-map/00-overview.md`
  + one page per module you touched.
- **Day 5 — First real work + exit check** → your first story via
  story-intake (next step), then `week_one_done: true` if the exit
  criteria hold.

Hard rule the skill enforces: **nothing invented** — every client
fact enters with a source (person/doc/ticket + date). Credentials
never go into tracked files (`.env` only, already gitignored).

## Step 7 — Capture your first story

Run the **story-intake** skill with the ticket (URL + body paste).
Manually, the core of it is:

```bash
node scripts/new-story.mjs ACME-101 search-by-name
```

Then fill `teams/pod-1/stories/ACME-101-search-by-name/story.md`:

- paste the acceptance criteria under **stable numbered headings** —
  `### AC-1: <title>`, `### AC-2: ...`. These ids are immutable
  (text may change; ids are never renumbered) — test cases point at
  them via `covers_ac`, and the coverage matrix is built from them.
- the skill also runs the AC audit → `ac-audit.md` with Teams-ready
  questions for the dev/PO, and rebuilds the INDEXes.

Repeat for each ticket in your plate. Two or three stories captured
this way and the brain is already answering "what's open, what's
ambiguous, what do I ask the dev".

## Step 8 — Design your first test cases

Run the **test-case-design** skill per scenario (scenarios usually
come from the **story-analyzer** skill first). Manually:

```bash
node scripts/new-test-case.mjs search search-partial-name --link-story ACME-101
```

In the TC frontmatter set `covers_ac: [AC-1]` (whichever ACs it
covers). Then check your traceability for free:

```bash
node scripts/build-index.mjs
cat teams/pod-1/coverage-matrix.md
```

Every (story × AC) shows covered / `⚠ uncovered` — this is the "what
am I missing?" view from day 2 onward.

## Step 9 — (When ready) wire the automation loop

Not required on day 1 — usually after week-one day 2, once
tracker/TMS are known and IT allows installs:

1. Run the **automation-bootstrap** skill. Verified command shape
   (from the brain root; `--out` is the PARENT dir, `--local` while
   kortex-test is npm-linked):
   ```bash
   kortex-test init --name acme-automation --datastore sqlite \
     --reporter ctrf-json --out .. --yes --local <flags from the skill's mapping table>
   ```
   The skill then sets `automation_repo_path` in `brain.config.json`
   and records everything in `teams/pod-1/automation/framework.md`.
2. First spec via the **automation-from-test-case** skill — titles
   are ALWAYS `test('[TC-SEARCH-001] <behavior>')`, files under
   `tests/<level>/<area>/` (e.g. `tests/ui/search/`).
3. Run and sync back:
   ```bash
   ( cd ../acme-automation && npx playwright test <spec-filter> )
   node scripts/sync-automation.mjs     # TC last_run/last_result + logs + matrix
   node scripts/validate-automation.mjs # traceability check
   ```

Full detail: [automation-flow.md](automation-flow.md).

## Step 10 — Close the day

Run the **session-end** skill. It is autonomous: infers the wrap
from the day's artifacts, appends the Bridge-out + JOURNAL entry,
updates TODO, rebuilds indexes, and auto-merges the session branch
to `main` behind the strict-PII gate. If it hard-stops because you
are on `main`, that is the guard working — start a session first
(step 5).

---

## Recap — minimal command trail

```bash
# once
cp -R kortex-qa-template acme-brain && cd acme-brain && rm -rf .git
node scripts/init.mjs acme --first-team pod-1
git init && node scripts/install-hooks.mjs
git add . && git commit -m "init: kortex-qa for acme v$(cat VERSION)"

# every day
<session-start skill>              # branch + log + briefing
<week-one / story-intake / test-case-design skills>  # the actual work
node scripts/build-index.mjs       # after content edits (matrix refresh)
<session-end skill>                # wrap + auto-merge

# health at any moment
node scripts/doctor.mjs
node scripts/validate.mjs && node scripts/validate-links.mjs
```

## If something blocks you

| Symptom | Fix |
|---|---|
| Commit blocked by the hook | Read the hook output — it names the script (usually `node scripts/build-index.mjs` after content edits, or `node scripts/sync-agents.mjs` after skill edits) |
| doctor warns about TLS/proxy | `client-bootstrap.md` §Corporate Mac checklist — `NODE_EXTRA_CA_CERTS` / `HTTP(S)_PROXY`, ask IT for the root CA |
| First ui spec dies on `playwright/.auth/user.json` | Framework generated with kortex-test < v0.4.0 — stub it: `mkdir -p playwright/.auth && echo '{"cookies":[],"origins":[]}' > playwright/.auth/user.json` |
| Agent can't find workflows | It's not reading `AGENTS.md` — point it at the Skills index table there |
| `kortex-test: command not found` | Install per the automation-bootstrap skill (clone → `pnpm install --ignore-workspace && pnpm build && npm link`) |
