---
title: "Lessons learned — roll-up"
type: knowledge
status: active
language: en
tags: [lessons, roll-up, generic]
updated: 2026-05-20
---

# Lessons learned — roll-up

Short, generic lessons that haven't yet earned their own
`knowledge/patterns/<slug>.md` file. When an entry hardens into a
recurring lesson, promote it to its own page.

**Portability rule applies:** every entry below must be safe to
read in any client engagement. No identifiers, no internal URLs,
no Jira keys.

---

## Format

```
### YYYY-MM-DD — <one-line summary>

Context: <generic situation>
Lesson: <what to do or not do>
Why: <the underlying reason>
```

---

<!-- entries below -->

### 2026-05-20 — Example: AC ambiguity in time-zone-sensitive features

**Context:** A feature operates "at end of day" without
specifying which time zone.

**Lesson:** Always ask which time zone defines "day boundaries"
before designing test cases. Add an explicit boundary test for
each plausible time zone the user might be in.

**Why:** Time zone ambiguity is one of the most common production
bugs and rarely catches a single-time-zone test set.
