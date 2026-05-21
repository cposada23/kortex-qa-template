# test-cases/ — single-home test repository

All test cases for this team live here, organized by area. There
is no story-local sub-folder anymore (that was the v1.5 model —
v1.6 unified to a single repository to match TestRail / Xray /
Zephyr / Qase / Azure DevOps conventions).

## Layout

```
test-cases/<area>/<slug>.md
```

`<area>` is a free-form lowercase kebab-case folder name (`auth`,
`search`, `billing`, `notifications`, ...). Scripts default the
area to "misc" if you don't pass one.

## Naming

`tc-<area>-<NNN>-<slug>.md`, e.g. `tc-auth-001-login-happy-path.md`.

## ID schema

Every test case has an immutable ID in its frontmatter:

```yaml
id: TC-AUTH-001
```

The ID is assigned at creation by `node scripts/new-test-case.mjs`
and **never changes** even if the file is renamed. Cross-references
in stories use the ID, not the path.

## Linking to stories

A test case knows which stories it covers via `linked_stories:` in
its frontmatter:

```yaml
linked_stories: [TEAM-1234, TEAM-1240]
```

A test case can be linked to multiple stories (many-to-many).
Conversely, the story's frontmatter has `linked_test_cases:
[TC-AUTH-001, ...]`. Both sides are kept in sync by `new-test-case.mjs
--link-story <TICKET>` and validated by `validate-links.mjs` on
every commit.

## Promotion ritual: GONE

In v1.5 you wrote test cases inside a story folder and "promoted"
them to a library later. v1.6 drops this: test cases are born here.
Use `status:` to track lifecycle:

- `status: draft` — being authored, not yet executed.
- `status: active` — executed and shipping to regression.
- `status: retired` — obsolete, kept for history but excluded from
  regression runs.

Regression suite composition = filter by `status: active` + tags +
areas. There is no separate regression folder.

## See also

- [Frontmatter schema](../../../.github/instructions/frontmatter.instructions.md)
- [test-case-design playbook](../../../playbooks/test-case-design.md)
- [test-case-peer-review playbook](../../../playbooks/test-case-peer-review.md)
