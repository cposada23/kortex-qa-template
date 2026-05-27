#!/usr/bin/env node
// import-prior-brain.mjs — bulk-import a prior markdown brain into the
// current Kortex-QA structure with confidence scoring.
//
// Phase 1 (analysis):
//   node scripts/import-prior-brain.mjs <source-folder>
//   Walks <source-folder> recursively, classifies each .md file,
//   dedupes against current content, writes imports/<slug>-<date>/
//   with MIGRATION_PLAN.md + sub-folders by confidence.
//
// Phase 2 (apply):
//   node scripts/import-prior-brain.mjs --apply imports/<slug>-<date>/
//   Reads MIGRATION_PLAN.md, moves high-confidence files to their
//   proposed destinations. Skips medium/low/unknown (those need
//   manual triage by the engineer).
//
// Hard rules:
//   - Never overwrite existing files. Suffix imports with `-imported`.
//   - Default: only auto-stage high-confidence items.
//   - Dry-run is the default (no --apply means analysis only).

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function parseFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!kv) continue;
    fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

async function walkMd(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try {
      entries = await fs.readdir(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const full = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile() && e.name.endsWith('.md')) out.push(full);
    }
  }
  return out;
}

function classify(filePath, content, sourceRoot) {
  const rel = path.relative(sourceRoot, filePath);
  const filename = path.basename(filePath);
  const fm = parseFrontmatter(content) || {};
  const body = content.slice(0, 600).toLowerCase();

  // High confidence — strong signals
  if (/^TC-[A-Z0-9_-]+\.md$/i.test(filename) || (fm.type === 'test-case')) {
    return { type: 'test-case', confidence: 'high', reason: 'filename/frontmatter explicit' };
  }
  if (/^BUG-\d+/.test(filename) || (fm.type === 'bug')) {
    return { type: 'bug', confidence: 'high', reason: 'filename/frontmatter explicit' };
  }
  if (/^[A-Z][A-Z0-9]+-\d+/.test(filename) && body.includes('acceptance criteria')) {
    return { type: 'story', confidence: 'high', reason: 'jira-keyed filename + AC mention' };
  }
  if (body.includes('steps to reproduce') && body.includes('expected') && body.includes('actual')) {
    return { type: 'bug', confidence: 'high', reason: 'bug-shape body' };
  }
  if (body.includes('steps:') && body.includes('expected:')) {
    return { type: 'test-case', confidence: 'high', reason: 'test-case-shape body' };
  }
  if (/(knowledge|patterns|playbooks)\//i.test(rel)) {
    return { type: 'playbook-or-pattern', confidence: 'high', reason: 'path signal' };
  }

  // Medium confidence — partial signals
  if (/(ceremonies|retros|retrospective|sprint|daily)/i.test(rel) || /\d{4}-\d{2}-\d{2}/.test(filename)) {
    return { type: 'ceremony', confidence: 'medium', reason: 'date-shaped or ceremony path' };
  }
  if (body.includes('environment') || body.includes('credentials') || body.includes('test user')) {
    return { type: 'environment-note', confidence: 'medium', reason: 'env-shape content' };
  }

  // Low confidence — generic short notes
  const lineCount = content.split('\n').length;
  if (lineCount < 50) {
    return { type: 'loose-note', confidence: 'low', reason: 'short markdown, no schema' };
  }

  return { type: 'unknown', confidence: 'low', reason: 'no signals matched' };
}

function destinationFor(classification, filename, team = '_template-team') {
  // Returns a suggested path relative to REPO_ROOT.
  // For imports the destination uses _template-team initially; engineer
  // moves to a real team after triage.
  switch (classification.type) {
    case 'test-case':
      return `teams/${team}/test-cases/misc/${filename}`;
    case 'bug':
      return `teams/${team}/bugs/${filename}`;
    case 'story':
      return `teams/${team}/stories/${path.basename(filename, '.md')}/story.md`;
    case 'playbook-or-pattern':
      return `knowledge/patterns/${filename}`;
    case 'ceremony':
      return `teams/${team}/ceremonies/imported/${filename}`;
    case 'environment-note':
      // env notes from a prior brain land in shared/ by default
      // (most apply client-wide). Move to teams/<slug>/environments/
      // manually if the note is team-specific.
      return `shared/environments/${filename}`;
    case 'loose-note':
      return `teams/${team}/inbox/imported/${filename}`;
    default:
      return `imports/unsorted/${filename}`;
  }
}

