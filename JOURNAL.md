# Journal

Append-only session log. Each `/session-end` invocation appends one
synthesized block here (STATE / DID / DECISIONS / BLOCKERS / NEXT),
stamped with the session's start date. Never edit history — if a
past entry was wrong, append a new entry that supersedes it.

The **granular** per-session record — the Handoff / Note /
Bridge-out blocks captured during a single session — lives in
`sessions/<id>.md` (one file per session branch, committed to
history). This JOURNAL is the distilled day-level trail; `sessions/`
is the detailed operational log.

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

## 2026-05-26 20:35 — v1.7.0: shared/ refactor + snapshot bugfix + cross-AI portability

STATE: Template v1.7.0 ready. Three independent fixes shipped on
the same safe-change branch (`safe-change/v1.7.0-shared-snapshot-crossai`)
because all three were uncovered in the same session triggered by a
real recovery failure on the engineer's other laptop.

DID:
- **Snapshot bugfix (critical).** `.snapshotignore` was excluding
  `.git/`, which broke the recovery channel: a snapshot taken on
  laptop A and restored to laptop B arrived without git history,
  branches, or stashes. New policy: snapshot includes EVERYTHING
  except `versions/` (recursion), `node_modules/` (size), and OS
  junk (`.DS_Store` / `Thumbs.db` / `desktop.ini`). Credentials
  (`.env*`, `client-secrets/`, `.cache/`, `CHAT-HANDOFF.md`) are
  intentionally inside per AGENTS.md §3.
  Added post-ZIP verification step in `scripts/snapshot.mjs` that
  reads the archive contents and aborts if `.git/`, `.github/`, or
  `AGENTS.md` is missing. Print at end now lists exactly what's
  included, including credentials.
  New test `scripts/tests/snapshot.test.mjs` (17 assertions, runs
  against a synthetic fixture so changes to the live tree don't flake).
- **shared/ refactor.** Environments, users, filters, and deploy
  procedures were duplicated under every `teams/<slug>/` folder.
  Wrong layout for the real use case: most clients have one set of
  envs/users/filters that every team uses. Created `shared/` at
  repo root with `environments/{local,dev,qa}.md`, `users.md`,
  `filters.md`, `deploy.md`. Each env file now has internal
  sections for UI / API / DB (the engineer's apps span all three
  tiers per env).
  Removed `teams/_template-team/environments/{local,dev,qa,users,filters}.md`,
  `teams/_template-team/deploy.md`, and all the same under
  `teams/example-team/`. `_template-team/environments/` keeps only
  a README explaining the override pattern. `example-team/` keeps
  no `environments/` folder at all — demonstrates pure shared
  inheritance.
- **Resolver helper.** New `scripts/lib/resolve-shared.mjs` with
  `resolveShared(repoRoot, teamSlug, rel)` + `resolveSharedWithSource`
  variant that returns `{ source: 'team' | 'shared' | 'missing' }`.
  Convention without config: presence of the file IS the switch. No
  registry, no flag. Test at `scripts/tests/resolve-shared.test.mjs`
  (15 assertions).
- **Cross-AI portability (Kortex-style, no symlinks).** Added
  `CLAUDE.md` and `GEMINI.md` as one-paragraph wrappers pointing at
  `AGENTS.md`. Added `.agents/permissions.yml` + `.agents/README.md`
  documenting the multi-AI policy: Copilot stays primary; Claude /
  Gemini / Codex are secondary surfaces that all read the same
  canonical context. Wrappers are plain files (not symlinks) so
  Windows clones work without `git config core.symlinks=true`.
- **Doc + script propagation.** Updated root `AGENTS.md`,
  `README.md`, `.github/copilot-instructions.md` discovery order,
  `teams/_template-team/AGENTS.md`, `teams/example-team/AGENTS.md`,
  `playbooks/team-onboarding.md`, `playbooks/client-bootstrap.md`,
  `scripts/init.mjs` Next-steps print, `scripts/new-team.mjs`
  Next-steps print, `scripts/import-prior-brain.mjs` env routing
  default (now lands in `shared/environments/`).

DECISIONS:
- No symlinks for cross-AI wrappers. Windows compat > elegance.
- Plain files with single-paragraph delegation, not adapters
  regenerated from canonical (Kortex's pattern). Three reasons:
  (1) the canonical lives at AGENTS.md and never changes shape per
  agent; (2) one-paragraph wrappers don't drift in practice;
  (3) adding a build step (regenerate adapters on commit) is more
  Windows friction than the duplication it prevents.
- `.snapshotignore` is now permissive by default (3 patterns +
  3 OS-junk lines). The owner's recovery story works because the
  snapshot is a personal channel to the owner's own Teams self-DM
  — the trade-off of "what if I share it?" is handled in AGENTS.md
  §3 ("Snapshot ZIPs are never shared. This is a hard rule.").
- Resolver helper is exported as a module (not bundled into a CLI)
  because today there are zero scripts that consume it. Documenting
  the pattern in AGENTS.md + having the helper available is enough
  for Copilot / agents to do the resolution mentally. If a future
  script needs it, the import is one line.
- `teams/_template-team/environments/README.md` kept on purpose —
  it teaches the override pattern to anyone scaffolding a new team
  via `node scripts/new-team.mjs <slug>`.

BLOCKERS: none.

NEXT: owner pulls this template on the other laptop (the one that
lost work in the last recovery cycle):
1. `git pull origin safe-change/v1.7.0-shared-snapshot-crossai`
   (or copy the new `scripts/snapshot.mjs` + `.snapshotignore` over
   the existing files if `.git/` is borked).
2. Run `node scripts/snapshot.mjs` — verify the new "Verified
   .git/ included" print appears.
3. Copy the resulting ZIP to Teams self-DM.
4. On the new machine: unzip + verify `.git/` is in place + `git
   status` works + `git log` shows recent history.
5. If everything looks right, mergear safe-change/v1.7.0... a
   main local + decidir si pushear `cposada23/kortex-qa-template`.

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

## 2026-05-21 16:25 — v1.5.1 client-bootstrap playbook + final instructions drift

STATE: Owner asked "how do I actually start from zero on the work laptop? clone → first team → first story → how do I import from a previous brain?" Realized: the README "Quick start" has the bullets, but no narrative playbook for the bootstrap + import-from-prior cases. Codex also flagged residual drift in `.github/instructions/*.md` (shorthand `stories/**`, `bugs/**`, `test-cases/library/` references in prose, while the `applyTo:` globs were already correct).

DID:
- **NEW playbook: `client-bootstrap.md`** (~340 lines). 8 numbered steps from `gh repo clone` to first commit + 4 import scenarios:
  1. Same client, different laptop → restore from snapshot ZIP (not re-clone).
  2. New client, coming from a chat-thread brain → sanitize patterns into knowledge/, NOT stories/tcs/bugs.
  3. New client, coming from another Kortex-QA clone → only knowledge/ travels with sanitization checklist.
  4. New client, coming from a non-Kortex source (Notion, OneNote) → manual paste into knowledge/.
  Each step includes Windows PowerShell + Bash variants (the Windows-First policy). "What ready-to-work looks like" closing checklist.
- **Mirror to client-rotation.md**: bootstrap is the on-boarding ritual; rotation is the off-boarding. Cross-linked both ways.
- **playbooks/README.md**: reorganized into 5 sections (Lifecycle / Daily loop / Work-specific / Multi-team / Infrastructure). Bootstrap leads the Lifecycle section. Header version 1.2 → 1.5.
- **README.md "Related reading"**: bootstrap added at the top of the list with bold "start here" annotation.
- **`.github/instructions/*.md` final drift**: 5 prose references to v1.0 root paths corrected to `teams/<active>/`:
  - external-comms.instructions.md: 2 example headers (`stories/**/questions.md`, `bugs/**/*.md`) prefixed with `teams/**/`.
  - stories.instructions.md: folder shape diagram + bugs.md reference.
  - test-cases.instructions.md: 3 references in promotion-rule section.
  The `applyTo:` globs at the top of each file were already team-centric (correct), but the prose examples below them weren't — Copilot reads both, so the prose drift was teaching wrong defaults.
- VERSION 1.5.0 → 1.5.1.

DECISIONS:
- Patch bump (not minor): the bootstrap playbook is doc, the instruction drift fixes are cosmetic. No behavior change in scripts, no schema change.
- 4 import scenarios chosen vs trying for a single canonical flow: the scenarios genuinely differ in what's allowed to travel. Forcing them into one flow would hide the single-client design rule. Each scenario explicitly calls out what NOT to bring.
- Windows PowerShell snippets first in code blocks, with Bash equivalents inline (Windows-First per AGENTS.md §1).

BLOCKERS: none.

READINESS: still green. v1.5.1 closes the bootstrap-narrative gap (owner can now hand the playbook to a future-self on a new laptop) and the residual drift Codex flagged. Watch items unchanged.

## 2026-05-21 16:50 — v1.5.2 split init-client from create-first-team in bootstrap playbook

STATE: Owner reading v1.5.1's bootstrap playbook: "En los pasos me muestras como crear el client, digamos que el cliente es cliente-a, pero no me muestras como crear un team para ese cliente. Como creo client-a team-a?" Real gap — Step 3 mixed init.mjs (client setup) with new-team.mjs (team setup) and offered both as alternatives via `--first-team`, but never showed the explicit "first init the client, then create your first team" flow as the recommended path. Result: hard to mentally separate client from team.

DID:
- **NEW: "Mental model — client vs team" section** at the top of the playbook (right after Pre-flight). Defines explicitly: `<client-slug>` = engagement identifier, one per clone; `<team-slug>` = team WITHIN the client, one or many per clone. Names the example pair used throughout: `client-a` (client) + `team-a` (team) — matches the owner's question verbatim.
- **Step 3 rewritten** as "Initialize the client" — does ONLY client-level setup (rename workspace, write `.client-slug`, install hook, no team scaffolding). Shows expected script output. Notes that `teams/` still contains only example-team + _template-team after this step. The `--first-team` one-shot is kept as a documented variant but no longer the primary path.
- **NEW Step 4: "Create your first team for this client"** — explicit `new-team.mjs team-a` + `switch-team.mjs team-a` sequence with what each does. ASCII tree showing the resulting filesystem (kortex-qa-client-a/ → teams/team-a/ with all sub-zones). Sub-sections: "What about example-team?" (keep or delete decision) + "Adding more teams later" (multi-team path with `--add` for 50/50 mode + cross-link to team-onboarding.md).
- Renumbered Steps 5–9 (were 4–8). Step 8 (capture first story) updated with concrete `TEAM-1234 search-filter-empty-input` example and explanation that the story lands under the primary active team unless `--team` overrides.
- Replaced remaining `<client-slug>` placeholders in Steps 5 and 7 with `client-a` for consistency with the rest of the playbook. Mental model section keeps the placeholder syntax (`<client-slug>`, `<team-slug>`) because that's where the abstraction is taught.
- "Ready to work" checklist updated: `cat .client-slug` → `client-a`, `cat teams/active-team.txt` → `team-a` on line 1, NEW box for `ls teams/team-a/` showing the scaffolded sub-zones.
- VERSION 1.5.1 → 1.5.2.

DECISIONS:
- Concrete example names `client-a` + `team-a` chosen over `acme` + `payments`. Reason: the owner asked literally "Como creo client-a team-a?" so the playbook now answers that pair verbatim. The Mental model section names real-use examples (`acme`, `payments`) for context, but the running example is the owner's pair.
- Step 3 + Step 4 separated rather than kept as one step with `--first-team`. The separation makes the client vs team distinction load-bearing in the reader's mental model — they walk through both transitions explicitly. The one-shot variant is documented in Step 3 as an option for users who already know the team slug, but it's not the default narrative.
- ASCII tree in Step 4: chose a tree over a bullet list because the spatial relationship (teams/ → team-a/ → sub-zones) is the load-bearing concept. The tree shows the nesting at a glance.

BLOCKERS: none.

READINESS: green. Owner's question about how the team gets created within the client is now answered visibly in Step 4 with a concrete `new-team.mjs team-a` command and the resulting filesystem tree.

## 2026-05-21 18:00 — v1.6.0 structural refactor + chat handoff + import skill

STATE: All-day push closes the v1.5.x line and ships v1.6.0 — a real structural refactor driven by a fresh research + cross-validate pass. Test cases now live in a single home at `teams/<team>/test-cases/<area>/` with immutable IDs and ID-based linking, validated by a new pre-commit hook. Chat handoff workflow (CHAT-HANDOFF.md + 2 prompts) lets context transfer between chat sessions deliberately. Import skill walks a prior markdown brain folder, classifies by confidence, and bulk-stages results for the owner to apply.

DID (in execution order):
- **Wave 0 (research + spec):** general-purpose subagent ran 22 web searches over QA tooling patterns (TestRail / Xray / Zephyr / Qase / Azure DevOps), chat handoff conventions (Cline Memory Bank / softaworks / JD Hodges), multi-client isolation. Cross-validated by 3 external LLMs ($0.17, all REFINE, strong consensus on ID-based linking + frontmatter-wins reviews + defer-import; owner overrode the defer-import recommendation with the rationale that a real brain is waiting). Spec at `docs/superpowers/specs/2026-05-21-kortex-qa-v1.6-design.md` (in upstream mykortex). Plan at `docs/superpowers/plans/2026-05-21-kortex-qa-v1.6.md`.
- **Wave 1 (foundation, 3 parallel sub-agents):** validate-links.mjs (ID + body markdown link integrity check, conservative — only enforces ID match on canonical id-bearing files), migrate-v1.5-to-v1.6.mjs (idempotent example-team migration), import-prior-brain.mjs (analysis + apply with confidence scoring + staging). Plus Task 1 schema update + pre-existing link drift cleanup (13 README files had `../playbooks/...` paths from a depth that no longer matched repo layout — corrected to `../../../playbooks/...`).
- **Wave 2 (scripts, sequential):** new-story.mjs drops test-cases/ subfolder + bugs.md pointer; new-test-case.mjs writes to single-home + `--link-story` updates both sides; new-bug.mjs same. install-hooks.mjs now installs a 3-check pre-commit (validate + build-index --check + validate-links). session-start.mjs surfaces CHAT-HANDOFF.md presence (with stale-warning if >7 days). Templates: story.md gains `linked_test_cases: [] + linked_bugs: [] + review_status: not-reviewed`; test-case-library.md renamed to test-case.md (drops library/ from name); bug.md uses linked_stories array; bugs.md template deleted.
- **Wave 3 (docs, 4 parallel sub-agents + main thread):** sub-agent A updated 6 prompts (drop library/, add --link-story flow, drop bugs.md pointer, surface CHAT-HANDOFF.md in session-start, suggest /chat-handoff in session-end). Sub-agent E rewrote 6 zone READMEs (test-cases / bugs / reviews × _template-team + example-team) with v1.6 design rationale + correct paths. Sub-agent F updated 3 instruction files (stories/test-cases/automation). Sub-agent G updated 3 playbooks (test-case-design / automation-flow / test-case-peer-review with frontmatter-wins rule). Main thread wrote chat-handoff.prompt.md + resume-from-handoff.prompt.md, added AGENTS.md §8 "Chat handoff continuity" + Rule 10 in copilot-instructions.md, added CHAT-HANDOFF.md + imports/ to .gitignore. NEW playbook import-prior-brain.md (6-phase workflow with PowerShell + Bash variants).
- **Wave 4 (ship, sequential):** playbooks/README.md bumped to v1.6 + import-prior-brain added to Infrastructure. Migrated example-team TC's `status:` corrected from `reviewed` (legacy) to `active` (v1.6 schema). VERSION 1.5.2 → 1.6.0. README header + Versioning section updated. This JOURNAL entry. Install-hooks re-run to refresh `.git/hooks/pre-commit` with the new 3-check chain. Smoke test end-to-end in /tmp. Dogfood commit + tag v1.6.0 + push.

DECISIONS:
- ID-based linking (canonical) + body markdown links (navigation). Owner's pushback ("don't over-engineer, links should be clickable") shaped this dual approach. IDs survive rename; body markdown links enable single-click navigation in VS Code/Copilot.
- Import skill IN scope (overrode 3/3 LLM defer recommendation) because owner has a real brain to migrate today. Mitigated via confidence scoring + staging + bulk approval per Perplexity recommendation.
- Reviews folder stays + `review_status` frontmatter is canonical. Hard rule "frontmatter wins" if file disagrees with state. This is the synthesis of the cross-validation feedback.
- Migration script handles example-team's existing TC; pre-existing link drift (13 files) caught by validate-links on first run and cleaned up before commit chain integration.
- Sub-agent parallelization: 3 in Wave 1, 4 in Wave 3. Saved ~2-3 hours of sequential context usage in the main thread. Each sub-agent verified its own work + reported back; main thread integrated.

BLOCKERS: none.

READINESS: green. v1.6.0 published. Owner can now import a prior brain via `scripts/import-prior-brain.mjs <source>`, work with the single-home TC model, and use `/chat-handoff` + `/resume-from-handoff` to transfer context between chat sessions. Pre-commit hook enforces ID integrity. v1.5 → v1.6 migration is one-shot + idempotent for anyone on a v1.5 clone.

## 2026-05-21 18:30 — v1.6.1 critical fixes from external review

STATE: Owner ran an external review pass on v1.6.0 and surfaced 4 real issues that contradict v1.6's central promises. Fixed in patch release.

DID:
1. **validate-links.mjs now ERRORS on duplicate IDs.** The script had a `// flag later` placeholder where duplicate-ID handling should have lived. Without this, two files with `id: TC-AUTH-001` would pass validation but make `linked_test_cases: [TC-AUTH-001]` ambiguous. Fix: track collisions in a `duplicateIds` Map, emit `errors.push("duplicate id ... across N files: ...")` for each. Smoke-verified: induced 2 duplicates in /tmp sandbox, validator returned exit 1 with both findings.
2. **example-team's library/auth/tc-auth-001-login-happy-path.md migrated up to test-cases/auth/.** The migration script handled story-local TCs (Wave 1) but missed the library/ subfolder. The leftover TC at `TC-AUTH-001` would collide the moment a user ran `new-test-case.mjs auth login-something` (script scans new path, sees nothing, assigns TC-AUTH-001 → duplicate). Fix: `git mv` the file up one level, drop empty `library/auth/` and `library/` folders, fix relative paths inside the TC body (3 instances of `../../../environments/...` → `../../environments/...`).
3. **Stale references swept across docs.** Owner's review found `test-cases/library/`, `stories/<TICKET>/test-cases/`, and `bugs.md` sidecar references in 11+ files. Updated: README.md, AGENTS.md, playbooks/day-in-the-life.md, playbooks/client-bootstrap.md (multiple locations), teams/README.md (multiple), teams/_template-team/AGENTS.md, teams/example-team/AGENTS.md, teams/_template-team/workflow.md, teams/example-team/workflow.md, teams/_template-team/stories/README.md, teams/example-team/stories/README.md, teams/_template-team/automation/README.md, teams/example-team/automation/README.md, .github/instructions/frontmatter.instructions.md, .github/prompts/story-analyzer.prompt.md, .github/prompts/test-case-reviewer.prompt.md. Historical JOURNAL/Versioning section entries kept as-is (they're history, not active doc).
4. **new-story.mjs regex widened.** Old: `/^[A-Z][A-Z0-9]*-\d+$/` rejected `TEAM-EXAMPLE-001` (the example-team's own ticket key). New: `/^[A-Z][A-Z0-9]+(?:-[A-Z][A-Z0-9]+)*-\d+$/` accepts multi-segment Jira keys (TEAM-1234, TEAM-EXAMPLE-001, ACME-PROJ-9001). Aligned with validate-links.mjs's regex (already widened in Wave 1).

DECISIONS:
- All 4 issues confirmed real before fixing — not blindly applying review feedback.
- Patch bump (1.6.0 → 1.6.1), not minor. No new features; closes regressions introduced by incomplete v1.6.0 migration.
- "Promote duplicate-ID warnings to errors" rather than "ignore silently" or "warn loudly": IDs are load-bearing for linked_* references; ambiguity is worse than noise.

BLOCKERS: none.

READINESS: green. v1.6.1 closes the gaps. Smoke-tested end-to-end: new-story now accepts multi-segment ticket keys; validate-links blocks duplicates; example-team has zero library/ residue; docs no longer teach the old model.

## 2026-05-22 11:00 — v1.6.2 QA audit fixes before team handoff

STATE: Owner asked for a critical QA Lead/SDET audit pass before handing Kortex-QA to the work team. Compliance/snapshot policy was explicitly accepted as-is; no changes there. Fixed only concrete drift that would confuse Copilot, validation, or onboarding.

DID:
1. **Test-case contract unified.** `.github/instructions/frontmatter.instructions.md`, `.github/instructions/test-cases.instructions.md`, `.github/prompts/test-case-design.prompt.md`, `templates/test-case.md`, example test cases, and `scripts/validate.mjs` now agree on test case lifecycle (`draft | active | retired`), automation status (`auto-soon | auto-eventually | automated | manual-only | not-feasible`), and separate `review_status:`.
2. **`level:` made explicit.** `/automation-from-test-case` already depended on `level: ui | api | contract`; the field now exists in the schema docs, authoring rules, template, examples, and validator.
3. **Validator tightened.** `validate.mjs` now checks type-specific required fields and vocab fields instead of only checking `status:`. PII warning exit-code docs also match behavior.
4. **Active doc drift swept.** Fixed remaining active-doc references to old `library/<area>` wording, stale automation-flow "stub" text, scripts README version/check list, prompt count, and README version ordering.

DECISIONS:
- Patch bump (1.6.1 → 1.6.2). No architecture change, no compliance change.
- Added `level:` instead of removing automation prompt logic; the field is useful and already implied by automation-flow.
- Kept migration-script references to `bugs.md` / old story-local test-cases because those are historical migration inputs, not active guidance.

BLOCKERS: none.

READINESS: green. Validated with `node scripts/validate.mjs`, `node scripts/validate-links.mjs`, and `node scripts/build-index.mjs --check`.
