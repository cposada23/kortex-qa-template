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
// Post-ZIP verification (added v1.7.0 after a snapshot lost .git/
// and forced a manual recovery): listSnapshot() reads the archive
// and asserts that critical paths present in the working tree are
// also in the archive. If `.git/`, `.github/`, or `AGENTS.md` are
// missing, the script aborts with a clear error.
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// Paths whose presence in the working tree means they MUST also be
// in the snapshot. If any of these is missing from the produced
// archive, the snapshot is treated as failed.
const REQUIRED_IF_PRESENT = [
  '.git/',
  '.github/',
  'AGENTS.md',
  'README.md',
];

// Paths whose presence in the snapshot is noteworthy enough to
// print at the end (so the owner sees "yes, my creds are inside"
// or "no, I forgot to copy .env before snapshotting").
const NOTABLE_IF_PRESENT = [
  '.env',
  '.env.local',
  '.secrets',
  'client-secrets/',
  'CHAT-HANDOFF.md',
];

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
      .map((l) => {
        // Strip inline comments so 'versions/       # recursion guard' works.
        const hashIdx = l.indexOf('#');
        const noComment = hashIdx === -1 ? l : l.slice(0, hashIdx);
        return noComment.trim();
      })
      .filter((l) => l && !l.startsWith('#'));
  } catch {
    return [];
  }
}

