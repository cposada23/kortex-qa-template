# {{TEAM_NAME}}

QA brain content for the **{{TEAM_NAME}}** team.

## What this folder is

Everything specific to {{TEAM_NAME}} — stories, test cases, bugs,
peer reviews, ceremony notes, automation patterns, members,
workflow, and team-specific captures.

Client-wide content (envs / test users / filters / deploy
procedures) lives in [../../shared/](../../shared/) and is
inherited by default. See [environments/README.md](environments/README.md)
for the override pattern if {{TEAM_NAME}} needs its own.

## Quick links

- [AGENTS.md](AGENTS.md) — agent context for this team
- [INDEX.md](INDEX.md) — file map
- [members.md](members.md) — roster
- [workflow.md](workflow.md) — Jira board + definitions
- [ceremonies-info.md](ceremonies-info.md) — sprint cadence

## Daily zones (team-specific)

- [stories/](stories/) — Jira tickets
- [test-cases/](test-cases/) — reusable test cases
- [bugs/](bugs/) — bug registry
- [reviews/](reviews/) — peer reviews
- [ceremonies/](ceremonies/) — meeting captures
- [automation/](automation/) — Playwright meta
- [inbox/](inbox/) — team-specific capture

## Client-wide assets (inherited from shared/)

- [../../shared/environments/](../../shared/environments/) — local/dev/qa setup
- [../../shared/users.md](../../shared/users.md) — test user emails
- [../../shared/filters.md](../../shared/filters.md) — dataset filters
- [../../shared/deploy.md](../../shared/deploy.md) — deploy cadence

Override at `teams/{{TEAM_SLUG}}/<asset>` if this team differs from
the rest. See [environments/README.md](environments/README.md).

## Fill-in checklist (after `node scripts/new-team.mjs <slug>`)

Team-specific (always fill in):
- [ ] [members.md](members.md) — names, roles, ping-for
- [ ] [workflow.md](workflow.md) — Jira board, DoR, DoD
- [ ] [ceremonies-info.md](ceremonies-info.md) — meeting times

Client-wide (fill in once per client, in `shared/`):
- [ ] [../../shared/environments/local.md](../../shared/environments/local.md)
- [ ] [../../shared/environments/dev.md](../../shared/environments/dev.md)
- [ ] [../../shared/environments/qa.md](../../shared/environments/qa.md)
- [ ] [../../shared/users.md](../../shared/users.md)
- [ ] [../../shared/filters.md](../../shared/filters.md)
- [ ] [../../shared/deploy.md](../../shared/deploy.md)

Then start capturing stories with `node scripts/new-story.mjs <TICKET> <slug>`.
