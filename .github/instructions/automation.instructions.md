---
description: Automation meta-knowledge authoring rules
applyTo: "teams/**/automation/**/*.md"
---

# Automation — meta-knowledge authoring

Files under `automation/` capture **knowledge about** the
Playwright automation effort, not the automation code itself.

## What lives here

- Patterns observed in the actual automation repo (page objects,
  fixtures, parallelization, retries)
- Decisions and their rationale ("why we don't use auto-waiting
  for X")
- Glossary of locator / fixture / test ID conventions
- Lessons learned with this specific codebase

## What does NOT live here

- Executable `.ts` / `.spec.ts` files — those live in the
  automation repo, opened alongside as a separate workspace root
- Real selectors, real test IDs, real test data — anything that's
  client-internal
- Patterns generic enough to apply across clients — those go in
  `knowledge/playwright/`

## File shape

```markdown
---
title: "<Pattern or topic name>"
type: playbook | reference
status: active | draft | stub
language: en
tags: [automation, playwright, <topic>]
updated: YYYY-MM-DD
---

# <Title>

## Context (this codebase)
Where in the automation repo this applies.

## The pattern
What we do.

## Why
Rationale. Often references a past flake / incident / decision.

## Example
A small illustrative snippet (selectors anonymized if needed).

## See also
- Related patterns in this folder
- Generic version in `knowledge/playwright/` if one exists
```

## Promotion to `knowledge/playwright/`

When a pattern hardens enough to apply outside this codebase,
distill the **insight** (not the code) into a generic page under
`knowledge/playwright/<slug>.md`. Strip client-specific selectors,
business logic, and test IDs. The two pages can coexist (this one
client-specific, the other portable).

## When updating

- Bump `updated:`.
- If a decision was reversed, write a new section ("Update
  YYYY-MM-DD: reversed because...") rather than rewriting history.
