# scripts/ — Node.js tooling

Zero-dependency Node.js `.mjs` scripts. No `package.json`, no
`npm install`. Each script runs as:

```bash
node scripts/<name>.mjs [args]
```

This guarantees portability across macOS / Linux / Windows
(Node is required anyway since Playwright depends on it).

## Available scripts (v2.0 — cross-agent layer + day-1 preflight)

| Script | Purpose |
|---|---|
| [init.mjs](init.mjs) | Post-clone setup; `--first-team <slug>` to scaffold + activate one team in the same run. Also installs the pre-commit hook and runs `doctor.mjs` at the end. |
| [doctor.mjs](doctor.mjs) | Day-1 preflight. Checks Node ≥ 20 (warns on 18), git, zip capability, npm/pnpm, agent CLIs on PATH (claude/cursor/gemini/code/codex), generated adapter dirs, `brain.config.json`, proxy env vars, and probes the network — classifying **TLS interception (Zscaler/Netskope)** vs **no internet** explicitly. Suggests an agent surface. Always exits 0 except when Node < 18. `--no-net` skips the network probes (tests / offline). |
| [sync-agents.mjs](sync-agents.mjs) | Regenerate per-agent adapters from the canonical skills in `.agents/skills/<name>/SKILL.md`: `.github/prompts/*.prompt.md` (Copilot), `.claude/skills/*/SKILL.md` (Claude Code), the skills-index table in `AGENTS.md` (shim for Gemini/others), and byte-copies of `.mcp.json` into `.vscode/mcp.json` + `.cursor/mcp.json`. **Edit the canonical only** — adapters carry a DO-NOT-EDIT banner. `--check` exits 1 on drift or orphans (used by the pre-commit hook). |
| [install-hooks.mjs](install-hooks.mjs) | Install / refresh the Git pre-commit hook (runs 4 checks: `validate.mjs` + `build-index.mjs --check` + `validate-links.mjs` + `sync-agents.mjs --check`). Idempotent; refuses to clobber a non-Kortex hook. |
| [new-team.mjs](new-team.mjs) | Scaffold a new team folder from `teams/_template-team/` |
| [switch-team.mjs](switch-team.mjs) | Edit `teams/active-team.txt` (set primary, add secondary, remove, list) |
| [new-story.mjs](new-story.mjs) | Scaffold a story (team-scoped; `--team <slug>` overrides primary) |
| [new-test-case.mjs](new-test-case.mjs) | Scaffold a single-home test case under `teams/<team>/test-cases/<area>/`; `--link-story` updates both sides. |
| [new-bug.mjs](new-bug.mjs) | Scaffold a bug (team-scoped) |
| [session-start.mjs](session-start.mjs) | AI-free morning summary (default: all active teams; `--team <slug>` / `--all`). Scans `sessions/*.md` for any `status: open` log and surfaces it (the "previous session not closed" detection), plus JOURNAL last entries + TODO counts. |
| [session-branch-start.mjs](session-branch-start.mjs) | Create a clean `session/YYYYMMDD-HHMM` branch from `main` at start-of-day **and** the per-session log `sessions/<id>.md` (status `open`) atomically; prints `Session log: sessions/<id>.md`. Reuses the branch + ensures the file if already on `session/*`. |
| [session-branch-finish.mjs](session-branch-finish.mjs) | Validate (frontmatter + links + INDEX drift + a **blocking strict-PII secret gate** over `sessions/`), commit, and merge the current `session/*` branch back to `main` (`--no-ff`, then deletes the branch). Local-only, never pushes; preserves the branch on any failure. |
| [build-index.mjs](build-index.mjs) | Regenerate INDEX.md files across all team sub-zones + global knowledge/. `--check` exits 1 on drift (used by pre-commit hook). |
| [snapshot.mjs](snapshot.mjs) | ZIP the brain to versions/ for backup |
| [validate.mjs](validate.mjs) | Frontmatter + PII integrity check. Run before every commit (also enforced by the pre-commit hook installed by `install-hooks.mjs`). |
| [validate-links.mjs](validate-links.mjs) | Validate ID-based links (`linked_test_cases`, `linked_bugs`, `linked_stories`) and markdown links under `teams/`. |
| [import-prior-brain.mjs](import-prior-brain.mjs) | Stage content from a previous markdown brain for review + selective import. |
| [migrate-v1.5-to-v1.6.mjs](migrate-v1.5-to-v1.6.mjs) | One-shot migration from the pre-v1.6 story-local/library test case model to single-home test cases. |
| [migrate-v1.7-to-v1.8.mjs](migrate-v1.7-to-v1.8.mjs) | One-shot migration to the v1.8 per-session log model. |

## Shared helpers (`lib/`)

| Module | Purpose |
|---|---|
| [lib/platform.mjs](lib/platform.mjs) | Cross-platform detection helpers: `commandExists(cmd)` (PATH lookup, PATHEXT-aware on Windows) and `zipCapability()` (zip CLI → tar → PowerShell Compress-Archive, mirroring `snapshot.mjs`'s fallback order). Used by `doctor.mjs`. |
| [lib/resolve-shared.mjs](lib/resolve-shared.mjs) | Resolution rule for client-wide assets: team override (`teams/<slug>/<asset>`) first, else `shared/<asset>`. |

## Running the tests

Each test file under `scripts/tests/` is a standalone zero-dep Node
script (no test runner). Run them all with:

```bash
for t in scripts/tests/*.test.mjs; do node "$t"; done
```

A test exits non-zero on failure; the loop's output shows which file
failed. Run them before committing changes to any script.

## Auto-INDEX guarantee

The scaffold scripts (`new-story`, `new-test-case`, `new-bug`)
call `build-index.mjs` after creating files. This keeps INDEX.md
files (and therefore Copilot's `@workspace` retrieval) current
without manual steps.

## Design principles

- **Zero deps.** No `npm install` is acceptable. Node built-ins
  only (`fs`, `path`, `child_process`, `os`, `zlib`).
- **Self-contained.** Each script is one file. The only shared
  utility modules are the two in `scripts/lib/` (small duplication
  is fine; coupling is worse — the bar for adding to `lib/` is
  high).
- **Fail loud.** Errors print to stderr and exit non-zero. No
  silent failures.
- **Idempotent where possible.** `build-index.mjs` and
  `validate.mjs` can be run repeatedly without side effects.
- **Read-only by default.** Only scripts named `new-*`, `init`,
  `snapshot`, `build-index`, `sync-agents`, and `session-branch-*`
  write files or git state. The rest are read-only (`doctor` never
  writes; `--check` modes never write).

## Running on Windows

All scripts work in:

- Windows Command Prompt: `node scripts\new-story.mjs ...`
- PowerShell: `node scripts\new-story.mjs ...`
- Git Bash / WSL: `node scripts/new-story.mjs ...`

Path separators in arguments are normalized internally.

## Hard rules for adding scripts

If you add a new script:

- It must work on Windows, macOS, Linux.
- No deps. (If a use case truly requires a dep, that's the time
  to discuss adding a `package.json` — but the bar is high.)
- Document it in this README.
- If it writes files, hook into `build-index.mjs` so INDEX stays
  fresh.
