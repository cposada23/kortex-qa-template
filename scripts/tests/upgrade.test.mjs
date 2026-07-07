#!/usr/bin/env node
// upgrade.test.mjs — verify the template→brain upgrade path.
//
// Covers: framework files copied (changed + new), client zones never
// touched, debrand-on-copy, orphan reporting (never deleted),
// version-chained migrations (in-range runs, out-of-range doesn't),
// VERSION bump, dry-run writes nothing, same-version refusal,
// .code-workspace never copied, compareVersions ordering.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { runUpgrade, compareVersions, findMigrations } =
  await import(path.join(__dirname, '..', 'upgrade.mjs'));

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; process.stdout.write(`  ✓ ${msg}\n`); }
  else { failed++; process.stdout.write(`  ✗ ${msg}\n`); }
}

async function write(root, rel, content) {
  const p = path.join(root, rel);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, content);
}

async function read(root, rel) {
  return fs.readFile(path.join(root, rel), 'utf8');
}

async function exists(root, rel) {
  try { await fs.access(path.join(root, rel)); return true; } catch { return false; }
}

// Fixture: an old client brain (v9.0.0, initialized for client "acme")
// and a new template (v9.9.0) with framework changes.
async function buildFixture() {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'upgrade-test-'));
  const template = path.join(base, 'template');
  const brain = path.join(base, 'brain');

  // --- new template (v9.9.0) ---
  await write(template, 'VERSION', '9.9.0\n');
  await write(template, 'AGENTS.md', '# QA agents context v9.9 for Kortex-QA\n');
  await write(template, 'playbooks/story-intake.md', '# Story intake v9.9\nBrand check: Kortex-QA docs.\n');
  await write(template, 'scripts/hello.mjs', '// new framework tool v9.9\n');
  await write(template, 'teams/_template-team/links.md', '# links v9.9\n');
  await write(template, 'kortex-qa.code-workspace', '{ "template": true }\n');
  // in-range migration (from 9.0 >= brain 9.0, to 9.5 <= template 9.9):
  await write(template, 'scripts/migrate-v9.0-to-v9.5.mjs',
    "import { promises as fs } from 'node:fs';\nawait fs.writeFile('migrated-9.0-9.5.txt', 'ok\\n');\n");
  // out-of-range migration (from 8.0 < brain 9.0 — must NOT run):
  await write(template, 'scripts/migrate-v8.0-to-v8.5.mjs',
    "import { promises as fs } from 'node:fs';\nawait fs.writeFile('migrated-8.0-8.5.txt', 'MUST NOT EXIST\\n');\n");

  // --- old client brain (v9.0.0) ---
  await write(brain, 'VERSION', '9.0.0\n');
  await write(brain, '.client-slug', 'acme\n');
  await write(brain, 'AGENTS.md', '# QA agents context v9.0 (debranded)\n');
  await write(brain, 'playbooks/story-intake.md', '# Story intake v9.0 (old)\n');
  await write(brain, 'scripts/old-tool.mjs', '// removed upstream — orphan\n');
  await write(brain, 'teams/_template-team/links.md', '# links v9.0\n');
  // client-owned content that must survive byte-identical:
  await write(brain, 'teams/pod-1/stories/S-1/story.md', '# S-1 client story — precious\n');
  await write(brain, 'shared/users.md', '# client users — precious\n');
  await write(brain, 'sessions/20260707-0900.md', '# session log — precious\n');
  await write(brain, 'knowledge/lessons-learned.md', '# lessons — precious\n');
  await write(brain, 'brain.config.json', '{ "client": "acme", "tms": "octane" }\n');
  await write(brain, 'JOURNAL.md', '# journal — precious\n');
  await write(brain, 'acme-qa.code-workspace', '{ "client": true }\n');

  return { base, template, brain };
}

