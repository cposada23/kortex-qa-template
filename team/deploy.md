---
title: "Team — deploy"
type: reference
status: active
language: en
tags: [team, deploy, ci-cd]
updated: 2026-05-20
---

# Team — deploy procedures

> Replace placeholders after init. This file captures *how the
> team actually deploys*. Not the CI/CD config (that's in the SUT
> repo), but the human side.

## Environments

See [../environments/](../environments/) for technical setup.
Here we cover **deploy cadence and ownership**.

| Env | Purpose | Deploys via | Cadence | Who triggers |
|---|---|---|---|---|
| local | Per-engineer dev | Docker compose | on demand | self |
| dev | Integration shared | _<CI on merge to develop>_ | continuous | CI |
| qa | Test target | _<CI on merge to staging>_ | per sprint or on demand | QA + dev |
| prod | Live | _<release branch + manual approval>_ | per release | release manager |

## Promotion flow

```
local → dev → qa → prod
```

- Local: each engineer's Docker.
- Dev: auto-deployed on merge to the `develop` branch (or similar).
- QA: deployed at the start of each sprint or when a story is
  ready for testing. Often a manual trigger.
- Prod: cut from a release branch, manual approval, scheduled
  windows.

## When QA blocks a release

- A P0 or P1 bug surfaces in QA → escalate immediately in the
  Teams release channel.
- A test case execution finds a regression → log the bug, mark
  the story as blocked, ping dev.

## Smoke test on deploy

When QA env is freshly deployed, run the smoke test suite (from
the automation repo) before per-story testing. Path:
_<automation-repo>/tests/smoke/_.

## Release notes

- **Author:** _<who writes them>_
- **QA contribution:** _<test summary, known issues>_
- **Format / location:** _<wiki / Jira / Confluence link>_
