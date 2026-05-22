---
description: Test case shape and quality rules
applyTo: "teams/**/test-cases/**/*.md"
---

# Test cases — authoring rules

## File shape

```markdown
---
title: "TC-<AREA>-<NNN> — <one-line scenario summary>"
type: test-case
id: TC-<AREA>-<NNN>
area: <area-slug>
level: ui | api | contract
coverage: positive | negative | edge | integration | regression
status: draft | active | retired
automation_status: auto-soon | auto-eventually | automated | manual-only | not-feasible
automation_path: "../../<automation-repo>/tests/<area>/<file>.spec.ts"
linked_stories: [<TICKET-KEY>, ...]
review_status: not-reviewed | requested | in-review | changes-requested | approved
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

## Level label semantics

- `ui` — browser/user-interface flow.
- `api` — API-level behavior, service contract exercised through
  requests.
- `contract` — explicit consumer/provider contract or schema
  compatibility check.

The `level:` field drives `/automation-from-test-case`: UI tests
use the team's page-object/fixture pattern; API and contract tests
use the team's API/client pattern.

## ID assignment

`TC-<AREA>-<NNN>` where:

- `<AREA>` is uppercase (`AUTH`, `BILLING`, `SEARCH`, ...).
- `<NNN>` is zero-padded sequential per area.

Test cases are born at `teams/<active>/test-cases/<area>/` with
`status: draft` and graduate via the lifecycle
(`draft → active → retired`). Peer review is tracked separately
through `review_status:` so lifecycle state and review state don't
fight each other. There is no separate "library" location — the
canonical home is the single one above.

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
