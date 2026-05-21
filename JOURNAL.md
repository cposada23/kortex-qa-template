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
