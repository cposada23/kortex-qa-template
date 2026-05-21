# playbooks/ — Long-form workflow docs

Long-form workflows. Prompts in `.github/prompts/` are short and
invokable; these playbooks are detailed reference for cold reading
(returning after a vacation, onboarding a peer, debugging a
workflow that isn't working).

## Full playbook set (v1.2)

- **[day-in-the-life.md](day-in-the-life.md)** — **start here.**
  End-to-end narrative + 15-minute happy path
- **[session-start.md](session-start.md)** — morning ritual
- **[session-end.md](session-end.md)** — end-of-day wrap
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
- **[version-snapshot.md](version-snapshot.md)** — ZIP cadence,
  VERSION bump rules, storage targets, retention windows, restore
  procedure
- **[team-onboarding.md](team-onboarding.md)** — scaffold + activate
  a new team folder
- **[team-knowledge-promotion.md](team-knowledge-promotion.md)** —
  when team-local content graduates to global `knowledge/`
- **[client-rotation.md](client-rotation.md)** —
  **compliance-critical** off-boarding (one clone = one client;
  rotation = wipe + new clone)

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
| session-start.md | `/session-start` |
| session-end.md | `/session-end` |
| (no matching playbook yet) | `/sprint-planning-intake`, `/retro-intake`, `/question-generator`, `/bug-report-formatter` |

The four prompts without a dedicated playbook are intentional —
each is self-contained enough that the prompt body is the
documentation. If real usage reveals nuances that don't fit in
the prompt, promote a playbook later.

## Promotion to `knowledge/playwright/` or `knowledge/patterns/`

When a playbook section becomes a generic insight that applies
across clients, distill it into `knowledge/`. The playbook here
stays as the workflow guide; the `knowledge/` page is the
portable lesson.

## See also

- [../AGENTS.md](../AGENTS.md)
