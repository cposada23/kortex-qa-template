---
title: "TC-AUTH-001 — Login happy path"
type: test-case
id: TC-AUTH-001
area: auth
level: ui
coverage: positive
status: active
automation_status: auto-soon
automation_path: "../../<automation-repo>/tests/auth/login.spec.ts"
linked_stories: []
covers_ac: []
external_ids: {}
review_status: approved
language: en
tags: [auth, login, happy-path, smoke, example]
updated: 2026-05-20
---

# TC-AUTH-001 — Login happy path

## Objective

Verify that a standard user can log in with valid credentials
and lands on the home page (the canonical "session establishes
correctly" check).

## Preconditions

- **Env:** local | dev | qa (any)
- **User:** `qa+<env>+user@example.client.internal` (standard
  role; see [../../../../shared/users.md](../../../../shared/users.md))
- **Data:** the test user exists and is unlocked. If the user is
  locked, follow the reset procedure in
  [../../../../shared/users.md](../../../../shared/users.md).
- **Other:** SSO is on the default path (no MFA challenge in
  this scenario — for MFA, see TC-AUTH-002 once it exists).

## Steps

1. Given the user is on the application's login page.
2. When the user enters the test user email.
3. And enters the corresponding password (from the team's
   shared vault — never in this file).
4. And clicks "Log in".
5. Then within 3 seconds, the URL changes to the home page.
6. And the home page shows the user's name in the top-right
   profile area.
7. And the session cookie is set with the correct domain.

## Expected result

The user reaches the home page in under 3 seconds with a valid
session. The profile area confirms identity. No errors visible.

## Data setup

None — relies on the standard test user existing in the env.

## Cleanup

Log out at end of test run if running serially with other
auth-sensitive tests.

## Notes

- This is an **example library test case** shipped with the
  template — useful across many stories that depend on auth.
- The automation path is descriptive — the actual file lives in
  the automation repo opened alongside this brain.
- Pairs with TC-AUTH-002 (MFA flow), TC-AUTH-003 (locked user),
  TC-AUTH-004 (wrong password) — author those as the auth area
  grows.
