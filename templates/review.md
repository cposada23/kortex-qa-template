---
title: "{{TICKET_KEY}} — test case review"
type: review
reviewing_ticket: {{TICKET_KEY}}
review_outcome: in-progress
reviewed_at: {{UPDATED}}
status: in-progress
language: en
tags: [review]
updated: {{UPDATED}}
---

# {{TICKET_KEY}} — test case review

## Scope of review

<paths in the SUT repo, Jira test management plugin links, or
the engineer's brain location reviewed>

## Findings

### Coverage

- Does each AC line have at least one corresponding test case?
  - AC #1: ✅ / ❌ <reasoning>
  - AC #2: ...
- Are negative paths covered?
- Are edge cases / boundaries covered?

### Clarity

- Can a peer follow the steps without context?
- Are expected results unambiguous?
- Is the data setup explicit?

### Redundancy

- Does any test case duplicate an existing library case?
- Are there test cases that could be merged?

### Automation feasibility

- Which test cases are good automation candidates?
- Which should stay manual? Why?

### Schema compliance

- Are frontmatter fields correct?
- Is the TC-ID assigned correctly?
- Are linked stories listed?

## Outcome

<approved | changes-requested | rejected>

### One-paragraph rationale

...

## Comments to deliver

> **Paste-ready. First person. Peer tone. No AI scaffolding.**

1. TC-... step N — <specific comment>
2. ...