async function pathExistsRelative(rel) {
  try {
    await fs.access(path.join(REPO_ROOT, rel.replace(/\/$/, '')));
    return true;
  } catch {
    return false;
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
  // patterns. Passing a recursive Get-ChildItem result directly can
  // also produce duplicate archive paths, so stage the filtered tree
  // first and zip that directory.
  const excludeArgs = excludes.map((e) => `'${e.replace(/'/g, "''")}'`).join(',');
  const escapedZipPath = zipPath.replace(/'/g, "''");
  const cmd = `
    $ErrorActionPreference = 'Stop';
    $excludes = @(${excludeArgs});
    $root = (Get-Location).ProviderPath;
    $stage = Join-Path ([System.IO.Path]::GetTempPath()) ('kortex-qa-snapshot-' + [System.Guid]::NewGuid().ToString());
    New-Item -ItemType Directory -Path $stage | Out-Null;

    function Test-SnapshotExclude([string] $relPath) {
      $norm = $relPath -replace '\\\\', '/';
      $name = Split-Path $norm -Leaf;
      foreach ($raw in $excludes) {
        $e = ($raw -replace '\\\\', '/').Trim();
        if (-not $e) { continue }
        if ($e.EndsWith('/')) {
          $prefix = $e.TrimEnd('/');
          if ($norm -eq $prefix -or $norm.StartsWith($e)) { return $true }
        } elseif ($e.Contains('*') -or $e.Contains('?')) {
          if ($norm -like $e -or $name -like $e) { return $true }
        } else {
          if ($norm -eq $e -or $name -eq $e) { return $true }
        }
      }
      return $false
    }

    try {
      Get-ChildItem -LiteralPath $root -Recurse -File -Force |
        ForEach-Object {
          $rel = $_.FullName.Substring($root.Length).TrimStart('\\', '/');
          if (Test-SnapshotExclude $rel) { return }
          $target = Join-Path $stage $rel;
          $targetDir = Split-Path $target -Parent;
          New-Item -ItemType Directory -Path $targetDir -Force | Out-Null;
          Copy-Item -LiteralPath $_.FullName -Destination $target -Force;
        }

      Add-Type -AssemblyName System.IO.Compression.FileSystem;
      if (Test-Path '${escapedZipPath}') {
        Remove-Item -LiteralPath '${escapedZipPath}' -Force;
      }
      [System.IO.Compression.ZipFile]::CreateFromDirectory($stage, '${escapedZipPath}');
    } finally {
      if (Test-Path $stage) {
        Remove-Item -LiteralPath $stage -Recurse -Force;
      }
    }
  `;
  const r = spawnSync('powershell', ['-NoProfile', '-Command', cmd], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
  return r.status === 0;
}

// listSnapshot — return the list of entries inside the archive as
// repo-relative POSIX paths (directory entries end with '/').
// Returns null if listing failed; caller decides what to do.
function listSnapshot(archivePath) {
  const isZip = archivePath.endsWith('.zip');
  const isTar = archivePath.endsWith('.tar.gz');

  if (isZip) {
    // Try `unzip -l` first (mac/linux/git-bash).
    const r = spawnSync('unzip', ['-Z1', archivePath], { encoding: 'utf8' });
    if (r.status === 0) {
      return r.stdout
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => l.replace(/^\.\//, ''));
    }
    // Windows fallback: PowerShell System.IO.Compression listing.
    if (process.platform === 'win32') {
      const escaped = archivePath.replace(/'/g, "''");
      const cmd = `
        Add-Type -AssemblyName System.IO.Compression.FileSystem;
        $zip = [System.IO.Compression.ZipFile]::OpenRead('${escaped}');
        try {
          $zip.Entries | ForEach-Object { $_.FullName }
        } finally { $zip.Dispose() }
      `;
      const p = spawnSync('powershell', ['-NoProfile', '-Command', cmd], { encoding: 'utf8' });
      if (p.status === 0) {
        return p.stdout
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => l.replace(/\\/g, '/').replace(/^\.\//, ''));
      }
    }
    return null;
  }

  if (isTar) {
    const r = spawnSync('tar', ['-tzf', archivePath], { encoding: 'utf8' });
    if (r.status === 0) {
      return r.stdout
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => l.replace(/^\.\//, ''));
    }
    return null;
  }

  return null;
}

// verifySnapshot — check that everything in REQUIRED_IF_PRESENT
// that exists in the working tree is also in the archive. Returns
// { ok: boolean, missing: string[], notable: { path, present }[] }.
async function verifySnapshot(archivePath) {
  const entries = listSnapshot(archivePath);
  if (entries === null) {
    return {
      ok: false,
      missing: [],
      notable: [],
      listingFailed: true,
    };
  }

  const missing = [];
  for (const rel of REQUIRED_IF_PRESENT) {
    if (!(await pathExistsRelative(rel))) continue;
    const isDir = rel.endsWith('/');
    const found = entries.some((entry) => {
      if (isDir) {
        return entry === rel || entry.startsWith(rel);
      }
      return entry === rel;
    });
    if (!found) missing.push(rel);
  }

  const notable = [];
  for (const rel of NOTABLE_IF_PRESENT) {
    if (!(await pathExistsRelative(rel))) continue;
    const isDir = rel.endsWith('/');
    const present = entries.some((entry) => {
      if (isDir) return entry === rel || entry.startsWith(rel);
      return entry === rel;
    });
    notable.push({ path: rel, present });
  }

  return {
    ok: missing.length === 0,
    missing,
    notable,
    listingFailed: false,
    entryCount: entries.length,
  };
}

async function main() {
  const version = await readVersion();
  const clientSlug = await readClientSlug();
  const ts = timestamp();
  const baseName = `kortex-qa-${clientSlug}-v${version}-${ts}`;

  const versionsDir = path.join(REPO_ROOT, 'versions');
  await fs.mkdir(versionsDir, { recursive: true });

  const zipPath = path.join(versionsDir, `${baseName}.zip`);
  const tarPath = path.join(versionsDir, `${baseName}.tar.gz`);
  const excludes = await readSnapshotIgnore();

  process.stdout.write(`Creating snapshot for client="${clientSlug}", version="${version}"...\n`);
  process.stdout.write(`Excluding ${excludes.length} pattern(s): ${excludes.join(', ')}\n\n`);

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
    } else if (tryZip(zipPath, excludes)) {
      succeeded = true;
      outputPath = zipPath;
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

  let size = '?';
  try {
    const stat = await fs.stat(outputPath);
    const mb = (stat.size / (1024 * 1024)).toFixed(2);
    size = `${mb} MB`;
  } catch {
    // ignore
  }

  process.stdout.write(`\n✓ Snapshot created: ${path.relative(REPO_ROOT, outputPath)} (${size})\n`);

  // Post-ZIP verification.
  process.stdout.write('\nVerifying snapshot contents...\n');
  const verification = await verifySnapshot(outputPath);

  if (verification.listingFailed) {
    process.stderr.write('\n⚠️  Could not list snapshot contents to verify.\n');
    process.stderr.write('   The snapshot was created but its contents were not\n');
    process.stderr.write('   confirmed. Manually verify with:\n');
    process.stderr.write(`     unzip -l ${path.relative(REPO_ROOT, outputPath)}\n`);
    process.stderr.write('   and check that .git/, .github/, AGENTS.md are inside.\n');
    process.exit(2);
  }

  if (!verification.ok) {
    process.stderr.write('\n❌ Snapshot is missing critical paths:\n');
    for (const m of verification.missing) {
      process.stderr.write(`   - ${m}  (present in working tree but NOT in archive)\n`);
    }
    process.stderr.write('\n   This means the snapshot is unsafe for recovery.\n');
    process.stderr.write('   Check .snapshotignore — these paths must NOT be excluded.\n');
    process.stderr.write(`   Delete the bad snapshot: rm ${path.relative(REPO_ROOT, outputPath)}\n`);
    process.exit(3);
  }

  process.stdout.write(`✓ Verified ${verification.entryCount} entries.\n`);
  for (const rel of REQUIRED_IF_PRESENT) {
    if (await pathExistsRelative(rel)) {
      process.stdout.write(`  ✓ ${rel} included\n`);
    }
  }
  if (verification.notable.length > 0) {
    process.stdout.write('\nCredentials & session state (included by design):\n');
    for (const n of verification.notable) {
      const mark = n.present ? '✓ included' : '⚠ not in archive (file exists in working tree)';
      process.stdout.write(`  ${mark}: ${n.path}\n`);
    }
  }

  process.stdout.write('\nNext step: copy this file to your Teams self-DM\n');
  process.stdout.write('(or other IT-approved backup channel — per client policy).\n');
}

main().catch((err) => {
  process.stderr.write(`snapshot failed: ${err.message}\n`);
  process.exit(1);
});
