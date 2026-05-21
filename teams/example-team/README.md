# team/ — Context zone

Who you work with and how the team operates. Captured once per
engagement, edited rarely.

## Files

- **[members.md](members.md)** — roster: who, what role, when to
  ping them.
- **[ceremonies.md](ceremonies.md)** — sprint cadence, daily
  standup time, review/retro schedule.
- **[workflow.md](workflow.md)** — Jira board flow, definition of
  ready, definition of done, QA subtask conventions.
- **[deploy.md](deploy.md)** — how the team ships to dev/QA/prod.

## Why this zone exists

The team context shifts slowly but matters constantly. When
Copilot is helping with a story, knowing the team's DoD changes
whether a test case can be marked "complete" or not. When you
return to the brain after a vacation, this zone is your re-entry
point.

## What does NOT belong here

- **Specific tickets / stories** — those go in `stories/`.
- **Specific environments / URLs / creds** — those go in
  `environments/`.
- **Meeting notes** — those go in `ceremonies/`. This zone is
  *structure*, not *events*.

## Compliance note

Member names and roles MAY be sensitive. Treat this zone as
client-internal: it never leaves the client clone, and it's
explicitly excluded from any future `knowledge/` portability.

## See also

- [../AGENTS.md](../AGENTS.md)
