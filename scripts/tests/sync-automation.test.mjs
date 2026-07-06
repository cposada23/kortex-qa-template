#!/usr/bin/env node
// sync-automation.test.mjs — CTRF → brain results loop.
//
// Covers: last_run/last_result updates (worst-result wins), surgical
// line-level frontmatter mutation (byte-identical everything else,
// CRLF preserved), execution-log append, unmatched + missing reports,
// and --dry-run.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SCRIPT = path.join(REPO_ROOT, 'scripts', 'sync-automation.mjs');

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; process.stdout.write(`  ✓ ${msg}\n`); }
  else { failed++; process.stdout.write(`  ✗ ${msg}\n`); }
}

function run(root, extra = []) {
  const r = spawnSync('node', [SCRIPT, '--root', root, ...extra], { encoding: 'utf8' });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

const TC_BODY = `---
title: "TC-SEARCH-001 — filter"
type: test-case
id: TC-SEARCH-001
area: search
level: ui
coverage: positive
status: active
automation_status: automated
automation_path: "tests/search/filter.spec.ts"
linked_stories: [FIX-1]
covers_ac: [AC-1, AC-2]
external_ids: {octane: "1042"}
review_status: not-reviewed
language: en
tags: [search]
updated: 2026-07-06
---

# TC-SEARCH-001 — filter

## Steps

1. Given x when y then z
`;

const GHOST_TC = TC_BODY
  .replace(/TC-SEARCH-001/g, 'TC-SEARCH-777')
  .replace('tests/search/filter.spec.ts', 'tests/search/ghost.spec.ts');

const STORY = `---
title: "FIX-1 — Search filter"
type: story
ticket: FIX-1
sprint: "2026-S27"
priority: medium
status: in-progress
ac_audit_status: done
linked_test_cases: [TC-SEARCH-001]
linked_bugs: []
review_status: not-reviewed
language: en
tags: [story]
updated: 2026-07-06
---

# FIX-1

## Acceptance criteria

### AC-1: a
x

### AC-2: b
x
`;

const EXEC_LOG = `---
title: "FIX-1 — execution log"
type: reference
status: pending
language: en
tags: [execution]
updated: 2026-07-06
---

# FIX-1 — execution log

<!-- new run blocks below -->
`;

function ctrf({ start = 1783250000000 } = {}) { // 2026-07-05T11:13Z
  return JSON.stringify({
    results: {
      tool: { name: 'playwright' },
      summary: { tests: 3, passed: 1, failed: 1, skipped: 0, start, stop: start + 60000 },
      tests: [
        { name: '[TC-SEARCH-001] filters by date range', status: 'passed', duration: 900 },
        { name: '[TC-SEARCH-001] edge: empty range', status: 'failed', duration: 400 },
        { name: 'no id in this one', status: 'passed', duration: 100 },
      ],
    },
  }, null, 2);
}

async function buildFixture({ crlfTc = false } = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kqa-sync-'));
  const team = path.join(root, 'teams', 'ft');
  const storyDir = path.join(team, 'stories', 'FIX-1-search');
  await fs.mkdir(path.join(team, 'test-cases', 'search'), { recursive: true });
  await fs.mkdir(storyDir, { recursive: true });
  const tcContent = crlfTc ? TC_BODY.replace(/\n/g, '\r\n') : TC_BODY;
  await fs.writeFile(path.join(team, 'test-cases', 'search', 'tc-search-001.md'), tcContent);
  await fs.writeFile(path.join(team, 'test-cases', 'search', 'tc-search-777.md'), GHOST_TC);
  await fs.writeFile(path.join(storyDir, 'story.md'), STORY);
  await fs.writeFile(path.join(storyDir, 'execution-log.md'), EXEC_LOG);

  await fs.mkdir(path.join(root, 'auto-repo', 'reports', 'ctrf'), { recursive: true });
  await fs.writeFile(path.join(root, 'auto-repo', 'reports', 'ctrf', 'ctrf-report.json'), ctrf());
  await fs.writeFile(path.join(root, 'brain.config.json'), JSON.stringify({
    client: 'x', created: '2026-07-06', week_one_done: false,
    tms: 'none', tracker: 'none', ci: 'tbd',
    automation_repo_path: 'auto-repo',
    ctrf_report_path: 'reports/ctrf/ctrf-report.json',
  }));
  return { root, tcPath: path.join(team, 'test-cases', 'search', 'tc-search-001.md'), logPath: path.join(storyDir, 'execution-log.md') };
}

async function main() {
  process.stdout.write('sync-automation.test.mjs\n');
  process.stdout.write('========================\n\n');

  // Full sync
  {
    const { root, tcPath, logPath } = await buildFixture();
    const before = await fs.readFile(tcPath, 'utf8');
    const r = run(root);
    assert(r.code === 0, 'sync runs clean');

    const after = await fs.readFile(tcPath, 'utf8');
    assert(/^last_run: 2026-07-05$/m.test(after), 'last_run set from the CTRF run date');
    assert(/^last_result: failed$/m.test(after), 'worst result wins (passed+failed → failed)');
    // Surgical mutation: removing the two injected lines must restore
    // the original byte-for-byte (they were inserted after id:).
    const restored = after
      .replace(/^last_run: .*\r?\n/m, '')
      .replace(/^last_result: .*\r?\n/m, '');
    assert(restored === before, 'everything except the two injected lines is byte-identical');
    assert(after.includes('external_ids: {octane: "1042"}'), 'external_ids map untouched');
    assert(after.includes('covers_ac: [AC-1, AC-2]'), 'covers_ac array untouched');

    const log = await fs.readFile(logPath, 'utf8');
    assert(/2026-07-05/.test(log) && /TC-SEARCH-001/.test(log) && /failed/.test(log) && /automated run/.test(log),
      'execution-log gains the automated-run row');

    assert(/no id in this one/.test(r.out) && /unmatched/i.test(r.out),
      'test without TC-id reported as unmatched');
    assert(/TC-SEARCH-777/.test(r.out), 'automated TC absent from CTRF is reported');
  }

  // Second sync run updates the same lines (no duplicates)
  {
    const { root, tcPath } = await buildFixture();
    run(root);
    run(root);
    const after = await fs.readFile(tcPath, 'utf8');
    assert((after.match(/^last_run:/gm) || []).length === 1, 'repeated sync keeps a single last_run line');
  }

  // CRLF preservation
  {
    const { root, tcPath } = await buildFixture({ crlfTc: true });
    const r = run(root);
    assert(r.code === 0, 'sync runs clean on CRLF file');
    const after = await fs.readFile(tcPath, 'utf8');
    assert(/last_run: 2026-07-05\r\n/.test(after), 'injected lines use CRLF when the file does');
    assert(!/[^\r]\n/.test(after.replace(/\r\n/g, '')), 'no mixed line endings introduced');
  }

  // --dry-run writes nothing
  {
    const { root, tcPath, logPath } = await buildFixture();
    const beforeTc = await fs.readFile(tcPath, 'utf8');
    const beforeLog = await fs.readFile(logPath, 'utf8');
    const r = run(root, ['--dry-run']);
    assert(r.code === 0 && /dry-run/i.test(r.out), 'dry-run runs and says so');
    assert(await fs.readFile(tcPath, 'utf8') === beforeTc, 'dry-run leaves the TC untouched');
    assert(await fs.readFile(logPath, 'utf8') === beforeLog, 'dry-run leaves the execution-log untouched');
  }

  process.stdout.write(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
  process.stdout.write('✓ all sync-automation tests passed\n');
}

main().catch((err) => {
  process.stderr.write(`sync-automation.test.mjs crashed: ${err.stack}\n`);
  process.exit(1);
});
