---
title: "Playbook — Test case peer review"
type: playbook
status: active
language: en
tags: [playbook, peer-review]
updated: 2026-05-21
---

# Playbook — Test case peer review

## review_status is canonical; review files are optional (v1.6+)

The `review_status:` field in the artifact's own frontmatter
(the TC and the story it belongs to) is **the source of truth**
for where a review stands. Values: `not-reviewed`, `requested`,
`in-review`, `changes-requested`, `approved`.

The `teams/<team>/reviews/<TICKET>.md` folder is now **optional**.
Create a review file only when you have substantive prose to
capture — rationale for a change request, paste-ready Jira/Teams
comments, a side-by-side diff suggestion, or calibration notes
for future reviewers. For simple state changes ("LGTM" /
"approved" / "needs work, see Jira comment"), just bump
`review_status:` on the TC's or story's frontmatter and skip the
file entirely.

**Hard rule:** if a `reviews/<TICKET>.md` file says one thing and
the artifact's frontmatter says another, **frontmatter wins**.
The review file is supplementary prose; the frontmatter field is
the canonical state the rest of the pipeline (session-start
report, automation handoff, story closeout) reads.

When you DO write a review file, treat its contents as
explanatory — never as a substitute for updating
`review_status:`.

## Relationship to `/test-case-reviewer`

The `/test-case-reviewer` Copilot prompt in
[../.github/prompts/test-case-reviewer.prompt.md](../.github/prompts/test-case-reviewer.prompt.md)
does the **work** of the review: it loads one or more test case
files, scores them against a five-dimension rubric (coverage /
clarity / redundancy / automation feasibility / schema
compliance), and drafts the "Comments to deliver" section ready
to paste into Jira or Teams.

This playbook is the **wraparound**: when to start a review, how
to scope it, what to do with each kind of finding, how to deliver
feedback without burning a peer's morning, and how to calibrate
your eye against the team's other reviewers.

## When to start a peer review

- **Jira sub-task says "test-case-review"** — the team's workflow
  has the review as a formal step. This is the only mandatory
  trigger.
- **You spotted a test case you'd write differently** — informal,
  but high-value. Open a review file anyway; you'll either find
  a real issue or learn the other QA's reasoning.
- **You wrote the test cases yourself** — self-review before peer
  review. Same rubric, lower bar, but it catches the obvious
  smells before someone else has to.

Don't start a review when:

- The story is mid-execution. Reviewing in-flight test cases
  creates a moving target.
- The author is on vacation and can't respond. Park it; review
  when they're back.
- You don't have access to the same SUT or test data. You'll
  flag false positives. Ask for access first.

## Scope — what to review

A peer review covers:

1. **The test case files themselves** — `.md` content + frontmatter.
2. **The linked story** — to verify each AC has coverage.
3. **The execution log** (if any runs have happened) — to spot
   ambiguity that only shows up at execution time.

It does **not** cover:

- The Playwright automation. That's a separate review pass
  (`/automation-from-test-case` produces the skeleton; the
  resulting code review happens in the automation repo's PR
  flow).
- The story itself or the AC. Those are owned by the design QA,
  not the reviewer. Flag AC issues separately if you spot them
  but don't block the test-case review on AC quality.

## The five-dimension rubric

| Dimension | Question | What "good" looks like |
|---|---|---|
| Coverage | Does each AC line have ≥1 TC? Are negative paths and edge cases covered? | A coverage matrix you can read in 30 seconds. |
| Clarity | Can a peer follow the steps without external context? | No "obvious" hand-waving; data setup explicit; expected result is observable. |
| Redundancy | Is any TC duplicated against the team's library? Can two TCs be merged? | Each TC earns its line in the registry. |
| Automation feasibility | Which TCs are good automation candidates? Which should stay manual and why? | A label per TC: `auto-soon`, `auto-eventually`, `manual-only`. |
| Schema compliance | Frontmatter fields correct? TC-ID assigned? Linked stories listed? | `node scripts/validate.mjs` passes on the touched files. |

The prompt produces findings under each dimension. The playbook is
how you act on them.

## How to deliver feedback that gets accepted

Two patterns that work; one that doesn't.

### Pattern A — the "I noticed" lead

> "I noticed TC-07 expects the date in `YYYY-MM-DD` but the SUT
> renders `DD/MM/YYYY` in the LATAM locale. Is the format from AC
> #4, or should the TC accept either?"

