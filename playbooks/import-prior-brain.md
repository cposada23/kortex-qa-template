---
title: "Playbook — Import a prior QA brain"
type: playbook
status: active
language: en
tags: [playbook, import, migration, bootstrap]
updated: 2026-05-21
---

# Playbook — Import a prior QA brain

How to bulk-migrate an existing markdown-based QA brain (Obsidian
vault, plain folder of `.md` files, exported notes from another
tool) into the Kortex-QA structure without manually moving files
one at a time.

## Relationship to `scripts/import-prior-brain.mjs`

The script in
[../scripts/import-prior-brain.mjs](../scripts/import-prior-brain.mjs)
does the **work** of analysis and bulk apply. This playbook is the
**wraparound**: when to use the script, how to prepare the source,
how to triage the staging output, how to verify the import landed
cleanly, and the sanitization step you must run before importing
content from a different client engagement.

## When to use this

- You have a prior brain (folder + `.md` files) and want most of it
  inside the new Kortex-QA template structure.
- You don't want to go file-by-file ("paste this here, that there")
  — too slow for 20+ files.
- You accept that auto-classification will be imperfect and that
  some files will need manual triage afterwards.

Don't use this skill when:

- The source has fewer than ~10 files. Manual paste is faster.
- The source is from a **different client engagement** AND you haven't
  sanitized it. Per AGENTS.md §"Compliance" and the client-rotation
  playbook, only `knowledge/`-class content travels across clients.
  Bring stories, TCs, bugs, environments only if you're restoring
  the SAME client's brain on a new laptop (in which case use the
  snapshot ZIP, not this import).

## Pre-flight

1. **Confirm the source format.** The skill expects a folder of
   `.md` files (subfolders OK; walks recursively). It does NOT
   parse `.html`, `.docx`, `.pdf`, or Notion exports — convert
   those first.
2. **Confirm the new target template is initialized.** Run
   `node scripts/init.mjs <client-slug> --first-team <team-slug>`
   first if not already. See
   [client-bootstrap.md](client-bootstrap.md).
3. **(Cross-client only) Sanitize the source before import.** Run
   through the checklist in
   [client-rotation.md](client-rotation.md) §"Sanitization
   checklist" to scrub: client names, internal URLs, real Jira
   keys, screenshots that reveal client UI, test users with real
   emails. If unsure whether content is portable, default to NOT
   importing it.
4. **(Optional) Make a backup.** The script does not modify the
   source folder, but a `cp -r <source> <source>-backup-<date>`
   gives peace of mind during your first run.

## Phase 1 — Analysis

```powershell
node scripts/import-prior-brain.mjs <path-to-source-folder>
```

Example: if your prior brain lives at `~/work/old-qa-notes/`,
run:

```powershell
node scripts/import-prior-brain.mjs ~/work/old-qa-notes
```

What happens:

1. Walks the source folder recursively (skips dotfiles + node_modules).
2. Classifies each `.md` file by filename, frontmatter, body content,
   and source path. Each gets a confidence score (`high | medium |
   low | unknown`).
3. Dedupes against existing template content (compares titles + first
   500 chars of body).
4. Writes a staging plan to `imports/<source-slug>-<date>/`:

```
imports/
└── <source-slug>-<date>/
    ├── MIGRATION_PLAN.md         ← review this first
    ├── high-confidence/          ← copies of high-conf files
    ├── medium-confidence/        ← need manual triage
    ├── low-confidence/           ← need manual triage
    └── unknown-confidence/       ← genuinely couldn't classify
```

5. Prints the per-confidence counts to console.

The script does NOT touch any file outside `imports/` in this phase.
Your real template structure (`teams/`, `knowledge/`, etc.) is
untouched.

## Phase 2 — Review the migration plan

Open `imports/<source-slug>-<date>/MIGRATION_PLAN.md`. It's a
markdown table with one row per source file:

| # | source | type | confidence | reason | destination | dedupe |
|---|---|---|---|---|---|---|
| 1 | `notes/TEAM-1234-login.md` | story | high | filename + AC mention | `teams/_template-team/stories/TEAM-1234-login/story.md` | new |
| 2 | `patterns/flaky-fixtures.md` | playbook-or-pattern | high | path signal | `knowledge/patterns/flaky-fixtures.md` | new |
| 3 | `daily-notes/random.md` | loose-note | low | short, no schema | `teams/_template-team/inbox/imported/random.md` | new |

**Confidence levels:**

- **high** — strong signals match. Filename matches `TC-*` / `BUG-*`
  / `<TICKET-KEY>-*`, OR frontmatter has `type:`, OR body has
  characteristic shape (Steps: + Expected: + Actual: for bugs/TCs,
  AC mention for stories).
- **medium** — partial signals. Date-shaped filename, path under
  `ceremonies/`, or body mentions "environment" / "test user".
