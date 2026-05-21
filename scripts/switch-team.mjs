#!/usr/bin/env node
// switch-team.mjs — edit teams/active-team.txt.
//
// File semantics:
//   - Plain text, one slug per line, no blank lines, no comments.
//   - Line 1 = primary (default target for scaffold scripts).
//   - All listed lines = "active" (read by /session-start by default).
//
// Subcommands:
//   <slug>              Move <slug> to line 1 (set as primary).
//                       Creates the file if missing.
//                       If <slug> isn't in the file, it's added at top.
//   <slug> --add        Append <slug> to the bottom as secondary.
//                       Does nothing if already present.
//   <slug> --remove     Remove <slug> from the active list.
//   --list              Print current active list (primary first).
//
// Validates the slug exists as a real team folder under teams/<slug>/.
// Refuses to add a non-existent team.
//
// Usage:
//   node scripts/switch-team.mjs <slug>              # primary
//   node scripts/switch-team.mjs <slug> --add        # secondary
//   node scripts/switch-team.mjs <slug> --remove     # drop
//   node scripts/switch-team.mjs --list              # print

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const ACTIVE_FILE = path.join(REPO_ROOT, 'teams', 'active-team.txt');

function usage() {
  process.stderr.write('Usage:\n');
  process.stderr.write('  node scripts/switch-team.mjs <slug>             # set as primary\n');
  process.stderr.write('  node scripts/switch-team.mjs <slug> --add       # append as secondary\n');
  process.stderr.write('  node scripts/switch-team.mjs <slug> --remove    # drop from active list\n');
  process.stderr.write('  node scripts/switch-team.mjs --list             # print current active\n');
}

async function readActive() {
  try {
    const content = await fs.readFile(ACTIVE_FILE, 'utf8');
    return content.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

async function writeActive(list) {
  await fs.writeFile(ACTIVE_FILE, list.length ? list.join('\n') + '\n' : '');
}

async function teamExists(slug) {
  try {
    const stat = await fs.stat(path.join(REPO_ROOT, 'teams', slug));
    return stat.isDirectory() && slug !== '_template-team';
  } catch {
    return false;
  }
}

async function listAllTeams() {
  try {
    const entries = await fs.readdir(path.join(REPO_ROOT, 'teams'), { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== '_template-team')
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    usage();
    process.exit(1);
  }

  if (args[0] === '--list') {
    const active = await readActive();
    const all = await listAllTeams();
    process.stdout.write('Active teams (primary first):\n');
    if (active.length === 0) {
      process.stdout.write('  (none — run `node scripts/switch-team.mjs <slug>` to set primary)\n');
    } else {
      active.forEach((s, i) => {
        const label = i === 0 ? '(primary)' : '(also active)';
        const exists = all.includes(s);
        const note = exists ? '' : '  ⚠ NOT FOUND in teams/';
        process.stdout.write(`  ${i + 1}. ${s} ${label}${note}\n`);
      });
    }
    process.stdout.write(`\nAll teams in repo (${all.length}):\n`);
    if (all.length === 0) {
      process.stdout.write('  (none — run `node scripts/new-team.mjs <slug>` to create one)\n');
    } else {
      for (const s of all) process.stdout.write(`  - ${s}\n`);
    }
    return;
  }

  const slug = args[0];
  if (slug.startsWith('--')) {
    usage();
    process.exit(1);
  }

  const addFlag = args.includes('--add');
  const removeFlag = args.includes('--remove');

  // For --remove we don't need the team to exist (cleanup case)
  if (!removeFlag && !(await teamExists(slug))) {
    process.stderr.write(`error: team folder not found: teams/${slug}/\n`);
    process.stderr.write('Run `node scripts/new-team.mjs <slug>` first.\n');
    process.exit(1);
  }

  let active = await readActive();

  if (removeFlag) {
    const before = active.length;
    active = active.filter((s) => s !== slug);
    if (active.length === before) {
      process.stdout.write(`· ${slug} wasn't in the active list — no change.\n`);
    } else {
      await writeActive(active);
      process.stdout.write(`✓ removed ${slug} from active list.\n`);
    }
  } else if (addFlag) {
    if (active.includes(slug)) {
      process.stdout.write(`· ${slug} is already active.\n`);
    } else {
      active.push(slug);
      await writeActive(active);
      process.stdout.write(`✓ added ${slug} as secondary active team.\n`);
    }
  } else {
    // Set as primary (move to top, or add at top)
    active = active.filter((s) => s !== slug);
    active.unshift(slug);
    await writeActive(active);
    process.stdout.write(`✓ ${slug} is now the primary active team.\n`);
  }

  // Print updated list
  process.stdout.write('\nCurrent active list:\n');
  if (active.length === 0) {
    process.stdout.write('  (empty)\n');
  } else {
    active.forEach((s, i) => {
      const label = i === 0 ? '(primary)' : '(also active)';
      process.stdout.write(`  ${i + 1}. ${s} ${label}\n`);
    });
  }
}

main().catch((err) => {
  process.stderr.write(`switch-team failed: ${err.message}\n`);
  process.exit(1);
});
