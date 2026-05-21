# reviews/ — peer reviews of OTHER QAs' work (optional)

When the team workflow assigns you to review someone else's test
cases or stories, your review notes live HERE — not in the
original story's folder (which belongs to the design author).

## Frontmatter is the source of truth for state

In v1.6, **review state lives in the artifact's own frontmatter**,
not in this folder:

```yaml
# in a test case or story
review_status: not-reviewed | requested | in-review | changes-requested | approved
```

A file in `reviews/` is **optional supporting evidence** — created
only when the reviewer has substantive prose to add (rationale for
the decision, paste-ready comments for Jira, risk notes, etc.).

**Hard rule:** if a review file says one thing and the
frontmatter says another, **frontmatter wins**. The review file
is documentation, not state.

## When to create a review file

- You have detailed paste-ready comments for the author (so the
  comments don't get lost in chat).
- You're documenting a non-trivial rationale for `approved` or
  `changes-requested` so a future reader understands why.
- You want a permanent record of the review for audit / calibration.

When the review is just "LGTM" or "needs work, message sent": skip
the file. Just set `review_status:` on the artifact.

## File naming

`<TICKET-KEY>.md`, e.g. `TEAM-1234.md`. If you re-review the same
story, append a dated H2 section to the existing file rather than
creating a new one.

## See also

- [test-case-peer-review playbook](../../../playbooks/test-case-peer-review.md)
- [test-case-reviewer prompt](../../../.github/prompts/test-case-reviewer.prompt.md)
