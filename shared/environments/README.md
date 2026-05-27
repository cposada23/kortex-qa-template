# shared/environments/ — Infra zone (client-wide)

How to run the system under test (SUT) across the envs every team
on this client touches: **local**, **dev**, **qa**.

Each env file has the same shape internally — sections for **UI**,
**API**, and **DB** so the same file covers the full stack.

## Files

- **[local.md](local.md)** — Docker compose, ports, troubleshooting.
- **[dev.md](dev.md)** — dev env URLs, login, what's deployed.
- **[qa.md](qa.md)** — QA env URLs, login, what's deployed.

Test users and dataset filters live one level up (they're more about
*who* and *what data* than about the env itself):

- **[../users.md](../users.md)** — test user accounts (no passwords).
- **[../filters.md](../filters.md)** — common test data filters / datasets.

## Team override

If a team works against a different env (e.g. team-B owns a separate
microservice with its own qa URL), create
`teams/<slug>/environments/<env>.md` with the same shape. The
resolver picks the team override automatically.

See [../README.md](../README.md) for the full resolution rule.

## Compliance & credentials

**No real credentials in any file here.** Passwords for test users
live in a password manager (or `client-secrets/` gitignored). Real
prod credentials never enter this brain.

Acceptable in this zone:

- URLs (internal hostnames are fine for working within the client)
- Usernames (the email of the test user is not a secret in a QA
  context)
- Port numbers, Docker service names
- Steps to obtain credentials (e.g. "fetch login key from
  1Password vault `<vault-name>`")

Not acceptable:

- Password / token values in plaintext
- API keys
- Real customer data (use anonymized fixtures)

## When envs change

Update these files **immediately** when you notice a URL change, new
auth method, or new env added. Stale env docs are a recurring source
of 30-minute time sinks.
