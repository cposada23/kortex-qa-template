#!/usr/bin/env node
// new-bug.mjs — scaffold a bug file under teams/<team>/bugs/.
//
// CHANGED IN v1.6:
//   - New --link-story <TICKET> flag updates both sides:
//       1. Bug's frontmatter linked_stories: [<TICKET>].
//       2. The story's linked_bugs: gains BUG-NNN.
//       3. The story's body "## Bugs found" section gains a
//          markdown link to the new bug.
//
// Assigns the next free BUG-<NNN> by scanning existing files.
// Creates the file from templates/bug.md with substitutions.
// Auto-refreshes bugs/INDEX.md.
//
// Usage:
//   node scripts/new-bug.mjs <slug> [--team <slug>] [--link-story <TICKET>]
//   node scripts/new-bug.mjs search-empty-on-trailing-whitespace
//   node scripts/new-bug.mjs broken-cta --link-story TEAM-1234

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function usage() {
  process.stderr.write('Usage: node scripts/new-bug.mjs <slug> [--team <slug>] [--link-story <TICKET>]\n');
  process.stderr.write('Example: node scripts/new-bug.mjs broken-cta --link-story TEAM-1234\n');
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

async function findStoryDir(teamSlug, ticketKey) {
  const storiesRoot = path.join(REPO_ROOT, 'teams', teamSlug, 'stories');
  let entries;
  try {
    entries = await fs.readdir(storiesRoot, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const e of entries) {
    if (e.isDirectory() && (e.name.startsWith(ticketKey + '-') || e.name === ticketKey)) {
      return path.join(storiesRoot, e.name);
    }
  }
  return null;
}

async function linkBugToStory(storyDir, bugId, bugTitle, bugRelPath) {
  const storyMd = path.join(storyDir, 'story.md');
  let content;
  try {
    content = await fs.readFile(storyMd, 'utf8');
  } catch {
    throw new Error(`story.md not found at ${path.relative(REPO_ROOT, storyMd)}`);
  }

  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) throw new Error('story.md missing frontmatter');
  let fmBlock = fmMatch[1];
  const lineRe = /^linked_bugs:\s*\[(.*?)\]$/m;
  const lineMatch = fmBlock.match(lineRe);
  if (lineMatch) {
    const existing = lineMatch[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!existing.includes(bugId)) existing.push(bugId);
    fmBlock = fmBlock.replace(lineRe, `linked_bugs: [${existing.join(', ')}]`);
  } else {
    fmBlock = fmBlock + `\nlinked_bugs: [${bugId}]`;
  }
  fmBlock = fmBlock.replace(/^updated:\s*.*$/m, `updated: ${todayISO()}`);
  content = content.replace(/^---\r?\n[\s\S]*?\r?\n---/, `---\n${fmBlock}\n---`);

  const linkPath = path.relative(storyDir, bugRelPath).split(path.sep).join('/');
  const bullet = `- [${bugId} — ${bugTitle}](${linkPath})`;

  const sectionRe = /(^##\s+Bugs found\s*\n)([\s\S]*?)(?=^##\s|^$|\Z)/m;
  const sectionMatch = content.match(sectionRe);
  if (sectionMatch) {
    let sectionBody = sectionMatch[2];
    sectionBody = sectionBody.replace(/^_\(populated as bugs are filed[^)]*\)_\s*\n?/m, '');
    if (!sectionBody.includes(`[${bugId} —`)) {
      sectionBody = sectionBody.trimEnd() + `\n${bullet}\n`;
    }
    content = content.replace(sectionRe, `${sectionMatch[1]}\n${sectionBody}\n`);
  } else {
    content = content.trimEnd() + `\n\n## Bugs found\n\n${bullet}\n`;
  }

  await fs.writeFile(storyMd, content);
}

async function main() {
  const args = process.argv.slice(2);
  const positionals = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--team' || args[i] === '--link-story') {
      i++;
      continue;
    }
    positionals.push(args[i]);
  }
  const [slug] = positionals;

  if (!slug) {
    usage();
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
    process.stderr.write(`error: --link-story expects a Jira-key shape, got: ${linkStory}\n`);
    process.exit(1);
  }

  const bugsDir = path.join(REPO_ROOT, 'teams', teamSlug, 'bugs');
  await fs.mkdir(bugsDir, { recursive: true });
  const seq = await nextBugId(bugsDir);
  const id = `BUG-${seq}`;
  const filename = `${id}-${slug}.md`;
  const filePath = path.join(bugsDir, filename);

  try {
    await fs.access(filePath);
    process.stderr.write(`error: file already exists: teams/${teamSlug}/bugs/${filename}\n`);
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

  const bugTitle = `<one-line summary>`;
  const linkedStories = linkStory ? `[${linkStory}]` : `[]`;
  const vars = {
    ID: id,
    SLUG: slug,
    UPDATED: todayISO(),
    TITLE: `${id} — ${bugTitle}`,
    LINKED_STORIES: linkedStories,
  };
  content = substitute(content, vars);
  await fs.writeFile(filePath, content);

  process.stdout.write(`✓ Created teams/${teamSlug}/bugs/${filename}\n`);
  process.stdout.write(`  ID: ${id}\n`);

  if (linkStory) {
    const storyDir = await findStoryDir(teamSlug, linkStory);
    if (!storyDir) {
      process.stderr.write(`warning: --link-story ${linkStory} but no story folder found under teams/${teamSlug}/stories/. Bug frontmatter has linked_stories: [${linkStory}] but story.md was not updated.\n`);
    } else {
      try {
        await linkBugToStory(storyDir, id, bugTitle, filePath);
        process.stdout.write(`✓ Linked to ${linkStory} (frontmatter + body section updated)\n`);
      } catch (err) {
        process.stderr.write(`warning: failed to update story.md: ${err.message}\n`);
      }
    }
  }

  const buildIdx = spawnSync('node', ['scripts/build-index.mjs', `teams/${teamSlug}/bugs`], {
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
