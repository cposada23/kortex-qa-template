---
title: "Playbook — Version snapshot (ZIP)"
type: playbook
status: stub
language: en
tags: [playbook, snapshot, backup, stub]
updated: 2026-05-20
---

# Playbook — Version snapshot (ZIP)

**Status:** stub. The short version is captured inline in
[session-end.md](session-end.md) ("What 'milestone' warrants a
snapshot"). Fill this out after running snapshots through one
full sprint and seeing what the cadence should be.

## Planned content

- Cadence: routine vs milestone vs end-of-week vs end-of-sprint
- Naming conventions (the script already enforces:
  `kortex-qa-<client>-v<X.Y.Z>-<YYYYMMDD-HHMM>.zip`)
- Where to store the ZIPs (Teams archive, IT-managed backup,
  encrypted offline drive — per client policy)
- How long to retain (per client data retention rules)
- Restore procedure if you ever need to roll back

## How to fill this stub

After one sprint of running snapshots:

1. Note what events triggered each snapshot.
2. Note where each one ended up stored.
3. Note any restore events (hopefully none — but if any, what
   you learned).

This becomes the strategy summary.

## Related

- [client-rotation.md](client-rotation.md) — the off-boarding
  ritual that uses the final snapshot
- [../scripts/snapshot.mjs](../scripts/snapshot.mjs) — the script
  itself
