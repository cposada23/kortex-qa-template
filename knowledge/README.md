# knowledge/ — Synthesis zone (portable)

The only zone designed to travel across clients and employers.

## What lives here

- **istqb/** — your distilled ISTQB notes (definitions, syllabus
  references, key principles in your own words).
- **playwright/** — tricks, patterns, gotchas from your real
  Playwright usage. Generic, not tied to any one SUT.
- **patterns/** — observed patterns about how tests / bugs /
  releases tend to break. Cross-client wisdom.
- **lessons-learned.md** — a roll-up file for short lessons that
  don't yet warrant their own page.

## Hard portability rule

A knowledge page is portable **only if it contains none of**:

- Client / employer names
- Internal product or codebase names
- Internal URLs, hostnames, IP addresses
- Screenshots, log excerpts, real data samples
- Credentials of any kind
- Jira ticket keys or board names
- Proprietary workflow details that could identify the engagement
- Domain facts narrow enough to identify the client

If a lesson cannot be sanitized confidently, **it stays with the
client clone** and is deleted when the engagement ends. Don't
weaken the rule by "anonymizing" obviously identifying material —
sanitization isn't reliable enough to trust at scale.

## Promotion path

A pattern usually starts as:

1. A specific observation during execution (lives in
   `inbox/` or a story).
2. A recurring observation surfaces in a retro
   (`ceremonies/retrospectives/...`).
3. The owner decides it's generalizable → distill into
   `knowledge/patterns/<slug>.md` with client details stripped.

## Format

Knowledge pages follow this shape:

```yaml
---
title: "..."
type: knowledge
status: active
language: en
tags: [...]
updated: YYYY-MM-DD
---

# <Title>

## Context (generic)
When you encounter <generic situation>...

## The pattern / lesson
...

## When it applies
...

## When it doesn't apply
...

## Related
- [optional links to other knowledge/ pages]
```

## See also

- [../AGENTS.md](../AGENTS.md)
- [../playbooks/client-rotation.md](../playbooks/client-rotation.md) —
  what happens to this zone when changing engagements
- [INDEX.md](INDEX.md)