- **low** — short markdown with no schema. Default destination is
  the team inbox.
- **unknown** — no signals matched. Goes to `imports/unsorted/`.

**Dedupe outcomes:**

- **new** — no existing file at the destination. Will be created.
- **skip-duplicate** — destination exists AND content matches >80%.
  Will be skipped on apply.
- **skip-existing** — destination exists, content differs. Will be
  suffixed `-imported` on apply (e.g.
  `TEAM-1234-login-imported/story.md`) to avoid overwrite.

**What to look for during review:**

- Are the high-confidence classifications correct? Spot-check 3-5
  rows. If 90%+ look right, trust them.
- Are the medium/low/unknown rows actually unclassifiable, or did
  the heuristic miss a signal? If you spot a misclassification,
  note it — you'll handle that file manually in Phase 4.
- Are any destinations going to the wrong team? The default
  destination team is `_template-team` (placeholder). If you want
  imports to land in a real team, run the script after switching
  to that team via `node scripts/switch-team.mjs <slug>`, OR
  manually move files post-apply.

## Phase 3 — Apply high-confidence items

```powershell
node scripts/import-prior-brain.mjs --apply imports/<source-slug>-<date>/
```

This copies ONLY high-confidence files to their proposed destinations.
Medium / low / unknown items stay in the staging folder for manual
triage.

The script never overwrites existing files. If a destination already
exists with different content, the import is suffixed with
`-imported`.

After apply, run:

```powershell
node scripts/validate.mjs
node scripts/validate-links.mjs
node scripts/build-index.mjs
```

`validate-links.mjs` will likely surface broken links from the
imported content — these are real and worth fixing before commit
(or noting in the imports backlog).

## Phase 4 — Manual triage

For each file in `imports/<source>-<date>/medium-confidence/`,
`low-confidence/`, and `unknown-confidence/`:

1. Open it. Decide what it is (story / TC / bug / pattern /
   environment note / discardable).
2. Move it manually to the right destination, or:
3. If it's just a loose thought, paste relevant parts into
   `teams/<active>/inbox/INBOX.md` and delete the source.
4. If it's not worth keeping, delete it.

Speed: aim for 30 seconds per file. If you're stuck on one, paste
it into Copilot Chat and ask "where in Kortex-QA does this fit?".

## Phase 5 — Verify + commit

After Phases 3 + 4:

```powershell
node scripts/validate.mjs        # frontmatter clean
node scripts/validate-links.mjs  # links clean
node scripts/build-index.mjs     # INDEX files rebuilt
```

All three should pass. If `validate.mjs` flags missing frontmatter
on imported files, the source didn't have the required schema —
add it manually (or use the relevant scaffold script to create a
fresh file and copy the content over).

When clean, commit:

```powershell
git add .
git commit -m "import: prior brain from <source-name>, <N> files migrated"
```

The pre-commit hook will re-run the validators.

## Phase 6 — Clean up staging

After successful commit:

```powershell
# Remove the imports/ folder (it's gitignored, but housekeeping is good)
Remove-Item -Recurse -Force imports\<source-slug>-<date>
# Or on macOS / Linux:
# rm -rf imports/<source-slug>-<date>
```

Keep the source folder until you're confident the import is complete
and nothing valuable was missed. Delete it once you're sure.

## Hard rules

1. **No overwrite without consent.** The script will never replace
   an existing file. If destination exists with different content,
   the import is suffixed `-imported`.
2. **Cross-client = sanitize first.** Importing from a previous
   client's brain without sanitization violates AGENTS.md
   §"Compliance".
3. **Imports are gitignored until you commit.** The `imports/`
   folder is gitignored; the destination files (after apply) are
   tracked. This lets you experiment with the analysis without
   polluting git.
4. **The classifier is conservative.** It assigns `high` only when
   at least one strong signal matches. Don't expect more than ~70%
   high-confidence in a generic source; the rest is manual triage.

## When the import goes sideways

- **All files classified as `unknown`.** The source format doesn't
  match any heuristic. Either the files are too short / too freeform,
  or they use frontmatter the script doesn't recognize. Open
  `import-prior-brain.mjs` and skim the classifier — you may need
  to add a signal for your source's filename convention.
- **Heavy `skip-duplicate` count.** You're re-importing something
  already migrated. Cancel, verify, and don't re-apply.
- **Apply succeeded but build-index fails.** Some imported file has
  a malformed frontmatter. Run `validate.mjs` to find which one;
  fix or delete it.

## Related

- [../scripts/import-prior-brain.mjs](../scripts/import-prior-brain.mjs)
  — the script
- [client-bootstrap.md](client-bootstrap.md) — what to do
  immediately after import (open workspace, set active team, etc.)
- [client-rotation.md](client-rotation.md) — the sanitization
  checklist if the source is from a different client
- [test-case-design.md](test-case-design.md) — how to re-author
  imported TCs that need cleanup
