---
title: "Environment — local"
type: reference
status: active
language: en
tags: [environment, local, docker]
updated: 2026-05-20
---

# Environment — local

> Replace placeholders after init.

## Stack

- _<services list — e.g. Postgres, Redis, app, worker>_
- Orchestrated by Docker Compose (or _<alternative>_)

## Bring up

```bash
# From the SUT repo root:
docker compose up -d
# or
make dev
```

Wait time to ready: ~_<seconds>_ before frontend is reachable.

## URLs (local)

- Frontend: http://localhost:_<port>_
- API: http://localhost:_<port>_/api
- DB (if exposed): localhost:_<port>_
- Mail catcher / dev mailer: http://localhost:_<port>_

## Login (test user)

- Default user: `qa+local@example.com`
- Password: in the team's shared vault — never here.

## Common gotchas

- Port _<X>_ conflict with another local service → `lsof -i :<X>`
  to find the offender.
- Stale DB after schema change → `docker compose down -v` then
  bring up again.
- Browser caching the wrong build → hard-reload with Cmd+Shift+R.
- First boot is slower (image pulls + migrations).

## Stopping

```bash
docker compose down       # keep data
docker compose down -v    # wipe volumes (fresh DB on next up)
```

## Logs

```bash
docker compose logs -f <service>
```

## Connecting Playwright to local

In the automation repo, set `BASE_URL=http://localhost:<port>` in
`.env.test.local` (or whatever the convention is).
