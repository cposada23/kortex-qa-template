---
name: automation-sync
description: 'Pull CTRF results into the brain (TC last_run/last_result, logs, matrix): run after every automated test run.'
---
<!-- generated from .agents/skills/automation-sync/SKILL.md — DO NOT EDIT. Run: node scripts/sync-agents.mjs -->

# automation-sync

Close the loop: automated results land back on the test cases.

## Run

```
node scripts/sync-automation.mjs            # write mode
node scripts/sync-automation.mjs --dry-run  # preview only
```

The script reads the CTRF report at `brain.config.json`'s
`ctrf_report_path` (under `automation_repo_path`), extracts TC ids
from test names (`[TC-...]`), sets each matched TC's `last_run` +
`last_result` (worst result wins when a TC appears in several tests:
failed > skipped > passed), appends an automated-run row to each
linked story's `execution-log.md`, and refreshes the INDEXes +
coverage matrix.

## Interpret the report (agent's job)

- **Unmatched tests** (no `[TC-...]` in the name): suggest annotating
  the spec title with the TC id — `test('[TC-SEARCH-001] ...')`. An
  unmatched test is invisible to the brain.
- **Automated TC absent from the CTRF**: the spec may have been
  renamed or deleted — investigate, then run
  `node scripts/validate-automation.mjs` to confirm traceability.
- **A TC flipped to `failed`**: open the linked story, check whether
  the failure reveals a product defect → if so, use the
  bug-report-formatter skill and link the bug to the story.

## Hard rules

- Never edit `last_run` / `last_result` by hand — this script owns
  those two fields.
- The script never rewrites frontmatter structure; if it reports a
  malformed-frontmatter TC, fix the TC file first.
