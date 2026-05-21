# bugs/ — Bug registry

Every bug found during execution gets a file here. Linked from the
story that surfaced it (in `stories/<TICKET>/bugs.md` or
`execution-log.md`).

## File naming

`BUG-<NNN>-<slug>.md` — sequential numbering, kebab-case slug.

The `BUG-<NNN>` is the **local** bug ID. The Jira defect (when
filed) has its own key (e.g. `TEAM-9001`). Both go in frontmatter
(`id:` for local, `jira_key:` if filed).

## Local vs Jira

For each defect:

- **Jira is the system of record for the team.** The defect status
  (open / fixed / verified) lives in Jira.
- **This file is the engineer's working record.** Richer than Jira
  (exploratory observations, repro variations, related test
  cases) but never the official source of truth.

When you file a bug in Jira, fill in `jira_key:` in the
frontmatter. Update `status:` in this file to mirror Jira state at
key transitions, but don't treat it as a separate lifecycle
tracker that can diverge.

## Lifecycle

Frontmatter `status:` values:

```
open → assigned → fixed → verified → closed
```

Plus `wontfix` (terminal) and `duplicate` (terminal, links to the
canonical bug).

## Scaffolding

```bash
node scripts/new-bug.mjs <slug>
```

Or invoke `/bug-report-formatter` in Copilot Chat — outputs both
the local file content AND a Jira-ready paste block.

## See also

- [../AGENTS.md](../AGENTS.md)
- [INDEX.md](INDEX.md)
