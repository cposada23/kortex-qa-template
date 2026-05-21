# bugs/ — flat bug registry

All bugs for this team live here as `BUG-<NNN>-<slug>.md` files.
The folder is flat — bugs are not nested under stories. The
relationship between a bug and its parent story (if any) lives in
the bug's frontmatter:

```yaml
linked_stories: [TEAM-1234]    # empty if exploratory; many-to-many otherwise
linked_test_case: TC-AUTH-001  # optional, the TC that uncovered it
```

The story side mirrors via `linked_bugs: [BUG-001, ...]`.

## Why flat (not nested under stories)

Industry consensus (Jira, Xray, TestRail, Azure DevOps): bugs are
independent tickets. Nesting them under stories breaks the
many-to-many model — one bug can affect multiple stories (e.g., a
regression caused by an auth refactor that affects login,
password-reset, and profile-edit stories at once).

Exploratory bugs (no parent story) also live here with empty
`linked_stories: []`. Query them with:

```bash
grep -L "linked_stories: \[[A-Z]" teams/<team>/bugs/*.md
```

## ID schema

`id: BUG-NNN` — immutable. Assigned at creation by
`new-bug.mjs`. Renaming the file doesn't change the ID.

## See also

- [Frontmatter schema](../../../.github/instructions/frontmatter.instructions.md)
- [bug-report-formatter prompt](../../../.github/prompts/bug-report-formatter.prompt.md)
