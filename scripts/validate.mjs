#!/usr/bin/env node
// validate.mjs — frontmatter + integrity + PII check across the brain.
//
// Walks all .md files (except exempted README/AGENTS/INDEX/etc.),
// parses frontmatter, and checks:
//   1. Required base fields present (title, type, language, tags, updated)
//   2. type value is in the allowed set
//   3. status value is type-specific and valid
//   4. language is 'en' (template invariant)
//   5. updated is YYYY-MM-DD shaped
//   6. PII patterns in body (best-effort regex scan; warns only)
//
// Exit codes:
//   0 — all clean (PII warnings still print but don't fail)
//   1 — violations found (printed to stderr)
//   2 — only PII warnings; still safe to commit but flagged
//
// Usage:
//   node scripts/validate.mjs                # validate whole brain
//   node scripts/validate.mjs <path>         # validate one file
//   node scripts/validate.mjs --strict-pii   # treat PII warnings as errors

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const ALLOWED_TYPES = new Set([
  'story', 'test-case', 'bug', 'review', 'ceremony', 'knowledge',
  'playbook', 'reference', 'template', 'index', 'journal', 'inbox',
]);

const STATUS_BY_TYPE = {
  story: ['backlog', 'in-progress', 'design-done', 'review-done',
          'execution-done', 'closed', 'blocked', 'cancelled'],
  'test-case': ['draft', 'reviewed', 'active', 'deprecated'],
  bug: ['open', 'assigned', 'fixed', 'verified', 'closed',
        'wontfix', 'duplicate'],
  review: ['in-progress', 'approved', 'changes-requested',
           'rejected', 'done'],
  ceremony: ['active', 'archived'],
  knowledge: ['active', 'draft', 'deprecated'],
  playbook: ['active', 'stub', 'deprecated'],
  reference: ['active', 'pending', 'done', 'archived'],
};

// Files exempt from frontmatter requirements (operational, not content).
const SKIP_FILENAMES = new Set([
  'README.md', 'AGENTS.md', 'INDEX.md', 'INBOX.md',
  'JOURNAL.md', 'TODO.md',
]);

const SKIP_DIRS = new Set([
  '.git', 'node_modules', '.cache', 'versions',
  '.github', // Copilot instructions/prompts use a different frontmatter shape
  'templates', // templates carry frontmatter for the NEW file, not their own
]);

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const lines = match[1].split('\n');
  const out = {};
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }
    out[key] = val;
  }
  return out;
}

async function walkMdFiles(dir, baseDir = dir) {
  const result = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return result;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await walkMdFiles(full, baseDir)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      if (SKIP_FILENAMES.has(entry.name)) continue;
      result.push(path.relative(baseDir, full));
    }
  }
  return result;
}

