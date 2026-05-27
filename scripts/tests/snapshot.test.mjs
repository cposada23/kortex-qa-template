#!/usr/bin/env node
// snapshot.test.mjs — verify snapshot.mjs includes critical paths.
//
// Runs against a synthetic fixture (not the live repo) so changes
// to the real working tree don't flake the test. Builds a temp
// directory shaped like a real client brain, runs snapshot.mjs
// against it via SNAPSHOT_REPO_ROOT, and asserts that .git/,
// .github/, and credential files are inside the produced archive.
//
// Run:
//   node scripts/tests/snapshot.test.mjs
//
// Exits 0 on success, 1 on failure.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SNAPSHOT_SCRIPT = path.join(REPO_ROOT, 'scripts', 'snapshot.mjs');

let passed = 0;
let failed = 0;
const failures = [];

function assert(cond, msg) {
  if (cond) {
    passed++;
    process.stdout.write(`  ✓ ${msg}\n`);
  } else {
    failed++;
    failures.push(msg);
    process.stdout.write(`  ✗ ${msg}\n`);
  }
}

async function writeFile(p, content) {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, content, 'utf8');
}

async function buildFixture() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'snapshot-test-'));

  // Minimal shape of a real client brain.
  await writeFile(path.join(dir, 'AGENTS.md'), '# fixture AGENTS\n');
  await writeFile(path.join(dir, 'README.md'), '# fixture README\n');
  await writeFile(path.join(dir, 'VERSION'), '9.9.9\n');
  await writeFile(path.join(dir, '.client-slug'), 'fixture-client\n');

  // .git directory (the bug that triggered v1.7.0 — must be inside).
  await writeFile(path.join(dir, '.git', 'HEAD'), 'ref: refs/heads/main\n');
  await writeFile(path.join(dir, '.git', 'config'), '[core]\n');
  await writeFile(path.join(dir, '.git', 'objects', 'info', 'packs'), '');

  // .github directory (Copilot Custom Instructions).
  await writeFile(path.join(dir, '.github', 'copilot-instructions.md'), '# fixture copilot\n');
  await writeFile(path.join(dir, '.github', 'prompts', 'foo.prompt.md'), '# foo\n');

  // Credentials (must be included per .snapshotignore policy).
  await writeFile(path.join(dir, '.env'), 'SECRET=test\n');
  await writeFile(path.join(dir, 'client-secrets', 'creds.env'), 'API_KEY=test\n');
  await writeFile(path.join(dir, '.cache', 'state.json'), '{}\n');

  // Paths that MUST be excluded by .snapshotignore.
  await writeFile(path.join(dir, 'versions', 'old.zip'), 'old-zip-bytes');
  await writeFile(path.join(dir, 'node_modules', 'foo', 'index.js'), 'module.exports={};');
  await writeFile(path.join(dir, '.DS_Store'), 'fake');

  // .snapshotignore (copy the real one to keep the fixture honest).
  const realIgnore = await fs.readFile(path.join(REPO_ROOT, '.snapshotignore'), 'utf8');
  await writeFile(path.join(dir, '.snapshotignore'), realIgnore);

  return dir;
}

function runSnapshot(fixtureDir) {
  // Run the COPY of snapshot.mjs we placed in the fixture, not the
  // original. snapshot.mjs derives REPO_ROOT from its own __dirname,
  // so running it from inside the fixture makes it operate on the
  // fixture rather than the real template.
  return spawnSync('node', [path.join(fixtureDir, 'scripts', 'snapshot.mjs')], {
    cwd: fixtureDir,
    encoding: 'utf8',
  });
}

