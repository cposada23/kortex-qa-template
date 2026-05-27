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

Team-specific (always under this folder):

- **Stories:** [stories/](stories/) — one folder per Jira ticket.
- **All test cases (single home):** [test-cases/<area>/](test-cases/)
- **Bugs:** [bugs/](bugs/) — local bug records, linked from stories.
- **Peer reviews:** [reviews/](reviews/) — your reviews of others' test cases.
- **Ceremony notes:** [ceremonies/](ceremonies/) — sprint planning, dailies, reviews, retros.
- **Automation meta:** [automation/](automation/) — Playwright patterns specific to this team.
- **Inbox:** [inbox/](inbox/) — team-specific captures.
- **Meta:** [members.md](members.md), [workflow.md](workflow.md), [ceremonies-info.md](ceremonies-info.md).

Client-wide (inherited from `shared/` unless overridden here):

- **Environments:** [../../shared/environments/](../../shared/environments/) — local Docker, dev, QA URLs.
- **Test users:** [../../shared/users.md](../../shared/users.md).
- **Filters / datasets:** [../../shared/filters.md](../../shared/filters.md).
- **Deploy:** [../../shared/deploy.md](../../shared/deploy.md).

If this team needs an override for any client-wide asset, drop the
file at the matching path inside this folder. See
[environments/README.md](environments/README.md) for how the
override works.

## Cross-team boundary

This team's team-specific content stays in this folder. Client-wide
content lives in `shared/`. The only zone that crosses CLIENTS is
the global [knowledge/](../../knowledge/), and it must remain
client-safe (no team identifiers, no internal URLs).

If a pattern proves itself in two teams, promote it from each team's
local folder up to `knowledge/`. See
[../../playbooks/team-knowledge-promotion.md](../../playbooks/team-knowledge-promotion.md).

## See also

- [README.md](README.md) — humans-first overview of this team
- [INDEX.md](INDEX.md) — full file map for this team
- [../../shared/README.md](../../shared/README.md) — client-wide assets + override pattern
