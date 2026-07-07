---
agent: agent
description: 'Create/connect the client automation repo via kortex-test init, wired to the brain: run after week-one day 2.'
---
<!-- generated from .agents/skills/automation-bootstrap/SKILL.md — DO NOT EDIT. Run: node scripts/sync-agents.mjs -->

> Context: this workflow needs WORKSPACE-WIDE context. Before acting, read AGENTS.md and every file this workflow references — do not answer from the currently open file alone.

# automation-bootstrap

Bridge the brain to a generated `kortex-test` Playwright framework.
One-time per client (re-runnable if the framework is re-created).

## Precondition

Read `brain.config.json`. `tms` and `tracker` must NOT be `tbd` — the
init flags below derive from them. If either is `tbd`, stop and send
the owner to the week-one skill, day 2 (tool inventory) first.

`kortex-test` must be installed and reachable (`kortex-test --version`
— via `npm link` from its repo or a path invocation). If it is not,
print install instructions and STOP — never fail silently:

```
git clone <kortex-test repo> && cd kortex-test
pnpm install --ignore-workspace && pnpm build && npm link
```

## Mapping table (tool inventory → init flags)

| tool-inventory | kortex-test flag |
|---|---|
| tms: octane | `--test-mgmt octane` |
| tms: xray-cloud | `--test-mgmt xray-cloud` |
| tms: testrail | `--test-mgmt testrail` |
| tms: ado / none / tbd | (omit the flag) |
| tracker: jira | `--issue-tracker jira-cloud` |
| tracker: github | `--issue-tracker github-issues` |
| team chat: teams | `--notifier teams-workflows` |
| chat: slack | `--notifier slack-webhook` |

Note: if the mapped `--test-mgmt` adapter is not yet registered in
the installed kortex-test build (check `kortex-test init --help`),
omit the flag and note it in `teams/<slug>/automation/framework.md` —
the CTRF loop works without a TMS adapter.

## Compose and run the init

Fixed defaults + flags from the table. Suggest placing the framework
as a SIBLING of the brain folder. TWO gotchas, both load-bearing:

- `--out` is the **PARENT directory** in which the project folder is
  created (the folder itself is named by `--name`). From the brain
  root, sibling placement is `--out ..` — NOT `--out ../<name>`
  (that nests `<name>/<name>/`).
- If kortex-test is installed via `npm link` (any not-from-registry
  install — today ALL of them), add `--local` so the generated
  package.json references the local build instead of the npm
  registry (without it, `pnpm install` in the generated project
  fails).

```
kortex-test init --name <client>-automation --datastore sqlite \
  --reporter ctrf-json --out .. --yes --local <flags-from-table>
```

NO `--ai` flag by default — the model is editor-driven (the owner's
agent writes specs); add an AI provider only if the client permits it.

## Post-init wiring (do ALL of these)

1. Edit `brain.config.json`: set `automation_repo_path` to the path
   chosen in `--out` (relative to the brain root or absolute) and
   confirm `ctrf_report_path` is `reports/ctrf/ctrf-report.json`
   (the generated default).
2. Create `teams/<slug>/automation/framework.md` recording: the exact
   init command used, date, adapters chosen, and how to run
   (`pnpm install`, `pnpm test`, where the CTRF lands).
3. Remind the owner of the credential env vars the chosen adapters
   need (NEVER write values into tracked files):
   - octane: `OCTANE_CLIENT_ID`, `OCTANE_CLIENT_SECRET`
   - xray-cloud: `XRAY_CLIENT_ID`, `XRAY_CLIENT_SECRET`
   - testrail: `TESTRAIL_API_KEY`
   - ado: `AZURE_DEVOPS_PAT`
   - jira-cloud: `JIRA_BASE_URL`, `JIRA_PROJECT_KEY`, `JIRA_EMAIL`, `JIRA_API_TOKEN`
   - github-issues: `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_TOKEN`
   - notifiers: `TEAMS_WEBHOOK_URL` / `SLACK_WEBHOOK_URL`
4. Run `node scripts/validate-automation.mjs` — with the repo path now
   set, it starts enforcing TC → spec traceability on every commit.
5. Frameworks generated with kortex-test ≥ v0.4.0 produce an empty
   storageState stub automatically (the auth setup writes it before
   its skip). If the framework was generated with an OLDER build and
   the first `tests/ui/` spec dies with ENOENT on
   `playwright/.auth/user.json`, stub it from the framework root:
   `mkdir -p playwright/.auth && echo '{"cookies":[],"origins":[]}' > playwright/.auth/user.json`
6. Spec layout: the generated framework organizes tests by LEVEL
   (`tests/ui|api|db|e2e/` — Playwright projects are pinned to those
   dirs). Specs from the brain's TCs go in `tests/<level>/<area>/`,
   e.g. `tests/ui/search/filter.spec.ts`. A spec outside those dirs
   is run by NO project.

## After bootstrap

- First spec: use the automation-from-test-case skill (specs are
  titled `[<TC-ID>] <behavior>` — that id is the traceability key).
- After every test run: the automation-sync skill pulls CTRF results
  back into the brain.

Details: `playbooks/automation-flow.md` §Bootstrap.
