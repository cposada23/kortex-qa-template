#!/usr/bin/env node
// validate-links.mjs — verify ID-based and markdown-link integrity.
//
// Walks teams/, builds an index of every file's id (from frontmatter),
// then verifies:
//   1. Every id referenced in linked_test_cases / linked_bugs /
//      linked_stories / linked_story / linked_test_case resolves to
//      a known file.
//   2. Every markdown link in body that points at a .md file under
//      teams/ resolves to an existing file.
//   3. Body links with an ID prefix (e.g. [TC-AUTH-001 — ...](...))
//      target a file whose id: matches.
//
// Cross-platform: pure Node, no shell-outs.
//
// Usage:
//   node scripts/validate-links.mjs           # validate, exit 1 on break
//   node scripts/validate-links.mjs --quiet   # silent on clean runs

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const TEAMS_DIR = path.join(REPO_ROOT, 'teams');

const SKIP_DIRS = new Set(['node_modules', '.git', '.cache', 'versions']);

const ID_FIELDS_SINGLE = ['linked_story', 'linked_test_case'];
const ID_FIELDS_ARRAY = ['linked_stories', 'linked_test_cases', 'linked_bugs'];

// Accept TC-AUTH-001 style, BUG-001 style, and Jira keys with possibly
// multi-segment project codes (TEAM-1234, TEAM-EXAMPLE-001, ACME-PROJ-9001).
const ID_PREFIX_RE = /^(TC-[A-Z0-9_-]+|BUG-\d+|[A-Z][A-Z0-9]+(?:-[A-Z][A-Z0-9]+)*-\d+)$/;
const BODY_LINK_RE = /\[([^\]]+)\]\(([^)]+\.md)(#[^)]+)?\)/g;
const ID_IN_LINK_TEXT_RE = /^(TC-[A-Z0-9_-]+|BUG-\d+|[A-Z][A-Z0-9]+(?:-[A-Z][A-Z0-9]+)*-\d+)\b/;

async function walkMd(dir) {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walkMd(full)));
    } else if (e.isFile() && e.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split('\n')) {
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
  return fm;
}

function inferStoryIdFromPath(filePath) {
  // teams/<team>/stories/<TICKET-KEY>-<slug>/story.md
  // TICKET-KEY may be multi-segment (TEAM-EXAMPLE-001 etc), so the regex
  // greedily takes the longest "uppercase-segment(s)-trailing-digits" prefix.
  const norm = filePath.split(path.sep).join('/');
  const m = norm.match(/\/stories\/([A-Z][A-Z0-9]+(?:-[A-Z][A-Z0-9]+)*-\d+)-/);
  return m ? m[1] : null;
}

function extractId(filePath, fm) {
  if (fm && fm.id) return fm.id;
  const norm = filePath.split(path.sep).join('/');
  if (norm.endsWith('/story.md')) return inferStoryIdFromPath(filePath);
  return null;
}

