---
name: week-one
description: Guide the first 5 days at a new client, filling the brain progressively; reentrant, resumes from real state.
---
<!-- generated from .agents/skills/week-one/SKILL.md — DO NOT EDIT. Run: node scripts/sync-agents.mjs -->

# Week one

You are the QA engineer's onboarding guide for the first five days
at a new client. Your job is to fill the brain progressively — one
themed day at a time — so that by the end of the week the engineer
has tools, environments, people, and a seeded SUT map on file, and
`week_one_done` can flip to `true` honestly.

Why each day matters, what "good" looks like, and tips for corporate
environments: read the extended playbook at `playbooks/week-one.md`.

## Reentrancy — resume from real state, never from memory

This skill is **reentrant**. Every invocation starts by reading the
actual state of the brain and resumes at the first incomplete day.
Never assume "this is day N" from the calendar or the chat history.

On every invocation, FIRST determine progress:

1. Read `brain.config.json` — check `week_one_done`, `tms`,
   `tracker`, `ci` (`tbd` means day 2 is incomplete).
2. Read `teams/active-team.txt` for the primary team slug, then
   check whether `teams/<slug>/members.md` and
   `teams/<slug>/ceremonies-info.md` still contain `_<name>_`-style
   placeholders (day 1 incomplete if so).
3. Check whether `shared/tool-inventory.md` still has `(tbd)`
   entries (day 2).
4. Check whether `shared/environments/*.md`, `shared/users.md`,
   `shared/filters.md` still say "Replace placeholders after init"
   with no real data (day 3).
5. Check whether `knowledge/sut-map/00-overview.md` exists and
   whether `knowledge/sut-map/` has at least one module page
   besides the overview (day 4).
6. Check whether any story exists under `teams/<slug>/stories/`
   (day 5).

Report the computed state ("days 1–2 done, resuming at day 3"),
then run ONLY the incomplete days, in order. A day whose files are
already filled is skipped, not redone.

## Day 1 — Access & people

1. Walk the engineer through the **access checklist** — for each
   item, record status (requested / granted / blocked-on-whom):
   - SUT repo(s) (read access at minimum)
   - Tracker (Jira / Azure DevOps / GitHub Issues)
   - TMS (Xray, Octane, TestRail, ADO Test Plans — if any)
   - Environments + VPN (URLs, VPN client, who approves access)
   - CI (pipeline visibility)
   - Team chat channel(s) (Teams / Slack)
   - Ceremonies calendar (standing invites)
2. Capture people into `teams/<slug>/members.md` — replace the
   placeholder rows with real names, roles, and "pings for".
3. Capture the ceremony cadence into
   `teams/<slug>/ceremonies-info.md` (sprint length, standup time,
   planning/retro slots).
4. Park unresolved access requests in `TODO.md` with the person
   who owns the approval.
5. As you learn where things live (boards, repos, CI, docs, access
   processes), record each one in `teams/<slug>/links.md` — one line
   per thing. Any internal process someone describes (bug triage,
   reviews, releases, escalation) becomes a short file under
   `teams/<slug>/processes/`, with its source.

## Day 2 — Tool inventory

1. Run a **short interview** — four questions, in the engineer's
   words: Which tracker? Which TMS (if any)? Which CI? How does the
   app run locally?
2. Write the answers into `shared/tool-inventory.md`, replacing the
   `(tbd)` placeholders. Every answer carries a Source (person/doc
   + date).
3. Update `brain.config.json` by editing the JSON directly — set:
   - `tms`: one of `xray-cloud | octane | testrail | ado | none | tbd`
   - `tracker`: one of `jira | ado | github | none | tbd`
   - `ci`: free string (e.g. `github-actions`, `azure-pipelines`)

   Leave a field `tbd` only if the answer is genuinely unknown —
   `none` means "confirmed the client doesn't use one".

## Day 3 — Environments & data

1. Fill `shared/environments/*.md` (local, dev, qa) with real URLs,
   how-to-bring-up notes, and caveats.
2. Fill `shared/users.md` with the client's real test-user matrix
   (personas + envs — **never passwords**; note where the vault is).
3. Fill `shared/filters.md` with the first known "magic strings" /
   datasets for finding test scenarios in the SUT's data.
4. Anything a team overrides (its own env, its own users) goes to
   `teams/<slug>/<same-filename>` per the resolution rule.

## Day 4 — SUT map seeding

1. Create `knowledge/sut-map/00-overview.md`: the system's top-level
   modules, **one line each**, with a source per line. Frontmatter:
   `type: knowledge`, `status: active`.
2. For each module the engineer has actually touched or been walked
   through, create one page from `templates/sut-module.md` at
   `knowledge/sut-map/<module-slug>.md` and fill what is confirmed —
   unknowns go under "Open questions", not invented.
3. Do NOT map the whole system — seed only what week one actually
   surfaced. The `sut-map` skill grows it story by story afterwards.

## Day 5 — First real work + exit check

1. Take the first real story through the **story-intake** skill
   (scaffold + AC audit). Real work is the best test of the setup.
2. Run the **exit check**. Set `week_one_done: true` in
   `brain.config.json` ONLY if ALL of:
   - `shared/tool-inventory.md` has no critical `tbd` left
     (`tms`/`tracker`/`ci` answered or confirmed `none`);
   - at least 1 environment file in `shared/environments/` is
     filled with real data;
   - `knowledge/sut-map/` has `00-overview.md` + at least 1 module
     page.
3. If any check fails, leave `week_one_done: false`, report exactly
   which check failed and what's missing, and stop.

## Output

After each invocation, summarize: computed state at start, which
day(s) were worked, files written, unresolved access items, and —
on day 5 — the exit-check verdict per criterion.

## Hard rules

- **NEVER invent client data.** Every fact enters with a source:
  a person, a doc, or a ticket, plus the date. If nobody confirmed
  it, it goes into an "Open questions" section instead.
- **No credentials in tracked files.** Passwords, tokens, and API
  keys go to `.env` (already gitignored); tracked files record only
  *which* user/tool to use and *where* the secret lives.
- **Reentrant, not linear.** Always recompute state from the files;
  skip completed days; never re-ask what the brain already knows.
- `week_one_done: true` only via the day-5 exit check — never as a
  courtesy.
