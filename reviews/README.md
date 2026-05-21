# reviews/ — Peer reviews of others' test cases

When the team workflow assigns the owner to **review someone
else's test cases** (the "test-case-review" subtask of a Jira
story), the review goes here — not in the original story's folder.

Reason: the original story belongs to whoever owns the design
work. The review is the engineer's own deliverable.

## File naming

`<TICKET-KEY>.md` — one file per story reviewed. If the same
story comes back for a re-review, append to the same file with a
dated H2 section.

## Anatomy of a review file

```markdown
---
title: "<TICKET-KEY> — test case review"
type: review
status: in-progress | approved | changes-requested | rejected
reviewing_ticket: <TICKET-KEY>
reviewed_at: YYYY-MM-DD
language: en
tags: [review, ...]
updated: YYYY-MM-DD
---

# <TICKET-KEY> — test case review

## Scope of review

What was reviewed (paths in the SUT repo or Jira test management
plugin).

## Findings

### Coverage
- ...

### Clarity
- ...

### Redundancy
- ...

### Automation feasibility
- ...

## Outcome

Approved / Changes requested / Rejected. One paragraph rationale.

## Comments to deliver

(Phrased as the owner would write them — first person, peer tone.
This is what gets posted as Jira comments or sent to the author
in Teams.)
```

## Hard rule — external communication tone

The **Comments to deliver** section is destined for the original
author's eyes. It must read like the owner wrote it himself. No
AI scaffolding leakage. See [../AGENTS.md](../AGENTS.md) §"External
communication rule".

## See also

- [../AGENTS.md](../AGENTS.md)
- [../playbooks/test-case-peer-review.md](../playbooks/test-case-peer-review.md)
  (stub in v1.0)
- [INDEX.md](INDEX.md)