async function dedupe(filePath, destPath, repoRoot) {
  // Check if dest exists. If yes, compare title + first 200 chars.
  // If similar enough → suggest skip-duplicate. Else → suggest skip-overwrite.
  const fullDest = path.join(repoRoot, destPath);
  try {
    const existing = await fs.readFile(fullDest, 'utf8');
    const newContent = await fs.readFile(filePath, 'utf8');
    const existingHead = existing.slice(0, 500).toLowerCase();
    const newHead = newContent.slice(0, 500).toLowerCase();
    // crude similarity — count shared 20-char substrings
    let shared = 0;
    for (let i = 0; i < Math.min(existingHead.length, newHead.length) - 20; i += 20) {
      if (existingHead.includes(newHead.slice(i, i + 20))) shared++;
    }
    const total = Math.floor(Math.min(existingHead.length, newHead.length) / 20);
    if (total > 0 && shared / total > 0.8) {
      return 'skip-duplicate';
    }
    return 'skip-existing'; // dest exists but content differs — engineer must decide
  } catch {
    return 'new'; // dest doesn't exist
  }
}

async function analyzeMode(sourcePath) {
  const sourceRoot = path.resolve(sourcePath);
  const sourceSlug = path.basename(sourceRoot).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const today = new Date().toISOString().slice(0, 10);
  const importDir = path.join(REPO_ROOT, 'imports', `${sourceSlug}-${today}`);
  await fs.mkdir(importDir, { recursive: true });

  const files = await walkMd(sourceRoot);
  if (files.length === 0) {
    process.stderr.write(`No .md files found under ${sourceRoot}\n`);
    process.exit(1);
  }

  process.stdout.write(`Found ${files.length} .md file(s) under ${sourceRoot}\n`);
  process.stdout.write(`Writing analysis to ${path.relative(REPO_ROOT, importDir)}/\n\n`);

  const rows = [];
  const byConfidence = { high: [], medium: [], low: [], unknown: [] };

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const classification = classify(file, content, sourceRoot);
    const dest = destinationFor(classification, path.basename(file));
    const dedup = await dedupe(file, dest, REPO_ROOT);
    const row = {
      source: path.relative(sourceRoot, file),
      sourceFull: file,
      type: classification.type,
      confidence: classification.confidence,
      reason: classification.reason,
      destination: dest,
      dedupe: dedup,
    };
    rows.push(row);
    const bucket = classification.confidence === 'unknown' ? 'unknown' : classification.confidence;
    if (byConfidence[bucket]) byConfidence[bucket].push(row);
  }

  // Write MIGRATION_PLAN.md
  const planLines = [
    '# Migration plan',
    '',
    `Source: \`${sourceRoot}\``,
    `Date: ${today}`,
    `Files: ${files.length}`,
    '',
    '| # | source | type | confidence | reason | destination | dedupe |',
    '|---|---|---|---|---|---|---|',
  ];
  rows.forEach((r, i) => {
    planLines.push(`| ${i + 1} | \`${r.source}\` | ${r.type} | ${r.confidence} | ${r.reason} | \`${r.destination}\` | ${r.dedupe} |`);
  });
  planLines.push('', '## Summary', `- High confidence: ${byConfidence.high.length}`, `- Medium confidence: ${byConfidence.medium.length}`, `- Low confidence: ${byConfidence.low.length}`, `- Unknown: ${byConfidence.unknown.length}`, '', '## Next step', '', `- Review high-confidence rows (auto-applied on \`--apply\`).`, `- Manually triage medium/low/unknown rows by moving them yourself.`, `- Run \`node scripts/import-prior-brain.mjs --apply ${path.relative(REPO_ROOT, importDir)}/\` to apply high-confidence moves.`);
  await fs.writeFile(path.join(importDir, 'MIGRATION_PLAN.md'), planLines.join('\n') + '\n');

  // Stage copies by confidence bucket
  for (const [bucket, items] of Object.entries(byConfidence)) {
    if (items.length === 0) continue;
    const bucketDir = path.join(importDir, `${bucket}-confidence`);
    await fs.mkdir(bucketDir, { recursive: true });
    for (const r of items) {
      const dest = path.join(bucketDir, path.basename(r.source));
      await fs.copyFile(r.sourceFull, dest);
    }
  }

  process.stdout.write(`✓ Analysis complete.\n`);
  process.stdout.write(`  High: ${byConfidence.high.length}, Medium: ${byConfidence.medium.length}, Low: ${byConfidence.low.length}, Unknown: ${byConfidence.unknown.length}\n`);
  process.stdout.write(`\nReview: ${path.relative(REPO_ROOT, importDir)}/MIGRATION_PLAN.md\n`);
  process.stdout.write(`Apply (high-confidence only): node scripts/import-prior-brain.mjs --apply ${path.relative(REPO_ROOT, importDir)}/\n`);
}

