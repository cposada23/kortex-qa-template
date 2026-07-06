---
title: "Playbook — Automation flow"
type: playbook
status: active
language: en
tags: [playbook, automation, playwright]
updated: 2026-05-21
---

# Playbook — Automation flow

## Bootstrap — creating the automation repo (v2)

The automation-bootstrap skill creates or connects the client's
Playwright framework via `kortex-test init`, deriving adapter flags
from `brain.config.json` (`tms`/`tracker` — filled during week-one
day 2) and wiring the CTRF loop back into the brain:

1. Precondition: `tms`/`tracker` not `tbd`; `kortex-test` installed.
2. `kortex-test init --name <client>-automation --datastore sqlite
   --reporter ctrf-json --out <sibling dir> --yes` + mapped flags.
3. Post-init: set `automation_repo_path` in `brain.config.json`,
   record the command in `teams/<slug>/automation/framework.md`,
   export the credential env vars the adapters need.
4. From then on: specs titled `[<TC-ID>] ...` produce CTRF at
   `reports/ctrf/ctrf-report.json`; `node scripts/sync-automation.mjs`
   (the automation-sync skill) pulls results back into TC
   `last_run`/`last_result`, execution logs, and the coverage matrix;
   `node scripts/validate-automation.mjs` blocks drift at commit time.

## Relationship to `/automation-from-test-case`

The `/automation-from-test-case` Copilot prompt in
[../.github/prompts/automation-from-test-case.prompt.md](../.github/prompts/automation-from-test-case.prompt.md)
does the **work** of translating one manual test case into a
Playwright skeleton (UI or API depending on the TC's `level:`
field). It reads the TC's steps and expected results, picks the
right fixture, and emits a `.spec.ts` file with TODOs for the
selector-resolution work only a human with SUT access can finish.

This playbook is the **wraparound**: the decisions that surround
that translation. When to automate at all, when to keep the test
manual, how to stage the automation work inside the sprint, how
to keep the brain and the automation repo in sync, and which
patterns belong here vs in the portable `knowledge/` zone.

## The first question — should this test case be automated?

Not every test case earns an automation slot. Apply the
three-question filter:

1. **Will this run more than three times?** If no — keep manual.
   The setup cost is rarely recovered.
2. **Is the SUT behavior under test stable?** If the underlying
   feature is mid-redesign, automate later. Otherwise you'll
   pay maintenance cost on every redesign iteration.
3. **Can a human observe what an automation can't?** Visual
   layout, perceived performance, ambiguous error states,
   accessibility-with-screen-reader — these are stronger as
   manual + exploratory than as automation.

If all three answers point toward automation, label the TC
`auto-soon` in its frontmatter (`automation_status: auto-soon`).
If at least one points the other way, label `manual-only` and
write a one-sentence reason in the TC body.

## When to automate — three plausible cadences

The team's velocity and ticket-shape determine which one fits.

### Cadence A — same sprint as the feature (ideal)

The team writes the feature, the QA designs test cases, and the
QA writes the automation, all within one sprint. The story closes
with both manual TCs and automated coverage.

When it works: small features, mature SUT, automation framework
in good health. The team's velocity has room for the QA's
automation hours.

Risk: automation written under sprint pressure tends to be
brittle. Mitigation — keep automation work to test cases labeled
`auto-soon` only, and let `auto-eventually` ones wait.

### Cadence B — next sprint after manual execution (common)

The story closes with manual TC execution only. The next sprint
opens with an `AUTO-<NN>` story dedicated to writing the
Playwright for it.

When it works: most teams. Lets the SUT behavior settle for a
sprint, gives the QA time to design clean automation.

Risk: backlog drift. The `AUTO-` story can age. Mitigation —
treat aging `AUTO-` stories as bugs against your own coverage,
not as nice-to-haves.

### Cadence C — batched into a "coverage" sprint (rare, deliberate)

Every N sprints, the team allocates a sprint (or a slice of it)
to automation backfill. Multiple `AUTO-` stories executed together.

When it works: when the team has a known automation coverage gap
and wants to close it on purpose.

Risk: long context-loss between feature design and automation
write-up. Mitigation — only batch test cases that have been
manually re-executed in the previous 2 sprints, so the QA
remembers the behavior.

## Staging automation work — how it shows up in Jira

Whichever cadence the team uses, the automation work has a
**ticket trail** in Jira. The brain's `automation/` zone is the
private workbench, not the registry.

Two ticket shapes work:

### Shape 1 — automation sub-task on the original story

```
TEAM-1234   Story  — date-range filter on reports
└── TEAM-1234-1   Sub-task — write Playwright for TC-SEARCH-001..003
```

Best for Cadence A. The sub-task is the deliverable. The QA
links it to the brain via the TC's frontmatter
`automation_path:`.

### Shape 2 — standalone `AUTO-` story

```
AUTO-87     Story  — automate date-range filter on reports
            (covers TEAM-1234 TC-SEARCH-001..003)
```

