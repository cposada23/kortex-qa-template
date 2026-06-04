#!/usr/bin/env node
// migrate-v1.7-to-v1.8.mjs — upgrade an existing v1.7 brain to v1.8
// ("autonomous session-end + per-session log") WITHOUT losing its real
// data. Idempotent: safe to re-run.
//
// What v1.8 changes (framework, not user data):
//   - sessions/<id>.md per-session logs replace the gitignored
//     CHAT-HANDOFF.md handoff file.
//   - new/updated Copilot prompts: session-start, session-end,
//     chat-handoff, resume-from-handoff, session-note.
//   - new/updated scripts: session-start, session-branch-start,
//     session-branch-finish, validate (type:session + strict-pii gate),
//     snapshot.
//   - CHAT-HANDOFF.md is RETIRED everywhere (gitignore, snapshotignore,
//     a stray root file on disk).
//
// This script COPIES the framework allowlist from a fresh v1.8 template
// clone (--source) into the brain (--target), then makes a handful of
// SURGICAL, data-preserving edits to the target. It NEVER touches user
// data: teams/, knowledge/, shared/, TODO.md, JOURNAL.md, .env*,
// .client-slug, teams/active-team.txt, INDEX.md files, or any
// stories/test-cases/bugs.
//
// Usage:
//   node scripts/migrate-v1.7-to-v1.8.mjs \
//     --source /path/to/fresh-v1.8-template \
//     --target /path/to/the-brain
//
//   --target defaults to this script's own repo root.
//
// After it runs, the engineer should:
//   node scripts/validate.mjs && node scripts/build-index.mjs && node scripts/validate-links.mjs
// then review the diff and commit.

import { promises as fs } from 'node:fs';
import { realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Framework allowlist — files COPIED source -> target (overwrite). These are
// framework, not user data, so overwriting is correct. Paths are relative to
// each repo root and use forward slashes (joined with path.join, so they work
// on Windows too).
// ---------------------------------------------------------------------------
export const FRAMEWORK_ALLOWLIST = [
  // Copilot slash-command prompts (the primary surface).
  '.github/prompts/session-start.prompt.md',
  '.github/prompts/session-end.prompt.md',
  '.github/prompts/chat-handoff.prompt.md',
  '.github/prompts/resume-from-handoff.prompt.md',
  '.github/prompts/session-note.prompt.md',
  // Scripts (behavior is fixed truth — copy them verbatim).
  'scripts/session-start.mjs',
  'scripts/session-branch-start.mjs',
  'scripts/session-branch-finish.mjs',
  'scripts/validate.mjs',
  'scripts/snapshot.mjs',
  // Tests that guard the new session machinery.
  'scripts/tests/validate-session.test.mjs',
  'scripts/tests/session-branch.test.mjs',
  // Operational docs for the new sessions/ home.
  'sessions/README.md',
  // Playbooks describing the new ritual.
  'playbooks/session-start.md',
  'playbooks/session-end.md',
  'playbooks/day-in-the-life.md',
  'playbooks/README.md',
  // The 4 hand-synced mirror files (NO symlinks — Windows-first).
  'AGENTS.md',
  'CLAUDE.md',
  'GEMINI.md',
  '.github/copilot-instructions.md',
  // Instruction file that documents the session frontmatter schema.
  '.github/instructions/frontmatter.instructions.md',
  // Top-level docs + version stamp.
  'README.md',
  'scripts/README.md',
  'VERSION',
];

// ---------------------------------------------------------------------------
// Hard never-touch list. Used as a defensive assertion only — nothing in the
// flow below writes to these, but if a future edit to the allowlist or the
// surgical steps ever pointed here, we want to fail loudly rather than corrupt
// user data. Directory prefixes end with a path separator marker.
// ---------------------------------------------------------------------------
export const NEVER_TOUCH = [
  'teams/',
  'knowledge/',
  'shared/',
  'TODO.md',
  'JOURNAL.md',
  '.client-slug',
  'teams/active-team.txt',
];

function isProtectedRelPath(rel) {
  const norm = rel.split(path.sep).join('/');
  if (/(^|\/)INDEX\.md$/.test(norm)) return true;
  if (/(^|\/)\.env(\.|$)/.test(norm) || norm === '.env' || norm.startsWith('.env')) return true;
  for (const guard of NEVER_TOUCH) {
    if (guard.endsWith('/')) {
      if (norm === guard.slice(0, -1) || norm.startsWith(guard)) return true;
    } else if (norm === guard) {
      return true;
    }
  }
  return false;
}

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function isFile(p) {
  try {
    const st = await fs.stat(p);
    return st.isFile();
  } catch {
    return false;
  }
}

// Copy one allowlisted file source -> target (overwrite). Returns a report
// entry describing what happened.
export async function copyFrameworkFile(rel, sourceRoot, targetRoot) {
  if (isProtectedRelPath(rel)) {
    throw new Error(`refusing to copy into protected path: ${rel}`);
  }
  const src = path.join(sourceRoot, rel);
  const dest = path.join(targetRoot, rel);
  if (!(await isFile(src))) {
    return { rel, action: 'skip', reason: 'missing in source' };
  }
  const srcBuf = await fs.readFile(src);
  let changed = true;
  if (await isFile(dest)) {
    const destBuf = await fs.readFile(dest);
    if (srcBuf.equals(destBuf)) changed = false;
  }
  if (!changed) {
    return { rel, action: 'skip', reason: 'identical' };
  }
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, srcBuf);
  return { rel, action: 'copy' };
}

