# Journal

Append-only session log. Each `/session-end` invocation appends a
block. Never edit history — if a past entry was wrong, append a
new entry that supersedes it.

Format per entry:

```
## YYYY-MM-DD HH:MM — <one-line summary>

STATE: <what's currently in flight>
DID: <what changed since last entry>
DECISIONS: <choices made>
BLOCKERS: <what's stuck and on whom>
NEXT: <what to do next session>
```

---

<!-- entries below -->

## 2026-05-21 13:30 — v1.2.0 completion pass

STATE: Template v1.2.0 ready for first real-client use. Three deferred playbooks promoted from stub → full (test-case-peer-review, automation-flow, version-snapshot). Five new Copilot prompts added per v1.1 plan (test-case-reviewer, automation-from-test-case, sprint-planning-intake, retro-intake, question-generator). README rewritten to reflect team-centric architecture + v1.2 scope.
DID: VERSION 1.1.0 → 1.2.0. README sync. Playbooks/{test-case-peer-review,version-snapshot,automation-flow}.md from ~40 lines stub → 150+ lines full, matching `ac-audit.md` format (Relationship to /<prompt>, When-to/What-to/How-to sections, cheat sheet, Linking output, Related). 5 new `.github/prompts/*.prompt.md` files (~150-250 lines each, ask/edit modes, mirroring existing prompt structure). INDEX rebuild.
DECISIONS: Single-client constraint stays — multi-client `clients/` zone still deferred to "post-real-usage". v1.2 closes the prompt + playbook gaps without scope creep into multi-tenancy.
BLOCKERS: none.
NEXT: First client use. Capture real friction as TODOs / patterns. Expect 2-3 patch bumps in first month addressing real-world gaps. Don't pre-emptively add features the engineer hasn't asked for.

## 2026-05-21 13:55 — v1.2.1 sync day-in-the-life ↔ v1.2 prompt set

STATE: First patch on top of v1.2.0. day-in-the-life.md was the only v1.1 playbook untouched by the v1.2 sweep — caught by the owner before merge of the mykortex-side TODO update. The full-day narrative covered the 7 v1.0 prompts but not the 5 new ones (test-case-reviewer / automation-from-test-case / sprint-planning-intake / retro-intake / question-generator); the See also list missed the 3 promoted full playbooks.
DID: 15-minute happy path table extended with 3 new decision branches (Review peer TCs / Manual → Playwright / Non-AC ambiguity). New "Days that aren't typical" section: 5 sub-scenarios (Peer review day, Automation day, Sprint planning day, Retro day, Design-doc-heavy day), each with a flow + prompt + playbook reference. See also expanded from 5 to 11 entries. VERSION 1.2.0 → 1.2.1.
DECISIONS: Patch bump rather than amend v1.2.0 — the v1.2.0 commit is already pushed; amend + force-push would violate the no-force-push rule. The new content is real (~100 lines), worth its own commit + tag.
BLOCKERS: none.
NEXT: same as v1.2.0 — first client use. The day-in-the-life now reflects the full v1.2 capability set.

## 2026-05-21 14:10 — v1.2.2 sync .github/copilot-instructions.md with team-centric architecture

STATE: Second patch in same day, surfaced by owner pre-merge audit ("¿qué le falta al kortex qa?"). The Copilot entry-point file `copilot-instructions.md` was the last v1.0 artifact untouched by the v1.1 team-centric restructure. It claimed "ten zones", referenced `../stories/README.md` (404 post-restructure), pointed at root-level paths for stories/bugs/reviews/environments (all now under `teams/<slug>/`), and listed only the 7 v1.0 prompts. Since Copilot reads this file FIRST, every drift cascaded into wrong defaults from the first interaction.
DID: Rewrite `copilot-instructions.md` from the ground up — architecture section reflects team-centric layout, discovery order points at `teams/<active>/{stories,test-cases,bugs,reviews,automation}/README.md` instead of root, hard rule #1 path globs updated to `teams/<slug>/...`, prompt list extended to 12 entries (all v1.2 prompts included), new hard rule #7 "Default-scope to the active team" formalizing the primary-team convention. VERSION 1.2.1 → 1.2.2.
DECISIONS: Owner explicitly declined the 4 optional trade-offs (LICENSE / CHANGELOG.md / CI workflow / knowledge seed examples) — selective scope. Only the legit drift bug got fixed. No additions.
BLOCKERS: none.
NEXT: same as v1.2.0/v1.2.1 — first client use. The Copilot entry point now matches the rest of the template.

