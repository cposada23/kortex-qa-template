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

import { promises as fs, realpathSync } from 'node:fs';
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
  // patterns. We stage the filtered tree to a temp dir and zip
  // that directory.
  //
  // Enumeration uses [System.IO.Directory]::EnumerateFiles with
  // AllDirectories, not Get-ChildItem -Recurse -Force. Reason:
  // PowerShell 5.1's Get-ChildItem has a long-standing inconsistency
  // where -Force on -Recurse does not always descend into hidden
  // subdirectories (Git on Windows marks .git/ as +H Hidden, so
  // its contents would silently be skipped). The .NET API recurses
  // unconditionally — it sees what NTFS sees.
  //
  // After staging, we verify that at least one entry under .git/
  // and .github/ was actually staged (when those folders exist in
  // the source tree). If not, the function throws so the caller
  // falls back to a different creator instead of producing a broken
  // ZIP.
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
      # .NET enumeration — recurses into hidden subdirectories
      # (Get-ChildItem -Recurse -Force does NOT, reliably, in PS 5.1).
      $rootLen = $root.Length;
      if (-not ($root.EndsWith('\\') -or $root.EndsWith('/'))) { $rootLen = $rootLen + 1 }
      $files = [System.IO.Directory]::EnumerateFiles($root, '*', [System.IO.SearchOption]::AllDirectories);
      foreach ($f in $files) {
        $rel = $f.Substring($rootLen);
        if (Test-SnapshotExclude $rel) { continue }
        $target = Join-Path $stage $rel;
        $targetDir = Split-Path $target -Parent;
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null;
        Copy-Item -LiteralPath $f -Destination $target -Force;
      }

      # Sanity check the stage before zipping. If .git/ exists in the
      # source but produced ZERO staged files, something silently
      # skipped it — fail loudly so the caller can fall back to zip CLI.
      foreach ($critical in @('.git', '.github')) {
        $srcDir = Join-Path $root $critical;
        $stagedDir = Join-Path $stage $critical;
        if ((Test-Path -LiteralPath $srcDir) -and -not (Test-Path -LiteralPath $stagedDir)) {
          throw "Stage missing $critical/ contents — enumeration skipped a hidden directory. Aborting so caller can fall back to zip CLI.";
        }
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

// normalizeEntry — make path comparison robust across platforms.
// Windows zip producers may emit entries with backslashes or
// leading "./", and filesystems are case-insensitive. We normalize
// both sides before comparison so a single canonical form decides
// the match.
//
// Exported for unit tests in scripts/tests/snapshot.test.mjs.
export function normalizeEntry(p) {
  return String(p)
    .replace(/\\/g, '/')      // backslash → forward slash (Windows)
    .replace(/^\.\//, '')     // strip leading "./"
    .replace(/^\/+/, '')      // strip any leading "/"
    .toLowerCase();           // case-insensitive (Windows + macOS default)
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

  // Pre-normalize entries once so we don't re-normalize per check.
  const normEntries = entries.map(normalizeEntry);

  const missing = [];
  for (const rel of REQUIRED_IF_PRESENT) {
    if (!(await pathExistsRelative(rel))) continue;
    const isDir = rel.endsWith('/');
    const relNorm = normalizeEntry(rel);
    const found = normEntries.some((entry) => {
      if (isDir) {
        return entry === relNorm || entry.startsWith(relNorm);
      }
      return entry === relNorm;
    });
    if (!found) missing.push(rel);
  }

  const notable = [];
  for (const rel of NOTABLE_IF_PRESENT) {
    if (!(await pathExistsRelative(rel))) continue;
    const isDir = rel.endsWith('/');
    const relNorm = normalizeEntry(rel);
    const present = normEntries.some((entry) => {
      if (isDir) return entry === relNorm || entry.startsWith(relNorm);
      return entry === relNorm;
    });
    notable.push({ path: rel, present });
  }

  return {
    ok: missing.length === 0,
    missing,
    notable,
    listingFailed: false,
    entryCount: entries.length,
    rawEntries: entries,   // surfaced for diagnostic prints on failure
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

  process.stdout.write(`Platform: ${process.platform} (node ${process.version})\n\n`);

  let succeeded = false;
  let outputPath = null;
  let creator = null;
  if (process.platform !== 'win32') {
    process.stdout.write('→ Trying zip CLI...\n');
    if (tryZip(zipPath, excludes)) {
      succeeded = true;
      outputPath = zipPath;
      creator = 'zip CLI';
    } else {
      process.stderr.write('zip not available or failed. Falling back to tar...\n');
      if (tryTar(tarPath, excludes)) {
        succeeded = true;
        outputPath = tarPath;
        creator = 'tar';
      }
    }
  } else {
    // Windows: prefer Git Bash's `zip` CLI when available (info-zip
    // is well-tested for dotfolders like .git/ and .github/). Fall
    // back to PowerShell + System.IO.Compression only if zip CLI is
    // missing or fails. The previous order (PowerShell first) had a
    // hidden-directory enumeration gotcha on PowerShell 5.1 where
    // Get-ChildItem -Recurse -Force silently skipped .git/ contents.
    process.stdout.write('→ Trying zip CLI (Git Bash on Windows)...\n');
    if (tryZip(zipPath, excludes)) {
      succeeded = true;
      outputPath = zipPath;
      creator = 'zip CLI (Git Bash)';
    } else {
      process.stdout.write('→ zip CLI not available. Trying PowerShell ZipFile fallback...\n');
      if (tryPowerShellZip(zipPath, excludes)) {
        succeeded = true;
        outputPath = zipPath;
        creator = 'PowerShell ZipFile';
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

  let size = '?';
  try {
    const stat = await fs.stat(outputPath);
    const mb = (stat.size / (1024 * 1024)).toFixed(2);
    size = `${mb} MB`;
  } catch {
    // ignore
  }

  process.stdout.write(`\n✓ Snapshot created: ${path.relative(REPO_ROOT, outputPath)} (${size})\n`);
  process.stdout.write(`  Created by: ${creator}\n`);

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
    process.stderr.write('\n❌ Snapshot verifier reports missing critical paths:\n');
    for (const m of verification.missing) {
      process.stderr.write(`   - ${m}  (present in working tree but NOT in archive)\n`);
    }

    // Diagnostic dump: print what the verifier ACTUALLY saw inside
    // the archive. If the engineer expected .git/ to be in there
    // and it IS in the list below, the bug is the comparison logic
    // (normalize already runs; report it). If it's NOT in the list
    // below, the bug is in the archive itself or the listing tool.
    const sample = (verification.rawEntries || []).slice(0, 30);
    if (sample.length > 0) {
      process.stderr.write(`\n   First ${sample.length} entries the verifier saw inside the archive:\n`);
      for (const e of sample) {
        process.stderr.write(`     ${e}\n`);
      }
      if (verification.rawEntries.length > sample.length) {
        process.stderr.write(`     ... and ${verification.rawEntries.length - sample.length} more.\n`);
      }
    } else {
      process.stderr.write('\n   (the verifier got an EMPTY listing — the archive may be empty or the lister tool failed silently)\n');
    }

    process.stderr.write('\n   Diagnostic next step (run manually, send the output if asking for help):\n');
    process.stderr.write(`     unzip -l ${path.relative(REPO_ROOT, outputPath)} | head -40\n`);
    process.stderr.write('   If that shows the missing paths but the verifier above did NOT, it is a listing-tool mismatch.\n');
    process.stderr.write('   If it ALSO does not show them, the ZIP creator skipped them — re-create with:\n');
    process.stderr.write(`     rm ${path.relative(REPO_ROOT, outputPath)} && node scripts/snapshot.mjs\n`);
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

// Only run main() when invoked as a script. If this module is
// imported (by snapshot.test.mjs for unit-testing exports like
// normalizeEntry), the import side-effects must be inert.
//
// Use realpathSync on both sides so that symlinks like /tmp →
// /private/tmp on macOS, or any other filesystem indirection, do
// not break the equality check.
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
    process.stderr.write(`snapshot failed: ${err.message}\n`);
    process.exit(1);
  });
}
