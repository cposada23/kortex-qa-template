---
title: "TEAM-EXAMPLE-001 — execution log"
type: reference
status: pending
language: en
tags: [execution, search, example]
updated: 2026-05-20
---

# TEAM-EXAMPLE-001 — execution log

## Run 2026-05-20 14:30 — qa

**Env:** qa
**User:** qa+qa+user@example.client.internal
**Build / commit:** 2026-05-20.1
**Result:** fail

### Test cases executed

| TC ID | Result | Notes |
|---|---|---|
| TC-TEAM-EXAMPLE-001-01 | fail | empty-state CTA does not reset both dates |

### Observations

- The happy path filter (start: 2026-04-01, end: 2026-05-20) works.
- When the filter produces zero results, the empty state appears
  correctly with the "Clear filter" text — but clicking it only
  resets the end date, leaving the start date in place.
- See BUG-001.

### Bugs filed

- [BUG-001 — empty-state Clear filter CTA only resets end date](../../bugs/BUG-001-empty-state-clear-cta-partial-reset.md) — _Jira: TEAM-EXAMPLE-9001_

---

<!-- new run blocks below -->
