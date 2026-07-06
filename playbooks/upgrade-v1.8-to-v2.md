---
title: "Upgrade an existing brain from v1.8 to v2.0"
type: playbook
language: en
tags: [upgrade, migration, v2]
updated: 2026-07-06
status: active
---

# Upgrade a v1.8 brain to v2.0

Manual guide for carrying the v2.0 framework into a brain that
already holds real client content. There is no migration script for
this jump — the framework zones are copied wholesale; the content
zones are never touched.

## What v2.0 changes (summary)

Cross-agent skills (`.agents/skills/` canonical + generated
adapters), compact AGENTS.md with a generated skills index,
`brain.config.json` machine state, `doctor.mjs` preflight, schema v2
traceability (`### AC-n:` headings, `covers_ac`, `external_ids`,
`last_run`/`last_result`), per-team `coverage-matrix.md`, and the
automation bridge (`sync-automation.mjs`, `validate-automation.mjs`,
`automation-bootstrap` / `automation-sync` skills).

## Framework zones — COPY from the v2.0 template

Copy these wholesale into the old brain (overwrite):

- `.agents/` (canonical skills + permissions README)
- `.claude/` and `.github/prompts/` (generated adapters — or delete
  them and run `node scripts/sync-agents.mjs` after copying `.agents/`)
- `.github/instructions/` and `.github/copilot-instructions.md`
- `scripts/` (all of it — new scripts + updated validators)
- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` (wrappers)
- `.mcp.json`, `.vscode/mcp.json`, `.cursor/mcp.json`
- `templates/` (new sut-module template + v2 fields in test-case/story)
- `playbooks/compliance-policy.md`, `playbooks/week-one.md`,
  `playbooks/upgrade-v1.8-to-v2.md` (this file), and take the v2
  updates to `playbooks/automation-flow.md`, `client-bootstrap.md`,
  `day-in-the-life.md`, `playbooks/README.md`

## Content zones — NEVER touch

- `teams/` (stories, test cases, bugs, reviews, ceremonies, inbox)
- `shared/` (but ADD the new `shared/tool-inventory.md` template)
- `knowledge/` (but ADD the new `knowledge/sut-map/` zone README)
- `sessions/`, `JOURNAL.md`, `TODO.md`, `versions/`

## After copying

1. `node scripts/init.mjs <existing-client-slug>` — re-stamps the
   client, writes `brain.config.json` (keeps nothing to lose — the
   file did not exist in v1.8), reinstalls the 5-check pre-commit
   hook, runs doctor.
2. Fill `brain.config.json` honestly (`tms`, `tracker`, `ci` from
   your real tool inventory; `week_one_done: true` if you're past
   week one).
3. `node scripts/sync-agents.mjs` then `--check` → green.
4. `node scripts/validate.mjs && node scripts/validate-links.mjs &&
   node scripts/build-index.mjs` → the matrix generates; expect
   `⚠ uncovered` rows and legacy-story warnings.
5. Opportunistic content upgrades (NOT required day one):
   - Convert story AC sections to `### AC-n:` headings when you next
     touch each story (legacy stories are tolerated with a WARN but
     excluded from the coverage matrix).
   - Add `covers_ac` to TCs as you touch them.
   - `automation_status: automated` TCs need a real
     `automation_path` under the automation repo once
     `brain.config.json.automation_repo_path` is set — downgrade to
     `auto-soon` anything that has no spec yet.
6. `VERSION` → `2.0.0` and commit.

## Rollback

The copy is additive except for `scripts/` and the wrappers. A brain
under git can always `git checkout <pre-upgrade-commit> -- scripts/ AGENTS.md`
to roll back. Content zones were never touched, so client data is
not at risk.
