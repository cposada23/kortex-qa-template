# playbooks/ — Long-form workflow docs

Long-form workflows. Prompts in `.github/prompts/` are short and
invokable; these playbooks are detailed reference for cold reading
(returning after a vacation, onboarding a peer, debugging a
workflow that isn't working).

## v1.1 — full playbooks

- **[day-in-the-life.md](day-in-the-life.md)** — **start here.**
  End-to-end narrative + 15-minute happy path
- **[session-start.md](session-start.md)** — morning ritual
- **[session-end.md](session-end.md)** — end-of-day wrap
- **[story-intake.md](story-intake.md)** — new Jira ticket workflow
- **[ac-audit.md](ac-audit.md)** — wraparound for `/ac-auditor`
  (when to run, how to triage findings, common AC smells)
- **[test-case-design.md](test-case-design.md)** — coverage
  strategy and authoring
- **[team-onboarding.md](team-onboarding.md)** — scaffold + activate
  a new team folder
- **[team-knowledge-promotion.md](team-knowledge-promotion.md)** —
  when team-local content graduates to global `knowledge/`
- **[client-rotation.md](client-rotation.md)** —
  **compliance-critical** off-boarding (one clone = one client;
  rotation = wipe + new clone)

## v1.1 — stubs (write as you go)

Frontmatter-only files. Fill them in once the workflow stabilizes
through real usage.

- **[test-case-peer-review.md](test-case-peer-review.md)** —
  reviewing someone else's test cases
- **[automation-flow.md](automation-flow.md)** — staging
  automation work alongside manual execution
- **[version-snapshot.md](version-snapshot.md)** — ZIP backup
  conventions and timing

## Promotion to `knowledge/playwright/` or `knowledge/patterns/`

When a playbook section becomes a generic insight that applies
across clients, distill it into `knowledge/`. The playbook here
stays as the workflow guide; the `knowledge/` page is the
portable lesson.

## See also

- [../AGENTS.md](../AGENTS.md)