async function applyMode(importDirPath) {
  const importDir = path.resolve(importDirPath);
  const planPath = path.join(importDir, 'MIGRATION_PLAN.md');
  const planContent = await fs.readFile(planPath, 'utf8');

  // Parse the migration plan table
  const lines = planContent.split('\n');
  const rows = [];
  let inTable = false;
  for (const line of lines) {
    if (line.startsWith('|---')) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    if (!line.startsWith('|')) break;
    const cells = line.split('|').map((c) => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length - 1);
    if (cells.length < 7) continue;
    rows.push({
      n: cells[0],
      source: cells[1].replace(/`/g, ''),
      type: cells[2],
      confidence: cells[3],
      reason: cells[4],
      destination: cells[5].replace(/`/g, ''),
      dedupe: cells[6],
    });
  }

  let applied = 0;
  let skipped = 0;
  for (const r of rows) {
    if (r.confidence !== 'high') {
      skipped++;
      continue;
    }
    if (r.dedupe === 'skip-duplicate') {
      process.stdout.write(`· skip ${r.source} (duplicate of existing)\n`);
      skipped++;
      continue;
    }
    if (r.dedupe === 'skip-existing') {
      // Destination exists, content differs — suffix with -imported
      const ext = path.extname(r.destination);
      const base = r.destination.slice(0, -ext.length);
      r.destination = `${base}-imported${ext}`;
    }
    const stagedFile = path.join(importDir, 'high-confidence', path.basename(r.source));
    const finalDest = path.join(REPO_ROOT, r.destination);
    await fs.mkdir(path.dirname(finalDest), { recursive: true });
    await fs.copyFile(stagedFile, finalDest);
    process.stdout.write(`✓ ${r.source} → ${r.destination}\n`);
    applied++;
  }

  process.stdout.write(`\n${applied} applied, ${skipped} skipped (non-high-confidence or duplicate)\n`);
  process.stdout.write(`Manually triage medium/low/unknown items by inspecting:\n`);
  process.stdout.write(`  ${path.relative(REPO_ROOT, importDir)}/medium-confidence/\n`);
  process.stdout.write(`  ${path.relative(REPO_ROOT, importDir)}/low-confidence/\n`);
  process.stdout.write(`  ${path.relative(REPO_ROOT, importDir)}/unknown-confidence/\n`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    process.stderr.write('Usage:\n');
    process.stderr.write('  node scripts/import-prior-brain.mjs <source-folder>      # analysis\n');
    process.stderr.write('  node scripts/import-prior-brain.mjs --apply <imports/dir>  # apply high-confidence\n');
    process.exit(1);
  }
  if (args[0] === '--apply') {
    if (!args[1]) {
      process.stderr.write('--apply requires a path to an imports/ directory.\n');
      process.exit(1);
    }
    await applyMode(args[1]);
  } else {
    await analyzeMode(args[0]);
  }
}

main().catch((err) => {
  process.stderr.write(`import-prior-brain failed: ${err.message}\n`);
  process.exit(1);
});
