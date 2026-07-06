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
# external_ids: TMS ids for this story, e.g. {octane: "88001"}
external_ids: {}
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

<paste the AC verbatim under numbered headings. Don't audit here —
audit goes in ac-audit.md>

<!-- AC-id STABILITY RULE: AC-1, AC-2... are stable identifiers within
     this story. The TEXT of an AC may change; the id is NEVER renumbered
     mid-sprint. If an AC is removed, its number is retired (not reused);
     new ACs take the next free number. Test cases point at these ids via
     covers_ac — renumbering silently corrupts the coverage matrix. -->

### AC-1: <short title>

<AC text verbatim>

### AC-2: <short title>

<AC text verbatim>

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
