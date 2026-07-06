#!/usr/bin/env node
// install-hooks.mjs — install the Kortex-QA pre-commit hook.
//
// The hook runs validate.mjs + build-index.mjs --check before every
// commit. Without it, schema drift, INDEX drift, or a stray
// credential pasted into a tracked .md file can land in the local
// git history unnoticed (even with no remote, history rewriting is
// the only way out once it's in).
//
// Idempotent. Re-running overwrites if the existing hook is ours
// (detected via signature comment); refuses if the hook is
// user-authored (won't clobber custom logic).
//
// Cross-platform: writes a `#!/bin/sh` script. On Windows, Git for
// Windows ships with MINGW sh; on macOS / Linux, /bin/sh is native.
//
// Usage:
//   node scripts/install-hooks.mjs

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const HOOK_SIGNATURE = '# Kortex-QA pre-commit hook — installed by scripts/install-hooks.mjs';

const HOOK_CONTENT = `#!/bin/sh
${HOOK_SIGNATURE}
# Do not edit by hand; re-run \`node scripts/install-hooks.mjs\` to refresh.
#
# Cross-platform: on Windows, Git for Windows runs this via MINGW sh.
# On macOS / Linux, /bin/sh runs it natively.
#
# Bypass with \`git commit --no-verify\` (use sparingly — that's how
# bad data gets in).

set -e

echo "→ Running Kortex-QA pre-commit checks..."

# 1. Frontmatter validation
#    Blocks on frontmatter schema errors. Warns on PII heuristics.
node scripts/validate.mjs
echo "  ✓ Frontmatter OK"

# 2. INDEX drift check
#    Blocks if INDEX.md files weren't rebuilt after scaffolding.
node scripts/build-index.mjs --check
echo "  ✓ INDEX up-to-date"

# 3. Link integrity check (v1.6+)
#    Verifies IDs in frontmatter (linked_test_cases, linked_bugs,
#    linked_stories) all resolve to existing files, and that
#    markdown body links targeting teams/ files don't 404.
node scripts/validate-links.mjs
echo "  ✓ Links OK"

# 4. Agent adapter drift check (v2.0+)
#    Blocks if .github/prompts/, .claude/skills/, the AGENTS.md
#    skills-index, or the mcp.json copies drifted from the canonical
#    .agents/skills/ sources.
node scripts/sync-agents.mjs --check
echo "  ✓ Agent adapters in sync"

echo "✓ pre-commit OK"
`;

async function main() {
  const gitDir = path.join(REPO_ROOT, '.git');

  // .git missing: probably pre-init. Silent skip — init.mjs handles
  // bootstrap order, and a user running install-hooks.mjs by hand
  // just needs a clear note.
  let stat;
  try {
    stat = await fs.stat(gitDir);
  } catch {
    process.stdout.write(
      '· No .git/ found — skipping hook install. Run `git init` first, then re-run this script.\n'
    );
    return;
  }
  if (!stat.isDirectory()) {
    // Worktree pointer or submodule .git file — uncommon for this
    // template; surface the case rather than silently fail.
    process.stderr.write(
      '⚠ .git is not a directory (worktree pointer?) — install-hooks.mjs does not support this case yet. Skipping.\n'
    );
    return;
  }

  const hooksDir = path.join(gitDir, 'hooks');
  await fs.mkdir(hooksDir, { recursive: true });

  const hookPath = path.join(hooksDir, 'pre-commit');

  let action = 'created';
  try {
    const existing = await fs.readFile(hookPath, 'utf8');
    if (existing.includes(HOOK_SIGNATURE)) {
      action = 'refreshed';
    } else {
      process.stderr.write(
        `⚠ .git/hooks/pre-commit already exists and is NOT a Kortex-QA hook.\n`
      );
      process.stderr.write(
        `  Leaving it untouched. To install the Kortex-QA hook, either:\n`
      );
      process.stderr.write(
        `    - back up the existing hook and re-run \`node scripts/install-hooks.mjs\`, or\n`
      );
      process.stderr.write(
        `    - append Kortex-QA's two checks (validate.mjs + build-index.mjs --check) to your existing hook by hand.\n`
      );
      process.exit(1);
    }
  } catch {
    // File doesn't exist — fine, create it.
  }

  await fs.writeFile(hookPath, HOOK_CONTENT);
  await fs.chmod(hookPath, 0o755);

  process.stdout.write(
    `✓ pre-commit hook ${action}: ${path.relative(REPO_ROOT, hookPath)}\n`
  );
  process.stdout.write(
    `  Runs on every \`git commit\`: validate.mjs + build-index.mjs --check\n`
  );
  process.stdout.write(
    `  Bypass with \`git commit --no-verify\` (rare — use only when you know exactly why).\n`
  );
}

main().catch((err) => {
  process.stderr.write(`install-hooks failed: ${err.message}\n`);
  process.exit(1);
});
