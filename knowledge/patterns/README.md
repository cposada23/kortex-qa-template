# knowledge/patterns/ — Cross-client observed patterns

Generic patterns about how QA work, automation, releases, and
team dynamics tend to play out across engagements.

## What goes here

- Recurring failure modes ("tests that pass locally but fail in
  CI 30% of the time usually mean...")
- Communication patterns ("when a dev's AC is vague, the question
  type that gets the fastest answer is...")
- Release-process patterns ("Friday deploys produce more bugs
  than Monday deploys when...")
- Team / role anti-patterns observed across clients

## Format

One file per pattern. Filename is kebab-case slug. Content:

```yaml
---
title: "Pattern: <one-line description>"
type: knowledge
status: active
language: en
tags: [pattern, ...]
updated: YYYY-MM-DD
---

# Pattern: <description>

## Symptom (generic)
What you observe.

## Underlying cause(s)
Why it happens.

## What to do
Concrete actions.

## What not to do
Common wrong responses.

## Related
- [other patterns]
```

## Hard rule

Every pattern entry must be generic. If a pattern is only true
for one client's setup, it's not a pattern — it's a note for
that client (lives in `team/`, `environments/`, or that client's
clone). The portability test: could another QA at a different
company read this and benefit?
