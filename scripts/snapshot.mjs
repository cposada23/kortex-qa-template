#!/usr/bin/env node
// snapshot.mjs — ZIP the brain to versions/ for offline backup.
//
// Reads VERSION file, parses .snapshotignore for excluded paths,
// and produces:
//   versions/kortex-qa-<client>-v<X.Y.Z>-<YYYYMMDD-HHMM>.zip
//
// Strategy:
//   1. Try `zip` CLI (macOS / Linux ship with it).
//   2. Fall back to `tar -czf` (creates a .tar.gz instead of .zip
//      but is equivalent for backup purposes).
//   3. On Windows, try PowerShell's Compress-Archive.
//
// Client slug is read from .client-slug if present (written by
// init.mjs) or falls back to "client".
//
// Usage:
//   node scripts/snapshot.mjs

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

async function readVersion() {
  try {
    const v = await fs.readFile(path.join(REPO_ROOT, 'VERSION'), 'utf8');
    return v.trim();
  } catch {
    return '0.0.0';
  }
}

async function readClientSlug() {
  try {
    const s = await fs.readFile(path.join(REPO_ROOT, '.client-slug'), 'utf8');
    return s.trim() || 'client';
  } catch {
    return 'client';
  }
}

async function readSnapshotIgnore() {
  try {
    const content = await fs.readFile(path.join(REPO_ROOT, '.snapshotignore'), 'utf8');
    return content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
  } catch {
    return [];
  }
}

function tryZip(zipPath, excludes) {
  // macOS / Linux: zip -r out.zip . -x <pattern> -x <pattern>
  const args = ['-r', '-q', zipPath, '.'];
  for (const e of excludes) {
    args.push('-x', e.endsWith('/') ? `${e}*` : e);
  }
  const r = spawnSync('zip', args, { cwd: REPO_ROOT, stdio: 'inherit' });
  return r.status === 0;
}

function tryTar(tarPath, excludes) {
  const args = ['-czf', tarPath];
  for (const e of excludes) {
    args.push('--exclude', e.endsWith('/') ? e.slice(0, -1) : e);
  }
  args.push('.');
  const r = spawnSync('tar', args, { cwd: REPO_ROOT, stdio: 'inherit' });
  return r.status === 0;
}

function tryPowerShellZip(zipPath, excludes) {
  // Windows PowerShell: Compress-Archive can't natively exclude
  // patterns; we approximate via Get-ChildItem + filter.
  // Best-effort fallback.
  const excludeArgs = excludes.map((e) => `'${e.replace(/'/g, "''")}'`).join(',');
  const cmd = `
    $excludes = @(${excludeArgs});
    $files = Get-ChildItem -Path . -Recurse |
      Where-Object {
        foreach ($e in $excludes) {
          if ($_.FullName -like "*$e*") { return $false }
        }
        return $true
      };
    Compress-Archive -Path $files -DestinationPath '${zipPath}' -Force
  `;
  const r = spawnSync('powershell', ['-NoProfile', '-Command', cmd], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
  return r.status === 0;
}

async function main() {
  const version = await readVersion();
  const clientSlug = await readClientSlug();
  const ts = timestamp();
  const baseName = `kortex-qa-${clientSlug}-v${version}-${ts}`;

  // Ensure versions/ exists
  const versionsDir = path.join(REPO_ROOT, 'versions');
  await fs.mkdir(versionsDir, { recursive: true });

  const zipPath = path.join(versionsDir, `${baseName}.zip`);
  const tarPath = path.join(versionsDir, `${baseName}.tar.gz`);
  const excludes = await readSnapshotIgnore();

  process.stdout.write(`Creating snapshot for client="${clientSlug}", version="${version}"...\n`);
  process.stdout.write(`Excluding ${excludes.length} pattern(s).\n\n`);

  // Try zip first
  let succeeded = false;
  let outputPath = null;
  if (process.platform !== 'win32') {
    if (tryZip(zipPath, excludes)) {
      succeeded = true;
      outputPath = zipPath;
    } else {
      process.stderr.write('zip not available or failed. Falling back to tar...\n');
      if (tryTar(tarPath, excludes)) {
        succeeded = true;
        outputPath = tarPath;
      }
    }
  } else {
    if (tryPowerShellZip(zipPath, excludes)) {
      succeeded = true;
      outputPath = zipPath;
    } else {
      // Try git bash zip if present
      if (tryZip(zipPath, excludes)) {
        succeeded = true;
        outputPath = zipPath;
      }
    }
  }

  if (!succeeded) {
    process.stderr.write('error: no archive tool succeeded.\n\n');
    if (process.platform === 'win32') {
      process.stderr.write('On Windows, this script tries (in order):\n');
      process.stderr.write('  1. PowerShell Compress-Archive\n');
      process.stderr.write('  2. `zip` (if Git Bash / WSL is installed)\n\n');
      process.stderr.write('If both failed, your corporate Execution Policy may be\n');
      process.stderr.write('blocking scripts. Workarounds:\n');
      process.stderr.write('  - Manually right-click the folder and "Send to → Compressed (zipped) folder"\n');
      process.stderr.write('  - Install 7-Zip and zip from the GUI\n');
      process.stderr.write('  - Have IT relax the policy or use a different backup channel\n');
      process.stderr.write('\nSee README.md "Org policy fit" for guidance.\n');
    } else {
      process.stderr.write('Install `zip` or `tar` (tar is usually shipped by default).\n');
    }
    process.exit(1);
  }

  // Print size
  let size = '?';
  try {
    const stat = await fs.stat(outputPath);
    const mb = (stat.size / (1024 * 1024)).toFixed(2);
    size = `${mb} MB`;
  } catch {
    // ignore
  }

  process.stdout.write(`\n✓ Snapshot created: ${path.relative(REPO_ROOT, outputPath)} (${size})\n`);
  process.stdout.write('\nNext step: copy this file to your client-approved backup location\n');
  process.stdout.write('(Teams archive, IT-managed folder, encrypted drive — per client policy).\n');
}

main().catch((err) => {
  process.stderr.write(`snapshot failed: ${err.message}\n`);
  process.exit(1);
});
