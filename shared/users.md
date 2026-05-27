---
title: "Test users"
type: reference
status: active
language: en
tags: [users, test-data]
updated: 2026-05-26
---

# Test users

> Replace placeholders after init.
>
> **No passwords in this file.** Credentials live in the client's
> shared vault (1Password, Bitwarden, Azure Key Vault, etc.).
> This file lists *which user to use for what scenario*.

Client-wide by default. If a team has its own set of users (e.g.
team-B works on a separate microservice with its own SSO realm),
override at `teams/<slug>/users.md`.

## Naming convention

Users follow: `qa+<env>+<persona>@example.client.internal`.

- `<env>` = `local`, `dev`, `qa`, `prod-readonly`
- `<persona>` = `admin`, `user`, `manager`, `viewer`, etc.

## User matrix

| Email | Env | Persona | Use for |
|---|---|---|---|
| `qa+local+admin@example.client.internal` | local | Admin | full-access scenarios |
| `qa+local+user@example.client.internal` | local | Standard user | happy-path |
| `qa+local+viewer@example.client.internal` | local | Read-only | permission tests |
| `qa+dev+admin@example.client.internal` | dev | Admin | shared integration |
| `qa+qa+admin@example.client.internal` | qa | Admin | release-ready testing |
| `qa+qa+user@example.client.internal` | qa | Standard | per-story execution |

## Where to get passwords

_<Describe the client's vault — e.g. "1Password vault 'CLIENT-X / QA'
shared item 'qa-test-users'">_.

## Resetting a test user

If you suspect a test user's data is polluted:

1. _<command or admin panel link to reset>_
2. Document the reset in the relevant story's `execution-log.md`
   so the next person isn't confused.

## Production-readonly access

_<If the client has prod-readonly accounts for QA verification, list
the policy here — when it's appropriate to use, who approves.>_

## Hard rule

Test users are not real users. **Never** use a real customer
account, even temporarily, even for "just one quick check."
