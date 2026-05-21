#!/usr/bin/env node
// new-bug.mjs — scaffold a bug file under bugs/.
//
// Assigns the next free BUG-<NNN> by scanning existing files.
// Creates the file from templates/bug.md with substitutions.
// Auto-refreshes bugs/INDEX.md.
//
// Usage:
//   node scripts/new-bug.mjs <slug>
//   node scripts/new-bug.mjs search-empty-on-trailing-whitespace

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function usage() {
  process.stderr.write('Usage: node scripts/new-bug.mjs <slug>\n');
  process.stderr.write('Example: node scripts/new-bug.mjs search-empty-on-trailing-whitespace\n');
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

async function nextBugId(bugsDir) {
  let maxN = 0;
  try {
    const entries = await fs.readdir(bugsDir);
    for (const name of entries) {
      const m = name.match(/^BUG-(\d{3})-/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > maxN) maxN = n;
      }
    }
  } catch {
    // Dir doesn't exist yet
  }
  return String(maxN + 1).padStart(3, '0');
}

async function main() {
  const [slug] = process.argv.slice(2);
  if (!slug) {
    usage();
    process.exit(1);
  }
  if (!/^[a-z][a-z0-9-]+$/.test(slug)) {
    process.stderr.write(`error: slug must be kebab-case lowercase (got: ${slug})\n`);
    process.exit(1);
  }

  const bugsDir = path.join(REPO_ROOT, 'bugs');
  const seq = await nextBugId(bugsDir);
  const id = `BUG-${seq}`;
  const filename = `${id}-${slug}.md`;
  const filePath = path.join(bugsDir, filename);

  try {
    await fs.access(filePath);
    process.stderr.write(`error: file already exists: bugs/${filename}\n`);
    process.exit(1);
  } catch {
    // Expected
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'bug.md');
  let content;
  try {
    content = await fs.readFile(templatePath, 'utf8');
  } catch (err) {
    process.stderr.write(`error: missing template bug.md: ${err.message}\n`);
    process.exit(1);
  }

  const vars = {
    ID: id,
    SLUG: slug,
    UPDATED: todayISO(),
    TITLE: `${id} — <one-line summary>`,
  };
  content = substitute(content, vars);
  await fs.writeFile(filePath, content);

  process.stdout.write(`✓ Created bugs/${filename}\n`);
  process.stdout.write(`  ID: ${id}\n`);

  const buildIdx = spawnSync('node', ['scripts/build-index.mjs', 'bugs'], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
  if (buildIdx.status !== 0) {
    process.stderr.write('warning: build-index returned non-zero. Run manually if needed.\n');
  }

  process.stdout.write(`\nNext step: open the file and fill in the bug body.\n`);
  process.stdout.write('Or invoke /bug-report-formatter in Copilot Chat to get a Jira-paste block.\n');
}

main().catch((err) => {
  process.stderr.write(`new-bug failed: ${err.message}\n`);
  process.exit(1);
});
