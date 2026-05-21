---
title: "Playwright — Page Object pattern (this codebase)"
type: playbook
status: active
language: en
tags: [automation, playwright, page-object, example]
updated: 2026-05-20
---

# Playwright — Page Object pattern (this codebase)

> **Example automation playbook** shipped with the template.
> Replace with your client's actual page object conventions
> after running init.

## Context (this codebase)

The automation repo follows a **lightweight Page Object** pattern.
Each page or major component has a class in `tests/page-objects/`
exposing locators and actions. Tests interact with the SUT only
through these classes — no raw `page.click(...)` in spec files.

## The pattern

```typescript
// tests/page-objects/SearchPage.ts
import type { Page, Locator } from '@playwright/test';

export class SearchPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly dateFilter: Locator;
  readonly resultList: Locator;
  readonly emptyState: Locator;
  readonly clearFilterCta: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByRole('searchbox', { name: 'Search reports' });
    this.dateFilter = page.getByTestId('date-range-filter');
    this.resultList = page.getByRole('list', { name: 'Search results' });
    this.emptyState = page.getByText(/no matches found/i);
    this.clearFilterCta = page.getByRole('button', { name: 'Clear filter' });
  }

  async goto() {
    await this.page.goto('/reports/search');
  }

  async setDateRange(start: string, end: string) {
    await this.dateFilter.locator('[name="start"]').fill(start);
    await this.dateFilter.locator('[name="end"]').fill(end);
  }

  async clearFilter() {
    await this.clearFilterCta.click();
  }
}
```

```typescript
// tests/search/filter-by-date-range.spec.ts
import { test, expect } from '@playwright/test';
import { SearchPage } from '../page-objects/SearchPage';

test('TC-TEAM-EXAMPLE-001-01 — filter by date range happy path', async ({ page }) => {
  const search = new SearchPage(page);
  await search.goto();
  await search.setDateRange('2026-04-20', '2026-05-20');
  await expect(search.resultList).toBeVisible();
  // ... assertions on result count ...
});
```

## Why

- **Stable selectors** — when the UI changes (button rename, DOM
  refactor), only the page object updates, not 30 specs.
- **Readable specs** — `search.setDateRange(...)` reads better
  than `page.locator('[data-testid="date-range-filter"] input[name="start"]').fill(...)`.
- **Action grouping** — multi-step actions (open filter, set
  dates, apply) become single methods.

## Conventions in this codebase

- One class per page or major reusable component
  (`SearchPage`, `LoginPage`, `ReportDetailsModal`).
- Locators preferred in order:
  1. `getByRole(...)` (best — accessibility-aware)
  2. `getByText(...)` (good for visible text)
  3. `getByTestId(...)` (when role/text isn't unique enough)
  4. CSS / XPath (last resort — and only when paired with a
     `data-testid` on the SUT)
- Actions return `void` unless they navigate (then return the
  new page object).

## When NOT to use a page object

- One-off helper actions that aren't part of a UI surface (API
  setup, auth tokens) — those go in fixtures, not page objects.
- Pure assertions — assertions live in specs, not page objects.

## Related

- See [api-test-pattern.md](api-test-pattern.md) for API-level
  tests.
- Portable version (across-client lessons) goes to
  [../../knowledge/playwright/](../../knowledge/playwright/)
  when patterns generalize.
