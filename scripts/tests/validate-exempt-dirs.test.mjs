#!/usr/bin/env node
// validate-exempt-dirs.test.mjs — v2.3.0: brain.config.json
// `validation_exempt_dirs` lets a brain exempt directories of AS-IS
// imported source material from the frontmatter/language schema.
// The setting is data, so it survives template upgrades that
// replace scripts/.
//
// Strategy: validate.mjs is zero-dep and resolves REPO_ROOT from its
// own location, so we copy it into a sandbox repo in tmp and run the
// whole-brain walk there.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const VALIDATE_SRC = path.join(REPO_ROOT, 'scripts', 'validate.mjs');

let passed = 0;
let failed = 0;
const failures = [];
function assert(cond, msg) {
  if (cond) { passed++; process.stdout.write(`  ✓ ${msg}\n`); }
  else { failed++; failures.push(msg); process.stdout.write(`  ✗ ${msg}\n`); }
}

function run(script) {
  const r = spawnSync('node', [script], { encoding: 'utf8' });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

const BAD_MD = `# Imported doc, no frontmatter

Documento importado tal cual — sin frontmatter, en español.
`;

const OK_MD = `---
title: "A valid knowledge page"
type: knowledge
status: active
language: en
tags: [patterns]
updated: 2026-07-12
---

# A valid knowledge page

Body.
`;

async function buildSandbox({ exempt }) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kqa-exempt-'));
  await fs.mkdir(path.join(root, 'scripts'), { recursive: true });
  await fs.copyFile(VALIDATE_SRC, path.join(root, 'scripts', 'validate.mjs'));
  await fs.mkdir(path.join(root, 'imported-docs'), { recursive: true });
  await fs.writeFile(path.join(root, 'imported-docs', 'raw-import.md'), BAD_MD);
  await fs.mkdir(path.join(root, 'knowledge'), { recursive: true });
  await fs.writeFile(path.join(root, 'knowledge', 'ok.md'), OK_MD);
  const cfg = { client: 'sandbox', created: '2026-07-12' };
  if (exempt) cfg.validation_exempt_dirs = exempt;
  await fs.writeFile(path.join(root, 'brain.config.json'), JSON.stringify(cfg, null, 2) + '\n');
  return root;
}

async function main() {
  process.stdout.write('validate-exempt-dirs.test.mjs\n');
  process.stdout.write('=============================\n\n');

  {
    const root = await buildSandbox({ exempt: null });
    const r = run(path.join(root, 'scripts', 'validate.mjs'));
    assert(r.code === 1 && /raw-import\.md/.test(r.out),
      'no exemption → schema-violating file inside imported-docs/ FAILS the walk');
    await fs.rm(root, { recursive: true, force: true });
  }
  {
    const root = await buildSandbox({ exempt: ['imported-docs'] });
    const r = run(path.join(root, 'scripts', 'validate.mjs'));
    assert(r.code === 0 && !/raw-import\.md/.test(r.out),
      'validation_exempt_dirs: ["imported-docs"] → walk skips the dir and passes');
    await fs.rm(root, { recursive: true, force: true });
  }
  {
    // Non-array / junk values must not break the validator.
    const root = await buildSandbox({ exempt: null });
    const cfgPath = path.join(root, 'brain.config.json');
    const cfg = JSON.parse(await fs.readFile(cfgPath, 'utf8'));
    cfg.validation_exempt_dirs = 'imported-docs'; // wrong type on purpose
    await fs.writeFile(cfgPath, JSON.stringify(cfg, null, 2) + '\n');
    const r = run(path.join(root, 'scripts', 'validate.mjs'));
    assert(r.code === 1 && /raw-import\.md/.test(r.out),
      'non-array validation_exempt_dirs → ignored gracefully (no crash, no exemption)');
    await fs.rm(root, { recursive: true, force: true });
  }

  process.stdout.write(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    failures.forEach((f) => process.stdout.write(`  FAILED: ${f}\n`));
    process.exit(1);
  }
}

main().catch((err) => {
  process.stderr.write(`test crashed: ${err.stack}\n`);
  process.exit(1);
});
