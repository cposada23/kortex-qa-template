#!/usr/bin/env node
// upgrade.mjs — bring an initialized client brain up to this template
// version WITHOUT touching client content.
//
// Runs FROM the new template copy, pointing AT the client brain — so
// even brains cloned before this script existed can be upgraded:
//
//   node <new-template>/scripts/upgrade.mjs --brain <path-to-brain>
//   node <new-template>/scripts/upgrade.mjs --brain ../acme-brain --dry-run
//
// Ownership model (the whole design):
//   FRAMEWORK zones (this template owns them → copied/overwritten):
//     scripts/ .agents/ .claude/ .github/ .vscode/ .cursor/
//     templates/ playbooks/ teams/_template-team/
//     AGENTS.md CLAUDE.md GEMINI.md README.md .aiexclude
//     .snapshotignore .mcp.json
//   CLIENT zones (the engagement owns them → NEVER touched):
//     teams/<real-teams>/ shared/ sessions/ knowledge/ versions/
//     JOURNAL.md TODO.md brain.config.json .client-slug .env*
//     <slug>-qa.code-workspace
//
// Copy semantics: add + overwrite, NEVER delete. Framework files that
// exist in the brain but no longer in the template are reported as
// orphans for the engineer to remove by hand (same philosophy as
// sync-agents orphans).
//
// Data migrations: when a version changes the CLIENT content schema,
// that version ships a scripts/migrate-v<A>-to-v<B>.mjs. This script
// chains every migration in (brainVersion .. templateVersion], running
// each from the BRAIN's scripts/ copy (cwd = brain) AFTER the
// framework copy, so __dirname-based REPO_ROOT resolution points at
// the brain.
//
// Safety rails:
//   - refuses if the target doesn't look like a brain (VERSION + AGENTS.md)
//   - refuses same-or-newer brain version
//   - refuses a dirty git tree in the brain (commit first — the diff
//     of the upgrade should be reviewable on its own)
//   - takes a snapshot via the brain's own snapshot.mjs before writing
//     (skip with --skip-snapshot; --dry-run never writes anything)
//   - copied .md files are re-debranded with the brain's .client-slug

import { promises as fs, realpathSync, existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_ROOT = path.resolve(__dirname, '..');

const { debrandContent } = await import(path.join(__dirname, 'init.mjs'));

export const FRAMEWORK_DIRS = [
  'scripts',
  '.agents',
  '.claude',
  '.github',
  '.vscode',
  '.cursor',
  'templates',
  'playbooks',
  path.join('teams', '_template-team'),
];

export const FRAMEWORK_FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  'GEMINI.md',
  'README.md',
  '.aiexclude',
  '.snapshotignore',
  '.mcp.json',
];

// Never copied regardless of location: the brain has its own renamed
// workspace file; shipping the template's would re-introduce brand.
function skipCopy(rel) {
  return rel.endsWith('.code-workspace');
}

export function compareVersions(a, b) {
  const pa = String(a).trim().split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).trim().split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (da !== db) return da - db;
  }
  return 0;
}

// findMigrations — every scripts/migrate-v<A>-to-v<B>.mjs in the
// template with A >= brainVersion and B <= templateVersion, ordered.
export async function findMigrations(templateRoot, brainVersion, templateVersion) {
  const dir = path.join(templateRoot, 'scripts');
  let entries = [];
  try {
    entries = await fs.readdir(dir);
  } catch { /* no scripts dir */ }
  const migs = [];
  for (const f of entries) {
    const m = f.match(/^migrate-v([\d.]+)-to-v([\d.]+)\.mjs$/);
    if (!m) continue;
    const [, from, to] = m;
    if (compareVersions(from, brainVersion) >= 0 && compareVersions(to, templateVersion) <= 0) {
      migs.push(f);
    }
  }
  migs.sort((a, b) => {
    const va = a.match(/^migrate-v([\d.]+)-/)[1];
    const vb = b.match(/^migrate-v([\d.]+)-/)[1];
    return compareVersions(va, vb);
  });
  return migs;
}

async function readIfExists(p) {
  try { return await fs.readFile(p); } catch { return null; }
}

async function listFilesRecursive(root, relDir) {
  const out = [];
  const abs = path.join(root, relDir);
  let entries;
  try {
    entries = await fs.readdir(abs, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const rel = path.join(relDir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await listFilesRecursive(root, rel)));
    } else {
      out.push(rel);
    }
  }
  return out;
}