## 2026-05-21 14:45 — v1.3.0 Windows-First + .env policy + zoneName fix

STATE: Owner ran a Gemini audit. Three real issues surfaced (zoneName bug in build-index.mjs, Windows-First not declared, no-push + .env policy not formalized). Gemini drafted edits to 3 files — accepted 2 partially (with corrections), accepted the bug fix as-is. Two of Gemini's claims rejected after critical review: timezone date drift in daysSince (real but immaterial — soft signal, ±1 day jitter on a 3-day threshold = noise; not worth datetime refactor); git hooks (owner declined — no remote to leak to).
DID:
- VERSION 1.2.2 → 1.3.0 (minor bump: new platform policy + restored portability rules).
- AGENTS.md: rewrote the compliance section properly. Kept Gemini's 3 new policies (Windows-First, Local-only Git, .env permitted) BUT restored 3 rules Gemini deleted as collateral damage: "no client identifiers in knowledge/" (portability invariant), "run validate.mjs before snapshotting" (still useful even without push), "single-client by design" (architecture decision). Also fixed double `---` separator Gemini left, and added a §6 "Org policy pre-flight" so the assumptions list isn't lost. Total: 6 numbered subsections under "Compliance, Org Policy & Platform Philosophy".
- .github/copilot-instructions.md: kept Gemini's Rule 5 rewrite (Local credentials + Purely Local Git) and Rule 8 new (Windows-First Cross-Platform Compatibility). No further edits needed.
- scripts/build-index.mjs: accepted Gemini's fix verbatim — `zoneName = path.basename(zoneRelPath)` declared at top of buildIndexForZone. Empirically verified by triggering the no-INDEX branch in sandbox (created empty zone, ran build-index, got clean INDEX.md instead of ReferenceError).
- .snapshotignore: added `*.env`, `*.env.local`, `.secrets` (Gemini didn't mention this gap, but it's the load-bearing piece of the .env policy — ZIPs often end up in client-managed Teams archives, so creds must stay out of them too).
DECISIONS:
- Platform policy: Windows-First / PowerShell primary, full cross-platform parity. No script changes needed — already uses path.join() + process.platform branching in snapshot.mjs.
- Cred policy: .env files OK with real creds (gitignored AND snapshotignored). Tracked .md files stay creds-free.
- No-push: documented as a workflow invariant, not enforced with a hook (no remote = nothing to enforce against). If a remote ever gets wired in by accident, the rule says "remove the remote, don't push".
- Skipped: timezone fix in daysSince, pre-commit hook (owner declined), CHANGELOG/LICENSE/CI/knowledge-seeds (owner declined v1.2.2).
BLOCKERS: none.
READINESS: green to start using. The template is complete enough for first real client. Latent concerns (timezone jitter, no automated PII gate) are explicitly Watch, not blocker. Owner-driven NEXT items if they surface in real use: clients/ zone (multi-tenancy), seed examples in knowledge/{patterns,playwright,istqb}, optional CI.

## 2026-05-21 15:10 — v1.4.0 pre-commit hook + invert snapshot policy + AI read restrictions

STATE: Owner corrected two stances from v1.3.0 review:
1. **Pre-commit hook IS useful** even without a remote — "no hay remote, pero si hay commits" — a credential or schema drift in local history requires history rewrite to remove. The previous "no remote = no leak risk = no hook needed" reasoning ignored that local history is itself the artifact to keep clean.
2. **`.env` files SHOULD be in the snapshot ZIP** — the ZIP is personal cross-laptop recovery (owner DMs it to themselves on Teams, never shared). Including creds means a laptop swap restores the brain *with* creds intact, no re-collection from password managers.
Also surfaced a NEW concern: protect creds against AI model ingestion. If Copilot/Claude/Gemini read `.env` while helping, content can end up in logs / training pipelines / leaked context across sessions.

