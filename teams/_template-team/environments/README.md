# teams/<slug>/environments/ — Per-team override (optional)

By default, every team on this client uses the shared envs at
[../../../shared/environments/](../../../shared/environments/).

This folder exists **only** to host overrides — drop a file here
ONLY if your team works on a different env than the rest. The
resolver (`scripts/lib/resolve-shared.mjs`) checks this folder first
and falls back to `shared/environments/` automatically.

## When to override

Override when:
- Your team owns a separate microservice with its own dev/qa URL.
- Your team works on a fork of the SUT with different auth.
- Anything else where "the shared file is wrong for me."

Don't override when:
- The URLs match the shared file → just use shared.
- You only need to add ONE note → consider opening a PR (or git
  commit) on the shared file instead, since other teams probably
  hit the same gotcha.

## How to override

Create the file with the same shape as the shared one:

```bash
cp ../../../shared/environments/qa.md ./qa.md
# Edit ./qa.md with your team's specifics
```

The resolver picks `teams/<slug>/environments/qa.md` over
`shared/environments/qa.md` whenever both exist.

## Same pattern for users / filters / deploy

Same logic applies at the team root for these client-wide files:

| Asset | Shared | Team override |
|---|---|---|
| users | `shared/users.md` | `teams/<slug>/users.md` |
| filters | `shared/filters.md` | `teams/<slug>/filters.md` |
| deploy | `shared/deploy.md` | `teams/<slug>/deploy.md` |

Just drop the file at the team root with the same name.

## See also

- [../../../shared/README.md](../../../shared/README.md) — full
  shared vs team rule.
- [../../../AGENTS.md](../../../AGENTS.md) §"Shared vs team resolution".
