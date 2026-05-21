---
title: "Playwright — API test pattern (this codebase)"
type: playbook
status: active
language: en
tags: [automation, playwright, api, fixtures, example]
updated: 2026-05-20
---

# Playwright — API test pattern (this codebase)

> **Example automation playbook** shipped with the template.
> Replace with your client's actual API test conventions after
> running init.

## Context (this codebase)

API-level tests use Playwright's `request` context (no browser).
They live in `tests/api/` and exercise the SUT's REST endpoints
directly. Faster than UI tests, used for:

- Regression coverage of business logic
- Data setup for UI tests (creating fixture records)
- Contract-shape verification (response schemas)

## The pattern

```typescript
// tests/api/reports/list-by-date-range.spec.ts
import { test, expect } from '../../fixtures/api-fixtures';

test('TC-TEAM-EXAMPLE-001-API-01 — GET /reports with date range', async ({ apiClient }) => {
  const response = await apiClient.get('/reports', {
    params: {
      created_after: '2026-04-20',
      created_before: '2026-05-20',
    },
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.results).toBeInstanceOf(Array);
  expect(body.results.length).toBeGreaterThan(0);
  // Schema check
  for (const r of body.results) {
    expect(r).toMatchObject({
      id: expect.any(String),
      created_at: expect.any(String),
    });
    const created = new Date(r.created_at).getTime();
    expect(created).toBeGreaterThanOrEqual(new Date('2026-04-20').getTime());
    expect(created).toBeLessThanOrEqual(new Date('2026-05-20T23:59:59Z').getTime());
  }
});
```

## Fixtures

API tests use a custom `apiClient` fixture that handles
auth + base URL:

```typescript
// tests/fixtures/api-fixtures.ts
import { test as base, APIRequestContext } from '@playwright/test';

export const test = base.extend<{ apiClient: APIRequestContext }>({
  apiClient: async ({ playwright }, use) => {
    const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';
    const token = process.env.QA_API_TOKEN; // resolved from env, never hardcoded
    const ctx = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    });
    await use(ctx);
    await ctx.dispose();
  },
});

export { expect } from '@playwright/test';
```

## Conventions

- API test files mirror the URL structure:
  `tests/api/<resource>/<action>.spec.ts`.
- Test names start with the corresponding TC-ID
  (`TC-<AREA>-API-<NN>`).
- Auth: always via the `apiClient` fixture. Never `fetch()`
  directly with a hardcoded token.
- Data isolation: prefer creating data the test needs in a
  `beforeEach`, then deleting in `afterEach`. Avoid relying on
  shared fixtures that other tests can mutate.
- Schema assertions: at minimum verify the response status, top-
  level shape, and any key invariants. Don't snapshot-test the
  entire body — it's brittle.

## When to use API tests vs UI tests

- **API test:** business logic, data shape, regression of a known
  endpoint contract.
- **UI test:** user-perceived flow, visual confirmation,
  cross-component integration.
- **Both:** for high-value journeys, an API test verifies the
  contract and a UI test verifies the end-to-end (slower but
  closer to the real user).

## Related

- [playwright-page-object.md](playwright-page-object.md) — for UI
  tests.
- Portable version (across-client lessons) →
  [../../knowledge/playwright/](../../knowledge/playwright/).
