# environments/ — Infra zone

How to run the system under test (SUT). The environments your QA
work touches: **local**, **dev**, **qa**, and the configurations
for test users and data filters.

## Files

- **[local.md](local.md)** — Docker compose, ports, troubleshooting.
- **[dev.md](dev.md)** — dev env URL, login, what's deployed.
- **[qa.md](qa.md)** — QA env URL, login, what's deployed.
- **[users.md](users.md)** — test user accounts (no passwords).
- **[filters.md](filters.md)** — common test data filters / datasets.

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

## When environments change

The team will update infra periodically (URL changes, new
auth method, new env added). Update these files **immediately**
when you notice — stale env docs are a recurring source of
30-minute time sinks.

## See also

- [../AGENTS.md](../AGENTS.md)
- [../team/deploy.md](../team/deploy.md) — deploy cadence and
  ownership (the human side)
