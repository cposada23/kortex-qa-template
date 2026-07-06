#!/usr/bin/env node
// sync-automation.mjs — pull CTRF results back into the brain (v2).
//
// Reads the CTRF report at brain.config.json's ctrf_report_path
// (resolved under automation_repo_path), extracts TC ids from test
// names via the [TC-...] convention, and updates each matched TC's
// `last_run` / `last_result`. Appends an automated-run row to every
// linked story's execution-log.md, then reruns build-index.mjs so the
// coverage matrix reflects the new state.
//
// YAML anti-corruption rule (load-bearing): this script NEVER
// re-serializes frontmatter. It mutates ONLY the scalar top-level
// lines `last_run:` and `last_result:` inside the --- block, line by
// line; if absent, they are inserted immediately after the `id:`
// line. Arrays (covers_ac) and maps (external_ids) stay byte-identical.
// CRLF files keep CRLF.
//
// Usage:
//   node scripts/sync-automation.mjs [--dry-run] [--root <dir>]

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT = path.resolve(__dirname, '..');

const rootArgIdx = process.argv.indexOf('--root');
const REPO_ROOT = rootArgIdx !== -1 ? path.resolve(process.argv[rootArgIdx + 1]) : DEFAULT_ROOT;
const DRY_RUN = process.argv.includes('--dry-run');

const TC_ID_RE = /\[(TC-[A-Z0-9-]+-\d+)\]/;
// Worst-result ordering: failed > skipped > passed.
const SEVERITY = { failed: 3, skipped: 2, passed: 1 };

function normalizeStatus(ctrfStatus) {
  if (ctrfStatus === 'passed' || ctrfStatus === 'failed') return ctrfStatus;
  return 'skipped'; // skipped | pending | other → skipped
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return null;
  const out = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    }
    out[key] = val;
  }
  return out;
}

async function walkMd(dir) {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walkMd(full)));
    else if (e.isFile() && e.name.endsWith('.md')) out.push(full);
  }
  return out;
}

// Mutate ONLY the last_run / last_result scalar lines inside the
// frontmatter block. Everything else stays byte-identical.
function injectRunFields(content, lastRun, lastResult) {
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const fmMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/);
  if (!fmMatch) return null;
  const fmBlock = fmMatch[0];
  const rest = content.slice(fmBlock.length);

  const lines = fmBlock.split(/\r?\n/);
  const setLine = (key, value) => {
    const idx = lines.findIndex((l) => new RegExp(`^${key}:`).test(l));
    if (idx !== -1) {
      lines[idx] = `${key}: ${value}`;
      return;
    }
    const idIdx = lines.findIndex((l) => /^id:/.test(l));
    const insertAt = idIdx !== -1 ? idIdx + 1 : lines.length - 2;
    lines.splice(insertAt, 0, `${key}: ${value}`);
  };
  setLine('last_run', lastRun);
  setLine('last_result', lastResult);
  return lines.join(eol) + rest;
}

