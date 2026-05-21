---
title: "Playbook — Test case design"
type: playbook
status: active
language: en
tags: [playbook, test-design, coverage]
updated: 2026-05-21
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
existing test case in the same area.

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

### 3. Single home — pick the area

As of v1.6, **every test case lives in exactly one place**:
`teams/<team>/test-cases/<area>/`. There is no `library/`
subfolder and no story-local copy. The TC's `linked_stories:`
frontmatter array is the canonical many-to-many link to one or
more stories that exercise it.

For each chosen scenario, pick the `<area>` it belongs to (e.g.
`auth`, `search`, `billing`, `reports`). The area folder is just
the SUT's functional surface — keep it consistent across stories
that touch the same surface. When in doubt, look at sibling TCs
in `teams/<team>/test-cases/` and reuse an existing area name
before inventing a new one.

If the same SUT invariant is exercised by a second story later,
**do not duplicate the TC**. Append the new story's Jira key to
the existing TC's `linked_stories:` array. One TC, many stories.

### 4. Author each test case

Invoke `/test-case-design` per scenario, or use the CLI:

```bash
node scripts/new-test-case.mjs <area> <slug> --link-story <TICKET>
```

The `--link-story <TICKET>` flag is the new v1.6 wiring. When
provided, the script:

1. Creates the TC at `teams/<team>/test-cases/<area>/tc-<area>-<NNN>-<slug>.md`
   with `linked_stories: [<TICKET>]` already populated.
2. Reads the matching `teams/<team>/stories/<TICKET>-*/story.md`,
   appends the new TC's ID to its `linked_test_cases:`
   frontmatter array, and adds a markdown link under the
   story's "## Test cases" body section (creating the section
   if missing).

Both sides of the link are updated in a single command — no more
manual cross-referencing.

If you skip `--link-story`, the TC lands as a standalone artifact
with `linked_stories: []`. Wire it later by editing both
frontmatter arrays and `node scripts/validate-links.mjs` will
flag any mismatch.

The prompt and the CLI both:

- Generate a fully-formed test case file
- Assign the next free TC-ID (`TC-<AREA>-<NNN>`, immutable once set)
- Draft Gherkin-influenced steps
- Identify automation feasibility

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

## When to reuse an existing TC vs author new

Before authoring, scan `teams/<team>/test-cases/<area>/` for a TC
that already covers the scenario. Single-home means there's only
one place to look.

Reuse when:

- The existing TC verifies the same invariant.
- The AC of the new story implies that invariant must still hold.
- The TC isn't `status: retired`.

To reuse, append the new story's Jira key to the TC's
`linked_stories:` array and add a markdown link to the new
story's "## Test cases" body section. Both sides updated, no
file duplication.

Don't reuse when:

- The existing TC is "close but not quite" — that's a signal to
  author a variant, not to widen the original.
- The existing TC is too generic and would pass even if this
  story's specific behavior is broken.

## Naming conventions

File: `tc-<area>-<NNN>-<descriptive-slug>.md` (e.g.
`tc-search-005-filter-by-date-range-happy.md`).

ID inside frontmatter: `TC-<AREA>-<NNN>` (uppercase, padded).
**Immutable once assigned** — renaming the file does not change
the ID, and the ID is what `linked_test_cases:` references.

The TC's path always lives at `teams/<team>/test-cases/<area>/`.
No story-local IDs, no library subfolder.

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
