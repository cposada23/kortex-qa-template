# shared/ — Client-wide zone

Everything in `shared/` is **client-wide**: it applies to every team
the engineer works with on this client engagement. Compare to
`teams/<slug>/` where everything is **team-specific**.

## Contents

- **[environments/](environments/)** — local, dev, qa URLs, infra
  notes, "how to bring up the SUT", per env (UI / API / DB sections
  inside each file).
- **[users.md](users.md)** — test user accounts and naming convention.
  Passwords are never here.
- **[filters.md](filters.md)** — recurring test datasets, magic
  strings to find a specific scenario in the SUT's data.
- **[deploy.md](deploy.md)** — deploy cadence and ownership across
  envs (the human side, not the CI/CD config).

## Resolution rule (shared vs team override)

Most clients have one set of environments / users / filters / deploy
procedures that every team uses. That's the default — files live
here, every team reads them.

Some teams have their own (e.g. team-B works on a different
microservice with a different staging env). In that case, the team
gets **an override file at the same name** under its own folder:

| Asset | Shared default | Team override (optional) |
|---|---|---|
| local env | `shared/environments/local.md` | `teams/<slug>/environments/local.md` |
| qa users | `shared/users.md` | `teams/<slug>/users.md` |
| filters | `shared/filters.md` | `teams/<slug>/filters.md` |
| deploy | `shared/deploy.md` | `teams/<slug>/deploy.md` |

The resolver (`scripts/lib/resolve-shared.mjs`) checks the team
folder first; falls back to `shared/` if not present.

**Convention without config:** the presence of the file IS the
switch. No registry, no flag. If `teams/team-b/environments/qa.md`
exists, team-b uses it; if not, team-b reads `shared/environments/qa.md`.

## When something belongs here vs in a team folder

| Symptom | Belongs in |
|---|---|
| "All teams test against the same QA URL" | `shared/environments/` |
| "Team A and team B share the same admin users" | `shared/users.md` |
| "Team C runs on a different microservice with its own qa env" | `teams/team-c/environments/qa.md` (override) |
| "Daily stand-up format is different for team B" | `teams/team-b/ceremonies-info.md` (team-only — no shared equivalent) |
| "Stories, bugs, test cases" | Always team-specific — `teams/<slug>/{stories,bugs,test-cases}/` |

## See also

- [../AGENTS.md](../AGENTS.md) — repo-wide rules + resolution policy.
- [../teams/_template-team/AGENTS.md](../teams/_template-team/AGENTS.md) — team template (the override side).