// Ensure sessions/ exists in the target. The README is copied by the
// allowlist; this just guarantees the directory is present (it would already
// be created by the README copy, but we keep the step explicit + idempotent
// for the case where the README is missing in source).
export async function ensureSessionsDir(targetRoot) {
  const dir = path.join(targetRoot, 'sessions');
  if (await pathExists(dir)) {
    return { action: 'skip', reason: 'sessions/ already exists' };
  }
  await fs.mkdir(dir, { recursive: true });
  return { action: 'create' };
}

// Delete a stray root CHAT-HANDOFF.md if it exists on disk. (It was gitignored
// ephemeral state, so it may or may not be present.)
export async function deleteRootChatHandoff(targetRoot) {
  const p = path.join(targetRoot, 'CHAT-HANDOFF.md');
  if (!(await pathExists(p))) {
    return { action: 'skip', reason: 'no root CHAT-HANDOFF.md' };
  }
  await fs.unlink(p);
  return { action: 'delete' };
}

// Strip the CHAT-HANDOFF.md block from a .gitignore. The v1.7 .gitignore has a
// 3-line comment header immediately followed by the `CHAT-HANDOFF.md` line:
//
//   # Chat handoff state — ephemeral session context, not knowledge.
//   # Generated by /chat-handoff. Included in snapshot ZIPs for personal
//   # laptop-swap recovery (see AGENTS.md §3 + §8).
//   CHAT-HANDOFF.md
//
// We remove the `CHAT-HANDOFF.md` line and the contiguous comment block that
// describes it directly above it (a comment group ending at the entry, where
// at least one line of the group mentions chat-handoff so we never eat an
// unrelated header), plus a single trailing blank line so the file doesn't
// grow double blank-line gaps on re-runs. CRLF-tolerant.
export function stripChatHandoffFromGitignore(content) {
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const lines = content.split(/\r?\n/);
  const out = [];
  let removed = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === 'CHAT-HANDOFF.md') {
      removed = true;
      // Gather the contiguous comment block immediately above the entry.
      let header = 0;
      while (out.length - header > 0 && out[out.length - 1 - header].trim().startsWith('#')) {
        header++;
      }
      // Only remove the header if it actually describes chat-handoff — guards
      // against eating an unrelated comment that happens to sit just above.
      const headerLines = header > 0 ? out.slice(out.length - header) : [];
      const describesHandoff = headerLines.some((l) =>
        /chat\s*handoff|chat-handoff|\/chat-handoff/i.test(l)
      );
      if (describesHandoff) {
        out.length -= header;
      }
      // Collapse the gap left behind to exactly one blank-line separator
      // between the surrounding sections. Drop the blank that preceded the
      // removed block (if any) AND the blank that followed the entry (if
      // any) — then re-emit a single blank only if real content sits on both
      // sides. This keeps re-runs idempotent and avoids both glued sections
      // and double blank gaps.
      const hadLeadingBlank = out.length > 0 && out[out.length - 1].trim() === '';
      if (hadLeadingBlank) out.pop();
      let hadTrailingBlank = false;
      if (i + 1 < lines.length && lines[i + 1].trim() === '') {
        hadTrailingBlank = true;
        i++;
      }
      const hasContentBefore = out.length > 0;
      const hasContentAfter = i + 1 < lines.length;
      if ((hadLeadingBlank || hadTrailingBlank) && hasContentBefore && hasContentAfter) {
        out.push('');
      }
      continue;
    }
    out.push(line);
  }
  return { content: out.join(eol), removed };
}

export async function editGitignore(targetRoot) {
  const p = path.join(targetRoot, '.gitignore');
  if (!(await isFile(p))) {
    return { action: 'skip', reason: 'no .gitignore' };
  }
  const original = await fs.readFile(p, 'utf8');
  const { content, removed } = stripChatHandoffFromGitignore(original);
  if (!removed || content === original) {
    return { action: 'skip', reason: 'no CHAT-HANDOFF.md line' };
  }
  await fs.writeFile(p, content);
  return { action: 'edit' };
}