// collectPlan — compute what would be copied and what is orphaned.
export async function collectPlan(templateRoot, brainRoot) {
  const copies = []; // { rel, kind: 'new' | 'changed' }
  const orphans = [];

  const templateFiles = [];
  for (const dir of FRAMEWORK_DIRS) {
    templateFiles.push(...(await listFilesRecursive(templateRoot, dir)));
  }
  for (const f of FRAMEWORK_FILES) {
    if (existsSync(path.join(templateRoot, f))) templateFiles.push(f);
  }

  const templateSet = new Set(templateFiles);
  for (const rel of templateFiles) {
    if (skipCopy(rel)) continue;
    const src = await readIfExists(path.join(templateRoot, rel));
    const dst = await readIfExists(path.join(brainRoot, rel));
    if (dst === null) copies.push({ rel, kind: 'new' });
    else if (!src.equals(dst)) copies.push({ rel, kind: 'changed' });
    // NOTE: 'changed' compares raw bytes; debrand happens at write
    // time, so an already-debranded identical file may show as
    // changed. Harmless — the write is idempotent.
  }

  // Orphans: framework-zone files in the brain with no template
  // counterpart.
  for (const dir of FRAMEWORK_DIRS) {
    for (const rel of await listFilesRecursive(brainRoot, dir)) {
      if (skipCopy(rel)) continue;
      if (!templateSet.has(rel)) orphans.push(rel);
    }
  }

  return { copies, orphans };
}

async function readVersion(root) {
  const v = await readIfExists(path.join(root, 'VERSION'));
  return v ? v.toString('utf8').trim() : null;
}

async function readSlug(root) {
  const s = await readIfExists(path.join(root, '.client-slug'));
  return s ? s.toString('utf8').trim() : null;
}

function gitTreeDirty(brainRoot) {
  if (!existsSync(path.join(brainRoot, '.git'))) return false;
  const r = spawnSync('git', ['status', '--porcelain'], { cwd: brainRoot, encoding: 'utf8' });
  if (r.status !== 0) return false; // can't tell — don't block on a broken git
  return r.stdout.trim().length > 0;
}

/**
 * runUpgrade — the whole flow. Returns a report:
 * { fromVersion, toVersion, copies, orphans, migrations, postChecks }
 */
export async function runUpgrade(templateRoot, brainRoot, opts = {}) {
  const dryRun = Boolean(opts.dryRun);
  const skipSnapshot = Boolean(opts.skipSnapshot);

  // -- sanity: target must look like a brain
  const brainVersion = await readVersion(brainRoot);
  const hasAgents = existsSync(path.join(brainRoot, 'AGENTS.md'));
  if (!brainVersion || !hasAgents) {
    throw new Error(
      `${brainRoot} does not look like a brain (missing VERSION or AGENTS.md). Refusing.`
    );
  }
  const templateVersion = await readVersion(templateRoot);
  if (!templateVersion) {
    throw new Error(`${templateRoot} has no VERSION file. Refusing.`);
  }
  if (compareVersions(brainVersion, templateVersion) >= 0) {
    throw new Error(
      `Brain is at v${brainVersion}, template is v${templateVersion} — nothing to upgrade.`
    );
  }

  // -- sanity: reviewable diff requires a clean tree
  if (!dryRun && gitTreeDirty(brainRoot)) {
    throw new Error(
      'Brain git tree is dirty. Commit (or stash) first so the upgrade diff is reviewable on its own.'
    );
  }

  const plan = await collectPlan(templateRoot, brainRoot);
  const migrations = await findMigrations(templateRoot, brainVersion, templateVersion);
  const report = {
    fromVersion: brainVersion,
    toVersion: templateVersion,
    copies: plan.copies,
    orphans: plan.orphans,
    migrations,
    postChecks: [],
  };

  if (dryRun) return report;

  // -- snapshot first (rollback insurance), via the brain's own script
  if (!skipSnapshot) {
    if (existsSync(path.join(brainRoot, 'scripts', 'snapshot.mjs'))) {
      process.stdout.write('→ Taking a pre-upgrade snapshot...\n');
      const r = spawnSync('node', ['scripts/snapshot.mjs'], { cwd: brainRoot, stdio: 'inherit' });
      if (r.status !== 0) {
        throw new Error('Pre-upgrade snapshot failed. Fix that first (or pass --skip-snapshot at your own risk).');
      }
    } else {
      report.postChecks.push('snapshot skipped — brain has no scripts/snapshot.mjs');
    }
  }

  // -- copy framework files (debrand .md at write time)
  const slug = await readSlug(brainRoot);
  for (const { rel } of plan.copies) {
    const srcAbs = path.join(templateRoot, rel);
    const dstAbs = path.join(brainRoot, rel);
    await fs.mkdir(path.dirname(dstAbs), { recursive: true });
    if (slug && rel.endsWith('.md')) {
      const content = await fs.readFile(srcAbs, 'utf8');
      await fs.writeFile(dstAbs, debrandContent(content, slug));
    } else {
      await fs.copyFile(srcAbs, dstAbs);
    }
  }

  // -- chain data migrations from the BRAIN's fresh scripts/ copy
  for (const mig of migrations) {
    process.stdout.write(`→ Running migration ${mig}...\n`);
    const r = spawnSync('node', [path.join('scripts', mig)], { cwd: brainRoot, stdio: 'inherit' });
    if (r.status !== 0) {
      throw new Error(`Migration ${mig} failed (exit ${r.status}). Brain may be mid-upgrade — restore the snapshot.`);
    }
  }

  // -- regenerate + validate with the brain's fresh tooling
  const postSteps = [
    ['sync-agents.mjs', []],
    ['build-index.mjs', []],
    ['validate.mjs', []],
    ['validate-links.mjs', []],
  ];
  for (const [script, args] of postSteps) {
    if (!existsSync(path.join(brainRoot, 'scripts', script))) {
      report.postChecks.push(`${script}: not present — skipped`);
      continue;
    }
    const r = spawnSync('node', [path.join('scripts', script), ...args], {
      cwd: brainRoot,
      stdio: 'inherit',
    });
    report.postChecks.push(`${script}: ${r.status === 0 ? 'OK' : `FAILED (exit ${r.status})`}`);
  }

  // -- stamp the new version
  await fs.writeFile(path.join(brainRoot, 'VERSION'), templateVersion + '\n');

  return report;
}

