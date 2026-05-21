#!/usr/bin/env node
// session-start.mjs — AI-free morning context dump.
//
// Reads the brain's current state and prints a one-screen summary
// to stdout. This is the bash-side counterpart to the Copilot
// /session-start prompt — useful when Copilot isn't available or
// for a fast manual check.
//
// What it surfaces:
//   - Active stories (status in-progress / blocked / design-done /
//     review-done / execution-done)
//   - Last few JOURNAL entries
//   - Open TODO count
//   - Inbox count
//   - Stale stories (in-progress with no JOURNAL mention in 3+ days)
//
// Usage:
//   node scripts/session-start.mjs

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const SKIP_DIRS = new Set(['.git', 'node_modules', '.cache', 'versions']);
const SKIP_FILENAMES = new Set([
  'INDEX.md', 'README.md', 'AGENTS.md', 'INBOX.md',
  'JOURNAL.md', 'TODO.md',
]);

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const lines = match[1].split('\n');
  const out = {};
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }
    out[key] = val;
  }
  return out;
}

async function walkMdFiles(dir, baseDir = dir) {
  const result = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return result;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await walkMdFiles(full, baseDir)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      if (SKIP_FILENAMES.has(entry.name)) continue;
      result.push(path.relative(baseDir, full));
    }
  }
  return result;
}

async function loadStories() {
  const storiesDir = path.join(REPO_ROOT, 'stories');
  const stories = [];
  let entries;
  try {
    entries = await fs.readdir(storiesDir, { withFileTypes: true });
  } catch {
    return stories;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const storyPath = path.join(storiesDir, entry.name, 'story.md');
    try {
      const content = await fs.readFile(storyPath, 'utf8');
      const fm = parseFrontmatter(content);
      if (fm) {
        stories.push({
          folder: entry.name,
          title: fm.title || entry.name,
          status: fm.status || 'unknown',
          ticket: fm.ticket || entry.name.split('-').slice(0, 2).join('-'),
          updated: fm.updated || '1970-01-01',
        });
      }
    } catch {
      // story.md missing or malformed — skip
    }
  }
  return stories;
}

async function readLastJournalEntries(n = 3) {
  const journalPath = path.join(REPO_ROOT, 'JOURNAL.md');
  try {
    const content = await fs.readFile(journalPath, 'utf8');
    // Split by `## YYYY-MM-DD` headers
    const entries = content.split(/^## \d{4}-\d{2}-\d{2}/m).slice(1);
    return entries.slice(-n).map((e, i) => '##' + e).reverse();
  } catch {
    return [];
  }
}

async function countTodoItems() {
  const todoPath = path.join(REPO_ROOT, 'TODO.md');
  try {
    const content = await fs.readFile(todoPath, 'utf8');
    const active = (content.match(/^- \[ \] /gm) || []).length;
    const done = (content.match(/^- \[x\] /gmi) || []).length;
    return { active, done };
  } catch {
    return { active: 0, done: 0 };
  }
}

async function countInboxItems() {
  const inboxDir = path.join(REPO_ROOT, 'inbox');
  const files = await walkMdFiles(inboxDir);
  // Exclude README.md and the catch-all INBOX.md count itself
  // but count entries inside INBOX.md
  let count = files.filter(
    (f) => !['README.md', 'INBOX.md'].includes(path.basename(f)),
  ).length;
  // Count dated entries inside INBOX.md
  try {
    const inboxContent = await fs.readFile(path.join(inboxDir, 'INBOX.md'), 'utf8');
    const dates = inboxContent.match(/^## \d{4}-\d{2}-\d{2}/gm) || [];
    count += dates.length;
  } catch {
    // INBOX.md missing — OK
  }
  return count;
}

function daysSince(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return Infinity;
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

async function main() {
  const stories = await loadStories();
  const journal = await readLastJournalEntries(3);
  const todo = await countTodoItems();
  const inboxCount = await countInboxItems();

  const byStatus = {};
  for (const s of stories) {
    byStatus[s.status] = byStatus[s.status] || [];
    byStatus[s.status].push(s);
  }

  const stale = (byStatus['in-progress'] || []).filter(
    (s) => daysSince(s.updated) > 3,
  );

  process.stdout.write('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.stdout.write(`  Kortex-QA — Session start (${new Date().toISOString().slice(0, 16).replace('T', ' ')})\n`);
  process.stdout.write('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n');

  // Active stories
  for (const status of ['in-progress', 'blocked', 'design-done',
                        'review-done', 'execution-done']) {
    const items = byStatus[status] || [];
    if (!items.length) continue;
    process.stdout.write(`▸ ${status.toUpperCase()} (${items.length})\n`);
    for (const s of items) {
      process.stdout.write(`    ${s.ticket} — ${s.title}\n`);
      process.stdout.write(`      stories/${s.folder}/  (updated ${s.updated})\n`);
    }
    process.stdout.write('\n');
  }

  // Stale callout
  if (stale.length) {
    process.stdout.write(`⚠  STALE (in-progress, no JOURNAL mention in 3+ days):\n`);
    for (const s of stale) {
      process.stdout.write(`    ${s.ticket} — last touched ${s.updated} (${daysSince(s.updated)} days ago)\n`);
    }
    process.stdout.write('\n');
  }

  // TODO
  process.stdout.write(`▸ TODO: ${todo.active} open\n\n`);

  // Inbox
  process.stdout.write(`▸ INBOX: ${inboxCount} item(s)\n\n`);

  // Last journal entry (just the header line)
  if (journal.length) {
    const lastHeader = journal[0].split('\n')[0];
    const lastNextLine = (journal[0].match(/^NEXT: .+$/m) || ['NEXT: (none)'])[0];
    process.stdout.write(`▸ LAST JOURNAL ENTRY\n`);
    process.stdout.write(`    ${lastHeader}\n`);
    process.stdout.write(`    ${lastNextLine}\n\n`);
  } else {
    process.stdout.write('▸ LAST JOURNAL ENTRY: (none yet — run /session-end at EOD)\n\n');
  }

  process.stdout.write('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.stdout.write('  Tip: invoke /session-start in Copilot Chat\n');
  process.stdout.write('  for AI-augmented suggestions.\n');
  process.stdout.write('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch((err) => {
  process.stderr.write(`session-start failed: ${err.message}\n`);
  process.exit(1);
});