function listArchive(archivePath) {
  if (archivePath.endsWith('.zip')) {
    const r = spawnSync('unzip', ['-Z1', archivePath], { encoding: 'utf8' });
    if (r.status === 0) return r.stdout.split('\n').filter(Boolean).map((l) => l.replace(/^\.\//, ''));
  }
  if (archivePath.endsWith('.tar.gz')) {
    const r = spawnSync('tar', ['-tzf', archivePath], { encoding: 'utf8' });
    if (r.status === 0) return r.stdout.split('\n').filter(Boolean).map((l) => l.replace(/^\.\//, ''));
  }
  return null;
}

async function findArchive(versionsDir) {
  const items = await fs.readdir(versionsDir);
  for (const it of items) {
    if (it.endsWith('.zip') || it.endsWith('.tar.gz')) {
      return path.join(versionsDir, it);
    }
  }
  return null;
}

async function main() {
  process.stdout.write('snapshot.test.mjs\n');
  process.stdout.write('=================\n\n');

  // The current snapshot.mjs uses a hard-coded REPO_ROOT computed from
  // its own location, which means the test fixture cannot redirect it.
  // We work around that by symlinking the script into the fixture as
  // <fixture>/scripts/snapshot.mjs. The script's REPO_ROOT resolves
  // to <fixture>/, so it operates on the fixture.
  const fixture = await buildFixture();
  process.stdout.write(`Fixture at: ${fixture}\n`);

  await fs.mkdir(path.join(fixture, 'scripts'), { recursive: true });
  await fs.copyFile(SNAPSHOT_SCRIPT, path.join(fixture, 'scripts', 'snapshot.mjs'));

  process.stdout.write('\nRunning snapshot.mjs against fixture...\n');
  const r = runSnapshot(fixture);
  if (r.status !== 0) {
    process.stdout.write('STDOUT:\n' + r.stdout + '\n');
    process.stdout.write('STDERR:\n' + r.stderr + '\n');
    assert(false, `snapshot.mjs exited 0 (got ${r.status})`);
    process.exit(1);
  }
  assert(true, 'snapshot.mjs exited 0');

  const archivePath = await findArchive(path.join(fixture, 'versions'));
  assert(archivePath !== null, 'archive was produced in versions/');
  if (!archivePath) {
    process.exit(1);
  }

  const entries = listArchive(archivePath);
  assert(entries !== null, 'archive can be listed');
  if (!entries) process.exit(1);

  // Critical: paths that MUST be inside.
  const hasPrefix = (prefix) => entries.some((e) => e === prefix || e.startsWith(prefix));
  const hasExact = (p) => entries.some((e) => e === p);

  assert(hasPrefix('.git/'), '.git/ is inside the archive');
  assert(hasExact('.git/HEAD'), '.git/HEAD specifically is inside');
  assert(hasPrefix('.github/'), '.github/ is inside the archive');
  assert(hasExact('.github/copilot-instructions.md'), '.github/copilot-instructions.md is inside');
  assert(hasExact('AGENTS.md'), 'AGENTS.md is inside');
  assert(hasExact('README.md'), 'README.md is inside');

  // Credentials policy: ARE included.
  assert(hasExact('.env'), '.env is inside (credentials policy)');
  assert(hasPrefix('client-secrets/'), 'client-secrets/ is inside (credentials policy)');
  assert(hasPrefix('.cache/'), '.cache/ is inside (recovery state)');

  // Exclusions: must NOT be inside.
  assert(!hasPrefix('versions/'), 'versions/ is NOT inside (recursion guard)');
  assert(!hasPrefix('node_modules/'), 'node_modules/ is NOT inside (size)');
  assert(!hasExact('.DS_Store'), '.DS_Store is NOT inside (OS junk)');

  // Stdout must show the verification block.
  assert(r.stdout.includes('✓ .git/ included'), 'stdout reports .git/ included');
  assert(r.stdout.includes('✓ .github/ included'), 'stdout reports .github/ included');

  // Cleanup.
  await fs.rm(fixture, { recursive: true, force: true });

  process.stdout.write(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    process.stdout.write('\nFailures:\n');
    for (const f of failures) process.stdout.write(`  - ${f}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  process.stderr.write(`test crashed: ${err.message}\n${err.stack}\n`);
  process.exit(1);
});
