#!/usr/bin/env node
// new-test-case.mjs — scaffold a test case under teams/<team>/test-cases/<area>/.
//
// CHANGED IN v1.6:
//   - Drops library/ subfolder. All TCs live at <area>/ directly.
//   - New --link-story <TICKET> flag updates both sides:
//       1. TC's frontmatter linked_stories: [<TICKET>] is set.
//       2. The story's linked_test_cases: gains the new TC's id.
//       3. The story's body "## Test cases" section gains a markdown
//          link to the new TC.
//
// Assigns the next free TC-<AREA>-<NNN> ID by scanning existing files
// in the area. Creates the file from templates/test-case.md with
// substitutions. Auto-refreshes test-cases/INDEX.md.
//
// Usage:
//   node scripts/new-test-case.mjs <area> <slug> [--team <slug>] [--link-story <TICKET>]
//   node scripts/new-test-case.mjs auth login-locked-account
//   node scripts/new-test-case.mjs auth login-happy --link-story TEAM-1234

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function usage() {
  process.stderr.write('Usage: node scripts/new-test-case.mjs <area> <slug> [--team <slug>] [--link-story <TICKET>]\n');
  process.stderr.write('Example: node scripts/new-test-case.mjs auth login-happy --link-story TEAM-1234\n');
}

function flagValue(args, name) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  const v = args[idx + 1];
  if (!v) throw new Error(`${name} requires an argument`);
  return v;
}

