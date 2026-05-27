#!/usr/bin/env node
// resolve-shared.test.mjs — verify the shared/teams resolver picks
// team override when present, falls back to shared otherwise, and
// returns the right source label.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { resolveShared, resolveSharedWithSource, resolveSharedRelative } =
  await import(path.join(__dirname, '..', 'lib', 'resolve-shared.mjs'));

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
    process.stdout.write(`  ✓ ${msg}\n`);
  } else {
    failed++;
    process.stdout.write(`  ✗ ${msg}\n`);
  }
}

async function buildFixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'resolve-shared-'));

  // shared/ assets (defaults for every team)
  await fs.mkdir(path.join(root, 'shared', 'environments'), { recursive: true });
  await fs.writeFile(path.join(root, 'shared', 'environments', 'qa.md'), '# shared qa\n');
  await fs.writeFile(path.join(root, 'shared', 'environments', 'dev.md'), '# shared dev\n');
  await fs.writeFile(path.join(root, 'shared', 'users.md'), '# shared users\n');
  await fs.writeFile(path.join(root, 'shared', 'filters.md'), '# shared filters\n');
  await fs.writeFile(path.join(root, 'shared', 'deploy.md'), '# shared deploy\n');

  // teams/team-a/ — NO overrides, full fallback
  await fs.mkdir(path.join(root, 'teams', 'team-a'), { recursive: true });

  // teams/team-b/ — overrides qa env and users
  await fs.mkdir(path.join(root, 'teams', 'team-b', 'environments'), { recursive: true });
  await fs.writeFile(path.join(root, 'teams', 'team-b', 'environments', 'qa.md'), '# team-b qa OVERRIDE\n');
  await fs.writeFile(path.join(root, 'teams', 'team-b', 'users.md'), '# team-b users OVERRIDE\n');

  return root;
}

async function main() {
  process.stdout.write('resolve-shared.test.mjs\n');
  process.stdout.write('=======================\n\n');

  const root = await buildFixture();
  process.stdout.write(`Fixture at: ${root}\n\n`);

  // team-a: no overrides → all falls back to shared
  {
    const r = resolveSharedWithSource(root, 'team-a', 'environments/qa.md');
    assert(r.source === 'shared', 'team-a / qa.md → shared (no team override)');
    assert(r.path === path.join(root, 'shared', 'environments', 'qa.md'), 'team-a / qa.md returns shared path');
  }
  {
    const r = resolveSharedWithSource(root, 'team-a', 'users.md');
    assert(r.source === 'shared', 'team-a / users.md → shared (no team override)');
  }
  {
    const r = resolveSharedWithSource(root, 'team-a', 'deploy.md');
    assert(r.source === 'shared', 'team-a / deploy.md → shared');
  }

  // team-b: overrides qa env and users; dev/filters/deploy still fall back
  {
    const r = resolveSharedWithSource(root, 'team-b', 'environments/qa.md');
    assert(r.source === 'team', 'team-b / qa.md → team override');
    assert(r.path === path.join(root, 'teams', 'team-b', 'environments', 'qa.md'), 'team-b / qa.md returns team path');
  }
  {
    const r = resolveSharedWithSource(root, 'team-b', 'users.md');
    assert(r.source === 'team', 'team-b / users.md → team override');
  }
  {
    const r = resolveSharedWithSource(root, 'team-b', 'environments/dev.md');
    assert(r.source === 'shared', 'team-b / dev.md → shared (no override for dev)');
  }
  {
    const r = resolveSharedWithSource(root, 'team-b', 'filters.md');
    assert(r.source === 'shared', 'team-b / filters.md → shared (no override for filters)');
  }

  // Missing asset (neither shared nor team) → 'missing' source, path points to shared
  {
    const r = resolveSharedWithSource(root, 'team-a', 'environments/nonexistent.md');
    assert(r.source === 'missing', 'nonexistent asset → missing source');
    assert(r.path.endsWith('shared/environments/nonexistent.md'), 'missing asset points to expected shared path');
  }

  // resolveShared returns abs path; resolveSharedRelative returns repo-relative
  {
    const abs = resolveShared(root, 'team-b', 'environments/qa.md');
    const rel = resolveSharedRelative(root, 'team-b', 'environments/qa.md');
    assert(path.isAbsolute(abs), 'resolveShared returns absolute path');
    assert(rel === 'teams/team-b/environments/qa.md', `resolveSharedRelative returns POSIX rel (got: ${rel})`);
  }

  // Validation: missing args throw
  {
    let threw = false;
    try { resolveShared(); } catch { threw = true; }
    assert(threw, 'resolveShared() with no args throws');
  }
  {
    let threw = false;
    try { resolveShared(root, '', 'x'); } catch { threw = true; }
    assert(threw, 'resolveShared with empty teamSlug throws');
  }

  await fs.rm(root, { recursive: true, force: true });

  process.stdout.write(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  process.stderr.write(`test crashed: ${err.message}\n${err.stack}\n`);
  process.exit(1);
});
