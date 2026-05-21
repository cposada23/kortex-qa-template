---
description: Story folder structure and authoring rules
applyTo: "teams/**/stories/**/*.md"
---

# Stories — authoring rules

## Folder shape per story

```
teams/<active>/stories/<TICKET-KEY>-<slug>/
├── story.md           REQUIRED — captures the Jira ticket
├── ac-audit.md        REQUIRED — AC quality audit + Teams-ready questions
├── questions.md       OPTIONAL — free-form parked questions
└── execution-log.md   REQUIRED — test run records
```

`<TICKET-KEY>` is the Jira key verbatim (uppercase, hyphenated
number). `<slug>` is 2–6 kebab-case words.

TCs live at `teams/<active>/test-cases/<area>/`; the story
references them via `linked_test_cases:` frontmatter + a
`## Test cases` body section with markdown links. Bugs are
referenced similarly via `linked_bugs:` frontmatter + a
`## Bugs found` body section.

## `story.md` shape

```markdown
---
title: "<one-line ticket title>"
type: story
ticket: <TICKET-KEY>
sprint: <sprint-id>
priority: low | medium | high | critical
status: backlog | in-progress | design-done | review-done | execution-done | closed | blocked | cancelled
ac_audit_status: pending | done
test_cases_count: 0
bugs_found: 0
linked_test_cases: []
language: en
tags: [story, <area>, ...]
updated: YYYY-MM-DD
---

# <Title>

## Jira link
<paste the URL here>

## Summary
<one paragraph from the ticket, in the team's voice>

## Acceptance criteria
<paste the AC verbatim — auditing happens in ac-audit.md, not here>

## Out of scope
<what the ticket explicitly excludes, if stated>

## Dependencies
<other tickets, infra, etc.>

## Notes
<engineer's running notes during the work>
```

## `ac-audit.md` shape

```markdown
---
title: "<TICKET-KEY> — AC audit"
type: reference
status: pending | done
language: en
tags: [ac-audit, <area>]
updated: YYYY-MM-DD
---

# <TICKET-KEY> — AC audit

## Findings

### Ambiguity
- ...

### Missing constraints
- ...

### Untestable phrasing
- ...

### Hidden assumptions
- ...

### Missing negative paths
- ...

## Risks
<the bigger risks the audit surfaces>

## Questions for dev/PO

> **These will be pasted into Teams or Jira. Write them in first
> person as the engineer. No AI scaffolding language.**

1. ...
2. ...
```

## `execution-log.md` shape

```markdown
---
title: "<TICKET-KEY> — execution log"
type: reference
status: in-progress | done
language: en
tags: [execution, <area>]
updated: YYYY-MM-DD
---

# <TICKET-KEY> — execution log

## Run YYYY-MM-DD HH:MM — <env>

**Env:** local | dev | qa
**User:** <test user email>
**Result:** pass | fail | blocked

### Test cases executed
- TC-... — pass / fail / skipped (note)

### Observations
- ...

### Bugs filed
- [BUG-NNN-slug](../../bugs/BUG-NNN-slug.md) — _Jira: TEAM-XXXX_

---

## Run YYYY-MM-DD HH:MM — <env>
...
```

## Hard rules

1. Never modify Jira AC after capture (re-audit instead, append to
   ac-audit.md as an "Update" section).
2. The "Questions for dev/PO" section is **externally-visible
   content**. Tone rules apply
   (see [external-comms.instructions.md](external-comms.instructions.md)).
3. Story status moves forward only, except `blocked` which can
   apply from any state and clears when unblocked.
4. When a story closes, mark `status: closed` and update
   `bugs_found:` and `test_cases_count:`. Archival (moving to a
   separate folder) is deferred to v1.1 — for now, closed
   stories stay in place.
