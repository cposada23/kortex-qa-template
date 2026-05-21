---
title: "Environment — dev"
type: reference
status: active
language: en
tags: [environment, dev]
updated: 2026-05-20
---

# Environment — dev

> Replace placeholders after init.

## Purpose

Shared integration environment. Auto-deployed on merge to
`develop` (or the team's equivalent branch).

## URLs

- Frontend: _<https://dev.example.client.internal>_
- API: _<https://dev.example.client.internal/api>_
- Auth provider: _<...>_

## Access

- VPN required? _<yes / no>_
- SSO? _<which provider>_
- IP allowlist? _<...>_

## Test users

See [users.md](users.md). On dev, the `qa+dev@...` set is
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
