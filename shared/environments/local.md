---
title: "Environment — local"
type: reference
status: active
language: en
tags: [environment, local, docker]
updated: 2026-05-26
---

# Environment — local

> Replace placeholders after init.

Single source of truth for what every team's local stack looks like
on this client. If a team uses a different local setup, override
this file at `teams/<slug>/environments/local.md`.

## UI

- URL: http://localhost:_<port>_
- Build / serve: `_<command — e.g. pnpm dev>_`
- Hot reload: yes / no
- Auth in local: _<bypass / local SSO / fake user>_

## API

- URL: http://localhost:_<port>_/api
- Run: `_<command>_` (usually started together with UI via Docker
  compose)
- API docs (Swagger / OpenAPI): http://localhost:_<port>_/_<docs-path>_
- Auth header for direct API calls: _<bearer / cookie / none in local>_

## DB

- Engine: _<Postgres / MySQL / Mongo / ...>_ version _<X.Y>_
- Port: _<5432 / 3306 / 27017>_
- Connection (read-only psql/mysql client): `_<command>_`
- Default credentials in local: _<documented in client-secrets/ or
  team vault — never inline>_
- Seed / migration: `_<command>_` (e.g. `make seed`)

## Stack orchestration

```bash
# From the SUT repo root:
docker compose up -d
# or
make dev
```

Wait time to ready: ~_<seconds>_ before UI is reachable.

## Stopping

```bash
docker compose down       # keep data
docker compose down -v    # wipe volumes (fresh DB on next up)
```

## Logs

```bash
docker compose logs -f <service>
```

## Test user

- Default user: `qa+local@example.com`
- Password: in the client's shared vault — never here.

See [../users.md](../users.md) for the full user matrix.

## Common gotchas

- Port _<X>_ conflict with another local service → `lsof -i :<X>`
  to find the offender.
- Stale DB after schema change → `docker compose down -v` then
  bring up again.
- Browser caching the wrong build → hard-reload with Cmd+Shift+R.
- First boot is slower (image pulls + migrations).

## Connecting Playwright to local

In the automation repo, set `BASE_URL=http://localhost:<port>` in
`.env.test.local` (or whatever the convention is).
