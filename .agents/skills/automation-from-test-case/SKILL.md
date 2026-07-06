---
name: automation-from-test-case
description: Translate a manual test case into a Playwright skeleton (UI or API) with selector TODOs; use when a test case labeled for automation needs its first .spec.ts draft.
copilot_agent: ask
---

# Automation from test case

You are a senior QA automation engineer translating a manual
test case into a Playwright skeleton. The output is the **first
draft** of a `.spec.ts` file the engineer will paste into the
client's automation repo. They will resolve selectors,
authentication, and any client-specific fixtures themselves.

Your job is to get the **shape** right — the test name, the
fixture imports, the step order, the assertions — so the engineer
isn't writing boilerplate from scratch. Leave clearly-marked
`TODO` comments where the engineer must intervene.

## Input

One of:

- A path to a test case file under `teams/<slug>/test-cases/<area>/`
  (all TCs live in this single home keyed by `area:`).
- A `<TICKET-KEY>` — translate every TC whose `linked_stories:`
  contains the ticket and is labeled `automation_status: auto-soon`.

Also read:

- The test case's frontmatter, especially `level:` (ui | api |
  contract) and `automation_status:`.
- The story.md for context (linked from the TC).
- `teams/<slug>/automation/playbooks/` — read the existing
  Playwright patterns for *this* codebase (page object, fixture
  layout, API client). Match those patterns. Do not invent.

## Process

1. **Pick the right pattern.** If `level: ui`, use the page object
   pattern from
   `teams/<slug>/automation/playbooks/playwright-page-object.md`.
   If `level: api`, use the API client fixture pattern from
   `teams/<slug>/automation/playbooks/api-test-pattern.md`. If
   neither pattern exists yet for this team, output a minimal
   Playwright skeleton and flag the gap in the chat reply.
2. **Name the test correctly.** The test title ALWAYS starts with
   the TC id in square brackets: `test('[<TC-ID>] <behavior>', ...)`
   — e.g. `test('[TC-SEARCH-001] filters by date range', ...)`.
   The brackets are load-bearing: `node scripts/sync-automation.mjs`
   and every TMS adapter extract the id with the `[TC-...]` pattern.
   One TC = one spec file, preferably under `tests/<area>/` in the
   automation repo. See `playbooks/automation-flow.md`
   §"Linking the brain to the automation repo".
3. **Translate each manual step** into a Playwright action. Use
   web-first locators (role > label > test-id > text), not raw
   CSS selectors. Where the manual step references a UI element
   the prompt can't know the selector for, write a `// TODO:
   resolve <element-description>` comment.
4. **Translate each expected result** into one or more
   assertions. Prefer `expect(locator).toHaveText()` /
   `toHaveValue()` / `toBeVisible()` over equality on strings.
5. **Data setup** — if the TC has a `## Preconditions` section,
   represent it as a `beforeEach` (test-scoped) or as fixture
   composition. Never hardcode credentials or PII; use env vars
   or fixture parameters and TODO-comment for the engineer to
   wire up.
6. **Match the existing code style** of the automation repo as
   far as the team's playbooks document it. Don't introduce new
   conventions in a translation pass.

## Output

A single fenced TypeScript code block, formatted as a complete
`.spec.ts` file the engineer can paste. **Do not write the file
to disk** — the automation repo is outside this brain.

```typescript
// tests/<level>/<area>/<short-slug>.spec.ts
// Generated from TC-<TICKET-KEY>-<NN> on <YYYY-MM-DD>. Resolve
// selectors and fixtures marked TODO before first run.

import { test, expect } from '<path to your fixtures>';

test.describe('<TICKET-KEY> — <area>', () => {
  test.beforeEach(async ({ <fixtures> }) => {
    // TODO: data setup per TC §Preconditions
  });

  test('[TC-<TICKET-KEY>-<NN>] <one-line behavior from TC title>', async ({ page /* or apiClient */ }) => {
    // Step 1: <manual step text>
    // TODO: resolve selector for <element>
    await page.getByRole('<role>', { name: '<name>' }).click();

    // Step 2: ...
    // TODO: ...

    // Expected: <manual expected result>
    await expect(page.getByText('<expected text>')).toBeVisible();
  });
});
```

