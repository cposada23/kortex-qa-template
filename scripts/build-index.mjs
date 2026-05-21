#!/usr/bin/env node
// build-index.mjs — regenerate INDEX.md files across QA-brain zones.
//
// Walks each zone directory, lists *.md files (excluding INDEX.md,
// README.md, AGENTS.md, INBOX.md, JOURNAL.md, TODO.md), reads each
// file's frontmatter `title` and `tags`, and writes the entries
// between <!-- build-index:start --> / <!-- build-index:end -->
// markers in the zone's INDEX.md.
//
// Idempotent. Re-running with no changes is a no-op.
//
// Usage:
//   node scripts/build-index.mjs            # update all zones
//   node scripts/build-index.mjs <zone>     # update one zone only
//   node scripts/build-index.mjs --check    # exit 1 if drift exists

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const ZONES = [
  'stories',
  'test-cases',
  'automation',
  'bugs',
  'reviews',
  'knowledge',
];

const SKIP_FILENAMES = new Set([
  'INDEX.md', 'README.md', 'AGENTS.md', 'INBOX.md',
  'JOURNAL.md', 'TODO.md',
]);

const SKIP_DIRS = new Set(['.git', 'node_modules', '.cache', 'versions']);

const BLOCK_START = '<!-- build-index:start -->';
const BLOCK_END = '<!-- build-index:end -->';

// Minimal YAML frontmatter parser (sufficient for our subset:
// strings, lists, top-level keys). Avoids the js-yaml dep.
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const lines = match[1].split('\n');
  const out = {};
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    // List literal (e.g. [a, b, c])
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }
    out[key] = val;
  }
  return out;
}

async function walkMdFiles(dir, baseDir) {
  const result = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return result;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await walkMdFiles(full, baseDir)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      if (SKIP_FILENAMES.has(entry.name)) continue;
      result.push(path.relative(baseDir, full));
    }
  }
  return result;
}

async function buildIndexForZone(zoneName) {
  const zoneDir = path.join(REPO_ROOT, zoneName);
  const indexPath = path.join(zoneDir, 'INDEX.md');

  // Confirm zone exists
  try {
    await fs.access(zoneDir);
  } catch {
    return { zone: zoneName, status: 'missing-zone' };
  }

  // Find all .md files in zone (recursively)
  const files = await walkMdFiles(zoneDir, zoneDir);
  files.sort();

  // Read each file's frontmatter
  const entries = [];
  for (const rel of files) {
    const fullPath = path.join(zoneDir, rel);
    let content;
    try {
      content = await fs.readFile(fullPath, 'utf8');
    } catch {
      continue;
    }
    const fm = parseFrontmatter(content);
    const title = fm?.title || rel.replace(/\.md$/, '');
    const tags = Array.isArray(fm?.tags) ? fm.tags : [];
    const tagsStr = tags.length ? ` \`${tags.join(', ')}\`` : '';
    // Optionally surface status as a leading badge
    const status = fm?.status ? ` _[${fm.status}]_` : '';
    entries.push(`- **[${title}](${rel})**${status}${tagsStr}`);
  }

  // Build the new INDEX content
  const generated = entries.length
    ? entries.join('\n')
    : '_(no entries yet)_';

  // Read existing INDEX.md, replace block contents
  let existing = '';
  try {
    existing = await fs.readFile(indexPath, 'utf8');
  } catch {
    // No INDEX.md yet — create a minimal one
    existing = `# ${zoneName}/ — INDEX\n\nAuto-generated. Run \`node scripts/build-index.mjs\` to refresh.\n\n${BLOCK_START}\n${BLOCK_END}\n`;
  }

  const startIdx = existing.indexOf(BLOCK_START);
  const endIdx = existing.indexOf(BLOCK_END);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    return { zone: zoneName, status: 'malformed-markers' };
  }

  const before = existing.slice(0, startIdx + BLOCK_START.length);
  const after = existing.slice(endIdx);
  const newContent = `${before}\n\n${generated}\n\n${after}`;

  // Idempotent: write only if changed
  if (newContent === existing) {
    return { zone: zoneName, status: 'no-change', count: entries.length };
  }
  await fs.writeFile(indexPath, newContent);
  return { zone: zoneName, status: 'updated', count: entries.length };
}

async function main() {
  const args = process.argv.slice(2);
  const checkMode = args.includes('--check');
  const zoneArg = args.find((a) => !a.startsWith('--'));

  const zones = zoneArg ? [zoneArg] : ZONES;

  const results = [];
  for (const zone of zones) {
    results.push(await buildIndexForZone(zone));
  }

  let hadChanges = false;
  for (const r of results) {
    const tag = r.status === 'updated' ? '✓' :
                r.status === 'no-change' ? '·' :
                r.status === 'missing-zone' ? '⊘' : '!';
    const detail = r.count != null ? `(${r.count} entries)` : '';
    process.stdout.write(`${tag} ${r.zone} ${detail} — ${r.status}\n`);
    if (r.status === 'updated') hadChanges = true;
    if (r.status === 'malformed-markers') {
      process.stderr.write(`  → fix the markers in ${r.zone}/INDEX.md\n`);
      process.exitCode = 1;
    }
  }

  if (checkMode && hadChanges) {
    process.stderr.write('\nDrift detected (some INDEX.md files were stale).\n');
    process.stderr.write('Run without --check to apply, then commit.\n');
    process.exit(1);
  }
}

main().catch((err) => {
  process.stderr.write(`build-index failed: ${err.message}\n`);
  process.exit(1);
});
