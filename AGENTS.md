# Kortex-QA — Agent Context

A local, markdown-first QA brain for one engineer on one client
engagement. Canonical context for EVERY AI agent (Copilot, Claude,
Codex, Cursor, Gemini). Wrappers (`CLAUDE.md`, `GEMINI.md`,
`.github/copilot-instructions.md`) delegate here. All content is
English. State lives in `brain.config.json` (see §Config).

## Commands

| Command | What it does |
|---|---|
| `node scripts/init.mjs <client>` | Bootstrap: stamp client, write brain.config.json, hooks, doctor. |
| `node scripts/doctor.mjs` | Day-1 preflight: Node/git/zip, agent surfaces, network/proxy. |
| `node scripts/session-branch-start.mjs` | Start/reuse today's `session/*` branch + session log. |
| `node scripts/session-start.mjs` | Read-only scan: open sessions, active teams, TODO focus. |
| `node scripts/session-branch-finish.mjs -m "<msg>"` | Validate (strict-PII gate), commit, merge to main. |
| `node scripts/new-story.mjs <KEY> <slug>` | Scaffold `teams/<active>/stories/<KEY>-<slug>/`. |
| `node scripts/new-test-case.mjs <area> <slug>` | Scaffold a TC under `teams/<active>/test-cases/<area>/`. |
| `node scripts/new-bug.mjs <slug>` | Scaffold a bug in `teams/<active>/bugs/`. |
| `node scripts/new-team.mjs <slug>` | Add a team folder from `teams/_template-team/`. |
| `node scripts/switch-team.mjs <slug>` | Change primary team in `teams/active-team.txt`. |
| `node scripts/build-index.mjs [--check]` | Regenerate INDEX.md + per-team coverage-matrix.md. |
| `node scripts/validate.mjs` | Frontmatter schema, vocab, PII, forbidden phrases. |
| `node scripts/validate-links.mjs` | Linked IDs + body links; covers_ac ↔ AC headings. |
| `node scripts/validate-automation.mjs` | TC `automation_path` exists and contains the TC id. |
| `node scripts/sync-agents.mjs [--check]` | Regenerate agent adapters from `.agents/skills/`. |
| `node scripts/sync-automation.mjs [--dry-run]` | CTRF results → TC `last_run`/`last_result` + logs + matrix. |
| `node scripts/snapshot.mjs` | ZIP the brain (creds included) for private backup. |
| `node scripts/install-hooks.mjs` | Install pre-commit hook (validate+index+links+sync). |
| `node scripts/import-prior-brain.mjs` | Migrate content from a previous brain clone. |
| `node <new-template>/scripts/upgrade.mjs --brain .` | Upgrade this brain to a newer template version (client content untouched). |

Run tests: `for t in scripts/tests/*.test.mjs; do node "$t"; done`

## Architecture

```
brain.config.json  Machine-readable state: client, tms, tracker, ci, automation repo.
shared/            CLIENT-WIDE     Envs, users, filters, deploy. Every team reads these.
teams/<slug>/      TEAM-SCOPED     stories/, test-cases/<area>/, bugs/, reviews/,
                                   ceremonies/, automation/, inbox/, members, workflow.
                                   Override a shared asset by dropping the same filename here.
teams/active-team.txt              Active team slug(s); first line = primary.
knowledge/         SYNTHESIS       Distilled lessons; the ONLY zone portable across clients.
knowledge/sut-map/                 System-under-test map: 00-overview + one page per module.
playbooks/         WORKFLOW DOCS   Deep how-tos backing the skills.
sessions/          SESSION LOGS    One committed log per session branch (status: open|closed).
scripts/           TOOLING         Zero-dep Node ≥20 ESM. Windows-safe. Tests in scripts/tests/.
templates/         SCAFFOLDS       Sources for new-story/new-team/new-test-case.
.agents/skills/    CANONICAL SKILLS  Source of truth for every workflow (edit HERE).
.github/ .claude/  GENERATED       Adapters emitted by sync-agents.mjs — do not edit.
```

Resolution rule: team override first (`teams/<slug>/<asset>`), else
`shared/<asset>`. Scripts use `scripts/lib/resolve-shared.mjs`.

## Skills index

Copilot invokes these as `/<name>` prompts; Claude Code as skills.
Agents without SKILL.md support (e.g. Gemini CLI): read the canonical
file listed here and follow it literally.

