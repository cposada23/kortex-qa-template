---
title: "Playbook — Automation flow"
type: playbook
status: stub
language: en
tags: [playbook, automation, playwright, stub]
updated: 2026-05-20
---

# Playbook — Automation flow

**Status:** stub. Fill out once you've staged manual + automation
work on 5+ stories and the strategy stabilizes for this client.

## Planned content

- When to automate (which test cases, which areas, which
  coverage labels)
- When to stay manual (visual checks, exploratory, ad-hoc edge
  exploration)
- How to stage automation work: same sprint as the feature? next
  sprint? batched as separate `AUTO-<NN>` stories?
- Linking story → test case → automation file in the brain
  (frontmatter `automation_path:` discipline)
- Smoke vs regression vs feature suites — when each runs, who
  owns flakes
- Playwright-specific patterns that work here (cross-link to
  [../automation/playbooks/](../automation/playbooks/))

## How to fill this stub

1. Track automation decisions in `stories/*/execution-log.md` as
   you make them.
2. Track Playwright pattern decisions in
   `automation/playbooks/*.md` as they emerge.
3. After enough data, this file becomes the strategy summary
   linking those.

## Related

- [../automation/README.md](../automation/README.md) —
  automation meta-knowledge zone
- [../knowledge/playwright/README.md](../knowledge/playwright/README.md)
  — portable Playwright lessons
