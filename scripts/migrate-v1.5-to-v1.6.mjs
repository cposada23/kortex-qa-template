#!/usr/bin/env node
// migrate-v1.5-to-v1.6.mjs — one-shot migration from dual-location to
// single-home test cases. Idempotent: safe to re-run.
//
// Operations per team:
//   1. Move teams/<team>/stories/<TICKET>/test-cases/*.md to
//      teams/<team>/test-cases/<area>/<file>.md.
//   2. Ensure each TC has id: TC-<AREA>-<NNN> in frontmatter.
//   3. Add linked_stories: [<TICKET>] to each migrated TC.
//   4. Add linked_test_cases: [<id>, ...] to story.md frontmatter.
//   5. Add "## Test cases" body section with markdown links.
//   6. If story has bugs.md: extract referenced bug IDs, add
//      linked_bugs: to story frontmatter + body section. Delete bugs.md.
//
// Idempotent: if a story has no test-cases/ subfolder, skip it.

import { promises as fs } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const TEAMS_DIR = path.join(REPO_ROOT, 'teams');

function parseFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return { fm: null, body: content };
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let value = kv[2].trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    } else {
      value = value.replace(/^['"]|['"]$/g, '');
    }
    fm[key] = value;
  }
  return { fm, body: content.slice(m[0].length).replace(/^\n/, '') };
}

function stringifyFrontmatter(fm, body) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(fm)) {
    if (Array.isArray(v)) {
      lines.push(`${k}: [${v.join(', ')}]`);
    } else if (v != null) {
      lines.push(`${k}: ${v}`);
    }
  }
  lines.push('---', '');
  return lines.join('\n') + body;
}

async function listTeams() {
  const entries = await fs.readdir(TEAMS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('_') && !e.name.startsWith('.'))
    .map((e) => e.name);
}

async function getNextNNN(area, team) {
  // Scan teams/<team>/test-cases/<area>/ for existing TC-<UPPER(area)>-NNN
  const areaDir = path.join(TEAMS_DIR, team, 'test-cases', area);
  let nnn = 1;
  try {
    const files = await fs.readdir(areaDir);
    for (const f of files) {
      const m = f.match(new RegExp(`tc-${area}-(\\d+)`, 'i'));
      if (m) nnn = Math.max(nnn, Number(m[1]) + 1);
    }
  } catch {}
  return String(nnn).padStart(3, '0');
}

