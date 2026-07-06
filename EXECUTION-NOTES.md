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
## 2026-07-06 — Fase 4

- Task 4.4 demo-loop (mktemp dir): fresh brain copy → `init democlient` → `kortex-test init --name democlient-automation --datastore sqlite --reporter ctrf-json --issue-tracker github-issues --out . --yes --local` (via npm link) → `pnpm install` → spec `[TC-SEARCH-001] homepage has title` vs playwright.dev → green (1 passed) → CTRF at `reports/ctrf/ctrf-report.json` → `sync-automation` updated `last_run`/`last_result`, appended the execution-log row, refreshed the matrix (`DEMO-1 | AC-1 | TC-SEARCH-001 | automated | 2026-07-06 passed`). PHASE GATE 4 green.
- Friction found & fixed: the shipped example TC `TC-AUTH-001` was `automation_status: automated` with a placeholder `automation_path` — as soon as a brain sets `automation_repo_path`, validate-automation ERRORs on example data and blocks commits. Downgraded to `auto-soon` in the template (honest state: no spec exists). This also removes the standing "never synced" WARN.
- Note: `npx playwright test --project=chromium` does not match tests under `tests/e2e/` (per-project testDirs in the generated config) — run with a filename filter or the `e2e` project. Not a bug; recorded for the day-1 runbook.

## 2026-07-06 — Fase 2

- Task 2.7: the heuristic English-lint check was deliberately EXCLUDED (per plan spec) — too many false positives with SUT names / Spanish strings inside test data. Only the forbidden-phrases gate + automation freshness shipped.
- Side effect (intended): `teams/example-team/test-cases/auth/tc-auth-001-login-happy-path.md` now emits the "automated but never synced" WARN on every validate run — it demos the freshness check; non-blocking.
- Validators gained a `--root <dir>` flag (validate.mjs, validate-links.mjs, build-index.mjs, validate-automation.mjs) so tests can target fixture trees — not in the plan text but required by its own test specs.

- Task 1.1 conversion notes (recorded by the conversion pass): three prompts (`session-note`, `chat-handoff`, `resume-from-handoff`) carried HTML comments explaining Copilot frontmatter mechanics — dropped as unconvertible meta-commentary (facts they carried already live in the bodies). `chat-handoff`'s surface list "(Copilot Chat ↔ Claude ↔ Codex)" neutralized to "(e.g., one AI chat ↔ Claude ↔ Codex)". `ac-auditor` had a relative link valid only from `.github/prompts/` — rewritten to repo-root path prose.
