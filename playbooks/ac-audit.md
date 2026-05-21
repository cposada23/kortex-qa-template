---
title: "Playbook — AC audit (deep dive)"
type: playbook
status: active
language: en
tags: [playbook, ac, audit]
updated: 2026-05-20
---

# Playbook — AC audit (deep dive)

## Relationship to `/ac-auditor`

The `/ac-auditor` Copilot prompt in
[../.github/prompts/ac-auditor.prompt.md](../.github/prompts/ac-auditor.prompt.md)
does the **work** of the audit: it reads the AC, categorizes
findings (ambiguity / missing constraints / untestable / hidden
assumptions / negative paths / cross-cutting), and drafts the
"Questions for dev/PO" section ready to paste into Teams.

This playbook is for the **wraparound**: when to run an audit,
what to do with each kind of finding, and how to follow up.

## When to run an audit

- **Always on intake** — the `/story-intake` prompt chains the
  audit automatically.
- **After AC changes** — if the dev/PO updates the AC mid-sprint,
  re-run the audit and append a `## Update YYYY-MM-DD` section
  to the same `ac-audit.md`.
- **Before design** — if you didn't run intake (paste flow), make
  sure the audit happened before `/story-analyzer` or you'll
  brainstorm scenarios on a shaky foundation.

## What to do with each severity

The auditor labels findings **blocker** / **important** /
**minor**:

- **Blocker** — must clarify before designing test cases.
  Action: send the question to dev/PO in Teams, mark story
  `blocked` if no other work can proceed.
- **Important** — affects test case design but doesn't block.
  Action: include in the question batch but don't wait for the
  answer; proceed with provisional test cases that you'll adjust
  once clarified.
- **Minor** — note it, send it in the same Teams batch for
  visibility, but don't slow design.

## Common AC smells (cheat sheet)

| Smell | Example | Action |
|---|---|---|
| Vague adjectives | "fast", "intuitive", "secure" | Ask for a measurable target. |
| Time semantics | "recent", "latest", "current" | Ask for the cutoff. |
| Universal claims | "all users see X" | Ask: which roles? all devices? real-time? |
| "Handle Y" | "the system should handle invalid input" | Ask: graceful failure? retry? loud error? |
| Negative-path silence | (no mention of bad input) | Ask: what happens on invalid input / network failure / concurrent edits? |
| Edge-value silence | (no min/max) | Ask: what's the boundary? |
| Cross-cutting silence | (no a11y / i18n / mobile / concurrency) | Ask defaults; default to "yes verify" if no one says otherwise. |

## How to phrase questions that get decisive answers

Bad (open-ended): "Could you clarify the date handling?"
Good (decisive): "AC #4 says 'within 30 days' — calendar days or
business days?"

Two heuristics:

- **Offer the choices.** A multiple-choice question is faster
  for the dev to answer than an open one.
- **State your tentative assumption.** "I'm going to assume
  calendar days unless you say otherwise" gives the dev a chance
  to push back cheaply.

## When the AC is fundamentally insufficient

If the AC is so sparse that auditing produces only "the AC is
sparse" — that's the finding. Escalate to PO:

> "Hey [PO], the AC on TEAM-1234 is brief — could we walk
> through the intended behavior together before I design test
> cases? Want to make sure I cover what you're actually
> expecting."

This is rare but happens. Don't try to design test cases from
guesswork; you'll waste the dev's time later when re-tests
fail.

## Linking the audit output to the story

After running `/ac-auditor`:

1. `ac-audit.md` is populated with findings + questions.
2. Set `story.md`'s `ac_audit_status: pending` → `done` when
   you've sent the questions (regardless of whether answers are
   in yet — `done` means *audit complete*, not *all questions
   answered*).
3. If a blocker is open, also set `story.md`'s `status: blocked`
   and note who you're waiting on in `story.md`'s `## Notes`
   section. Move back to `in-progress` once answers arrive.

## Related

- [story-intake.md](story-intake.md) — the workflow that wraps
  this audit
- [test-case-design.md](test-case-design.md) — where audit
  outputs feed in
- [../.github/prompts/ac-auditor.prompt.md](../.github/prompts/ac-auditor.prompt.md)
  — the prompt that does the work
