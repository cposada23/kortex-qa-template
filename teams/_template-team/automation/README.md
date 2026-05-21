# automation/ — Playwright meta-knowledge

This zone holds **knowledge about** the automation effort, not
the automation code itself. The actual Playwright tests live in
the separate **automation repo** (opened alongside this brain in
the multi-root VS Code workspace).

What lives here:

- **Patterns** — page object structure, fixture conventions,
  data-setup strategies, parallelization rules.
- **Glossary** — locator naming, fixture naming, common test IDs.
- **Decisions** — why this codebase uses X over Y (e.g. why we use
  `test.step` for major user flows but not for assertions).
- **Lessons learned** — things that bit us once.

What does NOT live here:

- Executable `.ts` / `.spec.ts` files. Those live in the
  automation repo.
- Vendor credentials, real test data, environment URLs (those go
  in `environments/` or `client-secrets/`).

## Why split

Two reasons:

1. **Tool boundary.** The automation repo runs Playwright with
   real dependencies, CI, reporting. This brain is markdown only.
2. **Portability.** Patterns learned in one engagement can travel
   (via `knowledge/`); the automation code can't.

When a pattern hardens enough to be portable across clients,
distill the **insight** (not the code) into
`knowledge/playwright/<slug>.md`.

## Linking story / test case ↔ automation

In a story's local `test-cases/` or in `test-cases/library/...`,
set `automation_status: automated` and
`automation_path: ../../<automation-repo>/tests/<area>/<file>.spec.ts`
in the test case's frontmatter. The path is **descriptive** — the
brain doesn't validate that the file exists in the other repo.

## See also

- [../AGENTS.md](../AGENTS.md)
- [../playbooks/automation-flow.md](../playbooks/automation-flow.md)
  (stub in v1.0 — fill out as the automation strategy stabilizes)
- [INDEX.md](INDEX.md)
