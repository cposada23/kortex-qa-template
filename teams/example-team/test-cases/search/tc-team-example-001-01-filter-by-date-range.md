---
title: TC-TEAM-EXAMPLE-001-01 — Filter reports by date range (happy path)
type: test-case
id: TC-TEAM-EXAMPLE-001-01
area: search
level: ui
coverage: positive
status: active
automation_status: manual-only
automation_path: ../../<automation-repo>/tests/search/filter-by-date-range.spec.ts
linked_stories: [TEAM-EXAMPLE-001]
language: en
tags: [search, filter, date-range, happy-path, example]
updated: 2026-05-20
review_status: not-reviewed
---

# TC-TEAM-EXAMPLE-001-01 — Filter reports by date range (happy path)

## Objective

Verify that selecting a start and end date restricts the result
list to reports whose `created_at` is within the inclusive range.

## Preconditions

- **Env:** qa
- **User:** `qa+qa+user@example.client.internal` (standard role,
  has report-read permissions)
- **Data:** At least 10 reports in the dataset, spread across the
  last 90 days. Filter `created_at >= "<30 days ago>"` returns
  at least 5 reports (see [../../../../shared/filters.md](../../../../shared/filters.md)).
- **Other:** the search-results-v2 feature flag is ON for the
  test user (default on QA).

## Steps

1. Given the user is logged in and on the Reports / Search page.
2. When the user opens the date-range filter (visible above the
   result list).
3. And the user selects start date = `<30 days ago>` and end
   date = `today`.
4. Then the result list reloads and shows only reports whose
   `created_at` falls within `[<30 days ago>, today]` inclusive.
5. And the visible count matches the expected count (compare
   against the filter from [filters.md](../../../../shared/filters.md)).
6. And the result list is sorted by `created_at desc` (newest
   first).

## Expected result

The result list shows the correct subset of reports, no more and
no fewer, sorted descending by creation date. Boundary reports
(created exactly on the start or end date) are included.

## Data setup

If the QA dataset doesn't have enough recent reports, run the
seed:

```
<placeholder for seed command — replace per client>
```

## Cleanup

None required — filtering is a read-only operation.

## Notes

- This is an **example test case** shipped with the template.
- For the boundary edge cases (start = end, start > end), see
  TC-TEAM-EXAMPLE-001-02 / 03 (not shipped in v1.0 example).
- See related bug [BUG-001](../../bugs/BUG-001-empty-state-clear-cta-partial-reset.md)
  for the empty-state CTA issue surfaced during this run.
