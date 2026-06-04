#!/usr/bin/env node
// session-branch-start.mjs — create a daily session branch + its log file.
//
// Usage:
//   node scripts/session-branch-start.mjs [short-slug]
//
// Creates:
//   branch  session/YYYYMMDD-HHMM[-short-slug]
//   file    sessions/YYYYMMDD-HHMM[-short-slug].md   (type: session, status: open)
//
// The session log file is the per-session record: /chat-handoff and
// /session-note append blocks to it during the day, and /session-end
// appends the final Bridge-out block + flips status to closed before
// merging the branch to main. The file is keyed by the SESSION (the
// branch), never by calendar date — so forgetting to close, or a session
// that crosses midnight, never splits or orphans the record.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// KORTEX_SESSION_ROOT lets the test suite point the script at a temp repo
// (same override idiom as snapshot.mjs / SNAPSHOT_REPO_ROOT).
const REPO_ROOT = process.env.KORTEX_SESSION_ROOT
  ? path.resolve(process.env.KORTEX_SESSION_ROOT)
  : path.resolve(__dirname, '..');
const SESSIONS_DIR = path.join(REPO_ROOT, 'sessions');

// Cap slug length so the resulting filename stays well under the Windows
// MAX_PATH (260) ceiling even under deep client paths.
const MAX_SLUG_LEN = 40;

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

export function slugify(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LEN)
    .replace(/-+$/g, '');
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function currentBranch() {
  const r = runGit(['branch', '--show-current'], { capture: true });
  return r.ok ? r.stdout.trim() : '';
}

function dirtyStatus() {
  const r = runGit(['status', '--porcelain'], { capture: true });
  return r.ok ? r.stdout.trim() : null;
}

// Derive the session id (the branch name minus the `session/` prefix) and
// ensure sessions/<id>.md exists. Returns the relative path. Idempotent:
// if the file already exists (continuing an open session, or a recovery),
// it is left untouched. Uniqueness is inherited from git — `git switch -c`
// fails on a duplicate branch, so two sessions can never share an id.
export function ensureSessionFile(branch) {
  const id = branch.replace(/^session\//, '');
  const rel = path.join('sessions', `${id}.md`);
  const full = path.join(SESSIONS_DIR, `${id}.md`);
  if (existsSync(full)) return { rel, created: false };
  mkdirSync(SESSIONS_DIR, { recursive: true });
  const fm = [
    '---',
    `title: "Session ${id}"`,
    'type: session',
    'status: open',
    'language: en',
    'tags: [session]',
    `updated: ${todayISO()}`,
    `branch: ${branch}`,
    '---',
    '',
    `# Session ${id}`,
    '',
    '<!-- /chat-handoff appends "## Handoff HH:MM" blocks here.',
    '     /session-note appends "## Note HH:MM" blocks here.',
    '     /session-end appends the final "## Bridge-out HH:MM" block',
    '     and flips status to closed before merging to main. -->',
    '',
  ].join('\n');
  writeFileSync(full, fm);
  return { rel, created: true };
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

  // Already on a session branch — reuse it. Ensure its log file exists
  // (recovery if it was deleted) and print the path so the caller never
  // has to re-derive it.
  if (branch.startsWith('session/')) {
    const { rel, created } = ensureSessionFile(branch);
    process.stdout.write(`Already on session branch: ${branch}\n`);
    process.stdout.write(`Session log: ${rel}${created ? ' (recreated)' : ''}\n`);
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

  // Create the branch FIRST (so the dirty-tree guard above saw a clean
  // main), then derive the session file from the actually-created branch
  // name — file uniqueness inherits git's branch-uniqueness guarantee.
  const suffix = slugify(process.argv.slice(2).join(' '));
  const newBranch = `session/${timestamp()}${suffix ? `-${suffix}` : ''}`;
  const created = runGit(['switch', '-c', newBranch]);
  if (!created.ok) process.exit(created.status || 1);

  const actualBranch = currentBranch() || newBranch;
  const { rel } = ensureSessionFile(actualBranch);

  process.stdout.write(`\n✓ Session branch started: ${actualBranch}\n`);
  process.stdout.write(`✓ Session log: ${rel}\n`);
  process.stdout.write('Do today\'s work here. At session end, run /session-end (it auto-merges), or:\n');
  process.stdout.write('  node scripts/session-branch-finish.mjs -m "session: YYYY-MM-DD - summary"\n');
}

const invokedDirectly = (() => {
  try {
    if (!process.argv[1]) return false;
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
})();
if (invokedDirectly) main();
