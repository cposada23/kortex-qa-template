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
## 2026-07-06 — Fase 2

- Task 2.7: the heuristic English-lint check was deliberately EXCLUDED (per plan spec) — too many false positives with SUT names / Spanish strings inside test data. Only the forbidden-phrases gate + automation freshness shipped.
- Side effect (intended): `teams/example-team/test-cases/auth/tc-auth-001-login-happy-path.md` now emits the "automated but never synced" WARN on every validate run — it demos the freshness check; non-blocking.
- Validators gained a `--root <dir>` flag (validate.mjs, validate-links.mjs, build-index.mjs, validate-automation.mjs) so tests can target fixture trees — not in the plan text but required by its own test specs.

- Task 1.1 conversion notes (recorded by the conversion pass): three prompts (`session-note`, `chat-handoff`, `resume-from-handoff`) carried HTML comments explaining Copilot frontmatter mechanics — dropped as unconvertible meta-commentary (facts they carried already live in the bodies). `chat-handoff`'s surface list "(Copilot Chat ↔ Claude ↔ Codex)" neutralized to "(e.g., one AI chat ↔ Claude ↔ Codex)". `ac-auditor` had a relative link valid only from `.github/prompts/` — rewritten to repo-root path prose.