function printReport(report, dryRun) {
  process.stdout.write(`\n${dryRun ? 'DRY-RUN — nothing written.' : 'Upgrade complete.'}\n`);
  process.stdout.write(`  v${report.fromVersion} → v${report.toVersion}\n\n`);
  const news = report.copies.filter((c) => c.kind === 'new');
  const changed = report.copies.filter((c) => c.kind === 'changed');
  process.stdout.write(`  Framework files: ${changed.length} updated, ${news.length} new\n`);
  for (const c of report.copies.slice(0, 40)) {
    process.stdout.write(`    ${c.kind === 'new' ? '+' : '~'} ${c.rel}\n`);
  }
  if (report.copies.length > 40) {
    process.stdout.write(`    ... and ${report.copies.length - 40} more\n`);
  }
  if (report.migrations.length) {
    process.stdout.write(`  Migrations ${dryRun ? 'to run' : 'run'}: ${report.migrations.join(', ')}\n`);
  }
  if (report.orphans.length) {
    process.stdout.write('\n  ⚠ Orphans (in the brain, no longer in the template — NEVER auto-deleted):\n');
    for (const o of report.orphans) process.stdout.write(`    ? ${o}\n`);
    process.stdout.write('    Review each: your own addition → keep; template leftover → delete by hand.\n');
  }
  for (const p of report.postChecks) process.stdout.write(`  post: ${p}\n`);
  if (!dryRun) {
    process.stdout.write('\nNext steps:\n');
    process.stdout.write('  1. Review the diff:  git status && git diff\n');
    process.stdout.write(`  2. Commit:           git add . && git commit -m "upgrade: brain to template v${report.toVersion}"\n`);
    process.stdout.write('  3. Sanity check:     node scripts/doctor.mjs\n');
  }
}

function usage() {
  process.stderr.write('Usage: node <new-template>/scripts/upgrade.mjs --brain <path-to-brain> [--dry-run] [--skip-snapshot]\n');
}

async function main() {
  const args = process.argv.slice(2);
  const brainIdx = args.indexOf('--brain');
  const brainArg = brainIdx !== -1 ? args[brainIdx + 1] : null;
  if (!brainArg) {
    usage();
    process.exit(1);
  }
  const brainRoot = path.resolve(brainArg);
  const dryRun = args.includes('--dry-run');
  const skipSnapshot = args.includes('--skip-snapshot');

  if (path.resolve(brainRoot) === TEMPLATE_ROOT) {
    process.stderr.write('error: --brain points at the template itself. Refusing.\n');
    process.exit(1);
  }

  process.stdout.write(`Template: ${TEMPLATE_ROOT} (v${await readVersion(TEMPLATE_ROOT)})\n`);
  process.stdout.write(`Brain:    ${brainRoot} (v${await readVersion(brainRoot)})\n`);

  const report = await runUpgrade(TEMPLATE_ROOT, brainRoot, { dryRun, skipSnapshot });
  printReport(report, dryRun);
}

const invokedDirectly = (() => {
  try {
    if (!process.argv[1]) return false;
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
})();
if (invokedDirectly) {
  main().catch((err) => {
    process.stderr.write(`upgrade failed: ${err.message}\n`);
    process.exit(1);
  });
}