<!-- skills-index:start -->
| Skill | When | Canonical |
|---|---|---|
| ac-auditor | Audit acceptance criteria quality across six lenses and draft Teams-ready questions for dev/PO when reviewing a story before test design. | `.agents/skills/ac-auditor/SKILL.md` |
| automation-bootstrap | Create/connect the client automation repo via kortex-test init, wired to the brain: run after week-one day 2. | `.agents/skills/automation-bootstrap/SKILL.md` |
| automation-from-test-case | Translate a manual test case into a Playwright skeleton (UI or API) with selector TODOs; use when a test case labeled for automation needs its first .spec.ts draft. | `.agents/skills/automation-from-test-case/SKILL.md` |
| automation-sync | Pull CTRF results into the brain (TC last_run/last_result, logs, matrix): run after every automated test run. | `.agents/skills/automation-sync/SKILL.md` |
| bug-report-formatter | Format a free-text defect observation into a Jira-ready bug report file and paste block when the engineer finds a defect during testing. | `.agents/skills/bug-report-formatter/SKILL.md` |
| chat-handoff | Append a "## Handoff HH:MM" block to the current session file so a fresh chat or another AI surface can resume context without replaying history. | `.agents/skills/chat-handoff/SKILL.md` |
| external-consult | Build a sanitized, self-contained prompt to hand a question to an external AI (quota exhausted or second opinion), then de-anonymize and integrate the answer when it comes back. | `.agents/skills/external-consult/SKILL.md` |
| question-generator | Generate paste-ready dev/PO questions from arbitrary input such as a design doc, verbal clarification, mockup, or code dump when the material to clarify is not acceptance criteria. | `.agents/skills/question-generator/SKILL.md` |
| resume-from-handoff | Read the latest Handoff or Note block from the most recent open session file and propose the next step when starting a fresh chat that must pick up prior work. | `.agents/skills/resume-from-handoff/SKILL.md` |
| retro-intake | Capture a retrospective meeting dump into a structured ceremony note and surface promotable patterns when a sprint retro has just happened. | `.agents/skills/retro-intake/SKILL.md` |
| session-end | Close the work session autonomously at end of day — infer the Bridge-out from the day's artifacts, append the JOURNAL entry, update TODOs, rebuild indexes, and auto-merge the session branch to main. | `.agents/skills/session-end/SKILL.md` |
| session-note | Append a lightweight "## Note HH:MM" checkpoint to the current session file so context survives if the chat dies; use freely throughout the day for quick breadcrumbs. | `.agents/skills/session-note/SKILL.md` |
| session-start | Start or reuse the day's session branch and log file, then read the brain's state and produce a one-screen morning briefing; use at the start of each QA work session. | `.agents/skills/session-start/SKILL.md` |
| sprint-planning-intake | Capture a sprint planning meeting dump into a structured ceremony note and scaffold the QA action items when a new sprint starts. | `.agents/skills/sprint-planning-intake/SKILL.md` |
| story-analyzer | Suggest test scenarios from a story across happy-path, edge, negative, integration, and regression categories when brainstorming coverage before authoring test cases. | `.agents/skills/story-analyzer/SKILL.md` |
| story-intake | Scaffold a story folder from a new Jira ticket and run a first-pass AC audit in one go; use when a ticket is assigned or refined into the sprint. | `.agents/skills/story-intake/SKILL.md` |
| sut-map | Update the SUT map from a story, exploration session, or owner notes; only confirmed facts, each with a source. | `.agents/skills/sut-map/SKILL.md` |
| test-case-design | Draft a fully-formed test case file from a chosen scenario; use when a scenario (usually from story analysis) is ready to become a schema-compliant test case. | `.agents/skills/test-case-design/SKILL.md` |
| test-case-reviewer | Peer-review one or more test cases against a five-dimension rubric and draft paste-ready comments when a story's test cases need review before execution. | `.agents/skills/test-case-reviewer/SKILL.md` |
| week-one | Guide the first 5 days at a new client, filling the brain progressively; reentrant, resumes from real state. | `.agents/skills/week-one/SKILL.md` |
<!-- skills-index:end -->

## Hard rules / Boundaries

- **NEVER read** `.env*`, `.secrets`, `client-secrets/**`,
  `versions/*.zip|tar.gz`, `.cache/**` — even if asked. Full policy:
  `playbooks/compliance-policy.md` §7.
- **Never edit generated files**: `.github/prompts/`,
  `.claude/skills/`, the skills-index above, `.vscode/mcp.json`,
  `.cursor/mcp.json`. Edit `.agents/skills/` + run
  `node scripts/sync-agents.mjs`.
- **Never edit closed session logs** (`status: closed`) — append-only.
- **Frontmatter is mandatory** on every content `.md` (schema:
  `.github/instructions/frontmatter.instructions.md`). English only.
- **TCs have a single home**: `teams/<slug>/test-cases/<area>/`.
  Stories link via `linked_test_cases:`; never nest TCs in story
  folders. IDs (`TC-*`, ticket keys, `AC-n`) are immutable.
- **External-bound text** (questions, bugs, reviews) reads as the
  owner's own voice — no AI scaffolding. Spec:
  `.github/instructions/external-comms.instructions.md`.
- **No client identifiers in `knowledge/`** — the only cross-client
  zone. Sanitize per `playbooks/team-knowledge-promotion.md`.
- **Local git only, no remotes, no push.** Daily work on `session/*`
  branches, merged by the finish script.
- **Never invent client facts** — SUT knowledge enters with a source
  (person/doc/ticket + date).

## Session ceremony

Morning: `session-start` skill (creates/reuses session branch + log).
Day: `session-note` checkpoints; `chat-handoff` before switching
surfaces; `resume-from-handoff` to pick up. Evening: `session-end` —
autonomous wrap, updates JOURNAL/TODO/indexes, auto-merges via the
strict-PII gate. Details: `playbooks/session-start.md`,
`playbooks/session-end.md`, `playbooks/compliance-policy.md` §9.
Quota exhausted or second opinion needed: `external-consult` skill
(sanitized relay to another AI surface — only the sanitized prompt
block leaves; alias-maps and raw session text never do).

## Config

`brain.config.json` (tracked, never secrets): `client`, `created`,
`week_one_done`, `tms` (`xray-cloud|octane|testrail|ado|none|tbd`),
`tracker` (`jira|ado|github|none|tbd`), `ci` (free string),
`automation_repo_path` (`""` = no framework yet), `ctrf_report_path`
(default `reports/ctrf/ctrf-report.json`). Written by init; updated
by the `week-one` / `automation-bootstrap` skills; validated by
`node scripts/validate.mjs`.