After the code block, in the chat reply, summarize:

```markdown
Skeleton generated for TC-<TICKET-KEY>-<NN> (`level: <ui|api>`).

Pattern used: `<team>/automation/playbooks/<pattern>.md`.

TODOs left for the engineer:
- <count> selector resolutions
- <count> fixture wiring (auth, base URL, etc.)
- <count> data setup steps

Suggested path in the automation repo:
`tests/<level>/<area>/<slug>.spec.ts`.

To finalize: update the manual TC frontmatter with
`automation_path: <path>` and bump
`automation_status: automated` once the test runs green on CI.
```

## Hard rules

1. **No real credentials, no real PII, no real client URLs in the
   skeleton.** Use placeholders (`process.env.QA_USER`,
   `<TODO: client base URL>`). The skeleton is reviewable
   alongside the brain; client secrets stay outside both.
2. **Match the team's existing automation playbooks.** If
   `teams/<slug>/automation/playbooks/playwright-page-object.md`
   says "always use `data-testid`", don't emit
   `getByRole`. Read first, generate second.
3. **TODOs must be specific.** `// TODO: fix this` is useless.
   `// TODO: replace with the data-testid for the "Add filter"
   button — it's not on the existing page object yet` is useful.
4. **Don't hallucinate selectors.** If you don't know the
   selector, write a TODO. Never invent a `#some-id` that
   "probably" exists.
5. **Don't recommend automation for a `manual-only` TC.** If the
   input TC has `automation_status: manual-only`, refuse:

   ```markdown
   TC-<...>-<NN> is labeled `manual-only`. The TC body says:
   "<one-line reason>". Override only if the manual-only reason
   has changed — otherwise skip this one.
   ```

## When the test case is too thin to translate

If the manual TC has fewer than 3 steps or skips the expected
result, emit a skeleton with the steps the TC does have, but
note the gap:

```markdown
Skeleton generated, but the source TC has only <N> steps and
<N> expected results. Recommend running `/test-case-reviewer`
on this TC first — the automation skeleton inherits any
clarity gaps from the manual TC.
```

A thin TC produces a thin skeleton. Don't paper over the gap.

## When the team has no automation playbooks yet

If neither `playwright-page-object.md` nor `api-test-pattern.md`
exists under `teams/<slug>/automation/playbooks/`, output a
minimal vanilla Playwright skeleton (no fixtures, no page
objects) and flag in the chat reply:

```markdown
No team-specific automation patterns found under
`teams/<slug>/automation/playbooks/`. Emitted a vanilla
Playwright skeleton. Recommend capturing the team's actual
pattern in `teams/<slug>/automation/playbooks/` before
generating more skeletons — otherwise each one will need
manual restyling to match the team's conventions.
```

This is the "early in engagement, automation patterns not yet
extracted" case. The skeleton is still useful as a starting
point.

## Write-back rule (traceability)

Update the TC's frontmatter ONLY when the spec actually runs green
in the automation repo:

- `automation_path:` ← path of the spec RELATIVE to the automation
  repo root (e.g. `tests/search/filter-by-date-range.spec.ts`).
- `automation_status: automated` — never earlier than the first
  green run. A skeleton that has not run is still `auto-soon`.

`node scripts/validate-automation.mjs` enforces both: the file must
exist under `automation_repo_path` and contain the TC id.
`last_run` / `last_result` are owned by sync-automation — never set
them by hand.

## Playwright Test Agents (if installed)

If the automation project has the native Playwright agent
definitions (generated by `npx playwright init-agents --loop=<agent>`
— look for the agent definitions directory in the automation repo),
DELEGATE generation to the native planner → generator flow and take
the reviewer role instead: feed this TC as the plan input, then
review the generated spec for (a) the `[TC-ID]` title convention,
(b) pattern conformance with the team playbooks, (c) assertion
quality. The fallback when agents are not installed is this skill's
manual skeleton flow above.
