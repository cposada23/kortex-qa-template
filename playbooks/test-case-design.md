---
title: "Playbook — Test case design"
type: playbook
status: active
language: en
tags: [playbook, test-design, coverage]
updated: 2026-05-20
---

# Playbook — Test case design

The workflow from "AC is clear and audited" to "test cases are
drafted and ready for peer review." ~30–90 minutes per story
depending on scope.

## When

After the AC audit closes — meaning `story.md` has
`ac_audit_status: done` and any blocker-severity findings have
been resolved with the dev/PO.

## Steps

### 1. Brainstorm scenarios

Invoke `/story-analyzer`. It reads the story and AC audit and
outputs scenarios grouped by:

- Happy path
- Edge cases
- Negative paths
- Integration
- Regression candidates (cross-referenced against
  `knowledge/patterns/` and `bugs/`)

Each scenario gets a severity hint (must-have / should-have /
nice-to-have) and a flag for whether it likely duplicates an
existing library test case.

### 2. Choose the v1 set

Don't author all suggested scenarios. The triage:

- **All must-haves** — yes, always.
- **Should-haves** — yes for medium+ priority stories, optional
  for low.
- **Nice-to-haves** — only if (a) the SUT area has a history of
  bugs, or (b) you have spare time before the dev finishes the
  feature.

Aim for **5–12 test cases** for a typical story. More than that
suggests the story is too big and should be split.

### 3. Decide: story-local or library?

For each chosen scenario:

- **Story-local** if the test is tightly coupled to this
  story's specific data or behavior.
- **Library** (`test-cases/library/<area>/`) if the test verifies
  a stable SUT invariant and could be reused.

When in doubt, start story-local. Promotion to library is easy
later; demotion is awkward.

### 4. Author each test case

Invoke `/test-case-design` per scenario. Provide:

- The scenario description (often "design H1" from the analyzer
  output)
- Story-local vs library destination
- Any specific data setup the engineer already knows is needed

The prompt:

- Generates a fully-formed test case file
- Assigns the next free TC-ID
- Drafts Gherkin-influenced steps
- Identifies automation feasibility

### 5. Peer review hand-off (team workflow)

After authoring, the team's "test case review" subtask gets
assigned to another QA. They review in their own brain at
`reviews/<TICKET-KEY>.md`. Their comments come back via Jira
or Teams DM.

Apply the feedback in place. Don't keep the old draft around as a
"strikethrough" — git history is the audit trail.

Once review is approved:

- Update each test case `status: draft → reviewed`
- Update `story.md` `status: design-done`

### 6. Execution planning

Decide execution mode for each test case:

- **Manual** — for `coverage: positive` happy paths, exploratory
  testing, and anything that's hard to automate (visual checks,
  multi-step user-perceived flows).
- **Automated** — for `coverage: regression`, `coverage:
  negative` with structured inputs, and any test that will be
  re-run across releases.
- **Mixed** — initial run manual, automation follow-up as a
  separate `AUTO-<NN>` story.

Set `automation_status:` accordingly.

## Coverage strategy

Each story should have at least:

- **1 happy path** verifying the main AC.
- **1–2 edge cases** at the boundaries the AC implies.
- **1 negative path** verifying graceful rejection.
- **1 integration check** if the story touches adjacent
  features.

A story with only happy paths is under-tested. A story with 20
test cases is over-tested (or too big). Find the sweet spot.

## When to reuse a library test case vs author new

Reuse when:

- The library test case verifies the same invariant.
- The AC of the new story implies that invariant must still hold.
- The library test case isn't `deprecated`.

Don't reuse when:

- The library test case is "close but not quite" — that's a
  signal to author a variant.
- The library test case is too generic and would pass even if
  this story's specific behavior is broken.

## Naming conventions

File: `tc-<area>-<NNN>-<descriptive-slug>.md` (e.g.
`tc-search-005-filter-by-date-range-happy.md`).

ID inside frontmatter: `TC-<AREA>-<NNN>` (uppercase, padded).

Story-local can use `TC-<TICKET-KEY>-<NN>` local sequence (e.g.
`TC-TEAM-1234-01`).

## Hard rules

- A test case must be **executable by someone who doesn't know
  this story**. If a peer can't follow the steps cold, the test
  case is incomplete.
- Don't write selectors, test IDs, or implementation details in
  the brain. Those belong in the automation repo.
- Don't author test cases for AC that's still in audit. Wait for
  the audit to close.
- If the AC changed after test cases were written, re-audit and
  re-evaluate the affected test cases. Don't quietly let them
  drift.
