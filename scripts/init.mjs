#!/usr/bin/env node
// init.mjs — one-shot post-clone setup (v1.1 — team-aware).
//
// Steps:
//   1. Write .client-slug with the client slug provided.
//   2. Rename kortex-qa.code-workspace → <client-slug>-qa.code-workspace.
//   3. Verify VERSION exists.
//   4. If --first-team <slug> is passed, scaffold that team via
//      new-team.mjs and set it as primary active. Otherwise, leave
//      teams/example-team/ in place as a learning reference and
//      ask the user to run new-team.mjs themselves.
//   5. Print a "next step" summary.
//
// Does NOT run `git init` automatically — leaves that to the
// engineer to confirm.
//
// Usage:
//   node scripts/init.mjs <client-slug>
//   node scripts/init.mjs <client-slug> --first-team <team-slug>
//   node scripts/init.mjs acme-corp --first-team pod-8

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function usage() {
  process.stderr.write('Usage: node scripts/init.mjs <client-slug> [--first-team <team-slug>]\n');
  process.stderr.write('Examples:\n');
  process.stderr.write('  node scripts/init.mjs acme-corp\n');
  process.stderr.write('  node scripts/init.mjs acme-corp --first-team pod-8\n');
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
  const args = process.argv.slice(2);
  const firstTeamIdx = args.indexOf('--first-team');
  const positionals = args.filter((a, i) =>
    a !== '--first-team' && (firstTeamIdx === -1 || i !== firstTeamIdx + 1));
  const [slug] = positionals;
  const firstTeam = firstTeamIdx !== -1 ? args[firstTeamIdx + 1] : null;

  if (!slug) {
    usage();
    process.exit(1);
  }
  if (!/^[a-z][a-z0-9-]+$/.test(slug)) {
    process.stderr.write(`error: client slug must be kebab-case lowercase (got: ${slug})\n`);
    process.exit(1);
  }
  if (firstTeam && !/^[a-z][a-z0-9-]+$/.test(firstTeam)) {
    process.stderr.write(`error: team slug must be kebab-case lowercase (got: ${firstTeam})\n`);
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

  // 4. Optionally scaffold the first real team
  if (firstTeam) {
    process.stdout.write(`\n→ Scaffolding first team: ${firstTeam}\n`);
    const r = spawnSync('node', ['scripts/new-team.mjs', firstTeam], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
    });
    if (r.status !== 0) {
      process.stderr.write(`warning: new-team.mjs exited ${r.status}. Continuing.\n`);
    } else {
      const r2 = spawnSync('node', ['scripts/switch-team.mjs', firstTeam], {
        cwd: REPO_ROOT,
        stdio: 'inherit',
      });
      if (r2.status !== 0) {
        process.stderr.write(`warning: switch-team.mjs exited ${r2.status}. Continuing.\n`);
      }
    }
  }

  // 5. Gitignore .client-slug if not already
  const gitignorePath = path.join(REPO_ROOT, '.gitignore');
  try {
    const gi = await fs.readFile(gitignorePath, 'utf8');
    if (!gi.includes('.client-slug')) {
      process.stdout.write(`· note: .client-slug is NOT in .gitignore by default.\n`);
      process.stdout.write(`  Add it if you don't want it tracked in git.\n`);
    }
  } catch {
    // .gitignore missing — also fine
  }

  process.stdout.write('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.stdout.write(`  Initialized for client: ${slug}\n`);
  if (firstTeam) process.stdout.write(`  First team: ${firstTeam} (primary active)\n`);
  process.stdout.write('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n');
  process.stdout.write('Next steps:\n');
  process.stdout.write(`  1. Open the workspace:\n`);
  process.stdout.write(`       code ${slug}-qa.code-workspace\n`);
  process.stdout.write(`  2. Edit the workspace file to point at your SUT and automation repos.\n`);
  process.stdout.write(`  3. Initialize git inside the clone (if not already):\n`);
  process.stdout.write(`       git init && git add . && git commit -m "init: kortex-qa for ${slug} v$(cat VERSION)"\n`);
  if (firstTeam) {
    process.stdout.write(`  4. Fill in team details:\n`);
    process.stdout.write(`       teams/${firstTeam}/members.md\n`);
    process.stdout.write(`       teams/${firstTeam}/workflow.md\n`);
    process.stdout.write(`       teams/${firstTeam}/deploy.md\n`);
    process.stdout.write(`       teams/${firstTeam}/ceremonies-info.md\n`);
    process.stdout.write(`       teams/${firstTeam}/environments/*.md\n`);
    process.stdout.write(`  5. Capture your first Jira ticket:\n`);
    process.stdout.write(`       node scripts/new-story.mjs <TICKET-KEY> <slug>\n`);
  } else {
    process.stdout.write(`  4. Scaffold your first real team:\n`);
    process.stdout.write(`       node scripts/new-team.mjs <team-slug>\n`);
    process.stdout.write(`       node scripts/switch-team.mjs <team-slug>\n`);
    process.stdout.write(`  5. (Optional) remove the example-team:\n`);
    process.stdout.write(`       rm -rf teams/example-team\n`);
    process.stdout.write(`  6. Fill in members / workflow / deploy / environments / etc.\n`);
    process.stdout.write(`  7. Capture your first Jira ticket:\n`);
    process.stdout.write(`       node scripts/new-story.mjs <TICKET-KEY> <slug>\n`);
  }
}

main().catch((err) => {
  process.stderr.write(`init failed: ${err.message}\n`);
  process.exit(1);
});
