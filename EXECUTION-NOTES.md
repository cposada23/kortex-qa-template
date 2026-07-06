---
title: "Execution notes — v2.0 plan run"
type: reference
language: en
tags: [execution, v2, plan]
updated: 2026-07-06
status: active
---

# EXECUTION-NOTES — v2.0 run

Execution log for the QA Brain v2.0 plan (mykortex: `docs/superpowers/plans/2026-07-02-qa-brain-v2-kortex-test-v04.md`). Deviations, blockers, and verification records land here per §0.5 of the plan.

## 2026-07-06 — Fase 0

- Branch `v2.0` created from clean `main`.
- Baseline: **95 tests green** across 5 files (`migrate-v1.7-to-v1.8`: 24, `resolve-shared`: 15, `session-branch`: 14, `snapshot`: 34, `validate-session`: 8). Command: `for t in scripts/tests/*.test.mjs; do node "$t" || exit 1; done`.
- Deviation (plan §0.5): plan describes EXECUTION-NOTES.md as a plain committed file, but this repo's pre-commit validator requires frontmatter on every non-exempt `.md`. Added minimal `type: reference` frontmatter instead of touching the validator exemption list in Fase 0.

## 2026-07-06 — Fase 1

- Task 1.2 Step 1b verification (Copilot context mechanism): VS Code prompt-files doc (https://code.visualstudio.com/docs/agent-customization/prompt-files, doc dated 2026-07-01, fetched 2026-07-06) lists frontmatter fields `description`, `name`, `argument-hint`, `agent`, `model`, `tools`. **No sanctioned frontmatter field forces workspace-wide context**; `@workspace` is not part of the prompt-file contract. Conclusion: the generated context preamble (for `context_scope: repo` skills) is the only portable mechanism — implemented as planned, nothing additional to adopt.
- Task 1.1 conversion notes (recorded by the conversion pass): three prompts (`session-note`, `chat-handoff`, `resume-from-handoff`) carried HTML comments explaining Copilot frontmatter mechanics — dropped as unconvertible meta-commentary (facts they carried already live in the bodies). `chat-handoff`'s surface list "(Copilot Chat ↔ Claude ↔ Codex)" neutralized to "(e.g., one AI chat ↔ Claude ↔ Codex)". `ac-auditor` had a relative link valid only from `.github/prompts/` — rewritten to repo-root path prose.
## 2026-07-06 — Fase 2

- Task 2.7: the heuristic English-lint check was deliberately EXCLUDED (per plan spec) — too many false positives with SUT names / Spanish strings inside test data. Only the forbidden-phrases gate + automation freshness shipped.
- Side effect (intended): `teams/example-team/test-cases/auth/tc-auth-001-login-happy-path.md` now emits the "automated but never synced" WARN on every validate run — it demos the freshness check; non-blocking.
- Validators gained a `--root <dir>` flag (validate.mjs, validate-links.mjs, build-index.mjs, validate-automation.mjs) so tests can target fixture trees — not in the plan text but required by its own test specs.

## 2026-07-06 — Fase 4

- Task 4.4 demo-loop (mktemp dir): fresh brain copy → `init democlient` → `kortex-test init --name democlient-automation --datastore sqlite --reporter ctrf-json --issue-tracker github-issues --out . --yes --local` (via npm link) → `pnpm install` → spec `[TC-SEARCH-001] homepage has title` vs playwright.dev → green (1 passed) → CTRF at `reports/ctrf/ctrf-report.json` → `sync-automation` updated `last_run`/`last_result`, appended the execution-log row, refreshed the matrix (`DEMO-1 | AC-1 | TC-SEARCH-001 | automated | 2026-07-06 passed`). PHASE GATE 4 green.
- Friction found & fixed: the shipped example TC `TC-AUTH-001` was `automation_status: automated` with a placeholder `automation_path` — as soon as a brain sets `automation_repo_path`, validate-automation ERRORs on example data and blocks commits. Downgraded to `auto-soon` in the template (honest state: no spec exists). This also removes the standing "never synced" WARN.
- Note: `npx playwright test --project=chromium` does not match tests under `tests/e2e/` (per-project testDirs in the generated config) — run with a filename filter or the `e2e` project. Not a bug; recorded for the day-1 runbook.

## 2026-07-06 — Fase 5

- Task 5.2 discovery smoke: **Claude Code live-verified** headless (`claude -p` in the brain root): all 19 skills listed from `.claude/skills/`, and the `@AGENTS.md` import + hard rules confirmed (correct refusal citing compliance-policy §7). Copilot/Cursor/Codex/Gemini: structural verification only (paths + formats per docs); live checks pending day 1 on the owner's machine.
- Task 5.1 friction (found via dry-run cross-check, fixed): `templates/test-case.md`, both example TCs, the instructions files and the test-case-design skill still taught the OLD `automation_path` semantics (`../../<automation-repo>/...`, relative to the TC file). v2 scripts (validate-automation, sync-automation) resolve it under `brain.config.json.automation_repo_path`. All updated to repo-root-relative (`tests/<area>/<file>.spec.ts`), and design-time TCs now leave `automation_path: ""` empty (filled by automation-from-test-case when the spec runs green).
- Task 5.3: VERSION → 2.0.0; version-history entry; `playbooks/upgrade-v1.8-to-v2.md`; JOURNAL entry. kortex-test: CHANGELOG v0.4.0 + package.json bump (148 unit + 22 smoke green). Tags pending until post dry-run fixes.

## 2026-07-06 — Task 5.1 dry-run (full report + fixes)

Dry-run agent completed ALL 9 day-1 steps end-to-end (8 clean commits in the demo brain, hooks green without --no-verify, session opened+closed+auto-merged). 16 frictions found; fixes applied in this repo:

- **F2 (blocker, fixed)**: automation-bootstrap skill now documents `--local` (required for npm-linked installs — today all of them).
- **F3 (fixed)**: skill documents `--out` = PARENT dir; sibling placement is `--out ..` from the brain root (literal `--out ../<name>` nests `<name>/<name>/`).
- **F4 (blocker OOTB, workaround documented; real fix pending in kortex-test)**: generated `tests/ui` specs die with ENOENT on `playwright/.auth/user.json` (auth.setup self-skips but chromium project demands storageState). Bootstrap skill now documents the stub one-liner.
- **F1 (fixed)**: init.mjs now reruns build-index AFTER team scaffolding/switch — first day-1 commit no longer blocked by INDEX drift.
- **F5 (fixed)**: template inline `# comments` on covers_ac/external_ids/automation_path moved to standalone comment lines (naive parser treated them as values → 3 schema violations when users kept them).
- **F6 (fixed)**: story-intake gains explicit "run build-index" step after filling story.md.
- **F7 (fixed)**: automation-from-test-case now writes the spec into the automation repo when automation_repo_path is configured (chat-only output was a v1 assumption).
- **F8 (fixed)**: skills document the generated framework's LEVEL-based layout (`tests/ui|api|db|e2e/<area>/`) — specs outside those dirs run in no project.
- **F9 (fixed)**: session-end JOURNAL instruction corrected to newest-first BELOW the marker.
- **F10 (fixed)**: init.mjs resets JOURNAL.md (below the marker) on FRESH init only — client brains no longer inherit 38KB of template-dev history; re-init never wipes client history.
- **F14 (fixed)**: example TCs ship with empty automation_path — no more permanent warnings.
- **F15 (already fixed)**: VERSION 2.0.0 landed before the report.
- **F16 (fixed)**: automation_status flip criterion unified ("green in the automation repo — locally at minimum, CI when available").
- **F11/F12/F13 (accepted, cosmetic)**: week-one granted-access records improvised into TODO.md §Watching (fine); `--link-story` leaves a `<one-line scenario summary>` placeholder in the story body (by design — the agent fills it); framework.md format is described in the bootstrap skill, no template needed yet.

Runbook commands for steps 6–8 confirmed by the dry-run are quoted in the report (bootstrap with `--out .. --local`, storageState stub, `npx playwright test <filter>`, `node scripts/sync-automation.mjs`).