// Strip CHAT-HANDOFF.md mentions from .snapshotignore. In v1.7 the mention is
// INLINE inside a prose comment sentence, e.g.:
//   # ... client-secrets/, .secrets, CHAT-HANDOFF.md, .cache/) ARE included.
// We surgically drop just the ", CHAT-HANDOFF.md" / "CHAT-HANDOFF.md, "
// fragment so the sentence stays readable, and also remove any standalone
// `CHAT-HANDOFF.md` ignore line if one exists. CRLF-tolerant.
export function stripChatHandoffFromSnapshotignore(content) {
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const lines = content.split(/\r?\n/);
  const out = [];
  let removed = false;
  for (const line of lines) {
    // Standalone ignore entry — drop the whole line.
    if (line.trim() === 'CHAT-HANDOFF.md') {
      removed = true;
      continue;
    }
    if (line.includes('CHAT-HANDOFF.md')) {
      let edited = line
        .replace(/,\s*CHAT-HANDOFF\.md/g, '')
        .replace(/CHAT-HANDOFF\.md\s*,\s*/g, '')
        .replace(/CHAT-HANDOFF\.md/g, '');
      // Tidy any leftover doubled spaces from the removal.
      edited = edited.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+$/g, '');
      if (edited !== line) removed = true;
      out.push(edited);
      continue;
    }
    out.push(line);
  }
  return { content: out.join(eol), removed };
}

export async function editSnapshotignore(targetRoot) {
  const p = path.join(targetRoot, '.snapshotignore');
  if (!(await isFile(p))) {
    return { action: 'skip', reason: 'no .snapshotignore' };
  }
  const original = await fs.readFile(p, 'utf8');
  const { content, removed } = stripChatHandoffFromSnapshotignore(original);
  if (!removed || content === original) {
    return { action: 'skip', reason: 'no CHAT-HANDOFF.md mention' };
  }
  await fs.writeFile(p, content);
  return { action: 'edit' };
}

function parseArgs(argv) {
  const args = { source: null, target: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--source') args.source = argv[++i];
    else if (a === '--target') args.target = argv[++i];
    else if (a.startsWith('--source=')) args.source = a.slice('--source='.length);
    else if (a.startsWith('--target=')) args.target = a.slice('--target='.length);
  }
  return args;
}

export async function migrate({ source, target }) {
  const report = {
    sourceRoot: source,
    targetRoot: target,
    copied: [],
    skipped: [],
    edits: [],
  };

  if (!source) {
    throw new Error('--source <path to a fresh v1.8 template clone> is required');
  }
  if (!(await pathExists(source))) {
    throw new Error(`--source path does not exist: ${source}`);
  }
  if (!(await pathExists(target))) {
    throw new Error(`--target path does not exist: ${target}`);
  }

  // 1) Copy the framework allowlist (overwrite).
  for (const rel of FRAMEWORK_ALLOWLIST) {
    const r = await copyFrameworkFile(rel, source, target);
    if (r.action === 'copy') report.copied.push(r);
    else report.skipped.push(r);
  }

  // 2) Surgical, data-preserving edits.
  report.edits.push({ step: 'sessions-dir', ...(await ensureSessionsDir(target)) });
  report.edits.push({ step: 'delete-root-CHAT-HANDOFF', ...(await deleteRootChatHandoff(target)) });
  report.edits.push({ step: 'gitignore', ...(await editGitignore(target)) });
  report.edits.push({ step: 'snapshotignore', ...(await editSnapshotignore(target)) });

  return report;
}

function printReport(report, write = (s) => process.stdout.write(s)) {
  write('\nmigrate v1.7 -> v1.8\n');
  write(`  source: ${report.sourceRoot}\n`);
  write(`  target: ${report.targetRoot}\n`);

  write('\nFramework files (copied source -> target):\n');
  if (report.copied.length === 0) {
    write('  (none — everything already up to date)\n');
  } else {
    for (const r of report.copied) write(`  + ${r.rel}\n`);
  }

  if (report.skipped.length > 0) {
    write('\nSkipped (no change needed):\n');
    for (const r of report.skipped) write(`  · ${r.rel} (${r.reason})\n`);
  }

  write('\nSurgical edits:\n');
  for (const e of report.edits) {
    const label = e.action === 'skip' ? `skip (${e.reason})` : e.action;
    write(`  · ${e.step}: ${label}\n`);
  }

  write('\n✓ Migration complete.\n');
  write('  Next, from the brain root:\n');
  write('    node scripts/validate.mjs && node scripts/build-index.mjs && node scripts/validate-links.mjs\n');
  write('  Then review the diff and commit.\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const source = args.source ? path.resolve(args.source) : null;
  const target = args.target ? path.resolve(args.target) : path.resolve(__dirname, '..');

  const report = await migrate({ source, target });
  printReport(report);
}

const invokedDirectly = (() => {
  try {
    if (!process.argv[1]) return false;
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
})();

if (invokedDirectly) {
  main().catch((err) => {
    process.stderr.write(`migration failed: ${err.message}\n`);
    process.exit(1);
  });
}