Why it works: it states the observation, then turns the
disagreement into a clarification request. The author can answer
without backing down.

### Pattern B — the "concrete suggestion"

> "TC-12 step 3 says 'wait for the spinner.' Could we tighten it
> to 'wait for the loading spinner inside `#results-panel` to
> disappear (max 5s)'? That'll keep the automation reliable
> against the background spinner the header shows on every page."

Why it works: it offers the edit so the author doesn't have to
invent it.

### Anti-pattern — the "you should"

> "You should add a negative-path TC for invalid input."

Why it fails: it reads as a verdict. Even when correct, it makes
the author defensive. Reframe as "noticed the AC mentions
invalid input but I don't see a matching TC — would TC-NN cover
that?"

The `/test-case-reviewer` prompt is tuned to produce Pattern A/B
phrasing by default. If the output drifts into anti-pattern, edit
before sending.

## When to approve, when to request changes, when to reject

- **Approve** — all five dimensions are clean OR the only findings
  are minor (style, schema nits). Add the comments to the review
  file but don't block the merge.
- **Changes requested** — coverage or clarity has gaps that would
  produce wasted execution time. Author should fix before
  execution starts.
- **Reject** — only when the test cases are designed against the
  wrong AC version, or the SUT understanding is fundamentally off.
  This is rare. When it happens, jump to a sync call with the
  author rather than a written review.

The decision is recorded canonically in the artifact's
frontmatter — `review_status:` on the TC and on the linked
story. Bump it to `approved` or `changes-requested` and the rest
of the pipeline picks up the new state. The story moves back
into `in-progress` for the author once changes are requested. A
`reviews/<TICKET>.md` file is only needed when the rationale
warrants prose; for an "approved with no notes" decision, the
frontmatter bump alone is the full audit trail.

## Calibration — comparing your eye to other reviewers

Over time, save the review files in `teams/<slug>/reviews/`. After
5–10 reviews, look back at:

- **What you flag that the team approves anyway** — overreach. Tune
  down or skip that dimension next time.
- **What the team flags that you missed** — blind spots. Add a
  note to `knowledge/patterns/peer-review-blind-spots.md`.
- **What you and the team consistently flag** — these are the
  team's quality bar. Encode them as a checklist at the top of
  `teams/<slug>/reviews/README.md`.

This is how the review eye gets sharper. The prompt rubric is a
starting point; your team's actual bar is what matters.

## Common test case anti-patterns (cheat sheet)

| Smell | Example | Fix |
|---|---|---|
| Vague step | "verify the page loads correctly" | Name the element you check, the timeout you allow. |
| Hidden setup | step 1 = "log in as user X" without explaining what `X` has | Spell out the role + data preconditions. |
| Untestable expected result | "the system is fast" | Pick a measurable threshold or remove the line. |
| Shared mutable state | TC-A creates a record TC-B then asserts on | Either chain explicitly or independent setup. |
| AC drift | TC was written against AC v1, AC is now v3 | Add a `## Update YYYY-MM-DD` H2 to the TC and the story. |
| Duplicate TC | A second TC in the same `<area>/` re-covers what an existing TC already verifies | Append the new story's Jira key to the existing TC's `linked_stories:` instead of duplicating the file. |

## Linking the review output to the story

After running `/test-case-reviewer`:

1. Set the story's (and each touched TC's) frontmatter
   `review_status:` to `approved` or `changes-requested`. This is
   the canonical signal — required even if no review file is
   written.
2. If the review produced substantive prose (rationale, paste-ready
   comments, side-by-side suggestions), write it to
   `teams/<slug>/reviews/<TICKET-KEY>.md`. If the outcome is a
   clean "LGTM" with no notes, skip the file.
3. If `changes-requested`, set the story's `status: review-blocked`
   and note the reviewer in `story.md`'s `## Notes`. Move back to
   `in-progress` once the author addresses findings.
4. Promote durable lessons (anti-patterns you keep flagging) into
   `knowledge/patterns/<slug>.md`.

## Related

- [test-case-design.md](test-case-design.md) — what the author
  was supposed to produce
- [team-knowledge-promotion.md](team-knowledge-promotion.md) —
  how repeated review findings become `knowledge/`
- [../.github/prompts/test-case-reviewer.prompt.md](../.github/prompts/test-case-reviewer.prompt.md)
  — the prompt that does the work
- `teams/<slug>/reviews/README.md` — the file format and tone
  rule (review comments must read like the owner wrote them)
