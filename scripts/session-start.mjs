#!/usr/bin/env node
// session-start.mjs — AI-free morning context dump (team-scoped, v1.1).
//
// By default, surfaces stories/bugs/inbox for ALL teams listed in
// teams/active-team.txt (first line = primary). With --team <slug>
// scopes to one team; with --all walks every team in the repo
// regardless of active status.
//
// What it surfaces (per team):
//   - Active stories (in-progress / blocked / design-done / etc.)
//   - Stale stories (in-progress with no JOURNAL mention 3+ days)
//   - Inbox count
//
// Cross-team: last JOURNAL entries (global), TODO count (global).
//
// Usage:
//   node scripts/session-start.mjs                # default: all active teams
//   node scripts/session-start.mjs --team <slug>  # scope to one team
//   node scripts/session-start.mjs --all          # every team in repo

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

// Detect CHAT-HANDOFF.md at repo root. Returns { updated, staleDays }
// or null if missing.
async function readChatHandoff() {
  const handoffPath = path.join(REPO_ROOT, 'CHAT-HANDOFF.md');
  let content;
  try {
    content = await fs.readFile(handoffPath, 'utf8');
  } catch {
    return null;
  }
  const fm = parseFrontmatter(content);
  const updated = (fm && fm.updated) || 'unknown';
  let staleDays = 0;
  if (updated && /^\d{4}-\d{2}-\d{2}$/.test(updated)) {
    const then = new Date(updated).getTime();
    const now = Date.now();
    staleDays = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  }
  return { updated, staleDays };
}

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

// Load stories for a single team folder.
async function loadStoriesForTeam(teamSlug) {
  const storiesDir = path.join(REPO_ROOT, 'teams', teamSlug, 'stories');
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
          team: teamSlug,
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

// Resolve which teams to scope to based on CLI args + active-team.txt.
async function resolveTeams(args) {
  const allFlag = args.includes('--all');
  const teamFlagIdx = args.indexOf('--team');
  const teamFlag = teamFlagIdx !== -1 ? args[teamFlagIdx + 1] : null;

  // List all teams in repo (excluding _template-team)
  const allTeams = [];
  try {
    const entries = await fs.readdir(path.join(REPO_ROOT, 'teams'), { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory() && !e.name.startsWith('.') && e.name !== '_template-team') {
        allTeams.push(e.name);
      }
    }
  } catch {}

  if (teamFlag) {
    if (!allTeams.includes(teamFlag)) {
      throw new Error(`Team '${teamFlag}' not found. Available: ${allTeams.join(', ') || '(none)'}`);
    }
    return [teamFlag];
  }
  if (allFlag) {
    return allTeams;
  }

  // Default: read active-team.txt
  let active = [];
  try {
    const content = await fs.readFile(path.join(REPO_ROOT, 'teams', 'active-team.txt'), 'utf8');
    active = content.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch {}

  // Filter to only existing teams
  active = active.filter((slug) => allTeams.includes(slug));

  // If no active teams configured, fall back to all (better than empty output)
  return active.length ? active : allTeams;
}

// Count inbox items for a team
async function countTeamInbox(teamSlug) {
  const inboxDir = path.join(REPO_ROOT, 'teams', teamSlug, 'inbox');
  let count = 0;
  try {
    const entries = await fs.readdir(inboxDir, { withFileTypes: true });
    count = entries.filter((e) =>
      e.isFile() && e.name.endsWith('.md') &&
      !['README.md', 'INBOX.md'].includes(e.name),
    ).length;
    // Count dated entries inside INBOX.md
    try {
      const inboxContent = await fs.readFile(path.join(inboxDir, 'INBOX.md'), 'utf8');
      const dates = inboxContent.match(/^## \d{4}-\d{2}-\d{2}/gm) || [];
      count += dates.length;
    } catch {}
  } catch {}
  return count;
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

// (Inbox count moved to countTeamInbox above — global root inbox/
// was dropped in v1.1; inbox is now per-team.)

function daysSince(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return Infinity;
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

async function main() {
  const args = process.argv.slice(2);
  let teams;
  try {
    teams = await resolveTeams(args);
  } catch (err) {
    process.stderr.write(`error: ${err.message}\n`);
    process.exit(1);
  }

  if (teams.length === 0) {
    process.stderr.write('No teams found. Run `node scripts/new-team.mjs <slug>` to create one.\n');
    process.exit(1);
  }

  const journal = await readLastJournalEntries(3);
  const todo = await countTodoItems();
  const handoff = await readChatHandoff();

  process.stdout.write('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.stdout.write(`  Kortex-QA — Session start (${new Date().toISOString().slice(0, 16).replace('T', ' ')})\n`);
  process.stdout.write(`  Scope: ${teams.length === 1 ? teams[0] : teams.join(' + ')}\n`);
  process.stdout.write('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n');

  if (handoff) {
    if (handoff.staleDays > 7) {
      process.stdout.write(`ℹ CHAT-HANDOFF.md exists but is stale (last updated ${handoff.updated}, ${handoff.staleDays} days ago). Delete or refresh.\n\n`);
    } else {
      process.stdout.write(`⚠ CHAT-HANDOFF.md exists (last updated ${handoff.updated}). Consider running /resume-from-handoff first.\n\n`);
    }
  }

  for (const team of teams) {
    const stories = await loadStoriesForTeam(team);
    const inboxCount = await countTeamInbox(team);

    const byStatus = {};
    for (const s of stories) {
      byStatus[s.status] = byStatus[s.status] || [];
      byStatus[s.status].push(s);
    }
    const stale = (byStatus['in-progress'] || []).filter(
      (s) => daysSince(s.updated) > 3,
    );

    process.stdout.write(`━━━ TEAM: ${team} ━━━\n\n`);

    let totalActive = 0;
    for (const status of ['in-progress', 'blocked', 'design-done',
                          'review-done', 'execution-done']) {
      const items = byStatus[status] || [];
      if (!items.length) continue;
      totalActive += items.length;
      process.stdout.write(`▸ ${status.toUpperCase()} (${items.length})\n`);
      for (const s of items) {
        process.stdout.write(`    ${s.ticket} — ${s.title}\n`);
        process.stdout.write(`      teams/${team}/stories/${s.folder}/  (updated ${s.updated})\n`);
      }
      process.stdout.write('\n');
    }
    if (totalActive === 0) {
      process.stdout.write('▸ (no stories in active states)\n\n');
    }

    if (stale.length) {
      process.stdout.write(`⚠  STALE (in-progress, no update in 3+ days):\n`);
      for (const s of stale) {
        process.stdout.write(`    ${s.ticket} — last touched ${s.updated} (${daysSince(s.updated)} days ago)\n`);
      }
      process.stdout.write('\n');
    }

    process.stdout.write(`▸ INBOX (${team}): ${inboxCount} item(s)\n\n`);
  }

  // Global summary
  process.stdout.write('━━━ GLOBAL ━━━\n\n');
  process.stdout.write(`▸ TODO: ${todo.active} open\n\n`);
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
