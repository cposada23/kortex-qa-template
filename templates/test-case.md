---
title: "{{TITLE}}"
type: test-case
id: {{ID}}
area: {{AREA}}
level: ui
coverage: positive
status: draft
automation_status: manual-only
automation_path: "../../<automation-repo>/tests/{{AREA}}/{{SLUG}}.spec.ts"
linked_stories: {{LINKED_STORIES}}
review_status: not-reviewed
covers_ac: []                       # ACs of the linked story this TC covers, e.g. [AC-1, AC-3]
external_ids: {}                    # TMS ids, e.g. {octane: "1042"} — keys: xray|octane|testrail|ado|zephyr
# last_run / last_result are written by scripts/sync-automation.mjs — do not fill by hand
language: en
tags: [{{AREA}}]
updated: {{UPDATED}}
---

# {{TITLE}}

## Objective

<One sentence: what does this test verify?>

## Preconditions

- **Env:** local | dev | qa
- **User:** <test user persona; link to environments/users.md if specific>
- **Data:** <required SUT state; link to environments/filters.md if applicable>
- **Other:** <feature flags, prior actions>

## Steps

1. Given <starting state>
2. When <action>
3. Then <expected outcome>
4. And <additional check>

## Expected result

<one-paragraph human-readable summary of what "pass" looks like>

## Data setup (optional)

<exact data to create / API calls / SQL to seed>

## Cleanup (optional)

<what to undo so the next run starts clean>

## Notes (optional)

<caveats, flakiness history, related test cases>
