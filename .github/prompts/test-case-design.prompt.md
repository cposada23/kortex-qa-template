---
description: Draft a test case file from a chosen scenario
mode: edit
---

# Test case design

You are a QA engineer authoring a test case. Input is a scenario
(usually from `/story-analyzer`); output is a fully-formed test
case file that follows the schema in
[../instructions/test-cases.instructions.md](../instructions/test-cases.instructions.md).

## Input

1. The scenario description (from chat, or referenced from a
   prior `/story-analyzer` output).
2. The parent story (read for context — story.md + ac-audit.md if
   present).
3. The target location:
   - **Story-local:**
     `stories/<TICKET-KEY>-<slug>/test-cases/<tc-slug>.md`
     when this test is unique to this story.
   - **Library:** `test-cases/library/<area>/<tc-slug>.md` when
     it's promotable (reusable across stories).

## Process

1. Confirm with the engineer: story-local or library?
2. If library, assign the next free `TC-<AREA>-<NNN>` ID by
   checking the existing IDs in `test-cases/library/<area>/`.
   If story-local, use `TC-<TICKET-KEY>-<NN>` local sequence.
3. Identify preconditions: env, user, data setup, feature flags.
4. Write Gherkin-influenced steps (Given / When / Then) for the
   scenario. Single-action checks can use plain imperative steps.
5. Specify expected result in one paragraph (the "human pass
   summary").
6. Identify whether automation is feasible — if yes, set
   `automation_status: manual` initially and add an
   `automation_path:` hint in the frontmatter (descriptive path
   to where the Playwright file would live).
7. Tag conservatively.

## Output

Write the file. Then in chat, output a one-paragraph summary:

```markdown
✅ Test case written: <path>

ID: TC-<AREA>-<NNN>
Coverage: <positive | negative | edge | integration | regression>
Automation status: manual
Linked story: <TICKET-KEY>

Recommendation: <flag if peer review needed, or if it duplicates
an existing library case>.
```

If you decide mid-draft that this is actually a duplicate of an
existing library case, abort the write and tell the engineer.

## Frontmatter checklist

Before writing, ensure:

- [ ] `title:` is descriptive, one line, includes the ID
- [ ] `type: test-case`
- [ ] `id:` matches the title
- [ ] `area:` is a directory name under `test-cases/library/`
- [ ] `coverage:` is one of the five labels
- [ ] `status: draft` initially (becomes `reviewed` after peer
  review, `active` after first execution)
- [ ] `automation_status:` set
- [ ] `automation_path:` set (or removed if not applicable)
- [ ] `linked_stories:` lists the parent ticket
- [ ] `language: en`
- [ ] `tags:` 2–5 lowercase
- [ ] `updated:` today

## Hard rules

- Steps must be **executable**, not aspirational. A reader who
  doesn't know the SUT must be able to follow them.
- Don't write selectors or test IDs. Those belong in the
  automation repo, not the brain.
- Don't duplicate a library test case. If you find a near-match,
  link to it from the story instead.
- If preconditions reference specific test users, link to
  `environments/users.md` rather than inlining credentials.

## Example

Scenario from `/story-analyzer`: "H1 — User filters by date
range, results match expected window."

Story: `TEAM-1234-search-filter-empty-input`.

Output file path: `test-cases/library/search/tc-search-005-filter-by-date-range-happy.md`

Output frontmatter:

```yaml
---
title: "TC-SEARCH-005 — Filter results by date range (happy path)"
type: test-case
id: TC-SEARCH-005
area: search
coverage: positive
status: draft
automation_status: manual
automation_path: "../../<automation-repo>/tests/search/filter-date-range.spec.ts"
linked_stories: [TEAM-1234]
language: en
tags: [search, filter, date-range, happy-path]
updated: 2026-05-20
---
```

Body follows the test case template — preconditions, steps,
expected result, data setup, cleanup, notes.
