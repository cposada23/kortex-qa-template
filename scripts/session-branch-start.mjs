#!/usr/bin/env node
// session-branch-start.mjs — create a daily session branch.
//
// Usage:
//   node scripts/session-branch-start.mjs [short-slug]
//
// Creates:
//   session/YYYYMMDD-HHMM[-short-slug]

import { spawnSync } from 'node:child_process';

function runGit(args, { capture = false } = {}) {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
  if (capture) {
    return {
      ok: result.status === 0,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      status: result.status,
    };
  }
  return { ok: result.status === 0, status: result.status };
}

function slugify(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function currentBranch() {
  const r = runGit(['branch', '--show-current'], { capture: true });
  return r.ok ? r.stdout.trim() : '';
}

function dirtyStatus() {
  const r = runGit(['status', '--porcelain'], { capture: true });
  return r.ok ? r.stdout.trim() : null;
}

function main() {
  const inside = runGit(['rev-parse', '--is-inside-work-tree'], { capture: true });
  if (!inside.ok || inside.stdout.trim() !== 'true') {
    process.stderr.write('error: not inside a git worktree. Run `git init` first.\n');
    process.exit(1);
  }

  const branch = currentBranch();
  if (!branch) {
    process.stderr.write('error: could not determine current git branch.\n');
    process.exit(1);
  }

  if (branch.startsWith('session/')) {
    process.stdout.write(`Already on session branch: ${branch}\n`);
    return;
  }

  if (branch !== 'main') {
    process.stderr.write(`error: session branches must start from main (current: ${branch}).\n`);
    process.stderr.write('Finish, merge, or discard the current branch before starting a new session.\n');
    process.exit(1);
  }

  const dirty = dirtyStatus();
  if (dirty == null) {
    process.stderr.write('error: could not read git status.\n');
    process.exit(1);
  }
  if (dirty) {
    process.stderr.write('error: working tree is dirty. Commit or clean changes before starting a session branch.\n\n');
    process.stderr.write(dirty + '\n');
    process.exit(1);
  }

  const suffix = slugify(process.argv.slice(2).join(' '));
  const newBranch = `session/${timestamp()}${suffix ? `-${suffix}` : ''}`;
  const created = runGit(['switch', '-c', newBranch]);
  if (!created.ok) process.exit(created.status || 1);

  process.stdout.write(`\n✓ Session branch started: ${newBranch}\n`);
  process.stdout.write('Do today\'s work here. At session end, run:\n');
  process.stdout.write('  node scripts/session-branch-finish.mjs -m "session: YYYY-MM-DD - summary"\n');
}

main();
