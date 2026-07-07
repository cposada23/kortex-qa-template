# playbooks/ — Long-form workflow docs

Long-form workflows. Prompts in `.github/prompts/` are short and
invokable; these playbooks are detailed reference for cold reading
(returning after a vacation, onboarding a peer, debugging a
workflow that isn't working).

## Full playbook set (v1.8)

### Lifecycle (cradle to grave)

- **[day-1-runbook.md](day-1-runbook.md)** — **the copy-paste
  path for a brand-new client**: clone → init → first commit →
  open with your agent → week-one → first stories → first TCs →
  (optional) automation loop → close the day. Every command
  verified end-to-end 2026-07-06.
- **[client-bootstrap.md](client-bootstrap.md)** — **start here on
  a new laptop.** Day-0 IT checklist (proxy/VPN/permitted CLIs),
  clone → init → first team → first story → importing from a
  previous brain (4 scenarios)
- **[week-one.md](week-one.md)** — the first 5 days at a new
  client: access & people → tool inventory → environments & data →
  SUT map seeding → first real story + exit check
- **[client-rotation.md](client-rotation.md)** —
  **compliance-critical** off-boarding (one clone = one client;
  rotation = wipe + new clone)
- **[upgrade-template.md](upgrade-template.md)** — bring an
  initialized brain up to a newer template version without losing
  client content (`upgrade.mjs` runs FROM the new template copy;
  framework zones overwritten, client zones never touched,
  migrations chained, orphans reported)

### Daily loop

- **[day-in-the-life.md](day-in-the-life.md)** — end-to-end
  narrative + 15-minute happy path + 5 "Days that aren't typical"
  variations
- **[session-start.md](session-start.md)** — morning ritual
- **[session-end.md](session-end.md)** — end-of-day wrap

### Work-specific

- **[story-intake.md](story-intake.md)** — new Jira ticket workflow
- **[ac-audit.md](ac-audit.md)** — wraparound for `/ac-auditor`
  (when to run, how to triage findings, common AC smells)
- **[test-case-design.md](test-case-design.md)** — coverage
  strategy and authoring
- **[test-case-peer-review.md](test-case-peer-review.md)** —
  wraparound for `/test-case-reviewer` (when to start a review,
  how to deliver feedback, calibrating your eye over time)
- **[automation-flow.md](automation-flow.md)** — when to automate
  vs stay manual, staging the work in Jira, linking the brain to
  the automation repo, anti-patterns cheat sheet

### Multi-team / cross-cutting

- **[team-onboarding.md](team-onboarding.md)** — scaffold + activate
  a second or third team after the first is working
- **[team-knowledge-promotion.md](team-knowledge-promotion.md)** —
  when team-local content graduates to global `knowledge/`

### Infrastructure

- **[version-snapshot.md](version-snapshot.md)** — ZIP cadence,
  VERSION bump rules, storage targets, retention windows, restore
  procedure
- **[import-prior-brain.md](import-prior-brain.md)** — bulk-migrate
  a prior markdown-based brain (Obsidian, plain folder, etc.) into
  the v1.6 structure using `scripts/import-prior-brain.mjs` with
  confidence scoring + staging

## Relationship to `.github/prompts/`

Each playbook that has a matching prompt names that prompt in the
"Relationship to /<prompt>" section at the top. The playbook is
the reference; the prompt is the trigger. Read the playbook
when you want to understand the workflow; invoke the prompt when
you want to *do* the workflow.

| Playbook | Prompt |
|---|---|
| ac-audit.md | `/ac-auditor` |
| story-intake.md | `/story-intake` |
| test-case-design.md | `/test-case-design` (+ `/story-analyzer` upstream) |
| test-case-peer-review.md | `/test-case-reviewer` |
| automation-flow.md | `/automation-from-test-case` |
| session-start.md | `/session-start` (branch + session log creation, pop-last-session) |
| session-end.md | `/session-end` (autonomous close, auto-merge) |
| week-one.md | `/week-one` (reentrant 5-day onboarding at a new client) |
| (no matching playbook yet) | `/sprint-planning-intake`, `/retro-intake`, `/question-generator`, `/bug-report-formatter`, `/session-note`, `/chat-handoff`, `/resume-from-handoff`, `/sut-map` |

The session-lifecycle prompts now revolve around the **per-session
log** at `sessions/<id>.md` (keyed by the session branch, committed
to history). `/session-note` and `/chat-handoff` append `## Note`
and `## Handoff` blocks to it during the day; `/session-end` reads
those blocks to write an autonomous Bridge-out and consolidate the
branch. The `CHAT-HANDOFF.md` file is retired — there is no
gitignored handoff file anymore. Full detail is in the
session-start / session-end playbooks above.

The remaining prompts without a dedicated playbook are intentional
— each is self-contained enough that the prompt body is the
documentation. If real usage reveals nuances that don't fit in
the prompt, promote a playbook later.

## Promotion to `knowledge/playwright/` or `knowledge/patterns/`

When a playbook section becomes a generic insight that applies
across clients, distill it into `knowledge/`. The playbook here
stays as the workflow guide; the `knowledge/` page is the
portable lesson.

## See also

- [../AGENTS.md](../AGENTS.md)