DID:
- VERSION 1.3.0 → 1.4.0 (minor: new script + new feature + policy refinement).
- NEW: `scripts/install-hooks.mjs` (zero-dep Node script, ~90 lines). Writes `.git/hooks/pre-commit` shell shim that runs `validate.mjs` + `build-index.mjs --check`. Cross-platform `#!/bin/sh` (Git for Windows runs via MINGW sh). Idempotent — detects own signature to refresh; refuses to clobber a non-Kortex hook. Smoke-verified end-to-end: clean commit passes, broken frontmatter blocked with exit 1, re-install refreshes, user-authored hook left alone.
- INVERTED `.snapshotignore`: removed `*.env`, `*.env.local`, `.secrets`, `client-secrets/`. ZIP now includes them by design. Comment block at top of file explains why (personal recovery only, never shared).
- NEW: `.aiexclude` at repo root with credential file patterns. Convention respected by Gemini Code Assist; other agents enforce via AGENTS.md / copilot-instructions.md rules below.
- AGENTS.md: §3 rewritten — `.env` permitted, gitignored, but snapshot-INCLUDED; ZIP never shared (hard rule); cross-references new §7. §5 "Run validate.mjs" updated to mention the hook covers it at commit time + manual run still required pre-snapshot. NEW §7 "AI agents must NOT read credential files" — file pattern list, refusal scripts for common owner asks ("Show me .env" → decline), enforcement layers (.aiexclude + AGENTS.md + copilot-instructions.md + per-user VS Code settings).
- `.github/copilot-instructions.md`: Rule 5 updated to flip the snapshot policy + mention the pre-commit hook. NEW Rule 9 "AI model read restrictions" mirrors AGENTS.md §7.
- `init.mjs`: now calls `node scripts/install-hooks.mjs` automatically after team scaffolding (no-op if `.git/` doesn't exist yet, with a clear message). Next-steps text updated to put `install-hooks.mjs` next to `git init`.
- `scripts/README.md`: install-hooks.mjs added to the table, validate.mjs / build-index.mjs entries cross-reference the hook.
- README.md: new sub-section "Credentials and snapshots — read this once" under §Compliance. Versioning section extended with v1.2.1/v1.2.2/v1.3.0/v1.4.0 entries.

DECISIONS:
- Hook shell: `#!/bin/sh` works on Linux/macOS native + Windows via Git Bash. PowerShell-direct hook would force users to install PowerShell-as-hook-runner, friction vs Git Bash that's already installed with Git for Windows.
- Bypass: `git commit --no-verify` left intentionally available. Rare-but-legitimate cases (mid-recovery, intentional partial commit) need an escape hatch. Documented as "use sparingly" in the hook + AGENTS.md.
- AI exclusion: triple-layer (file convention + AGENTS.md + copilot-instructions.md). VS Code per-user setting `github.copilot.advanced.fileFilters` mentioned but NOT enforced — not portable across clones. The portable substitute is the rule layer.
- Hook installs validate.mjs WITHOUT --strict-pii. PII heuristics produce false positives (e.g., credit-card-shaped digit density). Blocking commit on warnings would cost owner more friction than it'd save. Schema errors still hard-block.

BLOCKERS: none.

READINESS: still green. v1.4.0 closes two structural gaps (history hygiene + AI cred protection) that v1.3.0 punted on. Watch items unchanged from v1.3.0.

## 2026-05-21 15:50 — v1.5.0 Codex audit pass

STATE: Owner ran a Codex audit on top of v1.4.0. Codex scored 8.7/10 and found drift / behavior bugs that Gemini's earlier audit missed. Codex's 6 claims verified individually, 6/6 confirmed real; one Copilot schema deprecation the IDE itself flagged (`mode:` → `agent:` rename).

DID:
- **Copilot prompt schema sync.** Renamed `mode:` → `agent:` in all 12 `.github/prompts/*.prompt.md` files. Per VS Code official docs (verified via WebFetch), `mode` is no longer documented; the field is `agent` with values `ask | agent | plan | <custom-agent-name>`. Mapped `mode: ask` → `agent: ask`, `mode: edit` → `agent: agent` (writes files), `mode: agent` → `agent: agent`. The IDE warning the owner saw will now disappear.
- **Path drift sweep in prompts.** 13 references to pre-team-centric paths (`stories/INDEX.md`, `bugs/`, `test-cases/library/`, `inbox/INBOX.md`, `environments/users.md`) across 7 prompts (`session-start`, `session-end`, `story-intake`, `story-analyzer`, `ac-auditor`, `test-case-design`, `bug-report-formatter`, `question-generator`) corrected to `teams/<active>/...`. The v1.2.2 sync covered `copilot-instructions.md` but missed the prompt bodies — this pass closes that gap.
- **build-index --check is now truly read-only.** Added `checkOnly` parameter to `buildIndexForZone` and `buildTeamsIndex`. In check mode, no `fs.writeFile` is called; instead returns `would-update` / `would-create` status. Main loop renders these with `✓` / `+` markers and exits 1 if any zone reports drift. Smoke-verified in /tmp sandbox: induced drift was reported as `would-update`, exit 1, `git diff` baseline confirmed INDEX.md untouched. Old behavior wrote then failed, leaving unstaged changes in the working tree after a blocked commit — confusing and required `git add -A` again to retry.
- **validate.mjs PII exit code reconciled.** Old code: `exit(2)` on PII warnings without `--strict-pii`. Combined with `set -e` in the pre-commit hook, any PII-shaped pattern (credit-card-shaped digit density, JWT-shaped tokens) blocked the commit despite the docstring saying warnings don't fail. New code: `return` (exit 0) so the hook does not block on heuristic false positives. Schema errors still hard-block. `--strict-pii` still exits 1 when the engineer opts into stricter mode for a critical commit.
- **automation_status vocab unified.** Frontmatter instructions said `manual | automated | not-feasible`; playbooks and prompts said `auto-soon | auto-eventually | automated | manual-only`. Canonical vocab now `auto-soon | auto-eventually | automated | manual-only | not-feasible` — superset that captures intent-to-automate states the original 3-value enum missed. Updated: `.github/instructions/frontmatter.instructions.md`, `templates/test-case-library.md`, example-team test case (`tc-team-example-001-01-filter-by-date-range.md` → `manual-only`), `.github/prompts/test-case-design.prompt.md` (initial value guidance updated).
- **README header version sync.** Was stuck at v1.2.0; now reflects v1.5.0 with the layered summary of what shipped today. Versioning section extended.
- VERSION 1.4.0 → 1.5.0.

DECISIONS:
- `mode: edit` → `agent: agent` mapping: the new `agent` field has values `ask | agent | plan | <name>`. The closest match for "write a file" is `agent` (the catchall) since `edit` is no longer a valid value. The semantic ("writes to disk") survives.
- `manual` → `manual-only` migration on existing files: kept the example-team test case correct under new vocab. No backward compat shim needed — single-user template, no downstream consumers.
- PII fix direction (exit 0 instead of "don't run hook on PII"): owner's stance is "no creds in tracked .md", so PII heuristic is signal worth surfacing. Just shouldn't block on the noisy false positives (timestamp strings that look credit-card-shaped, hashes that look JWT-shaped). `--strict-pii` is the escape hatch for the engineer who wants the harder gate.
- Skipped two of Codex's recommendations: type-specific field validation in validate.mjs (priority/coverage/severity/automation_status) — broader refactor than scope of this pass, defer; per-prompt linter for path drift — addressed manually here, future passes will be caught by reading the prompts during edit.

BLOCKERS: none.

READINESS: still green. v1.5.0 closes the drift / behavior gaps Codex found. The template is now self-consistent: schema docs match scripts match prompts match example team. Smoke + dogfood: this commit will be validated by the pre-commit hook itself.
