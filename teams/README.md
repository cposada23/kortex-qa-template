# teams/ — Team-scoped work

Each team you belong to (or rotate through) gets its own folder
under `teams/<team-slug>/`. The team folder contains everything
team-specific: stories, test cases, bugs, ceremonies, environments,
automation patterns, members, workflow, deploy procedures, and a
team-scoped inbox.

## Folder shape per team

```
teams/<team-slug>/
├── AGENTS.md             Team-scoped agent context (overrides root for this team)
├── README.md             Team overview (humans-first)
├── INDEX.md              Team's file map (auto-generated)
├── members.md            Roster: who, role, ping-for
├── workflow.md           Jira board, DoR, DoD, QA subtasks
├── deploy.md             How this team ships
├── ceremonies-info.md    Sprint cadence (lightweight schedule)
├── stories/              One folder per Jira ticket
├── test-cases/           Reusable test cases (library/<area>/)
├── bugs/                 Bug registry
├── reviews/              Peer reviews of others' test cases
├── ceremonies/           Meeting notes (sprint-planning/, daily-standups/, reviews/, retrospectives/)
├── environments/         Local / dev / qa setup, users, filters
├── automation/           Playwright meta-knowledge
└── inbox/                Team-specific captures
```

## Active team mechanism

The file `active-team.txt` (single file at this folder's root)
controls which team(s) are currently active.

**Single team:**
```
seis-pro-tagema
```

**Multi-team concurrent (e.g. 50/50 split or partial rotation):**
```
seis-pro-tagema
pod-8
```

Rules:

- **First line = primary.** Scaffold scripts (`new-story`, `new-bug`,
  `new-test-case`) default to the primary when `--team` is omitted.
- **All listed lines = active.** `/session-start` reads all of them
  by default. (`--team <slug>` for one. `--all` for every team in
  the repo regardless of active status.)
- **`--team <slug>` flag always overrides** the file. When in doubt,
  pass it explicitly.

Switch via:

```bash
node scripts/switch-team.mjs <slug>            # set as primary (moves to line 1)
node scripts/switch-team.mjs <slug> --add      # append as secondary
node scripts/switch-team.mjs <slug> --remove   # drop from active
node scripts/switch-team.mjs --list            # print current active list
```

### Why a file (and not env vars or branches)

Think of `teams/active-team.txt` as a **context file**, similar to
`.nvmrc`, `.tool-versions`, or `.python-version` in language
toolchains:

- You rarely edit it by hand; you run `switch-team.mjs` and let the
  script update it.
- It travels with the repo — any laptop cloning the brain sees the
  same active list without extra setup.
- The `--team` flag is the one-off override (like setting an env
  var for a single command).

It's deliberately not env-var-based (cross-machine pain), not
git-branch-based (branches are for editing modes, not team context),
and not Jira-project-based (this is a local file, no API calls).

### Known limitation: Copilot context isolation

The `applyTo` globs in `.github/instructions/` use `teams/**/...`
patterns. Copilot uses those to *apply* the right instruction file
when you edit a story under any team — that part works.

What's **not** guaranteed by the glob: Copilot reading the *correct
team's* `workflow.md` when you ask "use our team's workflow." With
multiple teams active, Copilot's `@workspace` retrieval may pull
documents from another team's folder.

Mitigation in v1.1: when invoking team-sensitive prompts (anything
that reads `workflow.md`, `members.md`, `deploy.md`, or
`environments/`), include the team slug in the prompt input:
"...for team `seis-pro-tagema`..." This forces Copilot to scope
its retrieval. Deferred to v1.2: an ephemeral
`.current-team-context.md` written by `switch-team.mjs` that
Copilot reads first.

### Optional vs always-on zones

The default team scaffold includes all 8 sub-zones, so the scripts
can assume a consistent layout. In real teams, not every zone is
used from day one:

- Some teams run retros in Jira or Miro and never keep `ceremonies/`
  in git.
- Some teams manage environments in infra repos and only need a
  lightweight `environments/README.md`.
- Some teams rarely use `inbox/` and prefer to create artifacts
  directly in their final location.

| Zone | Recommended for | Can delete if unused |
|---|---|---|
| `stories/` | Every team | No — core unit of work |
| `test-cases/<area>/` | Every team | No — single home for all TCs |
| `bugs/` | Every team | No — bug pointers needed |
| `reviews/` | Teams that do peer review | Yes |
| `ceremonies/` | Teams that capture decisions in git | Yes |
| `environments/` | Teams that own their env docs | Yes |
| `automation/` | Teams that document Playwright meta | Yes |
| `inbox/` | Teams that triage end-of-day | Yes |

If you delete an unused zone, scripts will re-create the needed
parent folder on first scaffold (`new-bug.mjs` does
`mkdir -p teams/<slug>/bugs/`).

### Copilot wiring sanity check (after a major restructure)

When you change team folder structure, confirm the Copilot
instructions still attach to the right files:

1. Open any story file under `teams/<your-team>/stories/<TICKET>/`.
2. Trigger Copilot (Chat or inline).
3. Check that Copilot's behavior reflects
   `.github/instructions/stories.instructions.md` (e.g. it
   suggests the story schema, not generic markdown).
4. Repeat for `bugs/`, `automation/`, `reviews/`, and the
   externally-bound files (`questions.md`).

If Copilot doesn't apply the right instruction, check the
`applyTo:` glob in the file. The pattern should be
`teams/**/<sub-zone>/...` — Copilot matches relative to the repo
root using glob semantics.

## Adding a new team

```bash
node scripts/new-team.mjs <slug>
```

This copies `_template-team/` to `teams/<slug>/` and stamps the
team's name into the team's own `AGENTS.md` + `README.md`. Then:

1. Fill in `teams/<slug>/members.md`
2. Fill in `teams/<slug>/workflow.md` (Jira board, DoR, DoD)
3. Fill in `teams/<slug>/deploy.md`
4. Fill in `teams/<slug>/environments/*.md` (this team's env URLs)
5. Optionally `node scripts/switch-team.mjs <slug>` to make it active

## Cross-team patterns

Some lessons span teams:

- **Team-local** (lives in `teams/<slug>/`) — anything specific to
  this team's workflow, members, environments, or SUT-specific
  patterns.
- **Cross-team** (lives in `knowledge/`) — patterns that hold true
  across multiple teams. Promote during retros or session-end when
  you notice a pattern repeating in two teams.

See [../playbooks/team-knowledge-promotion.md](../playbooks/team-knowledge-promotion.md)
for the promotion rule.

## What lives here vs root

| Type of content | Lives in |
|---|---|
| A specific Jira story you're working | `teams/<slug>/stories/<TICKET>/` |
| Test cases for that story | `teams/<slug>/test-cases/<area>/<tc-slug>.md` (single home; story refs via `linked_test_cases:` frontmatter) |
| Bug found during execution | `teams/<slug>/bugs/<BUG-NNN>.md` |
| Daily standup note | `teams/<slug>/ceremonies/daily-standups/<YYYY-MM-DD>.md` |
| Retro for the team | `teams/<slug>/ceremonies/retrospectives/<YYYY-MM-DD>.md` |
| QA env URL for this team's SUT | `teams/<slug>/environments/qa.md` |
| Playwright pattern this team uses | `teams/<slug>/automation/playbooks/<pattern>.md` |
| Generic Playwright pattern (cross-team) | `knowledge/playwright/<pattern>.md` |
| ISTQB notes | `knowledge/istqb/` (always cross-team) |
| Lessons learned across teams | `knowledge/lessons-learned.md` or `knowledge/patterns/<slug>.md` |
| Cross-team observation in capture mode | one of the team's inboxes (whichever applies) — there is **no** global root `inbox/` in v1.1 |

## Why team-centric

Previously (v1.0) everything was flat at the root: `stories/`,
`bugs/`, `ceremonies/`, etc. That meant a story for team A and a
story for team B lived as siblings in the same folder, and the only
way to tell which team owned which story was reading frontmatter.

The team-centric layout:

- Makes "what's the ceremony for this team?" a one-folder navigation.
- Makes team isolation visible (no accidental cross-team leakage of
  ceremony notes or env credentials).
- Supports both "single team for life" and "rotating across teams"
  with the same structure — single-team users just have one folder.

## See also

- [../AGENTS.md](../AGENTS.md) — overall agent context
- [../playbooks/day-in-the-life.md](../playbooks/day-in-the-life.md) —
  end-to-end narrative of a typical day
- [../playbooks/team-onboarding.md](../playbooks/team-onboarding.md) —
  how to set up a new team folder
- [active-team.txt](active-team.txt) — the active team marker
- [INDEX.md](INDEX.md) — list of teams in this repo
