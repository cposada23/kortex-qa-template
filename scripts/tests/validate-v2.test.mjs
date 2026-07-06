#!/usr/bin/env node
// validate-v2.test.mjs — v2 traceability schema: covers_ac,
// external_ids, last_run/last_result vocab, AC-heading link check,
// and brain.config.json vocabularies.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const VALIDATE = path.join(REPO_ROOT, 'scripts', 'validate.mjs');
const VALIDATE_LINKS = path.join(REPO_ROOT, 'scripts', 'validate-links.mjs');

let passed = 0;
let failed = 0;
const failures = [];
function assert(cond, msg) {
  if (cond) { passed++; process.stdout.write(`  ✓ ${msg}\n`); }
  else { failed++; failures.push(msg); process.stdout.write(`  ✗ ${msg}\n`); }
}

function run(script, args) {
  const r = spawnSync('node', [script, ...args], { encoding: 'utf8' });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

const STORY_WITH_ACS = `---
title: "FIX-1 — Search filter"
type: story
ticket: FIX-1
sprint: "2026-S27"
priority: medium
status: in-progress
ac_audit_status: done
linked_test_cases: [TC-SEARCH-900]
linked_bugs: []
review_status: not-reviewed
language: en
tags: [story]
updated: 2026-07-06
---

# FIX-1 — Search filter

## Acceptance criteria

### AC-1: Filter by date range
Given ... then ...

### AC-2: Empty state
Given ... then ...
`;

const STORY_NO_ACS = STORY_WITH_ACS
  .replace(/### AC-1:[\s\S]*$/, 'Plain prose AC without structured headings.\n')
  .replace('ticket: FIX-1', 'ticket: FIX-2')
  .replace('FIX-1 — Search filter', 'FIX-2 — Legacy story');

function makeTc({ id = 'TC-SEARCH-900', covers = '[AC-1]', extra = '', stories = '[FIX-1]' } = {}) {
  return `---
title: "${id} — some check"
type: test-case
id: ${id}
area: search
level: ui
coverage: positive
status: active
automation_status: manual-only
linked_stories: ${stories}
review_status: not-reviewed
covers_ac: ${covers}
${extra}language: en
tags: [search]
updated: 2026-07-06
---

# ${id} — some check

## Steps

1. Given x when y then z
`;
}

async function buildTeamFixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kqa-v2-'));
  const stories = path.join(root, 'teams', 'fix-team', 'stories', 'FIX-1-search-filter');
  const stories2 = path.join(root, 'teams', 'fix-team', 'stories', 'FIX-2-legacy');
  const tcs = path.join(root, 'teams', 'fix-team', 'test-cases', 'search');
  await fs.mkdir(stories, { recursive: true });
  await fs.mkdir(stories2, { recursive: true });
  await fs.mkdir(tcs, { recursive: true });
  await fs.writeFile(path.join(stories, 'story.md'), STORY_WITH_ACS);
  await fs.writeFile(path.join(stories2, 'story.md'), STORY_NO_ACS);
  return { root, tcs };
}

async function main() {
  process.stdout.write('validate-v2.test.mjs\n');
  process.stdout.write('====================\n\n');

  // ---- validate.mjs field-level checks (single files in tmp) ----
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'kqa-v2-files-'));

  {
    const p = path.join(tmp, 'tc-flaky.md');
    await fs.writeFile(p, makeTc({ extra: 'last_result: flaky\n' }));
    const r = run(VALIDATE, [p]);
    assert(r.code === 1 && /last_result/.test(r.out), 'last_result: flaky → validate ERROR (vocab)');
  }
  {
    const p = path.join(tmp, 'tc-ok.md');
    await fs.writeFile(p, makeTc({ extra: 'last_result: passed\nlast_run: 2026-07-05\nexternal_ids: {octane: "1042"}\n' }));
    const r = run(VALIDATE, [p]);
    assert(r.code === 0, 'valid v2 fields (passed + date + known external id) → OK');
  }
  {
    const p = path.join(tmp, 'tc-badrun.md');
    await fs.writeFile(p, makeTc({ extra: 'last_run: 05/07/2026\n' }));
    const r = run(VALIDATE, [p]);
    assert(r.code === 1 && /last_run/.test(r.out), 'last_run not YYYY-MM-DD → validate ERROR');
  }
  {
    const p = path.join(tmp, 'tc-badac.md');
    await fs.writeFile(p, makeTc({ covers: '[AC-1, CA-9]' }));
    const r = run(VALIDATE, [p]);
    assert(r.code === 1 && /covers_ac/.test(r.out), 'covers_ac item not matching ^AC-\\d+$ → validate ERROR');
  }
  {
    const p = path.join(tmp, 'tc-unknown-ext.md');
    await fs.writeFile(p, makeTc({ extra: 'external_ids: {rally: "77"}\n' }));
    const r = run(VALIDATE, [p]);
    assert(r.code === 0 && /rally/.test(r.out) && /⚠|warn/i.test(r.out),
      'external_ids unknown key → WARN, non-blocking');
  }

  // ---- validate-links.mjs covers_ac ↔ story AC headings ----
  {
    const { root, tcs } = await buildTeamFixture();
    await fs.writeFile(path.join(tcs, 'tc-search-900.md'), makeTc({ covers: '[AC-1]' }));
    const r = run(VALIDATE_LINKS, ['--root', root]);
    assert(r.code === 0, 'covers_ac AC-1 exists as heading in linked story → OK');
  }
  {
    const { root, tcs } = await buildTeamFixture();
    await fs.writeFile(path.join(tcs, 'tc-search-900.md'), makeTc({ covers: '[AC-9]' }));
    const r = run(VALIDATE_LINKS, ['--root', root]);
    assert(r.code === 1 && /AC-9/.test(r.out) && /FIX-1/.test(r.out),
      'covers_ac AC-9 missing from every linked story → validate-links ERROR');
  }
  {
    // Story without AC headings but with a TC covering nothing → WARN only
    const { root, tcs } = await buildTeamFixture();
    await fs.writeFile(path.join(tcs, 'tc-search-900.md'),
      makeTc({ covers: '[]', stories: '[FIX-2]' }));
    const r = run(VALIDATE_LINKS, ['--root', root]);
    assert(r.code === 0 && /FIX-2/.test(r.out) && /structured AC|AC headings/i.test(r.out),
      'story without ### AC-n: headings → WARN (legacy tolerated), exit 0');
  }

  // ---- brain.config.json vocab (Task 2.4) ----
  {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kqa-v2-cfg-'));
    await fs.writeFile(path.join(root, 'brain.config.json'), JSON.stringify({
      client: 'example', created: '2026-07-06', week_one_done: false,
      tms: 'rally', tracker: 'jira', ci: 'tbd',
      automation_repo_path: '', ctrf_report_path: 'reports/ctrf/ctrf-report.json',
    }, null, 2));
    const r = run(VALIDATE, ['--root', root]);
    assert(r.code === 1 && /tms/.test(r.out) && /rally/.test(r.out),
      'brain.config tms: "rally" → validate ERROR (vocab)');
  }
  {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kqa-v2-cfg2-'));
    await fs.writeFile(path.join(root, 'brain.config.json'), JSON.stringify({
      client: 'example', created: '2026-07-06', week_one_done: true,
      tms: 'tbd', tracker: 'jira', ci: 'github-actions',
      automation_repo_path: '', ctrf_report_path: 'reports/ctrf/ctrf-report.json',
    }, null, 2));
    const r = run(VALIDATE, ['--root', root]);
    assert(r.code === 0 && /week_one_done/.test(r.out) && /tbd/.test(r.out),
      'week_one_done: true with tms: tbd → WARN, non-blocking');
  }
  {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kqa-v2-cfg3-'));
    await fs.writeFile(path.join(root, 'brain.config.json'), JSON.stringify({
      client: 'example', created: '2026-07-06', week_one_done: false,
      tms: 'tbd', tracker: 'tbd', ci: 'tbd',
      automation_repo_path: '', ctrf_report_path: 'reports/ctrf/ctrf-report.json',
    }, null, 2));
    const r = run(VALIDATE, ['--root', root]);
    assert(r.code === 0, 'fresh template config (all tbd, week_one_done false) → clean');
  }

  process.stdout.write(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    for (const f of failures) process.stdout.write(`  FAILED: ${f}\n`);
    process.exit(1);
  }
  process.stdout.write('✓ all validate-v2 tests passed\n');
}

main().catch((err) => {
  process.stderr.write(`validate-v2.test.mjs crashed: ${err.stack}\n`);
  process.exit(1);
});
