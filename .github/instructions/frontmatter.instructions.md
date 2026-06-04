---
description: Frontmatter schema enforcement for every .md file in the brain
applyTo: "**/*.md"
---

# Frontmatter — enforcement

Every `.md` file in this repository **except** the following carries
YAML frontmatter at the top:

- `README.md` (any depth)
- `AGENTS.md` (any depth)
- `INDEX.md` (any depth)
- `INBOX.md` (any depth)
- `JOURNAL.md`
- `TODO.md`
- Any file under `.github/`
- Any file under `sessions/` (per-session logs — schema-light;
  carry minimal session frontmatter, see `type: session` below)
- Any file under `templates/` (those carry frontmatter, but it
  templates the *new* file's frontmatter — see below)

## Base schema

```yaml
---
title: "<page title>"
type: story | test-case | bug | review | ceremony | knowledge | playbook | reference | template | index | journal | inbox | session
status: "<type-specific>"
language: en
tags: [tag1, tag2, ...]
updated: YYYY-MM-DD
---
```

All values are required. `language: en` is invariant in this
template (English-only content for cross-client portability).

## Type-specific additions

### `type: story`

```yaml
ticket: TEAM-1234                       # Jira key, also serves as the story's canonical ID
sprint: 2026-S20                        # sprint identifier
priority: low | medium | high | critical
status: backlog | in-progress | design-done | review-done | execution-done | closed | blocked | cancelled
ac_audit_status: pending | done
linked_test_cases: [TC-AUTH-001, TC-SEARCH-007]    # canonical IDs (immutable), many-to-many
linked_bugs: [BUG-001, BUG-007]                    # canonical IDs, many-to-many
review_status: not-reviewed | requested | in-review | changes-requested | approved
```

### `type: test-case`

```yaml
id: TC-AUTH-001                # TC-<AREA>-<NNN> — IMMUTABLE once assigned
area: auth | billing | search | ...     # folder name under teams/<team>/test-cases/
level: ui | api | contract              # primary automation/test surface
coverage: positive | negative | edge | integration | regression
status: draft | active | retired         # lifecycle: born draft, ships active, eventually retired
automation_status: auto-soon | auto-eventually | automated | manual-only | not-feasible
automation_path: ../../<automation-repo>/tests/...   # descriptive
linked_stories: [TEAM-1234]              # immutable Jira keys, many-to-many
review_status: not-reviewed | requested | in-review | changes-requested | approved
```

### `type: bug`

```yaml
id: BUG-001                              # BUG-<NNN> — IMMUTABLE once assigned
severity: low | medium | high | critical
status: open | assigned | fixed | verified | closed | wontfix | duplicate
jira_key: TEAM-9001                      # when filed
linked_stories: []                       # empty if exploratory; many-to-many otherwise
linked_test_case: TC-AUTH-001            # optional, the TC that uncovered the bug
environment: local | dev | qa | prod-readonly
```

### `type: review`

```yaml
reviewing_ticket: TEAM-1234
review_outcome: in-progress | approved | changes-requested | rejected
reviewed_at: YYYY-MM-DD
status: in-progress | done
```

### `type: ceremony`

```yaml
ceremony_type: sprint-planning | daily-standup | review | retrospective
date: YYYY-MM-DD
```

### `type: knowledge`

```yaml
# (no extra required fields; the body matters)
```

### `type: playbook`

```yaml
status: active | stub | deprecated
```

### `type: reference`

A catch-all type for files that don't fit a more specific
type — environment docs, team docs, story sidecar files
(`ac-audit.md`, `execution-log.md`).

```yaml
status: active | pending | done | archived
```

### `type: index`

```yaml
# Index files have type: index. updated: stays current, status omitted.
```

### `type: journal` and `type: inbox`

Schema-light — minimal frontmatter is OK on these. The JOURNAL.md
and inbox files at zone root are exempted entirely (see top of
this file).

### `type: session`

Per-session logs at `sessions/<id>.md`, one per session branch
(`session/<id>` → `sessions/<id>.md`). Schema-light, like
JOURNAL.md — created and maintained by the session scripts, not by
hand. Minimal frontmatter:

```yaml
title: "Session <id>"
type: session
status: open | closed        # open while the session runs; closed by /session-end
language: en
tags: [session]
updated: YYYY-MM-DD           # the session start date
branch: session/<id>
```

`validate.mjs` accepts `type: session` with `status: open | closed`
and validates the `sessions/` directory. These files are
**not** indexed by `build-index` (operational log, like JOURNAL.md).

## When generating new files

1. Pick the right `type:` from the list above. Do not invent new
   types. If a file doesn't fit, ask the user before forcing a
   type.
2. Include all required fields.
3. Use today's date (UTC) for `updated:`.
4. Tag conservatively — 2 to 5 tags, lowercase, kebab-case for
   multi-word.

## When editing existing files

- If `updated:` is older than today, bump it.
- Preserve the type. Changing a file's type requires moving it
  (e.g. a `test-case` doesn't become a `playbook` in place).

## Immutable IDs (v1.6+)

Test cases (`id: TC-<AREA>-<NNN>`), bugs (`id: BUG-<NNN>`), and
stories (the Jira key, e.g. `TEAM-1234`) all carry IDs that
**never change once assigned**. Renaming a file does not change
its ID.

The `linked_test_cases`, `linked_bugs`, `linked_stories`, and
`linked_story` / `linked_test_case` fields use IDs (not paths) as
their canonical reference. Story bodies and test case bodies
use markdown links for human navigation; `validate-links.mjs`
(run by the pre-commit hook) checks both stay coherent.

If a TC's `id:` must change (extremely rare — only for repair),
update every `linked_test_cases` array referencing the old ID
across the team. `validate-links.mjs` will flag every break
until you fix them.

## Validation

`node scripts/validate.mjs` walks the tree and reports
frontmatter violations.

`node scripts/validate-links.mjs` (v1.6+) verifies ID-based and
markdown-link integrity across `teams/`. Both run automatically
via the pre-commit hook installed by `scripts/install-hooks.mjs`.

Scaffold scripts run `validate.mjs` automatically after creating
files. Run both manually before snapshotting.
