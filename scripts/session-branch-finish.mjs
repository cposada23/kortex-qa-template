#!/usr/bin/env node
// session-branch-finish.mjs — validate, commit, merge session branch to main.
//
// Usage:
//   node scripts/session-branch-finish.mjs -m "session: YYYY-MM-DD - summary"
//   node scripts/session-branch-finish.mjs -m "session: YYYY-MM-DD - summary" --keep-branch

import { spawnSync } from 'node:child_process';

function run(command, args, { capture = false } = {}) {
  const result = spawnSync(command, args, {
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

function git(args, opts) {
  return run('git', args, opts);
}

function currentBranch() {
  const r = git(['branch', '--show-current'], { capture: true });
  return r.ok ? r.stdout.trim() : '';
}

function dirtyStatus() {
  const r = git(['status', '--porcelain'], { capture: true });
  return r.ok ? r.stdout.trim() : null;
}

function parseArgs(args) {
  const keepBranch = args.includes('--keep-branch');
  const messageIdx = args.findIndex((a) => a === '-m' || a === '--message');
  const message = messageIdx !== -1 ? args[messageIdx + 1] : '';
  return { keepBranch, message };
}

function runCheck(args) {
  const result = run('node', args);
  if (!result.ok) {
    process.stderr.write(`error: check failed: node ${args.join(' ')}\n`);
    process.exit(result.status || 1);
  }
}

function main() {
  const { keepBranch, message } = parseArgs(process.argv.slice(2));
  if (!message) {
    process.stderr.write('Usage: node scripts/session-branch-finish.mjs -m "session: YYYY-MM-DD - summary"\n');
    process.exit(1);
  }

  const branch = currentBranch();
  if (!branch.startsWith('session/')) {
    process.stderr.write(`error: current branch is not a session branch (current: ${branch || 'unknown'}).\n`);
    process.stderr.write('Run this from a branch named session/*.\n');
    process.exit(1);
  }

  process.stdout.write('→ Running session close checks...\n');
  runCheck(['scripts/validate.mjs']);
  runCheck(['scripts/validate-links.mjs']);
  runCheck(['scripts/build-index.mjs', '--check']);
  // Secret gate (v1.8): session log files are committed to permanent
  // history and, with autonomous /session-end, no human reviews the diff.
  // Run the PII/secret scan in BLOCKING mode scoped to sessions/ so a
  // credential pasted into a Handoff/Note block aborts the merge and
  // preserves the branch for cleanup, instead of landing on main silently.
  // (Whole-repo PII stays warn-only above; only sessions/ is hard-gated.)
  runCheck(['scripts/validate.mjs', 'sessions', '--strict-pii']);

  const dirty = dirtyStatus();
  if (dirty == null) {
    process.stderr.write('error: could not read git status.\n');
    process.exit(1);
  }

  if (dirty) {
    const added = git(['add', '.']);
    if (!added.ok) process.exit(added.status || 1);
    const committed = git(['commit', '-m', message]);
    if (!committed.ok) process.exit(committed.status || 1);
  } else {
    process.stdout.write('· No working tree changes to commit.\n');
  }

  const switched = git(['switch', 'main']);
  if (!switched.ok) process.exit(switched.status || 1);

  const merged = git(['merge', '--no-ff', branch, '-m', `merge: ${branch}`]);
  if (!merged.ok) {
    process.stderr.write(`\nerror: merge failed. Resolve conflicts on main, then continue manually.\n`);
    process.stderr.write(`Session branch preserved: ${branch}\n`);
    process.exit(merged.status || 1);
  }

  if (!keepBranch) {
    const deleted = git(['branch', '-d', branch]);
    if (!deleted.ok) {
      process.stderr.write(`warning: merged but could not delete branch ${branch}. Delete it manually when ready.\n`);
    }
  }

  process.stdout.write(`\n✓ Session merged to main: ${branch}\n`);
  process.stdout.write('main now contains the consolidated end-of-session state.\n');
}

main();
