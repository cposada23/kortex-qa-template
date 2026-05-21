---
title: "Playbook — Version snapshot (ZIP)"
type: playbook
status: active
language: en
tags: [playbook, snapshot, backup]
updated: 2026-05-21
---

# Playbook — Version snapshot (ZIP)

## Relationship to `scripts/snapshot.mjs`

The script in [../scripts/snapshot.mjs](../scripts/snapshot.mjs)
does the **work** of the snapshot: it reads `VERSION`, reads
`.client-slug` (written by `init.mjs`), excludes everything in
`.snapshotignore`, and writes the archive under `versions/` with
the canonical naming
`kortex-qa-<client>-v<X.Y.Z>-<YYYYMMDD-HHMM>.zip`.

This playbook is the **wraparound**: when to take a snapshot, what
to bump the VERSION to, where to store the archive, how long to
keep it, and how to restore from one.

## Snapshots vs git — what each one is for

You have two persistence channels. They are not redundant; they
solve different problems.

| Channel | What it is | What it's for |
|---|---|---|
| Local `git` | Per-commit history inside one laptop | Daily snapshots of every change. Quick undo. Diffable. |
| ZIP under `versions/` | Self-contained archive copyable off the laptop | Cross-laptop / disaster-recovery / off-boarding. |

If your laptop dies and the disk is gone, the git log is gone.
The ZIPs are the only thing that survives — provided they live
**outside** the laptop (Teams, OneDrive for Business, IT-managed
backup, encrypted offline drive).

## Cadence — when to take a snapshot

There are four reasonable triggers. Run whichever match how this
client works.

### Sprint boundary (recommended default)

End of each sprint, after `/session-end`. Bump VERSION (see
below), then snapshot.

Rationale: a sprint is the smallest unit of stakeholder work the
client tracks. If something goes wrong, you can restore to a
sprint boundary without losing recent commits and without dragging
in mid-sprint inconsistencies.

### Milestone (additional)

After a major deliverable lands: a release, an end-of-quarter
report, a successful migration. Bump VERSION minor and snapshot,
with the milestone name in the commit message immediately before
the snapshot:

```bash
git add . && git commit -m "milestone: <name> — pre-snapshot"
node scripts/snapshot.mjs
```

### Routine (weekly)

Friday afternoon. Use the **patch** bump only if VERSION hasn't
moved that sprint; otherwise, no bump — the snapshot timestamp is
the discriminator.

### Off-boarding (mandatory)

Final snapshot before wiping the clone per
[client-rotation.md](client-rotation.md). This is the only
snapshot the client should formally receive (or have access to).
Tag the commit `final-<client>-<YYYY-MM-DD>` first so git history
also has the marker.

## Bumping VERSION before snapshot

The `VERSION` file uses SemVer. Bump rules:

- **Patch (1.0.0 → 1.0.1)** — schema unchanged, content additions
  only (new stories / TCs / bugs / reviews). Most snapshots.
- **Minor (1.0.0 → 1.1.0)** — added a new zone, a new playbook,
  or a new top-level convention. Rare during a normal engagement.
- **Major (1.0.0 → 2.0.0)** — fundamentally re-shaped the brain
  (e.g. team split, reorganization, schema migration). Very rare;
  more often this means you should clone the template anew rather
  than evolve in place.

If unsure, bump patch. The cost of an over-bumped patch is zero.

```bash
# Quick bump
echo "1.0.5" > VERSION
git add VERSION && git commit -m "version: bump to 1.0.5 for sprint-N snapshot"
node scripts/snapshot.mjs
```

## Storage — where each ZIP goes

Per client policy. The template does not assume any single
backup target.

| Backup target | When to use |
|---|---|
| Client-issued Teams archive | Default for most enterprise clients. Auditable, in-policy. |
| OneDrive for Business | When Teams archive is unavailable. Same data-residency story. |
| IT-managed backup share (`\\fileserver\qa-backups\`) | When IT has provisioned one specifically for QA artifacts. |
| Encrypted offline drive | When the client policy permits no cloud sync. Document who holds the drive. |

**Never** store the ZIP on:

- Personal cloud storage (personal Google Drive, iCloud, personal
  Dropbox). It crosses the boundary of client data.
- The laptop's `Downloads/` or `Desktop/`. These get wiped on
  decommission with no audit trail.

If you're not sure where the snapshot should live, ask the
client's IT lead or your direct manager **before** taking the
first one. A snapshot stored in the wrong place is worse than no
snapshot.

## Retention — how long to keep each ZIP

Default: keep snapshots for the engagement's data-retention
window minus 30 days (so they're gone before the client can
formally request deletion).

Typical retention windows:

- Short engagement (≤3 months): keep all snapshots until 30 days
  post-off-boarding.
- Medium engagement (3–12 months): keep monthly + sprint boundary
  + milestone snapshots. Roll up the weekly routine ones.
- Long engagement (>12 months): keep one per month + all
  milestones. Roll up everything else into the most recent
  monthly.

The client's data-retention policy overrides any of this. Ask
for it during onboarding (or as part of the
[client-rotation playbook](client-rotation.md) sanitization).

## Restore — when you actually need to roll back

This is rare, but plan for it.

### From git (same laptop)

```bash
git log --oneline | grep -F "<keyword>"
git checkout <SHA> -- <path>      # restore one path
git checkout <SHA>~1               # detached HEAD, inspect
git reset --hard <SHA>             # DANGER — last resort
```

`git reset --hard` is destructive; only run after you've verified
no uncommitted work is at risk.

### From ZIP (new laptop, or unrecoverable git)

```bash
# 1. Pull the latest ZIP from the backup target.
# 2. Unzip into ~/work/<client>/.
unzip kortex-qa-<client>-v<X.Y.Z>-<YYYYMMDD-HHMM>.zip -d ~/work/<client>/
cd ~/work/<client>

# 3. Re-init git locally (the ZIP intentionally excludes .git via .snapshotignore).
git init && git add . && git commit -m "restore: from snapshot v<X.Y.Z>-<YYYYMMDD-HHMM>"

# 4. (Optional) If you have a more recent ZIP, repeat with that one
#    and let the file-level merge happen by hand.
```

After any restore, the **first action** is to run
`node scripts/validate.mjs` and confirm `node
scripts/build-index.mjs` produces a clean INDEX. A corrupted
restore that passes both is functionally healthy.

### After restore — note in JOURNAL

```markdown
## YYYY-MM-DD — RESTORE
Restored from `kortex-qa-<client>-v<X.Y.Z>-<timestamp>.zip` (Teams
archive). Reason: laptop replaced; previous machine
decommissioned. Validation + INDEX rebuild green. No data loss.
```

## Smoke check before you walk away

After every snapshot, eyeball:

1. **The file exists** — `ls -lh versions/` shows non-zero size.
2. **The file opens** — quickly `unzip -l <file>.zip` (or `tar
   -tzf <file>.tar.gz`) and confirm the contents look right.
3. **Excludes ran** — verify `.cache/`, `node_modules/`, `*.env`,
   `client-secrets/` are NOT in the listing.

A snapshot you didn't verify is a snapshot you can't trust.

## Related

- [../scripts/snapshot.mjs](../scripts/snapshot.mjs) — the script
- [../.snapshotignore](../.snapshotignore) — exclusion list (mirror
  of `.gitignore` for the most part, plus `.git/` itself)
- [client-rotation.md](client-rotation.md) — uses the final
  off-boarding snapshot
- [session-end.md](session-end.md) — captures the "milestone
  warrants a snapshot" rule of thumb at session granularity
