# {{TEAM_NAME}} — Agent Context

Team-scoped agent context. Extends the root
[AGENTS.md](../../AGENTS.md) with rules specific to this team.

When an AI agent is helping with files under
`teams/{{TEAM_SLUG}}/`, the read order is:

1. Root [AGENTS.md](../../AGENTS.md) — global rules.
2. **This file** — team-specific overrides.
3. The specific file the user is editing.

## This team's identity

- **Team name:** {{TEAM_NAME}}
- **Slug:** `{{TEAM_SLUG}}`
- **Jira project key prefix:** _(fill in — e.g. `TEAM`, `POD8`)_
- **Sprint length:** _(2 weeks default — adjust)_
- **Primary product / SUT:** _(fill in)_

## Team-specific overrides

_(Capture overrides specific to this team that differ from other
teams' or the global default. Examples:_
- _Branch naming convention for the automation repo (e.g. `<team>/feature/<jira>`)_
- _Additional Definition of Done items_
- _Specific Teams / Slack channel for QA escalations_
- _Per-team test case ID conventions if they diverge from `TC-<AREA>-<NNN>`)_

## Where things live (this team)

- **Stories:** [stories/](stories/) — one folder per Jira ticket.
- **Reusable test cases:** [test-cases/library/<area>/](test-cases/library/)
- **Bugs:** [bugs/](bugs/) — local bug records, linked from stories.
- **Peer reviews:** [reviews/](reviews/) — your reviews of others' test cases.
- **Ceremony notes:** [ceremonies/](ceremonies/) — sprint planning, dailies, reviews, retros.
- **Environments:** [environments/](environments/) — local Docker, dev, QA URLs.
- **Automation meta:** [automation/](automation/) — Playwright patterns specific to this team.
- **Inbox:** [inbox/](inbox/) — team-specific captures.

## Cross-team boundary

This team's content stays in this folder. The only zone that
crosses teams is the global [knowledge/](../../knowledge/), and it
must remain client-safe (no team identifiers, no internal URLs).

If a pattern proves itself in two teams, promote it from each team's
local folder up to `knowledge/`. See
[../../playbooks/team-knowledge-promotion.md](../../playbooks/team-knowledge-promotion.md).

## See also

- [README.md](README.md) — humans-first overview of this team
- [INDEX.md](INDEX.md) — full file map for this team
- [members.md](members.md), [workflow.md](workflow.md), [deploy.md](deploy.md), [ceremonies-info.md](ceremonies-info.md)