async function main() {
  // Config + CTRF location
  let cfg;
  try {
    cfg = JSON.parse(await fs.readFile(path.join(REPO_ROOT, 'brain.config.json'), 'utf8'));
  } catch {
    process.stderr.write('✗ no brain.config.json — run node scripts/init.mjs <client> first.\n');
    process.exit(1);
  }
  if (!cfg.automation_repo_path) {
    process.stderr.write('✗ automation_repo_path is empty — bootstrap the automation repo first (automation-bootstrap skill).\n');
    process.exit(1);
  }
  const automationRoot = path.isAbsolute(cfg.automation_repo_path)
    ? cfg.automation_repo_path
    : path.join(REPO_ROOT, cfg.automation_repo_path);
  const ctrfPath = path.join(automationRoot, cfg.ctrf_report_path || 'reports/ctrf/ctrf-report.json');

  let ctrf;
  try {
    ctrf = JSON.parse(await fs.readFile(ctrfPath, 'utf8'));
  } catch (err) {
    process.stderr.write(`✗ cannot read CTRF report at ${ctrfPath}: ${err.message}\n`);
    process.exit(1);
  }
  const tests = ctrf?.results?.tests ?? [];
  const startMs = ctrf?.results?.summary?.start;
  const runDate = (typeof startMs === 'number' && startMs > 0)
    ? new Date(startMs).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  // Aggregate per TC id (worst result wins)
  const perTc = new Map();
  const unmatched = [];
  for (const t of tests) {
    const m = TC_ID_RE.exec(t.name ?? '');
    if (!m) {
      unmatched.push(t.name ?? '(unnamed test)');
      continue;
    }
    const id = m[1];
    const status = normalizeStatus(t.status);
    const prev = perTc.get(id);
    if (!prev || SEVERITY[status] > SEVERITY[prev]) perTc.set(id, status);
  }

  // Index brain TCs
  const tcFiles = new Map(); // id → {file, fm}
  for (const file of await walkMd(path.join(REPO_ROOT, 'teams'))) {
    let content;
    try {
      content = await fs.readFile(file, 'utf8');
    } catch { continue; }
    const fm = parseFrontmatter(content);
    if (fm?.type === 'test-case' && fm.id) tcFiles.set(fm.id, { file, fm, content });
  }

  const updated = [];
  const storyRows = new Map(); // story id → [{tc, result}]
  for (const [id, result] of perTc) {
    const entry = tcFiles.get(id);
    if (!entry) {
      process.stdout.write(`⚠ CTRF references ${id} but no TC with that id exists in the brain — skipped.\n`);
      continue;
    }
    const next = injectRunFields(entry.content, runDate, result);
    if (next === null) {
      process.stderr.write(`✗ ${path.relative(REPO_ROOT, entry.file)}: malformed frontmatter — not touched.\n`);
      continue;
    }
    if (!DRY_RUN && next !== entry.content) await fs.writeFile(entry.file, next);
    updated.push({ id, result, file: path.relative(REPO_ROOT, entry.file) });

    const linked = Array.isArray(entry.fm.linked_stories) ? entry.fm.linked_stories : [];
    for (const sid of linked) {
      if (!storyRows.has(sid)) storyRows.set(sid, []);
      storyRows.get(sid).push({ tc: id, result });
    }
  }

  // Append automated-run rows to each linked story's execution-log.md
  for (const [sid, rows] of storyRows) {
    // Find the story folder by convention: teams/*/stories/<sid>-*/execution-log.md
    const candidates = (await walkMd(path.join(REPO_ROOT, 'teams')))
      .filter((f) => {
        const norm = f.split(path.sep).join('/');
        return norm.endsWith('/execution-log.md') && norm.includes(`/stories/${sid}-`);
      });
    if (candidates.length === 0) {
      process.stdout.write(`⚠ story ${sid}: no execution-log.md found — rows not appended.\n`);
      continue;
    }
    for (const logFile of candidates) {
      let log = await fs.readFile(logFile, 'utf8');
      const eol = log.includes('\r\n') ? '\r\n' : '\n';
      const header = `## Automated runs`;
      const tableHeader = `| Date | TC | Result | Notes |${eol}|---|---|---|---|`;
      const newRows = rows.map((r) => `| ${runDate} | ${r.tc} | ${r.result} | automated run |`).join(eol);
      if (log.includes(header)) {
        // Append rows right after the existing table header block’s last row:
        // simplest robust approach — append at end of the section by
        // inserting after the LAST table row following the header.
        log = log.replace(/(## Automated runs[\s\S]*?)(\r?\n\r?\n|$)/, (m0, section, tail) =>
          `${section}${eol}${newRows}${tail}`);
      } else {
        log = `${log.trimEnd()}${eol}${eol}${header}${eol}${eol}${tableHeader}${eol}${newRows}${eol}`;
      }
      if (!DRY_RUN) await fs.writeFile(logFile, log);
    }
  }

  // Report automated TCs that the CTRF never mentioned (spec renamed/deleted?)
  for (const [id, { fm, file }] of tcFiles) {
    if (fm.automation_status === 'automated' && !perTc.has(id)) {
      process.stdout.write(`⚠ ${id} is automation_status: automated but absent from the CTRF report (${path.relative(REPO_ROOT, file)}) — check the spec still exists and is titled '[${id}] ...' (validate-automation helps).\n`);
    }
  }

  // Summary
  const mode = DRY_RUN ? ' (dry-run — nothing written)' : '';
  process.stdout.write(`\nsync-automation${mode}: run date ${runDate}\n`);
  for (const u of updated) process.stdout.write(`  ✓ ${u.id} → ${u.result} (${u.file})\n`);
  if (unmatched.length) {
    process.stdout.write(`  ⚠ ${unmatched.length} unmatched test(s) (no [TC-...] id in the name):\n`);
    for (const n of unmatched) process.stdout.write(`    - ${n}\n`);
  }

  // Refresh indexes + coverage matrix
  if (!DRY_RUN) {
    const args = ['scripts/build-index.mjs'];
    if (rootArgIdx !== -1) args.push('--root', REPO_ROOT);
    const r = spawnSync('node', args, { cwd: DEFAULT_ROOT, stdio: 'ignore' });
    if (r.status !== 0) {
      process.stderr.write('⚠ build-index.mjs failed after sync — run it manually.\n');
    } else {
      process.stdout.write('  ✓ indexes + coverage matrix refreshed\n');
    }
  }
}

main().catch((err) => {
  process.stderr.write(`sync-automation failed: ${err.message}\n`);
  process.exit(1);
});
