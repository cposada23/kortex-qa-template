#!/usr/bin/env node
// session-branch.test.mjs — guards v1.8 session-branch + session-log creation.
//
// Covers the adversarial review's findings:
//   #2  the session file is created atomically WITH the branch (creating it
//       first would dirty the tree and abort the branch guard).
//   #3  open/closed is explicit frontmatter (scanned, not inferred from mtime).
//   #4  slug is length-capped and empty-slug inputs degrade safely.
//
// Run: node scripts/tests/session-branch.test.mjs

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SCRIPT = path.join(REPO_ROOT, 'scripts', 'session-branch-start.mjs');

let passed = 0;
let failed = 0;
const failures = [];
function assert(cond, msg) {
  if (cond) { passed++; } else { failed++; failures.push(msg); }
}

const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'kqa-branch-'));
// Point the script's REPO_ROOT at the temp repo BEFORE importing it.
process.env.KORTEX_SESSION_ROOT = tmpRoot;
const mod = await import(pathToFileURL(SCRIPT).href);

// --- slugify: cap + empty degradation (#4) ---
assert(mod.slugify('Flaky Test!!!') === 'flaky-test', 'slugify normalizes to kebab');
assert(mod.slugify('🔥💯') === '', 'emoji-only slug degrades to empty (no crash)');
assert(mod.slugify('两个中文') === '', 'CJK-only slug degrades to empty');
const long = mod.slugify('a'.repeat(120));
assert(long.length <= 40, `slug capped at 40 (got ${long.length})`);
assert(!long.endsWith('-'), 'capped slug has no trailing dash');

// --- ensureSessionFile: creates type:session/status:open, idempotent (#3) ---
const r1 = mod.ensureSessionFile('session/20260604-0930-demo');
assert(r1.created === true, 'first ensureSessionFile creates the file');
const filePath = path.join(tmpRoot, 'sessions', '20260604-0930-demo.md');
const body = await fs.readFile(filePath, 'utf8');
assert(/^type: session$/m.test(body), 'session file has type: session');
assert(/^status: open$/m.test(body), 'session file starts status: open');
assert(/^branch: session\/20260604-0930-demo$/m.test(body), 'session file records its branch');
const r2 = mod.ensureSessionFile('session/20260604-0930-demo');
assert(r2.created === false, 'second ensureSessionFile is idempotent (no overwrite)');

// --- end-to-end: branch + file created together from a clean main (#2) ---
function git(args) {
  return spawnSync('git', args, { cwd: tmpRoot, encoding: 'utf8' });
}
git(['init', '-q']);
git(['config', 'user.email', 'test@example.com']);
git(['config', 'user.name', 'Test']);
git(['checkout', '-q', '-B', 'main']);
await fs.writeFile(path.join(tmpRoot, 'seed.md'), '# seed\n');
git(['add', '-A']);
git(['commit', '-q', '-m', 'seed']);

const run = spawnSync('node', [SCRIPT, 'Login Bug'], {
  cwd: tmpRoot,
  encoding: 'utf8',
  env: { ...process.env, KORTEX_SESSION_ROOT: tmpRoot },
});
assert(run.status === 0, `session-branch-start exits 0 on clean main (got ${run.status}: ${run.stderr})`);
const branch = git(['branch', '--show-current']).stdout.trim();
assert(/^session\/\d{8}-\d{4}-login-bug$/.test(branch), `created a session branch (got "${branch}")`);
const id = branch.replace('session/', '');
const created = await fs.access(path.join(tmpRoot, 'sessions', `${id}.md`)).then(() => true).catch(() => false);
assert(created, 'the session log file matching the branch id exists');
// the working tree should NOT be clean now (the session file is uncommitted) —
// which proves the file was created AFTER the branch (else the branch guard
// would have aborted on a dirty main).
const porcelain = git(['status', '--porcelain']).stdout;
assert(/sessions\//.test(porcelain), 'session file is an uncommitted change on the session branch');

await fs.rm(tmpRoot, { recursive: true, force: true });

process.stdout.write(`\nsession-branch: ${passed} passed, ${failed} failed\n`);
if (failed) {
  for (const f of failures) process.stdout.write(`  ✗ ${f}\n`);
  process.exit(1);
}
process.stdout.write('✓ all session-branch tests passed\n');
