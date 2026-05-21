---
title: "Environment — filters & datasets"
type: reference
status: active
language: en
tags: [environment, test-data, filters]
updated: 2026-05-20
---

# Environment — filters & datasets

> Replace placeholders after init.

Recurring test datasets, filter combinations, and "the magic
strings to find a specific scenario in the SUT's data."

## Why this file exists

The SUT typically has thousands of records. Finding the one that
exercises a specific edge case (an order in dispute, a user with
a long subscription history, a refund pending) is itself a skill.
This file is where you write down "to find X, filter by Y."

## Format

Each entry: a scenario, the filter, and a freshness note (data
shifts over time).

```
### <Scenario name>

**Env:** dev | qa | local
**Where:** <admin panel / API endpoint>
**Filter:** <the exact filter string or steps>
**Last verified working:** YYYY-MM-DD
```

## Examples (placeholders)

### A user with > 12 months of subscription history

**Env:** qa
**Where:** Admin > Users
**Filter:** `subscription.created_at < "<one year ago>"` and
`status = "active"`. First page contains _<expected user email>_.
**Last verified working:** 2026-05-20

### A pending refund request

**Env:** qa
**Where:** Admin > Payments > Refunds
**Filter:** `status = "pending"` and sort by `created_at desc`.
**Last verified working:** 2026-05-20

### A locked-out account (for "forgot password" flow)

**Env:** local
**Where:** Triggered via Postgres directly
**Filter:** Set `users.failed_attempts = 6` on `qa+local+user@...`
**Last verified working:** 2026-05-20

## When a filter stops working

Data drifts. When you find a filter no longer matches:

1. Update the entry with a new filter.
2. Update `Last verified working` date.
3. If you can't find a replacement, note that — and either fix
   the data or accept that the scenario is no longer available
   in this env.
