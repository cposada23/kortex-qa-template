# stories/ — Jira ticket work zone

One folder per Jira ticket. The unit of work.

## Folder naming

`<TICKET-KEY>-<slug>/` — e.g. `TEAM-1234-search-filter-empty-input/`.

Use the Jira key verbatim (uppercase, hyphenated number). The slug
is a 2–6 word kebab-case hint about the feature. Folder names are
permanent — don't rename after creation (the git history would
churn).

## Files inside a story folder

```
<TICKET-KEY>-<slug>/
├── story.md          REQUIRED  Captures the ticket itself.
├── ac-audit.md       REQUIRED  AC quality audit + questions for dev/PO.
├── questions.md      OPTIONAL  Free-form questions parked while awaiting answers.
├── execution-log.md  REQUIRED  Test runs: when, where, what passed/failed.
├── bugs.md           OPTIONAL  Local pointer file linking to bugs/ entries.
└── test-cases/       OPTIONAL  Story-specific test cases.
    └── <slug>.md
```

If a test case from this story is reusable across stories,
promote it to `test-cases/library/<area>/<slug>.md` and link to it
from the story's local test-cases folder.

## Scaffolding

```bash
node scripts/new-story.mjs <TICKET-KEY> <slug>
```

Or invoke `/story-intake` in Copilot Chat and paste the ticket body.

## Status lifecycle

The `status:` frontmatter field on `story.md` follows:

```
backlog → in-progress → design-done → review-done → execution-done → closed
```

Plus `blocked` (for any state) and `cancelled` (final, rare).

`/session-start` reads this field to surface what's active.

## Subtasks (team workflow)

Each story typically has three QA subtasks in the team's Jira board:

1. **Test case design** — produces `test-cases/` content.
2. **Test case review** — peer reviews it. If the owner is the
   reviewer, their work goes to `reviews/<TICKET-KEY>.md`, not here.
3. **Test case execution** — produces `execution-log.md` content +
   any bugs found.

Automation work is often a separate story (`AUTO-<NN>`) that links
back to the feature story.

## See also

- [../AGENTS.md](../AGENTS.md) — overall agent context
- [../playbooks/story-intake.md](../playbooks/story-intake.md) —
  the intake workflow in detail
- [INDEX.md](INDEX.md) — list of all stories
