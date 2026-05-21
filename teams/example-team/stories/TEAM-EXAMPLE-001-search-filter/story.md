---
title: "Search filter — restrict results by date range"
type: story
ticket: TEAM-EXAMPLE-001
sprint: "2026-S20"
priority: medium
status: in-progress
ac_audit_status: done
test_cases_count: 1
bugs_found: 1
linked_test_cases:
  - test-cases/tc-team-example-001-01-filter-by-date-range.md
language: en
tags: [story, search, filter, date-range, example]
updated: 2026-05-20
---

# TEAM-EXAMPLE-001 — Search filter: restrict results by date range

## Jira link

`https://example.client.internal/jira/TEAM-EXAMPLE-001` (placeholder)

## Summary

Users can already perform a free-text search across reports.
This story adds a **date-range filter** so users can restrict
results to reports created within a chosen window. The filter
appears as two date pickers above the result list, with a "Clear
filter" CTA when active.

## Acceptance criteria

```
AC #1: A user can select a start date and an end date.
AC #2: When both dates are set, the result list shows only
       reports whose `created_at` falls within the inclusive
       range [start, end].
AC #3: When only a start date is set, the upper bound defaults
       to today.
AC #4: When only an end date is set, the lower bound defaults to
       30 days before that end date.
AC #5: When the filter is active and produces zero results, the
       result area shows the empty state with a "Clear filter"
       CTA that resets both dates.
AC #6: The filter state persists across page refreshes within the
       same session.
```

## Out of scope

- Saving filter presets for future sessions
- Time-of-day granularity (date only, midnight to midnight)
- Other filter dimensions (status, owner, type)

## Dependencies

- Other tickets: none
- Infra / env: requires the search-results-v2 endpoint, deployed
  on dev as of 2026-05-15
- Designs / specs: Figma board "search-v2 / 2026-Q2"

## Notes

This is an **example story** shipped with the template to
demonstrate the end-to-end flow. Replace with a real ticket after
running `node scripts/init.mjs <your-client-slug>`. Do not treat
the URLs, dates, or AC as real client data.
