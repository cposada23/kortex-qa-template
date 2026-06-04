#!/usr/bin/env node
// validate-session.test.mjs — guards the v1.8 session-log validation path.
//
// Covers the adversarial review's blocking findings:
//   #1  `type: session` must be an allowed type (else the auto-merge gate
//       rejects every session file).
//   #5  the secret gate must BLOCK in --strict-pii mode scoped to sessions/.
//   + status enum (open|closed), directory target, missing-dir = clean.
//
// Run: node scripts/tests/validate-session.test.mjs

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const VALIDATE = path.join(REPO_ROOT, 'scripts', 'validate.mjs');

let passed = 0;
let failed = 0;
const failures = [];
function assert(cond, msg) {
  if (cond) { passed++; } else { failed++; failures.push(msg); }
}

function runValidate(args) {
  const r = spawnSync('node', [VALIDATE, ...args], { encoding: 'utf8' });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

const VALID = `---
title: "Session 20260604-0930"
type: session
status: open
language: en
tags: [session]
updated: 2026-06-04
branch: session/20260604-0930
---

# Session 20260604-0930

## Note 10:00
focus: writing the session-log tests
`;

const BAD_STATUS = VALID.replace('status: open', 'status: bogus');
const CLOSED = VALID.replace('status: open', 'status: closed');
const WITH_SECRET = VALID + '\n## Handoff 14:00\ntoken used in the call: sk-ABCDEFGHIJKLMNOPQRSTUVWXYZ012345\n';

async function main() {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'kqa-session-'));
  const sessions = path.join(tmp, 'sessions');
  await fs.mkdir(sessions, { recursive: true });

  // 1 — valid session file passes whole validation
  await fs.writeFile(path.join(sessions, '20260604-0930.md'), VALID);
  assert(runValidate([sessions]).code === 0, '#1 valid type:session should pass (exit 0)');

  // 2 — closed status also valid
  await fs.writeFile(path.join(sessions, '20260603-0900.md'), CLOSED);
  assert(runValidate([sessions]).code === 0, 'status: closed should pass');

  // 3 — bad status fails
  await fs.writeFile(path.join(sessions, '20260602-0900.md'), BAD_STATUS);
  const bad = runValidate([sessions]);
  assert(bad.code === 1, 'status: bogus should fail (exit 1)');
  assert(/status 'bogus' invalid/.test(bad.out), 'error message should name the bad status');
  await fs.rm(path.join(sessions, '20260602-0900.md'));

  // 4 — planted secret: warn-only WITHOUT --strict-pii, BLOCKS with it
  await fs.writeFile(path.join(sessions, '20260601-0900.md'), WITH_SECRET);
  assert(runValidate([sessions]).code === 0, 'secret without --strict-pii is warn-only (exit 0)');
  const gated = runValidate([sessions, '--strict-pii']);
  assert(gated.code === 1, '#5 secret with --strict-pii must BLOCK (exit 1)');
  assert(/PII|secret|openai/i.test(gated.out), 'secret gate output should mention PII/secret');
  await fs.rm(path.join(sessions, '20260601-0900.md'));

  // 5 — missing dir target = clean exit (no session files yet)
  assert(runValidate([path.join(tmp, 'nope'), '--strict-pii']).code === 0, 'missing sessions dir is clean (exit 0)');

  await fs.rm(tmp, { recursive: true, force: true });

  process.stdout.write(`\nvalidate-session: ${passed} passed, ${failed} failed\n`);
  if (failed) {
    for (const f of failures) process.stdout.write(`  ✗ ${f}\n`);
    process.exit(1);
  }
  process.stdout.write('✓ all session-validation tests passed\n');
}

main().catch((err) => {
  process.stderr.write(`validate-session test crashed: ${err.message}\n`);
  process.exit(1);
});
