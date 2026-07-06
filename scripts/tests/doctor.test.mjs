#!/usr/bin/env node
// doctor.test.mjs — verify the day-1 preflight report.
//
// Spawns doctor.mjs as a subprocess with a controlled PATH so binary
// detection is deterministic. Network checks are disabled via
// --no-net (they are best-effort probes, not unit-testable).

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DOCTOR = path.join(REPO_ROOT, 'scripts', 'doctor.mjs');

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
    process.stdout.write(`  ✓ ${msg}\n`);
  } else {
    failed++;
    process.stdout.write(`  ✗ ${msg}\n`);
  }
}

// Build a PATH dir containing only the given fake binaries (plus a
// symlink-free copy of `node` handled separately via process.execPath).
async function makeBinDir(binaries) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'doctor-bin-'));
  for (const name of binaries) {
    const p = path.join(dir, name);
    await fs.writeFile(p, '#!/bin/sh\nexit 0\n');
    await fs.chmod(p, 0o755);
  }
  return dir;
}

function runDoctor(binDir, extraEnv = {}) {
  return spawnSync(process.execPath, [DOCTOR, '--no-net'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: {
      // Deliberately minimal env: PATH only contains our fake bin dir.
      PATH: binDir,
      HOME: os.homedir(),
      ...extraEnv,
    },
  });
}

async function main() {
  process.stdout.write('doctor.test.mjs\n');
  process.stdout.write('===============\n\n');

  // Full toolbox: git, zip, pnpm, npm, agent CLIs present
  {
    const bin = await makeBinDir(['git', 'zip', 'npm', 'pnpm', 'code', 'claude']);
    const r = runDoctor(bin);
    assert(r.status === 0, 'exit 0 with a healthy toolbox');
    assert(/node/i.test(r.stdout) && /✓/.test(r.stdout), 'reports node OK');
    assert(/git/.test(r.stdout), 'reports git check');
    assert(/zip/i.test(r.stdout), 'reports zip capability');
    assert(/claude/i.test(r.stdout), 'detects claude CLI surface');
    assert(/Suggested surface/i.test(r.stdout), 'prints a suggested surface');
    assert(/copilot/i.test(r.stdout), 'suggests Copilot when code is installed (tie-break)');
  }

  // No git → warn but still exit 0
  {
    const bin = await makeBinDir(['zip', 'npm']);
    const r = runDoctor(bin);
    assert(r.status === 0, 'exit 0 without git (warn-only)');
    assert(/⚠.*git|git.*⚠/i.test(r.stdout), 'warns about missing git');
  }

  // No agent CLIs → suggests editor + AGENTS.md fallback
  {
    const bin = await makeBinDir(['git', 'zip', 'npm', 'pnpm']);
    const r = runDoctor(bin);
    assert(r.status === 0, 'exit 0 without agent CLIs');
    assert(/any editor \+ AGENTS\.md/i.test(r.stdout),
      'suggests "any editor + AGENTS.md" when no agent CLI is found');
  }

  // Missing pnpm → warn with install instruction
  {
    const bin = await makeBinDir(['git', 'zip', 'npm']);
    const r = runDoctor(bin);
    assert(/pnpm/.test(r.stdout) && /npm install -g pnpm|corepack/i.test(r.stdout),
      'missing pnpm → warn with install instruction');
  }

  // Proxy env vars are surfaced
  {
    const bin = await makeBinDir(['git', 'zip', 'npm', 'pnpm']);
    const r = runDoctor(bin, { HTTPS_PROXY: 'http://proxy.corp:8080' });
    assert(/HTTPS_PROXY.*proxy\.corp:8080/.test(r.stdout), 'prints HTTPS_PROXY when set');
  }

  process.stdout.write(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
  process.stdout.write('✓ all doctor tests passed\n');
}

main().catch((err) => {
  process.stderr.write(`doctor.test.mjs crashed: ${err.stack}\n`);
  process.exit(1);
});