async function main() {
  const quiet = process.argv.includes('--quiet');

  const files = await walkMd(TEAMS_DIR);
  const parsed = [];
  const idToPath = new Map();
  const duplicateIds = new Map(); // id → [paths]

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const fm = parseFrontmatter(content);
    const id = extractId(file, fm);
    if (id) {
      if (idToPath.has(id)) {
        // Track duplicates: keep the first path in idToPath; record all
        // colliding files in duplicateIds for the error report.
        const firstPath = idToPath.get(id);
        if (!duplicateIds.has(id)) {
          duplicateIds.set(id, [firstPath]);
        }
        duplicateIds.get(id).push(file);
      } else {
        idToPath.set(id, file);
      }
    }
    parsed.push({ file, fm, content, id });
  }

  const errors = [];
  const warnings = [];

  // Promote duplicate-ID findings to errors. IDs are the load-bearing
  // identifier for linked_test_cases / linked_bugs / linked_stories —
  // a duplicate makes the reference ambiguous.
  for (const [id, paths] of duplicateIds) {
    const relPaths = paths.map((p) => path.relative(REPO_ROOT, p));
    errors.push(`duplicate id "${id}" across ${paths.length} files: ${relPaths.join(', ')}`);
  }

  for (const { file, fm, content } of parsed) {
    const rel = path.relative(REPO_ROOT, file);

    // 1. ID references in frontmatter
    if (fm) {
      for (const field of ID_FIELDS_ARRAY) {
        const ids = fm[field];
        if (!Array.isArray(ids)) continue;
        for (const id of ids) {
          if (!id) continue;
          if (!ID_PREFIX_RE.test(id)) {
            warnings.push(`${rel}: frontmatter ${field} contains "${id}" which doesn't look like an ID (expected TC-XXX-NNN or BUG-NNN or TEAM-NNN)`);
            continue;
          }
          if (!idToPath.has(id)) {
            errors.push(`${rel}: frontmatter ${field} references unknown id "${id}"`);
          }
        }
      }
      for (const field of ID_FIELDS_SINGLE) {
        const id = fm[field];
        if (!id || Array.isArray(id)) continue;
        if (!ID_PREFIX_RE.test(id)) {
          warnings.push(`${rel}: frontmatter ${field} contains "${id}" which doesn't look like an ID`);
          continue;
        }
        if (!idToPath.has(id)) {
          errors.push(`${rel}: frontmatter ${field} references unknown id "${id}"`);
        }
      }
    }

    // 2. Body markdown links to .md files under teams/
    const fileDir = path.dirname(file);
    BODY_LINK_RE.lastIndex = 0;
    let m;
    while ((m = BODY_LINK_RE.exec(content)) !== null) {
      const linkText = m[1];
      const linkPath = m[2];
      if (linkPath.startsWith('http')) continue;
      // resolve relative to current file
      const resolved = path.resolve(fileDir, linkPath);
      // only validate links that point inside teams/
      if (!resolved.startsWith(TEAMS_DIR + path.sep)) continue;
      try {
        await fs.access(resolved);
      } catch {
        errors.push(`${rel}: body link "[${linkText}](${linkPath})" points to missing file`);
        continue;
      }
      // 3. If link text starts with an ID, verify target's id matches.
      // Only enforce when the target is a canonical id-bearing file
      // (story.md, TC, bug). Sidecar files (execution-log.md, ac-audit.md,
      // questions.md, INDEX.md, etc.) often reference IDs in link text
      // for navigation without owning the ID themselves — skip those.
      const idMatch = linkText.match(ID_IN_LINK_TEXT_RE);
      if (idMatch) {
        const expectedId = idMatch[1];
        const targetContent = await fs.readFile(resolved, 'utf8');
        const targetFm = parseFrontmatter(targetContent);
        const targetId = extractId(resolved, targetFm);
        // Only enforce when target is a canonical id-bearing file.
        // Canonical = has its own id: field, or is story.md.
        const targetIsCanonical = (targetFm && targetFm.id) || resolved.endsWith(path.sep + 'story.md') || resolved.endsWith('/story.md');
        if (targetIsCanonical && targetId !== expectedId) {
          errors.push(`${rel}: body link "[${linkText}](${linkPath})" — link text claims id "${expectedId}" but target file's id is "${targetId || '<missing>'}"`);
        }
      }
    }
  }

  if (errors.length === 0 && warnings.length === 0) {
    if (!quiet) {
      process.stdout.write(`✓ link-validate OK — ${files.length} file(s), ${idToPath.size} ID(s)\n`);
    }
    process.exit(0);
  }

  for (const w of warnings) {
    process.stderr.write(`⚠ ${w}\n`);
  }
  for (const e of errors) {
    process.stderr.write(`✗ ${e}\n`);
  }
  process.stderr.write(`\n${errors.length} error(s), ${warnings.length} warning(s) across ${files.length} file(s).\n`);
  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  process.stderr.write(`validate-links failed: ${err.message}\n`);
  process.exit(1);
});
