#!/usr/bin/env node
// init.mjs — one-shot post-clone setup.
//
// Steps:
//   1. Write .client-slug with the slug provided.
//   2. Rename kortex-qa.code-workspace → <slug>-qa.code-workspace.
//   3. Verify VERSION exists.
//   4. Print a "next step" summary.
//
// Does NOT run `git init` automatically — leaves that to the
// engineer to confirm. (Git init is destructive if the user has
// already done `git init` and added files.)
//
// Usage:
//   node scripts/init.mjs <client-slug>
//   node scripts/init.mjs acme-corp

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function usage() {
  process.stderr.write('Usage: node scripts/init.mjs <client-slug>\n');
  process.stderr.write('Example: node scripts/init.mjs acme-corp\n');
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
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

  // 1. Write .client-slug
  const clientSlugPath = path.join(REPO_ROOT, '.client-slug');
  if (await fileExists(clientSlugPath)) {
    process.stderr.write('warning: .client-slug already exists. Overwriting.\n');
  }
  await fs.writeFile(clientSlugPath, slug + '\n');
  process.stdout.write(`✓ wrote .client-slug (${slug})\n`);

  // 2. Rename workspace file
  const oldWorkspace = path.join(REPO_ROOT, 'kortex-qa.code-workspace');
  const newWorkspace = path.join(REPO_ROOT, `${slug}-qa.code-workspace`);
  if (await fileExists(oldWorkspace)) {
    if (await fileExists(newWorkspace)) {
      process.stderr.write(`warning: ${path.basename(newWorkspace)} already exists, leaving old in place.\n`);
    } else {
      await fs.rename(oldWorkspace, newWorkspace);
      process.stdout.write(`✓ renamed workspace → ${path.basename(newWorkspace)}\n`);
    }
  } else {
    process.stdout.write(`· kortex-qa.code-workspace not found (may have been renamed already)\n`);
  }

  // 3. Verify VERSION
  const versionPath = path.join(REPO_ROOT, 'VERSION');
  if (!(await fileExists(versionPath))) {
    await fs.writeFile(versionPath, '1.0.0\n');
    process.stdout.write(`✓ created VERSION (1.0.0)\n`);
  } else {
    const v = (await fs.readFile(versionPath, 'utf8')).trim();
    process.stdout.write(`· VERSION exists (${v})\n`);
  }

  // 4. Gitignore .client-slug if not already
  const gitignorePath = path.join(REPO_ROOT, '.gitignore');
  try {
    const gi = await fs.readFile(gitignorePath, 'utf8');
    if (!gi.includes('.client-slug')) {
      // Don't auto-edit .gitignore — let the engineer decide whether
      // they want .client-slug tracked (some prefer it for clarity).
      process.stdout.write(`· note: .client-slug is NOT in .gitignore by default.\n`);
      process.stdout.write(`  Add it if you don't want it tracked in git.\n`);
    }
  } catch {
    // .gitignore missing — also fine
  }

  process.stdout.write('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.stdout.write(`  Initialized for client: ${slug}\n`);
  process.stdout.write('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n');
  process.stdout.write('Next steps:\n');
  process.stdout.write(`  1. Open the workspace:\n`);
  process.stdout.write(`       code ${slug}-qa.code-workspace\n`);
  process.stdout.write(`  2. Edit the workspace file to point at your SUT and automation repos.\n`);
  process.stdout.write(`  3. Initialize git (if not already):\n`);
  process.stdout.write(`       git init && git add . && git commit -m "init: kortex-qa for ${slug} v$(cat VERSION)"\n`);
  process.stdout.write(`  4. Fill in:\n`);
  process.stdout.write(`       team/members.md\n`);
  process.stdout.write(`       team/ceremonies.md\n`);
  process.stdout.write(`       team/workflow.md\n`);
  process.stdout.write(`       team/deploy.md\n`);
  process.stdout.write(`       environments/*.md\n`);
  process.stdout.write(`  5. Capture your first Jira ticket:\n`);
  process.stdout.write(`       node scripts/new-story.mjs <TICKET-KEY> <slug>\n`);
}

main().catch((err) => {
  process.stderr.write(`init failed: ${err.message}\n`);
  process.exit(1);
});