async function main() {
  process.stdout.write('upgrade.test.mjs\n================\n\n');

  // ---- compareVersions ----
  assert(compareVersions('9.0.0', '9.9.0') < 0, 'compareVersions: 9.0.0 < 9.9.0');
  assert(compareVersions('9.0', '9.0.0') === 0, 'compareVersions: 9.0 == 9.0.0');
  assert(compareVersions('10.0.0', '9.9.0') > 0, 'compareVersions: 10.0.0 > 9.9.0');

  // ---- findMigrations ----
  {
    const { template } = await buildFixture();
    const migs = await findMigrations(template, '9.0.0', '9.9.0');
    assert(migs.length === 1 && migs[0].includes('migrate-v9.0-to-v9.5'),
      'findMigrations: picks in-range migration only');
  }

  // ---- dry-run writes nothing ----
  {
    const { template, brain } = await buildFixture();
    const report = await runUpgrade(template, brain, { dryRun: true, skipSnapshot: true });
    assert(report.copies.length >= 4, 'dry-run: reports pending copies');
    assert((await read(brain, 'playbooks/story-intake.md')).includes('v9.0'),
      'dry-run: changed file NOT written');
    assert(!(await exists(brain, 'scripts/hello.mjs')), 'dry-run: new file NOT created');
    assert((await read(brain, 'VERSION')).trim() === '9.0.0', 'dry-run: VERSION untouched');
  }

  // ---- real run ----
  {
    const { template, brain } = await buildFixture();
    const report = await runUpgrade(template, brain, { skipSnapshot: true });

    // framework updated
    const intake = await read(brain, 'playbooks/story-intake.md');
    assert(intake.includes('v9.9'), 'framework: changed playbook updated');
    assert(!/Kortex-QA/.test(intake) && intake.includes('QA Brain'),
      'framework: copied file is de-branded with the brain slug');
    assert(await exists(brain, 'scripts/hello.mjs'), 'framework: new script added');
    assert((await read(brain, 'teams/_template-team/links.md')).includes('v9.9'),
      'framework: _template-team updated');
    assert((await read(brain, 'AGENTS.md')).includes('v9.9'), 'framework: root file updated');

    // client zones untouched
    assert((await read(brain, 'teams/pod-1/stories/S-1/story.md')).includes('precious'),
      'client: story untouched');
    assert((await read(brain, 'shared/users.md')).includes('precious'), 'client: shared untouched');
    assert((await read(brain, 'sessions/20260707-0900.md')).includes('precious'),
      'client: sessions untouched');
    assert((await read(brain, 'knowledge/lessons-learned.md')).includes('precious'),
      'client: knowledge untouched');
    assert((await read(brain, 'brain.config.json')).includes('octane'),
      'client: brain.config.json untouched');
    assert((await read(brain, 'JOURNAL.md')).includes('precious'), 'client: JOURNAL untouched');

    // workspace files never copied
    assert(!(await exists(brain, 'kortex-qa.code-workspace')),
      'template .code-workspace NOT copied into the brain');
    assert((await read(brain, 'acme-qa.code-workspace')).includes('client'),
      'client .code-workspace untouched');

    // orphans reported, never deleted
    assert(await exists(brain, 'scripts/old-tool.mjs'), 'orphan: file NOT deleted');
    assert(report.orphans.some((o) => o.includes('old-tool.mjs')), 'orphan: reported');

    // migrations: in-range ran, out-of-range did not
    assert(await exists(brain, 'migrated-9.0-9.5.txt'), 'migration in range ran (cwd = brain)');
    assert(!(await exists(brain, 'migrated-8.0-8.5.txt')), 'migration out of range did NOT run');
    assert(report.migrations.length === 1, 'report lists exactly 1 migration');

    // version bumped
    assert((await read(brain, 'VERSION')).trim() === '9.9.0', 'VERSION bumped to template version');
  }

  // ---- same-version refusal ----
  {
    const { template, brain } = await buildFixture();
    await write(brain, 'VERSION', '9.9.0\n');
    let threw = false;
    try { await runUpgrade(template, brain, { skipSnapshot: true }); } catch { threw = true; }
    assert(threw, 'same version → refuses to run');
  }

  // ---- brain sanity check ----
  {
    const { template, base } = await buildFixture();
    const notABrain = path.join(base, 'random-dir');
    await fs.mkdir(notABrain, { recursive: true });
    let threw = false;
    try { await runUpgrade(template, notABrain, { skipSnapshot: true }); } catch { threw = true; }
    assert(threw, 'target without VERSION/AGENTS.md → refuses to run');
  }

  process.stdout.write(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
  process.stdout.write('✓ all upgrade tests passed\n');
}

main().catch((err) => {
  process.stderr.write(`upgrade.test.mjs crashed: ${err.stack}\n`);
  process.exit(1);
});