async function migrateTeam(team) {
  const teamDir = path.join(TEAMS_DIR, team);
  const storiesDir = path.join(teamDir, 'stories');
  let storyDirs;
  try {
    storyDirs = (await fs.readdir(storiesDir, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return { team, status: 'no-stories', moved: 0 };
  }

  let movedTCs = 0;
  for (const storyName of storyDirs) {
    const storyFolder = path.join(storiesDir, storyName);
    const storyMd = path.join(storyFolder, 'story.md');
    const tcSubdir = path.join(storyFolder, 'test-cases');
    const bugsPointer = path.join(storyFolder, 'bugs.md');

    // Idempotency: skip if no test-cases/ subfolder and no bugs.md
    let hasTC = false;
    try {
      await fs.access(tcSubdir);
      hasTC = true;
    } catch {}
    let hasBugsPointer = false;
    try {
      await fs.access(bugsPointer);
      hasBugsPointer = true;
    } catch {}
    if (!hasTC && !hasBugsPointer) continue;

    // Read story
    let storyContent = await fs.readFile(storyMd, 'utf8');
    const { fm: storyFm, body: storyBody } = parseFrontmatter(storyContent);

    // Infer ticket key — supports both PROJ-123 and PROJ-EXAMPLE-001 styles.
    const ticketMatch = storyName.match(/^([A-Z][A-Z0-9_]*(?:-[A-Z][A-Z0-9_]*)*-\d+)/);
    const ticketKey = ticketMatch ? ticketMatch[1] : storyName;

    const linkedTCs = Array.isArray(storyFm.linked_test_cases) ? [...storyFm.linked_test_cases] : [];
    const linkedBugs = Array.isArray(storyFm.linked_bugs) ? [...storyFm.linked_bugs] : [];

    const tcBodyLines = [];

    if (hasTC) {
      const tcFiles = (await fs.readdir(tcSubdir, { withFileTypes: true }))
        .filter((e) => e.isFile() && e.name.endsWith('.md'))
        .map((e) => e.name);

      for (const tcFile of tcFiles) {
        const src = path.join(tcSubdir, tcFile);
        const tcContent = await fs.readFile(src, 'utf8');
        const { fm: tcFm, body: tcBody } = parseFrontmatter(tcContent);

        // Determine area
        let area = tcFm.area;
        if (!area) {
          // infer from filename if formatted like tc-<area>-<NNN>
          const am = tcFile.match(/^tc-([a-z][a-z0-9-]+?)-\d+/i);
          area = am ? am[1].toLowerCase() : 'misc';
        }
        area = String(area).toLowerCase();

        // Determine ID
        let id = tcFm.id;
        if (!id) {
          const nnn = await getNextNNN(area, team);
          id = `TC-${area.toUpperCase()}-${nnn}`;
        }
        tcFm.id = id;
        tcFm.area = area;

        // Ensure linked_stories includes the parent
        const ls = Array.isArray(tcFm.linked_stories) ? tcFm.linked_stories : [];
        if (!ls.includes(ticketKey)) ls.push(ticketKey);
        tcFm.linked_stories = ls;

        // Default review_status if missing
        if (!tcFm.review_status) tcFm.review_status = 'not-reviewed';

        // Write to destination
        const destDir = path.join(teamDir, 'test-cases', area);
        await fs.mkdir(destDir, { recursive: true });
        const destPath = path.join(destDir, tcFile);
        await fs.writeFile(destPath, stringifyFrontmatter(tcFm, tcBody));
        await fs.unlink(src);

        // Track for story update
        linkedTCs.push(id);
        const title = tcFm.title || id;
        const relLink = path.relative(storyFolder, destPath).split(path.sep).join('/');
        tcBodyLines.push(`- [${id} — ${title.replace(new RegExp(`^${id}\\s*[—\\-:]\\s*`), '')}](${relLink})`);
        movedTCs++;
      }

      // Remove empty test-cases/ folder
      try {
        await fs.rmdir(tcSubdir);
      } catch {}
    }

    if (hasBugsPointer) {
      // Parse bugs.md to extract bug IDs (look for BUG-NNN patterns + markdown links)
      const bugsContent = await fs.readFile(bugsPointer, 'utf8');
      const bugIdRe = /\b(BUG-\d{3,})\b/g;
      const found = new Set();
      let bm;
      while ((bm = bugIdRe.exec(bugsContent)) !== null) {
        found.add(bm[1]);
      }
      for (const bid of found) {
        if (!linkedBugs.includes(bid)) linkedBugs.push(bid);
      }
      // Delete bugs.md (linked_bugs in story is now canonical)
      await fs.unlink(bugsPointer);
    }

    // Update story frontmatter + body
    storyFm.linked_test_cases = linkedTCs;
    storyFm.linked_bugs = linkedBugs;
    if (!storyFm.review_status) storyFm.review_status = 'not-reviewed';

    // Ensure ## Test cases section in body
    let newBody = storyBody;
    if (linkedTCs.length > 0 && !newBody.match(/^##\s+Test cases/m)) {
      newBody += `\n\n## Test cases\n\n${tcBodyLines.join('\n')}\n`;
    }
    // Ensure ## Bugs found section if bugs exist
    if (linkedBugs.length > 0 && !newBody.match(/^##\s+Bugs found/m)) {
      const bugLines = [];
      const bugsDir = path.join(teamDir, 'bugs');
      const bugFiles = await fs.readdir(bugsDir).catch(() => []);
      for (const bid of linkedBugs) {
        // Try to find the bug file to build a link
        const match = bugFiles.find((f) => f.startsWith(bid + '-'));
        if (match) {
          const relLink = path
            .relative(storyFolder, path.join(bugsDir, match))
            .split(path.sep)
            .join('/');
          bugLines.push(`- [${bid}](${relLink})`);
        } else {
          bugLines.push(`- ${bid}`);
        }
      }
      newBody += `\n\n## Bugs found\n\n${bugLines.join('\n')}\n`;
    }

    await fs.writeFile(storyMd, stringifyFrontmatter(storyFm, newBody));
  }

  return { team, status: 'migrated', moved: movedTCs };
}

async function main() {
  const teams = await listTeams();
  if (teams.length === 0) {
    process.stdout.write('No teams to migrate. Done.\n');
    return;
  }
  const results = [];
  for (const team of teams) {
    const r = await migrateTeam(team);
    results.push(r);
    process.stdout.write(`· ${r.team} — ${r.status}, ${r.moved} TC(s) moved\n`);
  }

  // Rebuild indexes
  process.stdout.write('\n→ Rebuilding INDEX.md files\n');
  const r = spawnSync('node', ['scripts/build-index.mjs'], { cwd: REPO_ROOT, stdio: 'inherit' });
  if (r.status !== 0) {
    process.stderr.write('warning: build-index.mjs exited non-zero. Continuing.\n');
  }

  process.stdout.write('\n✓ Migration complete. Run `node scripts/validate.mjs` + `node scripts/validate-links.mjs` to verify.\n');
}

main().catch((err) => {
  process.stderr.write(`migration failed: ${err.message}\n`);
  process.exit(1);
});
