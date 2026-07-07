#!/usr/bin/env node
// init-debrand.test.mjs — verify the de-branding content transform.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { debrandContent } = await import(path.join(__dirname, '..', 'init.mjs'));

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; process.stdout.write(`  ✓ ${msg}\n`); }
  else { failed++; process.stdout.write(`  ✗ ${msg}\n`); }
}

process.stdout.write('init-debrand.test.mjs\n=====================\n\n');

const input = [
  '# Kortex-QA — Agent Context',
  'Clone from cposada23/kortex-qa-template to start.',
  'Run kortex-test init to bootstrap automation.',
  'The kortex-qa brain and Kortex conventions.',
].join('\n');
const out = debrandContent(input, 'acme');

assert(!/kortex-qa/i.test(out.replace(/kortex-test/gi, '')), 'no kortex-qa brand left');
assert(!/\bKortex\b/.test(out), 'no bare Kortex left');
assert(out.includes('kortex-test'), 'kortex-test tool name is preserved');
assert(!out.includes('cposada23'), 'template origin remote removed');
assert(out.includes('acme-qa-brain'), 'client slug replaces the brand');

// case variants (cross-validate gemini H2): brand removal and tool
// protection must both be case-insensitive.
const caseOut = debrandContent('KORTEX-QA docs built on Kortex-Test tooling.', 'acme');
assert(/kortex-test/i.test(caseOut), 'kortex-test survives case variants');
assert(!/kortex/i.test(caseOut.replace(/kortex-test/gi, '')), 'case-variant brands removed');

// workspace filename must match what init.mjs actually renames to
const wsOut = debrandContent('open kortex-qa.code-workspace in VS Code', 'acme');
assert(wsOut.includes('acme-qa.code-workspace'), 'workspace filename maps to init rename target');
assert(!wsOut.includes('qa-brain.code-workspace'), 'workspace filename not hit by generic brand rule');

assert(debrandContent('nothing to change', 'acme') === 'nothing to change',
  'content without brand is untouched');

process.stdout.write(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
process.stdout.write('✓ all init-debrand tests passed\n');
