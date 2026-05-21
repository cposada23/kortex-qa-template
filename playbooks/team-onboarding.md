---
title: "Playbook — Adding a new team"
type: playbook
status: active
language: en
tags: [playbook, team, onboarding]
updated: 2026-05-21
---

# Playbook — Adding a new team

How to scaffold and onboard a new team within an existing
Kortex-QA clone. Single-client v1.0 lived inside one team
implicitly; v1.1 lets you support multiple teams in the same
clone via `teams/<slug>/`.

## When to add a team

- You start a new sprint that puts you on a team you've never
  worked with before in this engagement.
- A reorg moves you onto a new pod/squad mid-engagement.
- You've been moonlighting on a side team and decide to capture
  that work properly.

## When NOT to add a team

- A short-term spike with one other team (one or two stories) →
  capture in the current team's inbox + cross-link in story notes
  instead. The overhead of a new team folder isn't worth it for
  fewer than 5 stories of work.
- A different client engagement → that's a new Kortex-QA clone,
  not a new team. See [client-rotation.md](client-rotation.md).

## Steps

### 1. Scaffold the folder

```bash
node scripts/new-team.mjs <slug>
# or with a display name:
node scripts/new-team.mjs seis-pro-tagema --name "Six Pro-Tagema"
```

This copies `teams/_template-team/` to `teams/<slug>/` and
substitutes `{{TEAM_SLUG}}` and `{{TEAM_NAME}}` placeholders in
every `.md` file inside. It also refreshes `teams/INDEX.md`.

### 2. Activate the team

```bash
# Make it your primary (default for scaffolds):
node scripts/switch-team.mjs <slug>

# Or add as secondary (you remain on the previous primary):
node scripts/switch-team.mjs <slug> --add
```

### 3. Fill the team-level context

This is the difference between "scaffolded" and "usable." Don't
skip:

- **`teams/<slug>/members.md`** — at minimum, list the Tech Lead,
  PO, and the dev(s) you'll mostly interact with. Add ping-for
  notes ("Mariana — AC clarifications; Diego — env outages").
- **`teams/<slug>/workflow.md`** — capture the Jira board, the
  team's DoR/DoD, and which QA subtasks the team uses. If the team
  has any unusual conventions (branch naming, PR templates, etc.),
  note them here.
- **`teams/<slug>/deploy.md`** — how this team ships. Deploy
  cadence, who triggers, smoke test policy.
- **`teams/<slug>/ceremonies-info.md`** — sprint length, daily
  standup time, sprint planning/review/retro timing.
- **`teams/<slug>/environments/*.md`** — at minimum `local.md`,
  `dev.md`, `qa.md` with URLs and login hints (no passwords).
  Also `users.md` for the test user emails (no passwords) and
  `filters.md` for common dataset queries.

The other zones (`stories/`, `bugs/`, `reviews/`, `automation/`,
`ceremonies/`, `inbox/`) populate as you do the work — don't try
to pre-fill them.

### 4. Customize the team's `AGENTS.md`

The scaffold's `teams/<slug>/AGENTS.md` is generic. Edit it to
capture **team-specific** overrides:

- Branch naming conventions for the team's automation repo
- Communication channel (Teams channel name)
- Any QA conventions the team enforces that differ from the
  default (e.g. "this team requires a Slack thread per bug, in
  addition to Jira")
- Per-team test case ID conventions if they diverge from
  `TC-<AREA>-<NNN>`

When AI tools work on files under this team, they'll read this
file *after* the root `AGENTS.md`. So team-specific overrides
win.

### 5. Run validate + build-index

```bash
node scripts/validate.mjs
node scripts/build-index.mjs
```

Confirms the scaffold is clean and INDEX files are current.

### 6. Capture your first story

```bash
node scripts/new-story.mjs <TICKET-KEY> <slug>
```

If the team is your primary, no `--team` flag needed. Otherwise
pass `--team <slug>`.

## What about removing the example-team?

The template ships with `teams/example-team/` as a learning
reference. When you onboard your real team(s), the example team
is no longer useful. You have two options:

1. **Delete it.** Simple, clean. The risk: if you forget how a
   shape should look (e.g. story.md frontmatter), you lose the
   in-repo reference. The fix: open `teams/_template-team/`
   instead.

```bash
rm -rf teams/example-team
node scripts/build-index.mjs   # refresh teams/INDEX.md
```

2. **Keep it for reference, drop from active.**

```bash
node scripts/switch-team.mjs example-team --remove
```

`/session-start` ignores it (because it's not active). The folder
sits there as documentation but doesn't clutter daily flows.

Either choice is fine. Most users delete it once they trust the
shape.

## See also

- [day-in-the-life.md](day-in-the-life.md) — what daily work
  looks like once a team is set up
- [../teams/README.md](../teams/README.md) — active-team mechanism
  details
- [team-knowledge-promotion.md](team-knowledge-promotion.md) — when
  team-local content graduates to global `knowledge/`
- [client-rotation.md](client-rotation.md) — the bigger sibling
  (engagement change rather than team change)
