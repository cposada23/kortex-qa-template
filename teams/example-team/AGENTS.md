# example-team — Agent Context

Team-scoped agent context. Extends the root
[AGENTS.md](../../AGENTS.md) with rules specific to this team.

When an AI agent is helping with files under
`teams/example-team/`, the read order is:

1. Root [AGENTS.md](../../AGENTS.md) — global rules.
2. **This file** — team-specific overrides.
3. The specific file the user is editing.

## This team's identity

> **This is an example team shipped with the v1.1 template** to
> demonstrate the team-centric structure. Replace this file's
> content with your real team's context after running
> `node scripts/new-team.mjs <real-slug>` and removing the
> example-team folder.

- **Team name:** Example Team (replace)
- **Jira project key prefix:** TEAM (replace)
- **Sprint length:** 2 weeks (replace)
- **Primary product / SUT:** (replace)

## Team-specific overrides

(None in the example — real teams may override:
- Branch naming conventions for the automation repo
- Definition of Done extras specific to this team
- Communication channel
- Specific test case categories the team uses)

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
