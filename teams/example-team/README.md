# example-team — Reference team

This is a sample team shipped with the template to demonstrate the
team-centric architecture with `shared/` inheritance. Real teams
are scaffolded via `node scripts/new-team.mjs <slug>`.

## What this team illustrates

- Team-specific content: stories, test cases, bugs, ceremonies,
  members, workflow, automation patterns. All under this folder.
- Client-wide content: this team has NO local `environments/`,
  `users.md`, `filters.md`, or `deploy.md` — it inherits all four
  from [../../shared/](../../shared/). That's the typical case.
- One full story walkthrough (auth flow) end-to-end.

## Files

Team-specific (always here):

- **[members.md](members.md)** — roster.
- **[ceremonies-info.md](ceremonies-info.md)** — sprint cadence.
- **[workflow.md](workflow.md)** — Jira board, DoR, DoD.
- **[stories/](stories/)** — one folder per Jira ticket.
- **[test-cases/](test-cases/)** — test cases organized by area.
- **[bugs/](bugs/)** — bug registry.
- **[reviews/](reviews/)** — peer reviews.
- **[ceremonies/](ceremonies/)** — meeting notes.
- **[automation/](automation/)** — Playwright meta.
- **[inbox/](inbox/)** — free-form captures.

Client-wide (inherited from `shared/`):

- [../../shared/environments/](../../shared/environments/) — local/dev/qa
- [../../shared/users.md](../../shared/users.md) — test users
- [../../shared/filters.md](../../shared/filters.md) — datasets
- [../../shared/deploy.md](../../shared/deploy.md) — deploy procedures

## Why this zone exists

When Copilot helps with a story, knowing the team's DoD changes
whether a test case can be marked "complete." When you return to
the brain after a vacation, the team root files are your re-entry
point.

## What does NOT belong here

- **Specific tickets / stories** — those go in `stories/`.
- **Env URLs / test users / filters** — those go in `shared/`
  (or a team override file if THIS team differs).
- **Meeting notes** — those go in `ceremonies/`. This zone is
  *structure*, not *events*.

## Compliance note

Member names and roles MAY be sensitive. Treat this zone as
client-internal: it never leaves the client clone, and it's
explicitly excluded from any future `knowledge/` portability.

## See also

- [AGENTS.md](AGENTS.md) — agent context for this team.
- [../../AGENTS.md](../../AGENTS.md) — repo-wide rules.
- [../../shared/README.md](../../shared/README.md) — shared vs team override pattern.
