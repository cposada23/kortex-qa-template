---
title: "Upgrading a client brain to a newer template version"
type: playbook
language: en
tags: [upgrade, migration, versioning, lifecycle]
updated: 2026-07-07
status: active
---

# Upgrading a client brain to a newer template version

Client brains are clones with **no git link back to the template**
(day 1 deletes `.git` and re-inits). This playbook is how template
improvements reach an already-initialized brain WITHOUT losing any
client content — stories, test cases, sessions, knowledge, config.

## The model in one paragraph

`scripts/upgrade.mjs` runs **from the NEW template copy, pointing at
the brain** — so even brains cloned before the script existed can be
upgraded. It overwrites only **framework zones** (scripts, skills,
adapters, playbooks, templates, `_template-team`, root context docs),
never touches **client zones** (`teams/<real>/`, `shared/`,
`sessions/`, `knowledge/`, `JOURNAL.md`, `brain.config.json`, `.env`,
`versions/`), chains any **per-version data migrations** the new
version ships, re-debrands what it copied, re-runs the generators and
validators, and bumps `VERSION`. Deletes nothing, ever — removed
files are reported as orphans for you to review.

## When do you need a migration script, and when not?

- **Most upgrades need nothing extra.** New skill, fixed script,
  better playbook → framework-zone copies cover it. The general
  `upgrade.mjs` is written once and handles all of these.
- **Only when a version changes the CLIENT content schema** (renames
  a TC frontmatter field, moves story folders) does that version ship
  a `scripts/migrate-v<A>-to-v<B>.mjs` (precedent:
  `migrate-v1.5-to-v1.6.mjs`, `migrate-v1.7-to-v1.8.mjs`).
  `upgrade.mjs` detects and chains every migration between the brain
  version and the template version automatically — you never run them
  by hand.

## The procedure (at the client)

1. **Get the new template version onto the machine** the same way as
   day 1 (ZIP from your private channel, USB — whatever IT permits).
   Unzip it NEXT TO the brain, not inside it:

   ```
   ~/work/acme-brain/            ← your live brain
   ~/work/template-v2.3/        ← the new template, fresh copy
   ```

2. **Commit your brain first.** The upgrade refuses a dirty tree —
   its diff must be reviewable on its own:

   ```bash
   cd ~/work/acme-brain
   git add . && git commit -m "wip: pre-upgrade checkpoint"
   ```

3. **Dry-run — see what would change, write nothing:**

   ```bash
   node ../template-v2.3/scripts/upgrade.mjs --brain . --dry-run
   ```

4. **Run it:**

   ```bash
   node ../template-v2.3/scripts/upgrade.mjs --brain .
   ```

   What happens, in order: pre-upgrade **snapshot** (your rollback),
   framework copy (`.md` files re-debranded with your client slug),
   chained migrations, `sync-agents` + `build-index` + `validate` +
   `validate-links`, VERSION bump, report.

5. **Review and commit:**

   ```bash
   git status && git diff        # the whole upgrade, reviewable
   git add . && git commit -m "upgrade: brain to template v2.3.0"
   node scripts/doctor.mjs       # sanity
   ```

6. **Orphans (if reported).** Files in framework zones that the new
   template no longer ships. The script NEVER deletes them. For each:
   your own local addition → keep it; a template leftover → delete it
   by hand.

## Rollback

The pre-upgrade snapshot in `versions/` is the rollback: unzip it
over a fresh folder and keep working. Git history also has your
pre-upgrade commit (step 2).

## Rules

- **Never run the upgrade with uncommitted work** (the script blocks
  this, but don't fight it — the reviewable-diff property is the
  whole point).
- **Never skip the snapshot** unless you are in a test sandbox
  (`--skip-snapshot` exists for the test suite, not for you).
- **Local edits to framework files get overwritten.** If you improved
  a playbook or a skill at the client, the diff at step 5 shows your
  edit being replaced — rescue it there, and bring it home to the
  template so the next version ships it properly.
- One clone = one client still holds (see
  [client-rotation.md](client-rotation.md)). Upgrading is allowed;
  reusing a brain across clients is not.
