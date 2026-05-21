---
description: Test case shape and quality rules
applyTo: "teams/**/stories/**/test-cases/**/*.md, teams/**/test-cases/**/*.md"
---

# Test cases — authoring rules

## File shape

```markdown
---
title: "TC-<AREA>-<NNN> — <one-line scenario summary>"
type: test-case
id: TC-<AREA>-<NNN>
area: <area-slug>
coverage: positive | negative | edge | integration | regression
status: draft | reviewed | active | deprecated
automation_status: manual | automated | not-feasible
automation_path: "../../<automation-repo>/tests/<area>/<file>.spec.ts"
linked_stories: [<TICKET-KEY>, ...]
language: en
tags: [<area>, <coverage>, ...]
updated: YYYY-MM-DD
---

# <Title>

## Objective
What this test verifies (one sentence).

## Preconditions
- Env: local | dev | qa
- User: <test user persona or specific email>
- Data: <required SUT state — link to environments/filters.md if applicable>
- Other: <feature flags, prior actions, etc.>

## Steps
1. Given <starting state>
2. When <action>
3. Then <expected outcome>
4. And <additional checks>

## Expected result (summary)
One-paragraph human-readable summary of what "pass" looks like.

## Data setup
Optional — exact data to create / API calls / SQL to seed.

## Cleanup
Optional — what to undo so the next run starts clean.

## Notes
Optional — caveats, flakiness history, related test cases.
```

## Step style

Use Gherkin-influenced phrasing (Given / When / Then) for clarity,
but don't force it:

- **Single-action checks** can use plain imperative steps.
- **Multi-state scenarios** benefit from explicit Given / When /
  Then.
- **And / But** clauses are fine when a step has multiple
  related parts.

## Coverage label semantics

- `positive` — happy path, expected inputs.
- `negative` — invalid inputs, expected to be rejected gracefully.
- `edge` — boundary values, unusual but legitimate inputs.
- `integration` — exercises multiple components or services.
- `regression` — protects against a known historical bug.

A test case has one primary coverage label. If it serves multiple,
pick the one that best describes the *intent* and use tags for
secondary aspects.

## ID assignment

`TC-<AREA>-<NNN>` where:

- `<AREA>` is uppercase (`AUTH`, `BILLING`, `SEARCH`, ...).
- `<NNN>` is zero-padded sequential per area.

For story-local test cases (inside
`teams/<active>/stories/<TICKET>/test-cases/`), the ID can be
local — `TC-<TICKET>-<NN>` works too. When promoting to
`teams/<active>/test-cases/library/<area>/`, re-assign to the
area's sequence.

## Promotion rule

Promote a story-local test case to
`teams/<active>/test-cases/library/<area>/` when:

1. It's needed by a second story.
2. It verifies a stable SUT invariant.
3. It's a high-value regression check.

Don't promote one-offs.

## Linking automation

`automation_path:` is **descriptive only** — the brain doesn't
validate the path exists in the automation repo. Update it
when the automation file moves.

## When updating an existing test case

- Bump `updated:`.
- If the test now covers different behavior, change the title and
  consider whether it should be a new test case instead.
- If a step was wrong, fix it. Don't add a `~~struck~~` line —
  the git history is the audit trail.
