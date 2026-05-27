---
title: "Environment — QA"
type: reference
status: active
language: en
tags: [environment, qa]
updated: 2026-05-26
---

# Environment — QA

> Replace placeholders after init.

The dedicated test environment. Deployed at sprint start (or on
demand) for QA execution. More stable than `dev`, less so than
prod. Used by every team on this client unless one overrides at
`teams/<slug>/environments/qa.md`.

## UI

- URL: _<https://qa.example.client.internal>_
- Admin / back-office: _<https://qa-admin.example.client.internal>_
- Feature flags: _<dashboard URL>_

## API

- URL: _<https://qa.example.client.internal/api>_
- Auth: _<...>_
- API docs: _<https://qa.example.client.internal/swagger>_

## DB

- Read-only access: _<vault location / admin panel only>_
- Data shape: _<seeded from prod anonymized / synthetic fixtures>_
- Reset cadence: _<sprint-start wipe / never reset>_

## Access

- VPN required? _<yes / no>_
- SSO? _<which provider>_
- IP allowlist? _<...>_

## Test users

See [../users.md](../users.md). On QA, the `qa+qa@...` set or named
test users for specific scenarios.

## Caveats

- **Deploy windows:** _<are QA deploys scheduled? Mid-sprint?>_
- **Data shape:** is the QA DB seeded from prod (anonymized) or
  from synthetic fixtures?
- **Feature flags:** is QA on the same flag set as prod, or always
  "everything on"?

## Smoke before per-story testing

Run the smoke suite first (from the automation repo) any time the
QA env has been freshly deployed:

```bash
# From the automation repo:
pnpm playwright test tests/smoke --reporter=list
```

## Connecting Playwright to QA

`BASE_URL=https://qa.example.client.internal` in the
automation repo's `.env.test.qa`.

## Reporting environment issues

- DevOps: ping `_<who>_` in `_<channel>_`.
- Document the outage in the relevant story's `execution-log.md`
  so the test run isn't mistakenly marked as failed.
