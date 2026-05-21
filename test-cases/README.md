# test-cases/ — reusable test case library

Test cases that are useful **across multiple stories** live here.
Story-specific test cases stay inside their story's folder.

## When to promote a test case to the library

Promote when:

- The same test (or near-duplicate) is needed for a second story.
- The test verifies a stable invariant of the SUT, not a specific
  feature behavior.
- The test covers a high-value regression check.

Don't promote when:

- The test is tightly coupled to one story's specific data.
- The test is a one-off exploratory check.
- The team's test management tool (Xray/Zephyr/TestRail) is the
  better home for the cross-story version.

## Layout

```
library/
├── <area-1>/
│   ├── tc-<area>-<NN>-<slug>.md
│   └── ...
├── <area-2>/
│   └── ...
```

Areas are SUT-relative: `auth/`, `billing/`, `search/`, `cart/`,
`checkout/`, etc. Pick the smallest unit that makes sense.

## ID convention

`TC-<AREA>-<NNN>` where:

- `AREA` is the area uppercase (`AUTH`, `BILLING`, ...).
- `NNN` is a zero-padded sequential number per area.

The ID lives in the `id:` frontmatter field. Cross-references from
stories use the file path, not the ID.

## Scaffolding

```bash
node scripts/new-test-case.mjs <area> <slug>
```

Or invoke `/test-case-design` in Copilot Chat after running
`/story-analyzer`.

## See also

- [../AGENTS.md](../AGENTS.md)
- [../playbooks/test-case-design.md](../playbooks/test-case-design.md)
- [INDEX.md](INDEX.md)
