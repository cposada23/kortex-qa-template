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
