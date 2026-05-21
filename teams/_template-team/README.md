# {{TEAM_NAME}}

QA brain content for the **{{TEAM_NAME}}** team.

## What this folder is

Everything specific to {{TEAM_NAME}} — stories, test cases, bugs,
peer reviews, ceremony notes, environment configs, automation
patterns, and team-specific captures.

## Quick links

- [AGENTS.md](AGENTS.md) — agent context for this team
- [INDEX.md](INDEX.md) — file map
- [members.md](members.md) — roster
- [workflow.md](workflow.md) — Jira board + definitions
- [deploy.md](deploy.md) — deploy procedures
- [ceremonies-info.md](ceremonies-info.md) — sprint cadence

## Daily zones

- [stories/](stories/) — Jira tickets
- [test-cases/](test-cases/) — reusable test cases
- [bugs/](bugs/) — bug registry
- [reviews/](reviews/) — peer reviews
- [ceremonies/](ceremonies/) — meeting captures
- [environments/](environments/) — env setup
- [automation/](automation/) — Playwright meta
- [inbox/](inbox/) — team-specific capture

## Fill-in checklist (after `node scripts/new-team.mjs <slug>`)

- [ ] [members.md](members.md) — names, roles, ping-for
- [ ] [workflow.md](workflow.md) — Jira board, DoR, DoD
- [ ] [deploy.md](deploy.md) — env promotion cadence
- [ ] [ceremonies-info.md](ceremonies-info.md) — meeting times
- [ ] [environments/local.md](environments/local.md) — local Docker
- [ ] [environments/dev.md](environments/dev.md) — dev URL + auth
- [ ] [environments/qa.md](environments/qa.md) — QA URL + auth
- [ ] [environments/users.md](environments/users.md) — test user emails
- [ ] [environments/filters.md](environments/filters.md) — common dataset filters

Then start capturing stories with `node scripts/new-story.mjs <TICKET> <slug>`.
