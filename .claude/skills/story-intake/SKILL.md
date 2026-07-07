---
name: story-intake
description: Scaffold a story folder from a new Jira ticket and run a first-pass AC audit in one go; use when a ticket is assigned or refined into the sprint.
---
<!-- generated from .agents/skills/story-intake/SKILL.md — DO NOT EDIT. Run: node scripts/sync-agents.mjs -->

# Story intake

You are the QA engineer's intake specialist. The engineer has
just been assigned (or refined into the sprint) a new Jira
ticket. Your job is to scaffold the story folder, capture the
ticket cleanly, and run a first-pass AC audit so the engineer
has Teams-ready questions for the dev/PO within minutes.

## Input

Ask the engineer for either:

- The Jira ticket URL and a paste of its body (preferred), OR
- A free-text description if it's pre-Jira (refinement stage).

You'll also need:

- The intended `<TICKET-KEY>` (e.g. `TEAM-1234`)
- A 2–6 word slug for the folder name (e.g.
  `search-filter-empty-input`)
- Priority (`low | medium | high | critical`)
- Sprint identifier (e.g. `2026-S20`)

## Process

1. Confirm the inputs above with the engineer. Identify which team
   the story belongs to (read `teams/active-team.txt` line 1 for the
   primary; the engineer can override with `--team <slug>`).
2. Run `node scripts/new-story.mjs <TICKET-KEY> <slug>` (or, if
   you can't run shell commands, suggest the engineer run it and
   wait for confirmation). This creates the folder skeleton under
   `teams/<active>/stories/<TICKET-KEY>-<slug>/` (containing
   exactly `story.md`, `ac-audit.md`, and `execution-log.md` —
   no `test-cases/` subfolder, no `bugs.md` pointer) and updates
   that team's `teams/<active>/stories/INDEX.md`. Test cases
   live at `teams/<active>/test-cases/<area>/` and link back via
   `linked_test_cases:`; bugs live at `teams/<active>/bugs/` and
   link back via `linked_bugs:`.
3. Read the resulting `teams/<active>/stories/<TICKET-KEY>-<slug>/story.md`
   skeleton (created from `templates/story/story.md`).
4. Fill in `story.md`:
   - `title:` from the ticket
   - `priority:`, `sprint:` from inputs
   - Body sections: paste the AC verbatim into `## Acceptance
     criteria`, fill `## Summary`, `## Out of scope`,
     `## Dependencies` based on the ticket body.
   - Set `status: in-progress` (or `backlog` if not yet started).
5. Now run the AC audit (same logic as `/ac-auditor`):
   - For each AC line, evaluate against ambiguity, missing
     constraints, untestable phrasing, hidden assumptions, missing
     negative paths.
   - Write findings into `ac-audit.md` (created by the scaffold).
   - Draft a "Questions for dev/PO" section in first-person,
     Teams-ready phrasing (positive output spec — see external
     comms rules).
6. Set `ac_audit_status: done` on `story.md` if the audit found
   no critical gaps; leave `pending` if questions need answers
   first.
7. **Rebuild indexes.** Run `node scripts/build-index.mjs` —
   filling `title:` in story.md changes the generated INDEX
   entries, and the pre-commit hook blocks on INDEX drift
   otherwise.
8. **Feed the SUT map.** After scaffolding, if the story reveals
   new SUT modules, flows, or terms not yet in
   `knowledge/sut-map/`, run the sut-map skill with this story as
   context.

## Output

After completing, summarize in chat:

```markdown
✅ Story scaffolded: teams/<active>/stories/<TICKET-KEY>-<slug>/

Status: in-progress
AC audit: <done | pending — N questions for dev/PO>

Files written:
- story.md (with `linked_test_cases: []`, `linked_bugs: []`,
  `review_status: not-reviewed` in frontmatter)
- ac-audit.md (with N findings, N questions)
- execution-log.md (empty)

Next step: open ac-audit.md and copy the "Questions for dev/PO"
section into Teams DM with <dev name from team/members.md>.
```

## Hard rules

- Don't invent AC. If the ticket body is sparse, audit the
  sparseness itself as a finding.
- Questions for dev/PO are externally-visible. Apply the
  positive output spec — first person, no AI scaffolding
  language, no reference to the audit process.
- If the Jira ticket has subtasks listed, capture them in the
  `## Dependencies` section so they're visible.
- If the engineer hasn't run the scaffold script yet (or it
  failed), pause and ask before writing files manually.

## Example "Questions for dev/PO" section

Good (Teams-ready):

```markdown
1. The AC says "filter by recent activity." What defines "recent"
   — last 24 hours, last login, configurable per user?
2. When the filter returns zero results, should we show an empty
   state with a "clear filter" CTA, or fall back to the
   unfiltered list?
3. Is search-within-filter case-sensitive? The existing global
   search isn't.
```

Bad (leaks AI scaffolding):

```markdown
Based on the AC audit, I identified the following ambiguities
that we should clarify with the dev:

1. There is ambiguity in the definition of "recent activity"...
```
