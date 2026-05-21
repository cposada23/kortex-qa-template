---
description: Tone and content rules for files destined for external eyes
applyTo: "stories/**/questions.md, bugs/**/*.md, reviews/**/*.md"
---

# External communication — content rules

The files matched by this instruction will be **pasted into Jira,
Teams, or other team-visible channels**. They must read like the
engineer wrote them himself, with no trace of AI scaffolding.

## Primary enforcement: positive output specs

The prompts that produce content for these files (`ac-auditor`,
`bug-report-formatter`, the question section of any prompt)
already include positive output specs requiring first-person,
engineer-voice phrasing. This file is the **fallback layer** for
when content is being edited by Copilot outside of those prompts.

## Voice rules

- **First person.** The engineer is writing. Pronouns: "I",
  "we" (when speaking as part of the QA function), never "the
  user" or "the engineer".
- **Peer tone.** The reader is a developer / PO / fellow QA. Not
  a customer. Direct, technical, respectful.
- **Concise.** No throat-clearing. No "I hope this finds you
  well." No "Just wanted to flag that..."
- **Concrete.** Specific scenarios, specific behaviors,
  specific reproduction steps. Avoid hedging language
  ("seems to", "appears to") unless the engineer is genuinely
  uncertain.

## Forbidden phrasings

Never write any of these in matched files:

- "As an AI..."
- "Based on my analysis..."
- "I noticed in the audit that..."
- "The AC audit revealed..."
- "Per the brain..."
- "Per my instructions..."
- "I'll generate the questions..."
- "Here are the questions I drafted..."
- Any reference to "the audit", "this prompt", "the assistant",
  or any internal QA-brain machinery

## What to write instead

For `stories/**/questions.md`:

> 1. The AC says "filter by recent activity" — what defines
>    "recent"? Last 24 hours? Last login session? Configurable?
> 2. ...

NOT:

> Based on the AC audit, I identified the following ambiguities
> that I think we should clarify:
> 1. ...

For `bugs/**/*.md`:

> **Summary:** Search bar swallows trailing whitespace, treating
> "query " as "no results."
>
> **Steps to reproduce:** ...

NOT:

> The bug report formatter generated the following details
> for this defect: ...

For `reviews/**/*.md` (the "Comments to deliver" section
specifically):

> 1. TC-AUTH-002 step 3 — the expected result mentions a redirect
>    but doesn't specify the target URL. Could you add the
>    expected destination?

NOT:

> My review found the following issues that should be addressed: ...

## When unsure

If you can't tell whether a sentence sounds like the engineer or
like an AI, ask: would the engineer write this in Teams to a dev?
If no, rephrase.

## Hard rule

If you generate content under this glob that violates these
rules, that's a defect of the prompt or this fallback. Flag it
in the next session retro and tighten the prompt.
