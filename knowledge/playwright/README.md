# knowledge/playwright/ — Playwright tricks & patterns

Distilled lessons from real Playwright usage. Cross-client safe
(no SUT-specific code or selectors).

## What goes here

- Patterns that worked across multiple codebases (page objects,
  fixtures, auth setup, parallelization, retry strategies)
- Gotchas and workarounds you've learned (flaky-test anti-patterns,
  network-mocking pitfalls, locator strategies that aged poorly)
- Comparisons between approaches you've tried (`test.step` vs
  helper functions, soft vs hard assertions, custom fixtures vs
  global setup)
- Tooling tips that survive across projects (Playwright Inspector,
  trace viewer, codegen, parallelization knobs)

## What does NOT go here

- Code from any specific SUT or automation repo (paths, selectors,
  test IDs, business logic)
- Vendor or internal tool names

## Suggested files (create as you accumulate)

- `auth-setup-patterns.md` — how to authenticate once and reuse
- `parallel-execution-strategies.md` — workers, shards, fixtures
- `flaky-test-debugging-playbook.md` — heuristics that converge
  on the cause
- `page-object-vs-helpers.md` — when each beats the other
- `network-mocking-patterns.md` — `route.fulfill()`, fixtures
- `trace-viewer-workflow.md` — how you use it on every flake

## External references (link only)

- [Playwright official docs](https://playwright.dev/)
- [Playwright best practices](https://playwright.dev/docs/best-practices)
