#!/usr/bin/env node
// new-story.mjs — scaffold a new story folder under stories/.
//
// Creates:
//   stories/<TICKET-KEY>-<slug>/
//   ├── story.md
//   ├── ac-audit.md
//   ├── execution-log.md
//   ├── bugs.md
//   └── test-cases/.gitkeep
//
// Each file is stamped from templates/story/*.md with substitutions
// applied. After creation, build-index.mjs is invoked to refresh
// stories/INDEX.md.
//
// Usage:
//   node scripts/new-story.mjs <TICKET-KEY> <slug>
//   node scripts/new-story.mjs TEAM-1234 search-filter-empty-input

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function usage() {
  process.stderr.write('Usage: node scripts/new-story.mjs <TICKET-KEY> <slug>\n');
  process.stderr.write('Example: node scripts/new-story.mjs TEAM-1234 search-filter-empty-input\n');
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
  const [ticketKey, slug] = process.argv.slice(2);
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

  const folderName = `${ticketKey}-${slug}`;
  const storyDir = path.join(REPO_ROOT, 'stories', folderName);

  // Bail if folder exists
  try {
    await fs.access(storyDir);
    process.stderr.write(`error: story folder already exists: stories/${folderName}\n`);
    process.exit(1);
  } catch {
    // Expected — proceed
  }

  await fs.mkdir(storyDir, { recursive: true });
  await fs.mkdir(path.join(storyDir, 'test-cases'), { recursive: true });

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
    { src: 'bugs.md', dest: 'bugs.md' },
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

  // Empty .gitkeep in test-cases/ so the folder is tracked
  await fs.writeFile(path.join(storyDir, 'test-cases', '.gitkeep'), '');

  process.stdout.write(`✓ Scaffolded stories/${folderName}/\n`);
  process.stdout.write('  - story.md\n');
  process.stdout.write('  - ac-audit.md\n');
  process.stdout.write('  - execution-log.md\n');
  process.stdout.write('  - bugs.md\n');
  process.stdout.write('  - test-cases/\n');

  // Auto-refresh INDEX
  const buildIdx = spawnSync('node', ['scripts/build-index.mjs', 'stories'], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
  if (buildIdx.status !== 0) {
    process.stderr.write('warning: build-index returned non-zero. Run manually if needed.\n');
  }

  process.stdout.write(`\nNext step: open stories/${folderName}/story.md and paste the Jira ticket body.\n`);
  process.stdout.write('Then run /ac-auditor in Copilot Chat (or /story-intake to do both in one go).\n');
}

main().catch((err) => {
  process.stderr.write(`new-story failed: ${err.message}\n`);
  process.exit(1);
});
