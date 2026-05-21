---
title: "{{TITLE}}"
type: story
ticket: {{TICKET_KEY}}
sprint: "{{SPRINT}}"
priority: {{PRIORITY}}
status: backlog
ac_audit_status: pending
linked_test_cases: []
linked_bugs: []
review_status: not-reviewed
language: en
tags: [story]
updated: {{UPDATED}}
---

# {{TICKET_KEY}} — {{TITLE}}

## Jira link

<paste the Jira URL here>

## Summary

<one paragraph from the ticket, in the team's voice>

## Acceptance criteria

<paste the AC verbatim. Don't audit here — audit goes in ac-audit.md>

```
AC #1: ...
AC #2: ...
```

## Out of scope

<what the ticket explicitly excludes, if stated>

## Dependencies

- Other tickets:
- Infra / env:
- Designs / specs:

## Test cases

_(populated as you author TCs — use `node scripts/new-test-case.mjs <area> <slug> --link-story {{TICKET_KEY}}`)_

## Bugs found

_(populated as bugs are filed — use `node scripts/new-bug.mjs <slug> --link-story {{TICKET_KEY}}`)_

## Notes

<engineer's running notes during the work. Append, don't rewrite.>
