#!/usr/bin/env node
// new-team.mjs — scaffold a new team folder under teams/<slug>/.
//
// Copies teams/_template-team/ to teams/<slug>/, then replaces
// {{TEAM_SLUG}} and {{TEAM_NAME}} placeholders in each markdown file.
//
// Does NOT auto-switch the active team (use switch-team.mjs for that).
// Auto-refreshes teams/INDEX.md after creation.
//
// Usage:
//   node scripts/new-team.mjs <slug> [--name "<display name>"]
//   node scripts/new-team.mjs pod-8
//   node scripts/new-team.mjs seis-pro-tagema --name "Six Pro-Tagema"

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function usage() {
  process.stderr.write('Usage: node scripts/new-team.mjs <slug> [--name "<display name>"]\n');
  process.stderr.write('Examples:\n');
  process.stderr.write('  node scripts/new-team.mjs pod-8\n');
  process.stderr.write('  node scripts/new-team.mjs seis-pro-tagema --name "Six Pro-Tagema"\n');
}

function slugToName(slug) {
  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) {
      await copyDir(s, d);
    } else if (e.isFile()) {
      await fs.copyFile(s, d);
    }
  }
}

async function substituteInFile(filePath, vars) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let changed = false;
    for (const [key, val] of Object.entries(vars)) {
      const re = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      if (re.test(content)) {
        content = content.replace(re, val);
        changed = true;
      }
    }
    if (changed) await fs.writeFile(filePath, content);
  } catch {
    // Binary or unreadable — skip
  }
}

async function walkAndSubstitute(dir, vars) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      await walkAndSubstitute(full, vars);
    } else if (e.isFile() && e.name.endsWith('.md')) {
      await substituteInFile(full, vars);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const nameFlagIdx = args.indexOf('--name');
  const positionals = args.filter((a, i) =>
    a !== '--name' && (nameFlagIdx === -1 || i !== nameFlagIdx + 1));
  const [slug] = positionals;

  if (!slug) {
    usage();
    process.exit(1);
  }
  if (!/^[a-z][a-z0-9-]+$/.test(slug)) {
    process.stderr.write(`error: slug must be kebab-case lowercase (got: ${slug})\n`);
    process.exit(1);
  }
  if (slug === '_template-team') {
    process.stderr.write('error: "_template-team" is reserved.\n');
    process.exit(1);
  }

  const displayName = nameFlagIdx !== -1
    ? args[nameFlagIdx + 1]
    : slugToName(slug);

  const srcDir = path.join(REPO_ROOT, 'teams', '_template-team');
  const destDir = path.join(REPO_ROOT, 'teams', slug);

  try {
    await fs.access(srcDir);
  } catch {
    process.stderr.write(`error: template directory missing: teams/_template-team/\n`);
    process.exit(1);
  }
  try {
    await fs.access(destDir);
    process.stderr.write(`error: team folder already exists: teams/${slug}/\n`);
    process.exit(1);
  } catch {
    // Expected — proceed
  }

  await copyDir(srcDir, destDir);

  // Substitute placeholders in every .md file
  await walkAndSubstitute(destDir, {
    TEAM_SLUG: slug,
    TEAM_NAME: displayName,
  });

  process.stdout.write(`✓ Scaffolded teams/${slug}/\n`);
  process.stdout.write(`  Display name: ${displayName}\n`);

  // Refresh teams/INDEX.md so the new team shows up
  const buildIdx = spawnSync('node', ['scripts/build-index.mjs', 'teams'], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
  if (buildIdx.status !== 0) {
    process.stderr.write('warning: build-index returned non-zero. Run manually if needed.\n');
  }

  process.stdout.write(`\nNext steps:\n`);
  process.stdout.write(`  1. Activate the team:\n`);
  process.stdout.write(`       node scripts/switch-team.mjs ${slug}        # set as primary\n`);
  process.stdout.write(`       node scripts/switch-team.mjs ${slug} --add  # add as secondary\n`);
  process.stdout.write(`  2. Fill in team details:\n`);
  process.stdout.write(`       teams/${slug}/members.md\n`);
  process.stdout.write(`       teams/${slug}/workflow.md\n`);
  process.stdout.write(`       teams/${slug}/deploy.md\n`);
  process.stdout.write(`       teams/${slug}/ceremonies-info.md\n`);
  process.stdout.write(`       teams/${slug}/environments/*.md\n`);
}

main().catch((err) => {
  process.stderr.write(`new-team failed: ${err.message}\n`);
  process.exit(1);
});
