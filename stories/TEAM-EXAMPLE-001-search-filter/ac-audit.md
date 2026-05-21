---
title: "TEAM-EXAMPLE-001 — AC audit"
type: reference
status: done
language: en
tags: [ac-audit, search, example]
updated: 2026-05-20
---

# TEAM-EXAMPLE-001 — AC audit

## Audit 2026-05-20

### Findings

#### Ambiguity

- **AC #2 — "inclusive range":** confirmed inclusive on both
  ends. Asked dev; answered yes. _minor_
- **AC #4 — "30 days before that end date":** is that 30 calendar
  days or 30 business days? Ambiguous. Asked PO; answer pending.
  _important_

#### Missing constraints

- **AC #1 — date selection:** no max range stated. If a user
  picks "2010-01-01" to "today", does the query work? Ask backend
  about query performance. _important_
- **AC #2 — time zone:** the AC says "created_at falls within
  the range." Which time zone defines the boundaries? Server UTC?
  User's local? Account-level? _blocker_

#### Untestable phrasing

- None.

#### Hidden assumptions

- The AC assumes the filter UI is visible without any user
  action. Is it always visible, or hidden behind a "Filter"
  button? Designs show it as always-visible — confirm. _minor_

#### Missing negative paths

- **End date before start date:** the AC doesn't say what
  happens. Should the UI prevent submission, swap the dates, or
  show an error? _important_
- **Invalid date input** (free-text "asdf" in a date field):
  is the date picker the only entry method, or can the user
  type? _minor_

#### Cross-cutting concerns

- **Accessibility:** date pickers — are they keyboard-navigable?
  Screen-reader accessible? _important_
- **Mobile:** does the layout collapse on narrow viewports?
  _important_
- **i18n:** date format depends on locale. Are we honoring the
  user's locale, or fixing to ISO? _important_

### Risks

- The time-zone ambiguity (blocker above) could result in a UI
  that shows "0 results" because the user picked a date that's
  technically in tomorrow's UTC window. Catches us in production
  if not resolved.
- The "30 days before" default could surprise users if it means
  business days when they expect calendar.
- Performance risk on unbounded queries — if the filter accepts
  arbitrary ranges, a year-long query could time out.

### Questions for dev/PO

> Paste-ready. First person.

1. AC #2 mentions reports whose `created_at` is in the range.
   Which time zone defines the boundaries — server UTC, the
   user's local time zone, or their account's configured one?
   This affects how I design the boundary test cases.
2. AC #4 says "30 days before that end date" — is that calendar
   days or business days? Want to confirm before I write the
   test for the default.
3. Is there a max date range we want to support, or can a user
   query "the last decade" without performance concerns?
4. AC #5 covers zero results, but what should happen if the user
   sets an end date *before* the start date? Should the UI block
   submission, auto-swap, or show an error?
5. Accessibility / mobile / i18n on the date pickers — anything
   specific to verify, or should I default to our standard QA
   checklist for new UI elements?
