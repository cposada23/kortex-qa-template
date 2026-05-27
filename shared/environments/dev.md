---
title: "Environment — dev"
type: reference
status: active
language: en
tags: [environment, dev]
updated: 2026-05-26
---

# Environment — dev

> Replace placeholders after init.

Shared integration environment. Auto-deployed on merge to the
team's `develop` (or equivalent) branch. Used by every team on
this client unless one overrides at `teams/<slug>/environments/dev.md`.

## UI

- URL: _<https://dev.example.client.internal>_
- Auth provider: _<SSO / local users / ...>_
- Notes: _<any quirks on this env's UI — e.g. analytics disabled,
  banner present, etc.>_

## API

- URL: _<https://dev.example.client.internal/api>_
- Auth: _<bearer obtained via SSO / shared API key in vault>_
- Rate limits: _<if any>_
- API docs: _<https://dev.example.client.internal/swagger>_

## DB

- Direct access from QA laptop: _<allowed via VPN / not allowed,
  go through admin panel>_
- Read-only credentials: _<vault location>_
- Data reset cadence: _<daily / weekly / never — affects what we
  can rely on>_

## Access

- VPN required? _<yes / no>_
- SSO? _<which provider>_
- IP allowlist? _<...>_

## Test users

See [../users.md](../users.md). On dev, the `qa+dev@...` set is
typically usable.

## Caveats

- **Data resets:** _<is dev DB wiped on schedule? Daily / weekly?>_
- **Shared state:** other engineers may be testing concurrently —
  watch for cross-pollution in shared test users.
- **Flaky on Mondays:** check Teams for any heads-up about
  weekend deploys.

## Connecting Playwright to dev

`BASE_URL=https://dev.example.client.internal` in the
automation repo's `.env.test.dev` (or similar).
