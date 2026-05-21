#!/usr/bin/env node
// new-test-case.mjs — scaffold a library test case under
// test-cases/library/<area>/.
//
// Assigns the next free TC-<AREA>-<NNN> ID by scanning existing
// files in the area. Creates the file from templates/test-case-library.md
// with substitutions. Auto-refreshes test-cases/INDEX.md.
//
// Usage:
//   node scripts/new-test-case.mjs <area> <slug>
//   node scripts/new-test-case.mjs auth login-locked-account

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function usage() {
  process.stderr.write('Usage: node scripts/new-test-case.mjs <area> <slug>\n');
  process.stderr.write('Example: node scripts/new-test-case.mjs auth login-locked-account\n');
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function substitute(content, vars) {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (vars[key] == null) return `{{${key}}}`;
    return vars[key];
  });
}

async function nextId(areaDir, areaUpper) {
  let maxN = 0;
  try {
    const entries = await fs.readdir(areaDir);
    for (const name of entries) {
      const m = name.match(new RegExp(`^tc-${areaUpper.toLowerCase()}-(\\d{3})-`));
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > maxN) maxN = n;
      }
    }
  } catch {
    // Dir doesn't exist yet
  }
  return String(maxN + 1).padStart(3, '0');
}

async function main() {
  const [area, slug] = process.argv.slice(2);
  if (!area || !slug) {
    usage();
    process.exit(1);
  }
  if (!/^[a-z][a-z0-9-]*$/.test(area)) {
    process.stderr.write(`error: area must be kebab-case lowercase (got: ${area})\n`);
    process.exit(1);
  }
  if (!/^[a-z][a-z0-9-]+$/.test(slug)) {
    process.stderr.write(`error: slug must be kebab-case lowercase (got: ${slug})\n`);
    process.exit(1);
  }

  const areaDir = path.join(REPO_ROOT, 'test-cases', 'library', area);
  await fs.mkdir(areaDir, { recursive: true });

  const areaUpper = area.toUpperCase();
  const seq = await nextId(areaDir, areaUpper);
  const id = `TC-${areaUpper}-${seq}`;
  const filename = `tc-${area}-${seq}-${slug}.md`;
  const filePath = path.join(areaDir, filename);

  try {
    await fs.access(filePath);
    process.stderr.write(`error: file already exists: test-cases/library/${area}/${filename}\n`);
    process.exit(1);
  } catch {
    // Expected
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'test-case-library.md');
  let content;
  try {
    content = await fs.readFile(templatePath, 'utf8');
  } catch (err) {
    process.stderr.write(`error: missing template test-case-library.md: ${err.message}\n`);
    process.exit(1);
  }

  const vars = {
    ID: id,
    AREA: area,
    AREA_UPPER: areaUpper,
    SLUG: slug,
    UPDATED: todayISO(),
    TITLE: `${id} — <one-line scenario summary>`,
  };
  content = substitute(content, vars);
  await fs.writeFile(filePath, content);

  process.stdout.write(`✓ Created test-cases/library/${area}/${filename}\n`);
  process.stdout.write(`  ID: ${id}\n`);

  const buildIdx = spawnSync('node', ['scripts/build-index.mjs', 'test-cases'], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
  if (buildIdx.status !== 0) {
    process.stderr.write('warning: build-index returned non-zero. Run manually if needed.\n');
  }

  process.stdout.write(`\nNext step: open the file and fill in the test case body.\n`);
}

main().catch((err) => {
  process.stderr.write(`new-test-case failed: ${err.message}\n`);
  process.exit(1);
});
