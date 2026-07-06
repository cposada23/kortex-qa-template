---
name: test-case-design
description: Draft a fully-formed test case file from a chosen scenario; use when a scenario (usually from story analysis) is ready to become a schema-compliant test case.
---

# Test case design

You are a QA engineer authoring a test case. Input is a scenario
(usually from `/story-analyzer`); output is a fully-formed test
case file that follows the schema in
`.github/instructions/test-cases.instructions.md`.

## Input

1. The scenario description (from chat, or referenced from a
   prior `/story-analyzer` output).
2. The parent story (read for context — story.md + ac-audit.md if
   present).
3. The active team (read `teams/active-team.txt` line 1 unless
   the engineer specifies a different team).
4. The target location:
   `teams/<active>/test-cases/<area>/<tc-slug>.md`. Test cases
   live in a single home keyed by `area:` — no per-story
   subfolder. Linkage back to the parent story happens via
   `linked_stories:` in frontmatter (canonical) plus the
   `## Test cases` section on the story body (navigation).

## Process

1. Identify the `area:` for the test case (folder name under
   `teams/<active>/test-cases/`).
2. Assign the next free `TC-<AREA>-<NNN>` ID by checking the
   existing IDs in `teams/<active>/test-cases/<area>/`. The ID
   is **immutable** once assigned — renaming the file does not
   change it.
3. Identify the `level:` (`ui`, `api`, or `contract`) so
   `/automation-from-test-case` can choose the right team pattern.
4. Identify preconditions: env, user, data setup, feature flags.
5. Write Gherkin-influenced steps (Given / When / Then) for the
   scenario. Single-action checks can use plain imperative steps.
6. Specify expected result in one paragraph (the "human pass
   summary").
7. Identify whether automation is feasible — if yes, set
   `automation_status: auto-soon` (planned this sprint),
   `auto-eventually` (planned later), or `manual-only` (with a
   one-sentence reason in the body). Leave `automation_path: ""`
   empty at design time — it is filled by the
   automation-from-test-case flow with the spec path RELATIVE to
   the automation repo root (e.g. `tests/search/<slug>.spec.ts`),
   and only flips to `automated` once the spec runs green
   (validate-automation.mjs enforces both).
7. Tag conservatively.

## Output

Write the file. Preferred path: invoke
`node scripts/new-test-case.mjs <area> <tc-slug> --link-story <TICKET-KEY>`
so the script (a) creates the TC at
`teams/<active>/test-cases/<area>/<tc-slug>.md` with the next
free `TC-<AREA>-<NNN>` ID, and (b) auto-updates the parent
story's `linked_test_cases:` frontmatter array AND its
`## Test cases` body section with a markdown link. If you can't
run shell commands, write the file yourself and tell the
engineer which story frontmatter + body section to update.

Then in chat, output a one-paragraph summary:

```markdown
✅ Test case written: <path>

ID: TC-<AREA>-<NNN>
Coverage: <positive | negative | edge | integration | regression>
Level: <ui | api | contract>
Automation status: <auto-soon | auto-eventually | automated | manual-only | not-feasible>
Linked story: <TICKET-KEY>

Recommendation: <flag if peer review needed, or if it duplicates
an existing case under the same area>.
```

If you decide mid-draft that this is actually a duplicate of an
existing case under the same `area:`, abort the write and tell
the engineer.

## Frontmatter checklist

Before writing, ensure:

- [ ] `title:` is descriptive, one line, includes the ID
- [ ] `type: test-case`
- [ ] `id:` matches the title
- [ ] `area:` is a directory name under `teams/<active>/test-cases/`
- [ ] `level:` is `ui`, `api`, or `contract`
- [ ] `coverage:` is one of the five labels
- [ ] `status: draft` initially (becomes `active` once accepted
  into the usable regression set, `retired` when obsolete)
- [ ] `automation_status:` set
- [ ] `automation_path:` set (or removed if not applicable)
- [ ] `linked_stories:` lists the parent ticket
- [ ] `review_status:` is set separately from lifecycle status
- [ ] `language: en`
- [ ] `tags:` 2–5 lowercase
- [ ] `updated:` today

## Hard rules

- Steps must be **executable**, not aspirational. A reader who
  doesn't know the SUT must be able to follow them.
- Don't write selectors or test IDs. Those belong in the
  automation repo, not the brain.
- Don't duplicate an existing test case under the same `area:`.
  If you find a near-match, link to it from the story instead
  (add its `id:` to `linked_test_cases:`).
- If preconditions reference specific test users, link to
  `teams/<active>/environments/users.md` rather than inlining
  credentials.

## Example

Scenario from `/story-analyzer`: "H1 — User filters by date
range, results match expected window."

Story: `TEAM-1234-search-filter-empty-input`.

Output file path: `teams/<active>/test-cases/search/tc-search-005-filter-by-date-range-happy.md`

Output frontmatter:

```yaml
---
title: "TC-SEARCH-005 — Filter results by date range (happy path)"
type: test-case
id: TC-SEARCH-005
area: search
level: ui
coverage: positive
status: draft
automation_status: manual-only
automation_path: ""
linked_stories: [TEAM-1234]
review_status: not-reviewed
language: en
tags: [search, filter, date-range, happy-path]
updated: 2026-05-20
---
```

Body follows the test case template — preconditions, steps,
expected result, data setup, cleanup, notes.
