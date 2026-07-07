#!/usr/bin/env node
// validate-automation.test.mjs — TC → spec traceability check.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SCRIPT = path.join(REPO_ROOT, 'scripts', 'validate-automation.mjs');

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; process.stdout.write(`  ✓ ${msg}\n`); }
  else { failed++; process.stdout.write(`  ✗ ${msg}\n`); }
}

function run(root) {
  const r = spawnSync('node', [SCRIPT, '--root', root], { encoding: 'utf8' });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

function tc(id, { auto = 'automated', specPath = '' } = {}) {
  return `---
title: "${id}"
type: test-case
id: ${id}
area: search
level: ui
coverage: positive
status: active
automation_status: ${auto}
automation_path: "${specPath}"
linked_stories: []
review_status: not-reviewed
language: en
tags: [search]
updated: 2026-07-06
---

# ${id}
`;
}

async function buildBrain({ automationRepoPath = 'auto-repo' } = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kqa-va-'));
  await fs.mkdir(path.join(root, 'teams', 'ft', 'test-cases', 'search'), { recursive: true });
  await fs.writeFile(path.join(root, 'brain.config.json'), JSON.stringify({
    client: 'x', created: '2026-07-06', week_one_done: false,
    tms: 'none', tracker: 'none', ci: 'tbd',
    automation_repo_path: automationRepoPath,
    ctrf_report_path: 'reports/ctrf/ctrf-report.json',
  }));
  if (automationRepoPath) {
    await fs.mkdir(path.join(root, automationRepoPath, 'tests', 'search'), { recursive: true });
  }
  return root;
}

async function main() {
  process.stdout.write('validate-automation.test.mjs\n');
  process.stdout.write('============================\n\n');

  // Config empty → exit 0 with note
  {
    const root = await buildBrain({ automationRepoPath: '' });
    await fs.writeFile(
      path.join(root, 'teams', 'ft', 'test-cases', 'search', 'a.md'),
      tc('TC-SEARCH-001', { specPath: 'tests/search/a.spec.ts' }));
    const r = run(root);
    assert(r.code === 0 && /no automation repo|automation_repo_path/i.test(r.out),
      'empty automation_repo_path → exit 0 with note');
  }

  // Spec present, contains the TC id → OK
  {
    const root = await buildBrain();
    await fs.writeFile(
      path.join(root, 'auto-repo', 'tests', 'search', 'a.spec.ts'),
      "import { test } from '@playwright/test';\ntest('[TC-SEARCH-001] filters', async () => {});\n");
    await fs.writeFile(
      path.join(root, 'teams', 'ft', 'test-cases', 'search', 'a.md'),
      tc('TC-SEARCH-001', { specPath: 'tests/search/a.spec.ts' }));
    const r = run(root);
    assert(r.code === 0 && /✓/.test(r.out), 'spec exists + contains TC id → OK');
  }

  // Spec present but MISSING the id inside → automated = ERROR
  {
    const root = await buildBrain();
    await fs.writeFile(
      path.join(root, 'auto-repo', 'tests', 'search', 'a.spec.ts'),
      "test('untitled', async () => {});\n");
    await fs.writeFile(
      path.join(root, 'teams', 'ft', 'test-cases', 'search', 'a.md'),
      tc('TC-SEARCH-001', { specPath: 'tests/search/a.spec.ts' }));
    const r = run(root);
    assert(r.code === 1 && /TC-SEARCH-001/.test(r.out) && /does not (contain|mention)/i.test(r.out),
      'spec exists but lacks the TC id + automated → ERROR');
  }

  // Spec absent + automated → ERROR
  {
    const root = await buildBrain();
    await fs.writeFile(
      path.join(root, 'teams', 'ft', 'test-cases', 'search', 'a.md'),
      tc('TC-SEARCH-001', { specPath: 'tests/search/missing.spec.ts' }));
    const r = run(root);
    assert(r.code === 1 && /missing\.spec\.ts/.test(r.out),
      'spec absent + automated → ERROR (exit 1)');
  }

  // Spec absent + auto-soon → WARN only
  {
    const root = await buildBrain();
    await fs.writeFile(
      path.join(root, 'teams', 'ft', 'test-cases', 'search', 'a.md'),
      tc('TC-SEARCH-001', { auto: 'auto-soon', specPath: 'tests/search/missing.spec.ts' }));
    const r = run(root);
    assert(r.code === 0 && /⚠/.test(r.out),
      'spec absent + auto-soon → WARN, exit 0');
  }

  // Empty automation_path on a TC → simply skipped
  {
    const root = await buildBrain();
    await fs.writeFile(
      path.join(root, 'teams', 'ft', 'test-cases', 'search', 'a.md'),
      tc('TC-SEARCH-001', { specPath: '' }));
    const r = run(root);
    assert(r.code === 0, 'TC without automation_path → skipped, exit 0');
  }

  process.stdout.write(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
  process.stdout.write('✓ all validate-automation tests passed\n');
}

main().catch((err) => {
  process.stderr.write(`validate-automation.test.mjs crashed: ${err.stack}\n`);
  process.exit(1);
});