Best for Cadences B and C. The `AUTO-` story has its own
estimation, its own AC ("the listed TCs run green on
CI", "coverage report shows ≥X%"), its own review.

The brain stores the link both ways:

- On the original `story.md` → `automation_story: AUTO-87`.
- On the `AUTO-87` story (if you also track it in the brain) →
  `automates: [TEAM-1234]`.

## Linking the brain to the automation repo

The brain and the automation repo are two separate repos. The
link between them is **frontmatter discipline** in the brain plus
**TC-ID-in-the-test-name** discipline in the automation repo.

### Frontmatter on the manual TC

The TC lives at `teams/<team>/test-cases/<area>/tc-<area>-<NNN>-<slug>.md`
(v1.6 single home — no `library/` subfolder, no per-story copy):

```yaml
---
id: TC-SEARCH-001                # immutable
title: "filter by date range"
type: test-case
area: search
linked_stories: [TEAM-1234]      # canonical many-to-many link
automation_status: auto-soon | auto-eventually | automated | manual-only
automation_path: tests/ui/reports/filter-by-date-range.spec.ts   # relative to automation repo root
automation_story: TEAM-1234-1   # the Jira ticket that owns the automation work
---
```

### Test name in the automation file

```typescript
test('TC-SEARCH-001 — filter by date range', async ({ page }) => { ... });
```

Why test names matter: when a CI run fails, the QA can grep the
brain for the TC-ID and find the manual steps, the expected
results, and any open questions on the original story — without
opening Jira.

When the TC moves from `auto-soon` to `automated`, bump the
frontmatter and add a `## Automation` H2 to the TC noting the
commit SHA where the automation landed:

```markdown
## Automation

- File: `tests/ui/reports/filter-by-date-range.spec.ts`
- First green: 2026-05-21 (commit `a1b2c3d` in `acme-automation`)
- Story: TEAM-1234-1
```

## Smoke vs regression vs feature suites — who owns flakes

The team's automation suite likely has multiple suites. As QA on
this client, the owner needs a clear stance on each one:

| Suite | When it runs | Who owns flakes | Brain involvement |
|---|---|---|---|
| Smoke | Every PR | The PR author (or QA-on-rotation) | Flakes captured as bugs in `teams/<slug>/bugs/`; if recurring, promoted to `knowledge/patterns/playwright-flakes.md` |
| Regression | Nightly or per-release | QA team | Same |
| Feature | While a story is in flight | The story's QA | Captured only if it surfaces a real bug; flakes during development don't need a Jira ticket |

Establish "who owns flakes" with the dev team in week 1. The
default answer ("QA owns them all") burns out the QA and is rarely
the right call.

## Playwright patterns — local vs portable

The brain has two layers for Playwright knowledge:

- **`teams/<slug>/automation/playbooks/*.md`** — patterns specific
  to **this client's** codebase (page object shape, fixture
  layout, auth flow, CI quirks). Tied to the team's repo.
- **`knowledge/playwright/*.md`** — patterns **portable across
  clients** (anti-flake heuristics, when to use `request` vs
  `page`, locator priority, etc.). Cross-team, cross-client, and
  must be sanitized of any client-specific reference.

Promotion path: when the same pattern shows up across two clients
(or two teams within a client), promote it from team-scoped to
`knowledge/`. The
[team-knowledge-promotion playbook](team-knowledge-promotion.md)
walks through the sanitization checklist.

## Common automation anti-patterns (cheat sheet)

| Smell | What goes wrong | Fix |
|---|---|---|
| Hard-coded `await page.waitForTimeout(N)` | Slow + flaky. Either too short (race) or too long (idle waste). | Wait for a specific element state. |
| Selector by class only (`.btn-primary`) | Breaks when designers re-skin. | Prefer `data-testid` or role-based locators. |
| Shared state across tests | One test pollutes another. Order-dependent failures. | Independent setup per test. Even if slower. |
| API call hardcoded inside the test | Auth token in the file, base URL not configurable. | Move to a fixture; read env. |
| Asserting the entire response body | Brittle to backend additions. | Assert only the keys + invariants the TC actually requires. |
| `page.goto` to relative URLs | Test depends on `baseURL` being set correctly. | Either always absolute, or always relative-with-baseURL config; not mixed. |
| Login in every test | Slow. Burns auth quotas in some SUTs. | `storageState` once, reuse across tests. |

## When you (as QA) push back on automation

Sometimes the team will pressure the QA to automate something
that shouldn't be automated. Use one of these phrasings:

> "This one's a manual-only — visual perception isn't something
> an automation will catch. I'll add it to the smoke regression
> as a manual check we run on the release branch."

> "Happy to automate it next sprint once the SUT stops moving.
> Right now it's costing 2× rewrites per sprint."

> "I'd rather automate the API behind this view — it covers the
> same regression risk and won't break when we re-skin the page."

The brain is your evidence base. When you push back, point to the
TC's `manual-only` label and the one-sentence reason in the TC
body.

## Related

- [test-case-design.md](test-case-design.md) — where the TC
  decides its `automation_status:` label
- [test-case-peer-review.md](test-case-peer-review.md) — peer
  review covers automation feasibility as one of the five
  rubric dimensions
- [team-knowledge-promotion.md](team-knowledge-promotion.md) —
  how `automation/` patterns become `knowledge/` patterns
- [../.github/prompts/automation-from-test-case.prompt.md](../.github/prompts/automation-from-test-case.prompt.md)
  — the prompt that generates the Playwright skeleton
- `teams/<slug>/automation/playbooks/` — team-specific patterns
- `knowledge/playwright/` — portable patterns
