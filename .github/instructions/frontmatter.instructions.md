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
- Any file under `templates/` (those carry frontmatter, but it
  templates the *new* file's frontmatter — see below)

## Base schema

```yaml
---
title: "<page title>"
type: story | test-case | bug | review | ceremony | knowledge | playbook | reference | template | index | journal | inbox
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
ticket: TEAM-1234              # Jira key
sprint: 2026-S20               # sprint identifier
priority: low | medium | high | critical
status: backlog | in-progress | design-done | review-done | execution-done | closed | blocked | cancelled
ac_audit_status: pending | done
test_cases_count: 0
bugs_found: 0
linked_test_cases: []          # paths to test-case files
```

### `type: test-case`

```yaml
id: TC-AUTH-001                # TC-<AREA>-<NNN>
area: auth | billing | search | ...
coverage: positive | negative | edge | integration | regression
status: draft | reviewed | active | deprecated
automation_status: manual | automated | not-feasible
automation_path: ../../<automation-repo>/tests/...   # descriptive
linked_stories: [TEAM-1234]
```

### `type: bug`

```yaml
id: BUG-001
severity: low | medium | high | critical
status: open | assigned | fixed | verified | closed | wontfix | duplicate
jira_key: TEAM-9001            # when filed
linked_story: TEAM-1234
linked_test_case: TC-AUTH-001  # optional
environment: local | dev | qa | prod-readonly
```

### `type: review`

```yaml
reviewing_ticket: TEAM-1234
review_outcome: approved | changes-requested | rejected
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
(`ac-audit.md`, `execution-log.md`, `bugs.md`).

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

## Validation

`node scripts/validate.mjs` walks the tree and reports
violations. Run before commit; scaffold scripts run it
automatically after creating files.