async function resolveTargetTeam(args) {
  const slug = flagValue(args, '--team');
  if (slug) return slug;
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

async function nextId(areaDir, area) {
  let maxN = 0;
  try {
    const entries = await fs.readdir(areaDir);
    for (const name of entries) {
      const m = name.match(new RegExp(`^tc-${area}-(\\d{3})-`));
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

// Find the story folder for a given ticket key under teams/<team>/stories/.
async function findStoryDir(teamSlug, ticketKey) {
  const storiesRoot = path.join(REPO_ROOT, 'teams', teamSlug, 'stories');
  let entries;
  try {
    entries = await fs.readdir(storiesRoot, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const e of entries) {
    if (e.isDirectory() && e.name.startsWith(ticketKey + '-')) {
      return path.join(storiesRoot, e.name);
    }
  }
  // Also allow exact match (no slug suffix)
  for (const e of entries) {
    if (e.isDirectory() && e.name === ticketKey) {
      return path.join(storiesRoot, e.name);
    }
  }
  return null;
}

// Update story.md's frontmatter linked_test_cases + body "## Test cases" section.
async function linkTcToStory(storyDir, tcId, tcTitle, tcRelPath) {
  const storyMd = path.join(storyDir, 'story.md');
  let content;
  try {
    content = await fs.readFile(storyMd, 'utf8');
  } catch {
    throw new Error(`story.md not found at ${path.relative(REPO_ROOT, storyMd)}`);
  }

  // Update frontmatter linked_test_cases array
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) throw new Error('story.md missing frontmatter');
  let fmBlock = fmMatch[1];
  const lineRe = /^linked_test_cases:\s*\[(.*?)\]$/m;
  const lineMatch = fmBlock.match(lineRe);
  if (lineMatch) {
    const existing = lineMatch[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!existing.includes(tcId)) existing.push(tcId);
    fmBlock = fmBlock.replace(lineRe, `linked_test_cases: [${existing.join(', ')}]`);
  } else {
    // Append the field before the closing ---
    fmBlock = fmBlock + `\nlinked_test_cases: [${tcId}]`;
  }
  // Bump updated:
  fmBlock = fmBlock.replace(/^updated:\s*.*$/m, `updated: ${todayISO()}`);
  content = content.replace(/^---\r?\n[\s\S]*?\r?\n---/, `---\n${fmBlock}\n---`);

  // Update body "## Test cases" section — append a markdown link.
  // tcRelPath is a path from teams/<team>/test-cases/<area>/<file>.md
  // we need it relative to the story folder.
  const linkPath = path.relative(storyDir, tcRelPath).split(path.sep).join('/');
  const bullet = `- [${tcId} — ${tcTitle}](${linkPath})`;

  const tcSectionRe = /(^##\s+Test cases\s*\n)([\s\S]*?)(?=^##\s|^$|\Z)/m;
  const sectionMatch = content.match(tcSectionRe);
  if (sectionMatch) {
    let sectionBody = sectionMatch[2];
    // Drop the placeholder line if present
    sectionBody = sectionBody.replace(/^_\(populated as you author TCs[^)]*\)_\s*\n?/m, '');
    // Append bullet
    if (!sectionBody.includes(`[${tcId} —`)) {
      sectionBody = sectionBody.trimEnd() + `\n${bullet}\n`;
    }
    content = content.replace(tcSectionRe, `${sectionMatch[1]}\n${sectionBody}\n`);
  } else {
    // Append a new ## Test cases section at end of body
    content = content.trimEnd() + `\n\n## Test cases\n\n${bullet}\n`;
  }

  await fs.writeFile(storyMd, content);
}

async function main() {
  const args = process.argv.slice(2);
  const positionals = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--team' || args[i] === '--link-story') {
      i++; // skip the value
      continue;
    }
    positionals.push(args[i]);
  }
  const [area, slug] = positionals;

  if (!area || !slug) {
    usage();
    process.exit(1);
  }
  if (!/^[a-z][a-z0-9-]*$/.test(area)) {
    process.stderr.write(`error: area must be kebab-case lowercase (got: ${area})\n`);
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
  try {
    await fs.access(path.join(REPO_ROOT, 'teams', teamSlug));
  } catch {
    process.stderr.write(`error: team folder not found: teams/${teamSlug}/\n`);
    process.exit(1);
  }

  const linkStory = flagValue(args, '--link-story');
  if (linkStory && !/^[A-Z][A-Z0-9]+(?:-[A-Z][A-Z0-9]+)*-\d+$/.test(linkStory)) {
    process.stderr.write(`error: --link-story expects a Jira-key shape (e.g. TEAM-1234), got: ${linkStory}\n`);
    process.exit(1);
  }

  const areaDir = path.join(REPO_ROOT, 'teams', teamSlug, 'test-cases', area);
  await fs.mkdir(areaDir, { recursive: true });

  const areaUpper = area.toUpperCase();
  const seq = await nextId(areaDir, area);
  const id = `TC-${areaUpper}-${seq}`;
  const filename = `tc-${area}-${seq}-${slug}.md`;
  const filePath = path.join(areaDir, filename);

  try {
    await fs.access(filePath);
    process.stderr.write(`error: file already exists: teams/${teamSlug}/test-cases/${area}/${filename}\n`);
    process.exit(1);
  } catch {
    // Expected
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'test-case.md');
  let content;
  try {
    content = await fs.readFile(templatePath, 'utf8');
  } catch (err) {
    process.stderr.write(`error: missing template test-case.md: ${err.message}\n`);
    process.exit(1);
  }

  const tcTitle = `<one-line scenario summary>`;
  const linkedStories = linkStory ? `[${linkStory}]` : `[]`;
  const vars = {
    ID: id,
    AREA: area,
    AREA_UPPER: areaUpper,
    SLUG: slug,
    UPDATED: todayISO(),
    TITLE: `${id} — ${tcTitle}`,
    LINKED_STORIES: linkedStories,
  };
  content = substitute(content, vars);
  await fs.writeFile(filePath, content);

  process.stdout.write(`✓ Created teams/${teamSlug}/test-cases/${area}/${filename}\n`);
  process.stdout.write(`  ID: ${id}\n`);

  // Wire to story if --link-story was provided
  if (linkStory) {
    const storyDir = await findStoryDir(teamSlug, linkStory);
    if (!storyDir) {
      process.stderr.write(`warning: --link-story ${linkStory} but no story folder found under teams/${teamSlug}/stories/. TC frontmatter has linked_stories: [${linkStory}] but story.md was not updated.\n`);
    } else {
      try {
        await linkTcToStory(storyDir, id, tcTitle, filePath);
        process.stdout.write(`✓ Linked to ${linkStory} (frontmatter + body section updated)\n`);
      } catch (err) {
        process.stderr.write(`warning: failed to update story.md: ${err.message}\n`);
      }
    }
  }

  const buildIdx = spawnSync('node', ['scripts/build-index.mjs', `teams/${teamSlug}/test-cases`], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
  if (buildIdx.status !== 0) {
    process.stderr.write('warning: build-index returned non-zero. Run manually if needed.\n');
  }

  process.stdout.write(`\nNext step: open the file and fill in the test case body.\n`);
}

main().catch((err) => {
  process.stderr.write(`new-test-case failed: ${err.message}\n`);
  process.exit(1);
});
