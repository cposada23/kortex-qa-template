#!/usr/bin/env node
// validate-automation.mjs — TC → spec traceability check (v2).
//
// For every test case with a non-empty `automation_path`, verify:
//   (a) the file exists under brain.config.json's automation_repo_path
//       (relative paths resolve under that repo; absolute paths as-is);
//   (b) its content mentions the TC's `id:` (e.g. TC-SEARCH-001) —
//       the traceability convention is `test('[TC-ID] ...')`.
//
// Violations on a TC with automation_status: automated → ERROR (exit 1).
// Any other automation_status → WARN (exit 0).
// No automation repo configured → no-op (exit 0) so the pre-commit
// hook stays green on brains that haven't bootstrapped automation yet.
//
// Usage:
//   node scripts/validate-automation.mjs [--root <dir>]

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT = path.resolve(__dirname, '..');

const rootArgIdx = process.argv.indexOf('--root');
const REPO_ROOT = rootArgIdx !== -1 ? path.resolve(process.argv[rootArgIdx + 1]) : DEFAULT_ROOT;

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

async function main() {
  // Read brain.config.json for the automation repo location.
  let cfg = null;
  try {
    cfg = JSON.parse(await fs.readFile(path.join(REPO_ROOT, 'brain.config.json'), 'utf8'));
  } catch {
    process.stdout.write('· no brain.config.json — no automation repo configured, nothing to validate.\n');
    return;
  }
  const repoPath = cfg.automation_repo_path ?? '';
  if (repoPath === '') {
    process.stdout.write('· automation_repo_path is empty — no automation repo yet, nothing to validate.\n');
    return;
  }
  const automationRoot = path.isAbsolute(repoPath) ? repoPath : path.join(REPO_ROOT, repoPath);

  const errors = [];
  const warnings = [];
  let checked = 0;

  const files = await walkMd(path.join(REPO_ROOT, 'teams'));
  for (const file of files) {
    let content;
    try {
      content = await fs.readFile(file, 'utf8');
    } catch {
      continue;
    }
    const fm = parseFrontmatter(content);
    if (!fm || fm.type !== 'test-case' || !fm.id) continue;
    const autoPath = (fm.automation_path ?? '').trim();
    if (autoPath === '') continue;

    const rel = path.relative(REPO_ROOT, file);
    const isAutomated = fm.automation_status === 'automated';
    const report = (msg) => {
      if (isAutomated) errors.push(msg);
      else warnings.push(msg);
    };

    const specAbs = path.isAbsolute(autoPath) ? autoPath : path.join(automationRoot, autoPath);
    checked++;

    let spec;
    try {
      spec = await fs.readFile(specAbs, 'utf8');
    } catch {
      report(`${rel}: automation_path "${autoPath}" not found under ${path.relative(REPO_ROOT, automationRoot) || automationRoot} (automation_status: ${fm.automation_status})`);
      continue;
    }
    if (!spec.includes(fm.id)) {
      report(`${rel}: spec "${autoPath}" exists but does not contain the TC id "${fm.id}" — title the test '[${fm.id}] ...' (automation_status: ${fm.automation_status})`);
    }
  }

  for (const w of warnings) process.stdout.write(`⚠ ${w}\n`);
  for (const e of errors) process.stderr.write(`✗ ${e}\n`);

  if (errors.length) {
    process.stderr.write(`\n${errors.length} automation traceability error(s) (${checked} TC(s) checked).\n`);
    process.exit(1);
  }
  process.stdout.write(`✓ automation traceability OK — ${checked} TC(s) with automation_path checked${warnings.length ? `, ${warnings.length} warning(s)` : ''}.\n`);
}

main().catch((err) => {
  process.stderr.write(`validate-automation failed: ${err.message}\n`);
  process.exit(1);
});
