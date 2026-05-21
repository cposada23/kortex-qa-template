---
title: "Team — workflow"
type: reference
status: active
language: en
tags: [team, jira, workflow, dor, dod]
updated: 2026-05-20
---

# Team — workflow

> Replace placeholders after init. The point of this file is to
> codify how the team *actually* moves work — not the idealized
> Jira config.

## Jira board structure

- **Board name:** _<...>_
- **Project key:** _<...>_
- **Issue types used:** _<Story, Task, Bug, Spike>_
- **QA subtasks:** typically _Test case design_, _Test case
  review_, _Test case execution_. Confirm with the lead.

## Columns / states

| Column | Meaning | Who moves it |
|---|---|---|
| Backlog | Not started | PO |
| Ready for Dev | Refined, AC accepted | PO/Tech Lead |
| In Progress | Dev working | Dev |
| Ready for QA | Dev complete, deployed | Dev → PR merged |
| In QA | Engineer testing | QA |
| Ready for UAT / Demo | QA passed | QA |
| Done | Released or signed off | PO |

## Definition of Ready (DoR)

A story is "ready for dev" when:

- [ ] Title clearly describes the change
- [ ] AC are unambiguous (audited via `/ac-auditor`)
- [ ] Designs/specs linked if UI
- [ ] Dependencies identified
- [ ] Effort estimated

## Definition of Done (DoD)

A story is "done" when:

- [ ] Code merged
- [ ] Deployed to QA env
- [ ] All planned test cases executed
- [ ] No P0/P1 bugs open
- [ ] Demo'd (if review required)
- [ ] Documentation updated (if user-facing)

## QA subtask conventions

When a story has the three QA subtasks:

1. **Test case design** — owner of the subtask designs in their
   own brain (`stories/<TICKET>/test-cases/`). Final cases are
   reflected in the team's test management plugin (Xray/Zephyr/
   TestRail/...) as the system of record.
2. **Test case review** — assigned to a different QA. Their work
   goes in *their* brain at `reviews/<TICKET>.md`. Comments are
   posted on the Jira subtask.
3. **Test case execution** — by whoever the lead assigns. Results
   in `stories/<TICKET>/execution-log.md`. Bug links also there.

Automation work is usually a separate story (`AUTO-<NN>`).

## Branch & PR conventions (for SUT and automation repos)

- **SUT repo:** _<branch prefix convention, e.g. `feature/<jira>-<slug>`>_
- **Automation repo:** _<branch prefix, PR template, reviewers>_

## Escalation paths

- Blocked on dev clarification > 2 days → ping Tech Lead in Teams
- Recurring AC quality issues → flag in retro, log in
  `knowledge/patterns/`
- Environment outage → check `environments/<env>.md` first; escalate
  to DevOps if unblocked > 1 hour