// Best-effort PII / secret scan against file body. Warns only —
// false positives are common, so the engineer reviews. The check
// is "did you accidentally paste a token / credit card / IP"
// rather than "is this file safe to ship."
//
// Patterns recognized:
//   - Credit-card-shaped 13–19 digit sequences (Luhn not validated)
//   - SSN-shaped (US): XXX-XX-XXXX
//   - IPv4 addresses (warns; legitimate in env docs but worth a peek)
//   - api_key=, apikey=, secret=, password=, token= assignments
//   - Authorization: Bearer <looks-jwt-like>
//   - Long base64-shaped strings (40+ chars) that look like JWTs/keys
//
// To intentionally include a flagged string (e.g. in a doc that
// explains the pattern), prefix the line with `<!-- pii-ok -->` or
// place the file outside the validated scope.
const PII_PATTERNS = [
  // High-signal, low-false-positive provider keys go first (cheap to fail-fast)
  { name: 'aws-access-key', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'github-pat', re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/ },
  { name: 'stripe-live-key', re: /\b(?:sk|pk|rk)_live_[A-Za-z0-9]{20,}\b/ },
  { name: 'stripe-test-key', re: /\b(?:sk|pk|rk)_test_[A-Za-z0-9]{20,}\b/ },
  { name: 'openai-key', re: /\bsk-[A-Za-z0-9]{20,}\b/ },
  // Connection strings with credentials
  { name: 'url-with-credentials', re: /\b[a-z][a-z0-9+]*:\/\/[^\s:/@]+:[^\s/@]+@[^\s\/?#]+/i },
  // Classic PII
  { name: 'credit-card-shaped', re: /\b(?:\d[ -]?){13,19}\b/ },
  { name: 'ssn-shaped (US)', re: /\b\d{3}-\d{2}-\d{4}\b/ },
  // Skip 0.x and 127.x in env files (test fixtures) by not requiring it,
  // but still warn — engineer decides
  { name: 'ipv4-like', re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/ },
  { name: 'api-key-assignment', re: /\b(?:api[_-]?key|apikey|secret|password|access[_-]?token|client[_-]?secret)\s*[:=]\s*["']?[A-Za-z0-9_\-./+=]{8,}/i },
  { name: 'bearer-token', re: /\bAuthorization\s*:\s*Bearer\s+[A-Za-z0-9_\-./+=]{20,}/i },
  // JWT-shaped: three dot-separated base64-ish segments, each 10+
  // chars. Standard JWT pattern (eyJ... is "{" in base64, very
  // common header start).
  { name: 'jwt-shaped', re: /\beyJ[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\b/ },
  // Generic opaque token: 60+ chars, contains both upper and lower
  // case AND a digit. Avoids matching kebab-case filenames.
  { name: 'token-shaped', re: /\b(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z0-9_\-]{60,}={0,3}\b/ },
];

// Lines containing placeholders / example markers skip the entire
// PII scan loop — saves ~6x regex runs per line in docs heavy with
// `<...>` placeholders and `qa+...@example.client.internal` test
// users.
const PLACEHOLDER_RE = /<[^>]+>|\{\{[^}]+\}\}|YYYY-MM-DD|qa\+|example\.client\.internal|placeholder/i;

// Per-line suppressions:
//   <!-- pii-ok -->                  — suppress this single line
//   <!-- pii:ignore-block -->        — start a block of suppressed lines
//   <!-- pii:resume -->              — end the block (PII scan resumes)
//
// Block suppression is for legitimate dummy-data sections in test
// cases (curl examples with example tokens, postgres URLs in
// environments docs, etc.). Use sparingly — the validator is meant
// to be loud.
function scanPII(content) {
  const findings = [];
  const lines = content.split('\n');
  let inIgnoreBlock = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('<!-- pii:ignore-block -->')) {
      inIgnoreBlock = true;
      continue;
    }
    if (line.includes('<!-- pii:resume -->')) {
      inIgnoreBlock = false;
      continue;
    }
    if (inIgnoreBlock) continue;
    if (line.includes('<!-- pii-ok -->') || line.includes('pii-ok:')) continue;
    if (PLACEHOLDER_RE.test(line)) continue;
    for (const { name, re } of PII_PATTERNS) {
      if (re.test(line)) {
        findings.push({ line: i + 1, pattern: name, snippet: line.trim().slice(0, 80) });
        break;
      }
    }
  }
  return findings;
}

function validateFrontmatter(relPath, fm) {
  const errs = [];
  if (!fm) {
    errs.push('no frontmatter found (file must start with --- block)');
    return errs;
  }
  const required = ['title', 'type', 'language', 'tags', 'updated'];
  for (const field of required) {
    if (fm[field] == null || fm[field] === '') {
      errs.push(`missing required field: ${field}`);
    }
  }
  if (fm.type && !ALLOWED_TYPES.has(fm.type)) {
    errs.push(`invalid type: ${fm.type} (allowed: ${[...ALLOWED_TYPES].join(', ')})`);
  }
  if (fm.language && fm.language !== 'en') {
    errs.push(`language must be 'en' (got: ${fm.language})`);
  }
  if (fm.updated && !/^\d{4}-\d{2}-\d{2}$/.test(fm.updated)) {
    errs.push(`updated must be YYYY-MM-DD (got: ${fm.updated})`);
  }
  // status field is type-specific; only validate if both present
  if (fm.type && fm.status && STATUS_BY_TYPE[fm.type]) {
    if (!STATUS_BY_TYPE[fm.type].includes(fm.status)) {
      errs.push(`status '${fm.status}' invalid for type '${fm.type}' (allowed: ${STATUS_BY_TYPE[fm.type].join(', ')})`);
    }
  }
  return errs;
}

async function validateFile(relPath, baseDir) {
  const fullPath = path.join(baseDir, relPath);
  let content;
  try {
    content = await fs.readFile(fullPath, 'utf8');
  } catch (err) {
    return { errs: [`cannot read: ${err.message}`], piiFindings: [] };
  }
  const fm = parseFrontmatter(content);
  const errs = validateFrontmatter(relPath, fm);
  const piiFindings = scanPII(content);
  return { errs, piiFindings };
}

async function main() {
  const args = process.argv.slice(2);
  const strictPII = args.includes('--strict-pii');
  const target = args.find((a) => !a.startsWith('--'));

  let files;
  if (target) {
    const rel = path.isAbsolute(target)
      ? path.relative(REPO_ROOT, target)
      : target;
    files = [rel];
  } else {
    files = await walkMdFiles(REPO_ROOT);
  }

  let totalErrs = 0;
  let totalPII = 0;
  for (const rel of files) {
    const { errs, piiFindings } = await validateFile(rel, REPO_ROOT);
    if (errs.length) {
      process.stderr.write(`\n✗ ${rel}\n`);
      for (const e of errs) {
        process.stderr.write(`  - ${e}\n`);
      }
      totalErrs += errs.length;
    }
    if (piiFindings.length) {
      process.stderr.write(`\n⚠ ${rel} — possible PII / secrets:\n`);
      for (const f of piiFindings) {
        process.stderr.write(`  - line ${f.line} [${f.pattern}]: ${f.snippet}\n`);
      }
      totalPII += piiFindings.length;
    }
  }

  if (totalErrs > 0) {
    process.stderr.write(`\n${totalErrs} schema violation(s) across ${files.length} file(s).\n`);
    if (totalPII > 0) {
      process.stderr.write(`Plus ${totalPII} possible PII/secret finding(s).\n`);
    }
    process.exit(1);
  }
  if (totalPII > 0) {
    process.stderr.write(`\n${totalPII} possible PII/secret finding(s) across ${files.length} file(s).\n`);
    process.stderr.write('Review each. Add "<!-- pii-ok -->" on the line to suppress a false positive.\n');
    process.stderr.write('Use --strict-pii to fail commit on PII warnings.\n');
    if (strictPII) {
      process.exit(1);
    }
    // Warnings only — exit 0 so the pre-commit hook does not block.
    // The output is still surfaced to the engineer for review.
    return;
  }
  process.stdout.write(`✓ ${files.length} file(s) validated, no issues.\n`);
}

main().catch((err) => {
  process.stderr.write(`validate failed: ${err.message}\n`);
  process.exit(1);
});
