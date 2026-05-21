#!/usr/bin/env node
// new-story.mjs — scaffold a new story folder (team-scoped, v1.6+).
//
// Creates:
//   teams/<team>/stories/<TICKET-KEY>-<slug>/
//   ├── story.md          (has linked_test_cases + linked_bugs + review_status)
//   ├── ac-audit.md
//   └── execution-log.md
//
// CHANGED IN v1.6:
//   - No more test-cases/ subfolder. TCs live at
//     teams/<team>/test-cases/<area>/ and link via id (canonical) +
//     markdown link (navigation).
//   - No more bugs.md pointer. Story frontmatter has linked_bugs: [].
//
// Team resolution:
//   - --team <slug> overrides everything
//   - Otherwise: first line of teams/active-team.txt
//   - If neither: error
//
// Each file is stamped from templates/story/*.md with substitutions
// applied. After creation, build-index.mjs is invoked to refresh
// stories/INDEX.md for the target team.
//
// Usage:
//   node scripts/new-story.mjs <TICKET-KEY> <slug> [--team <slug>]
//   node scripts/new-story.mjs TEAM-1234 search-filter-empty-input
//   node scripts/new-story.mjs TEAM-1234 search-filter --team pod-8

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function usage() {
  process.stderr.write('Usage: node scripts/new-story.mjs <TICKET-KEY> <slug> [--team <slug>]\n');
  process.stderr.write('Example: node scripts/new-story.mjs TEAM-1234 search-filter-empty-input\n');
}

// Resolve the target team from --team flag or active-team.txt primary line.
async function resolveTargetTeam(args) {
  const flagIdx = args.indexOf('--team');
  if (flagIdx !== -1) {
    const slug = args[flagIdx + 1];
    if (!slug) throw new Error('--team requires a slug argument');
    return slug;
  }
  // Read active-team.txt, take first line
  try {
    const content = await fs.readFile(path.join(REPO_ROOT, 'teams', 'active-team.txt'), 'utf8');
    const first = content.split('\n').map((s) => s.trim()).filter(Boolean)[0];
    if (first) return first;
  } catch {}
  throw new Error('no team specified and teams/active-team.txt has no primary. Pass --team <slug> or run `node scripts/switch-team.mjs <slug>` first.');
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function substitute(content, vars) {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (vars[key] == null) return `{{${key}}}`;
    return vars[key];
  });
}

async function main() {
  const args = process.argv.slice(2);
  // Positional args = everything that's not --team or its value
  const flagIdx = args.indexOf('--team');
  const positionals = args.filter((a, i) =>
    a !== '--team' && (flagIdx === -1 || i !== flagIdx + 1));
  const [ticketKey, slug] = positionals;

  if (!ticketKey || !slug) {
    usage();
    process.exit(1);
  }
  if (!/^[A-Z][A-Z0-9]*-\d+$/.test(ticketKey)) {
    process.stderr.write(`error: TICKET-KEY must match <UPPER>-<NUMBER> (got: ${ticketKey})\n`);
    process.exit(1);
  }
  if (!/^[a-z][a-z0-9-]+$/.test(slug)) {
    process.stderr.write(`error: slug must be kebab-case lowercase (got: ${slug})\n`);
    process.exit(1);
  }

  let teamSlug;
  try {
    teamSlug = await resolveTargetTeam(args);
  } catch (err) {
    process.stderr.write(`error: ${err.message}\n`);
    process.exit(1);
  }

  const folderName = `${ticketKey}-${slug}`;
  const storyDir = path.join(REPO_ROOT, 'teams', teamSlug, 'stories', folderName);

  // Verify the team folder exists
  try {
    await fs.access(path.join(REPO_ROOT, 'teams', teamSlug));
  } catch {
    process.stderr.write(`error: team folder not found: teams/${teamSlug}/\n`);
    process.stderr.write('Run `node scripts/new-team.mjs <slug>` first.\n');
    process.exit(1);
  }

  // Bail if folder exists
  try {
    await fs.access(storyDir);
    process.stderr.write(`error: story folder already exists: teams/${teamSlug}/stories/${folderName}\n`);
    process.exit(1);
  } catch {
    // Expected — proceed
  }

  await fs.mkdir(storyDir, { recursive: true });

  // Variables for template substitution
  const vars = {
    TICKET_KEY: ticketKey,
    SLUG: slug,
    FOLDER_NAME: folderName,
    UPDATED: todayISO(),
    // Sprint / priority / title are placeholders for the engineer
    // to fill in after scaffold:
    TITLE: `<TICKET-KEY-${slug} — one-line title>`,
    SPRINT: '<sprint-id>',
    PRIORITY: 'medium',
  };

  // Stamp each template file
  const templatesDir = path.join(REPO_ROOT, 'templates', 'story');
  const templates = [
    { src: 'story.md', dest: 'story.md' },
    { src: 'ac-audit.md', dest: 'ac-audit.md' },
    { src: 'execution-log.md', dest: 'execution-log.md' },
  ];

  for (const t of templates) {
    const srcPath = path.join(templatesDir, t.src);
    const destPath = path.join(storyDir, t.dest);
    let content;
    try {
      content = await fs.readFile(srcPath, 'utf8');
    } catch (err) {
      process.stderr.write(`error: missing template ${t.src}: ${err.message}\n`);
      process.exit(1);
    }
    content = substitute(content, vars);
    await fs.writeFile(destPath, content);
  }

  process.stdout.write(`✓ Scaffolded teams/${teamSlug}/stories/${folderName}/\n`);
  process.stdout.write('  - story.md (frontmatter has linked_test_cases + linked_bugs + review_status)\n');
  process.stdout.write('  - ac-audit.md\n');
  process.stdout.write('  - execution-log.md\n');
  process.stdout.write('  (no test-cases/ subfolder — TCs live at teams/<team>/test-cases/<area>/ in v1.6+)\n');

  // Auto-refresh the team's stories INDEX + team-level INDEX
  const buildIdx = spawnSync('node', ['scripts/build-index.mjs', `teams/${teamSlug}`], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
  if (buildIdx.status !== 0) {
    process.stderr.write('warning: build-index returned non-zero. Run manually if needed.\n');
  }

  process.stdout.write(`\nNext step: open teams/${teamSlug}/stories/${folderName}/story.md and paste the Jira ticket body.\n`);
  process.stdout.write('Then run /ac-auditor in Copilot Chat (or /story-intake to do both in one go).\n');
  process.stdout.write(`\nTo author a test case linked to this story:\n`);
  process.stdout.write(`  node scripts/new-test-case.mjs <area> <slug> --link-story ${ticketKey}\n`);
  process.stdout.write(`To file a bug linked to this story:\n`);
  process.stdout.write(`  node scripts/new-bug.mjs <slug> --link-story ${ticketKey}\n`);
}

main().catch((err) => {
  process.stderr.write(`new-story failed: ${err.message}\n`);
  process.exit(1);
});
