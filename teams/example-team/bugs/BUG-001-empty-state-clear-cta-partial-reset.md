---
title: "BUG-001 — empty-state Clear filter CTA only resets end date"
type: bug
id: BUG-001
severity: medium
status: open
jira_key: "TEAM-EXAMPLE-9001"
linked_stories: [TEAM-EXAMPLE-001]
linked_test_case: TC-TEAM-EXAMPLE-001-01
environment: qa
language: en
tags: [bug, search, filter, ux, example]
updated: 2026-05-20
---

# BUG-001 — empty-state Clear filter CTA only resets end date

## Environment

- **Env:** qa
- **URL:** `https://qa.example.client.internal/reports/search`
- **User:** qa+qa+user@example.client.internal
- **Browser:** Chrome 125.0
- **OS:** macOS 14.5
- **Build / commit:** 2026-05-20.1

## Pre-conditions

1. Logged in as the standard QA test user.
2. Reports dataset has 5+ recent reports (per QA-env seed).
3. On the Reports / Search page.

## Steps to reproduce

1. Open the date-range filter.
2. Set start date = `<3 days from now>` and end date = `<today>`
   (a range guaranteed to return zero results because no
   reports were created in the future).
3. Click "Apply" or wait for the auto-applied filter to render.
4. Confirm the result list shows the empty state with "No
   matches found" and a "Clear filter" CTA.
5. Click "Clear filter".

## Expected result

Both date inputs reset to empty, the filter chip clears, and the
full unfiltered result list reappears.

## Actual result

The end date clears (now empty), but the start date remains
populated. The filter is still active (showing zero results),
and the empty state with "Clear filter" CTA is still visible.
The user has to click "Clear filter" a second time to fully
reset.

## Workaround

Click "Clear filter" twice. Or manually clear the start date
field after the first click.

## Notes

- Likely cause: the `onClear` handler in the empty-state CTA
  binds to the end date input but not the start.
- Affects AC #5 of TEAM-EXAMPLE-001.
- This is an **example bug** shipped with the template to
  demonstrate the file format and cross-linking pattern.
- Pairs with [BUG-001 in Jira](https://example.client.internal/jira/TEAM-EXAMPLE-9001)
  (placeholder URL).
