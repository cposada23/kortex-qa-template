#!/usr/bin/env node
// sync-agents.mjs — generate per-agent adapters from canonical skills.
//
// Canonical source: .agents/skills/<name>/SKILL.md (Agent Skills open
// standard). This script emits:
//   - .github/prompts/<name>.prompt.md   (GitHub Copilot)
//   - .claude/skills/<name>/SKILL.md     (Claude Code)
//   - skills-index table in AGENTS.md    (discovery shim for Gemini
//     CLI and any agent without SKILL.md support)
//   - .vscode/mcp.json + .cursor/mcp.json (byte copies of .mcp.json)
//
// Never edit the generated files — they carry a DO NOT EDIT banner and
// this script (or the pre-commit hook) will regenerate them.
//
// Usage:
//   node scripts/sync-agents.mjs            # write adapters
//   node scripts/sync-agents.mjs --check    # exit 1 on drift/orphans

import { promises as fs } from 'node:fs';
import { realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const INDEX_START = '<!-- skills-index:start -->';
const INDEX_END = '<!-- skills-index:end -->';

// Model pins for Claude Code adapters. Downgrade-only policy: pin
// cheap/mechanical skills to a smaller model; analysis skills carry
// no pin and inherit the session model. Copilot/Gemini adapters
// ignore this field (no native support). Validation throws at sync
// time (template dev time, not client runtime) to catch typos early.
export const ALLOWED_MODELS = new Set(['haiku', 'sonnet', 'opus', 'opusplan']);

// Injected into Copilot prompts for context_scope: repo skills (the
// default). Counters Copilot's tendency to answer from the currently
// open file without reading the workspace.
export const CONTEXT_PREAMBLE =
  '> Context: this workflow needs WORKSPACE-WIDE context. Before acting, read AGENTS.md and every file this workflow references — do not answer from the currently open file alone.';

function banner(name) {
  return `<!-- generated from .agents/skills/${name}/SKILL.md — DO NOT EDIT. Run: node scripts/sync-agents.mjs -->`;
}

// Minimal YAML frontmatter parser: scalar `key: value` lines only,
// which is all the canonical skill frontmatter uses. Strips one layer
// of matching quotes from values.
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { fields: null, body: content };
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith("'") && value.endsWith("'") && value.length >= 2) ||
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2)
    ) {
      value = value.slice(1, -1);
    }
    fields[m[1]] = value;
  }
  const body = content.slice(match[0].length);
  return { fields, body };
}

// Re-quote a description for YAML output: single-quote when it
// contains a colon (js-yaml parses unquoted colons as key separators).
function yamlValue(value) {
  if (/[:#]/.test(value)) return `'${value.replace(/'/g, "''")}'`;
  return value;
}

function normalizeEol(s) {
  return s.replace(/\r\n/g, '\n');
}

async function readSkills(root) {
  const skillsDir = path.join(root, '.agents', 'skills');
  let entries;
  try {
    entries = await fs.readdir(skillsDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const skills = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const skillPath = path.join(skillsDir, entry.name, 'SKILL.md');
    let raw;
    try {
      raw = await fs.readFile(skillPath, 'utf8');
    } catch {
      continue; // dir without SKILL.md — not a skill
    }
    const { fields, body } = parseFrontmatter(raw);
    if (!fields || !fields.name) {
      throw new Error(`${path.relative(root, skillPath)}: missing frontmatter or name field`);
    }
    if (fields.name !== entry.name) {
      throw new Error(
        `${path.relative(root, skillPath)}: name '${fields.name}' does not match directory '${entry.name}'`
      );
    }
    if (!fields.description) {
      throw new Error(`${path.relative(root, skillPath)}: missing description field`);
    }
    if (fields.model && !ALLOWED_MODELS.has(fields.model)) {
      throw new Error(
        `${path.relative(root, skillPath)}: model '${fields.model}' not one of ${[...ALLOWED_MODELS].join('|')}`
      );
    }
    skills.push({
      name: fields.name,
      description: fields.description,
      copilotAgent: fields.copilot_agent === 'ask' ? 'ask' : 'agent',
      contextScope: fields.context_scope === 'file' ? 'file' : 'repo',
      model: fields.model || null,
      body: normalizeEol(body),
    });
  }
  skills.sort((a, b) => a.name.localeCompare(b.name));
  return skills;
}

function renderCopilotPrompt(skill) {
  const fm = `---\nagent: ${skill.copilotAgent}\ndescription: ${yamlValue(skill.description)}\n---\n`;
  const preamble = skill.contextScope === 'repo' ? `${CONTEXT_PREAMBLE}\n\n` : '';
  return `${fm}${banner(skill.name)}\n\n${preamble}${skill.body.replace(/^\n+/, '')}`;
}

function renderClaudeSkill(skill) {
  const modelLine = skill.model ? `model: ${skill.model}\n` : '';
  const fm = `---\nname: ${skill.name}\ndescription: ${yamlValue(skill.description)}\n${modelLine}---\n`;
  return `${fm}${banner(skill.name)}\n\n${skill.body.replace(/^\n+/, '')}`;
}

function renderSkillsIndex(skills) {
  const rows = skills.map(
    (s) => `| ${s.name} | ${s.description} | \`.agents/skills/${s.name}/SKILL.md\` |`
  );
  return [
    INDEX_START,
    '| Skill | When | Canonical |',
    '|---|---|---|',
    ...rows,
    INDEX_END,
  ].join('\n');
}

function injectSkillsIndex(agentsMd, skills) {
  const start = agentsMd.indexOf(INDEX_START);
  const end = agentsMd.indexOf(INDEX_END);
  if (start === -1 || end === -1 || end < start) return null;
  return (
    agentsMd.slice(0, start) + renderSkillsIndex(skills) + agentsMd.slice(end + INDEX_END.length)
  );
}

async function readIfExists(p) {
  try {
    return await fs.readFile(p, 'utf8');
  } catch {
    return null;
  }
}

async function listAdapterNames(root) {
  const names = new Set();
  try {
    for (const f of await fs.readdir(path.join(root, '.github', 'prompts'))) {
      if (f.endsWith('.prompt.md')) names.add(f.slice(0, -'.prompt.md'.length));
    }
  } catch { /* no prompts dir */ }
  try {
    const dir = path.join(root, '.claude', 'skills');
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) names.add(entry.name);
    }
  } catch { /* no claude skills dir */ }
  return names;
}

/**
 * Sync all adapters from canonical skills.
 * @param {string} root repo root
 * @param {{check?: boolean}} opts
 * @returns {{written: string[], drift: string[], orphans: string[], skipped: string[]}}
 */
export async function syncAgents(root = REPO_ROOT, opts = {}) {
  const check = Boolean(opts.check);
  const written = [];
  const drift = [];
  const orphans = [];
  const skipped = [];

  const skills = await readSkills(root);
  const canonicalNames = new Set(skills.map((s) => s.name));

  // Expected file → content map (paths relative to root).
  const expected = new Map();
  for (const skill of skills) {
    expected.set(
      path.join('.github', 'prompts', `${skill.name}.prompt.md`),
      renderCopilotPrompt(skill)
    );
    expected.set(
      path.join('.claude', 'skills', skill.name, 'SKILL.md'),
      renderClaudeSkill(skill)
    );
  }

  // mcp.json copies — byte-identical to root .mcp.json when it exists.
  const mcpSource = await readIfExists(path.join(root, '.mcp.json'));
  if (mcpSource === null) {
    skipped.push('.mcp.json not found — skipping .vscode/mcp.json and .cursor/mcp.json copies');
  } else {
    expected.set(path.join('.vscode', 'mcp.json'), mcpSource);
    expected.set(path.join('.cursor', 'mcp.json'), mcpSource);
  }

  for (const [relPath, content] of expected) {
    const absPath = path.join(root, relPath);
    const current = await readIfExists(absPath);
    const same = current !== null && normalizeEol(current) === normalizeEol(content);
    if (same) continue;
    if (check) {
      drift.push(`${relPath}: ${current === null ? 'missing' : 'differs from canonical'}`);
    } else {
      await fs.mkdir(path.dirname(absPath), { recursive: true });
      await fs.writeFile(absPath, content);
      written.push(relPath);
    }
  }

  // skills-index in AGENTS.md
  const agentsPath = path.join(root, 'AGENTS.md');
  const agentsMd = await readIfExists(agentsPath);
  if (agentsMd === null) {
    skipped.push('AGENTS.md not found — skipping skills-index injection');
  } else {
    const updated = injectSkillsIndex(agentsMd, skills);
    if (updated === null) {
      skipped.push(
        `AGENTS.md has no ${INDEX_START} / ${INDEX_END} markers — skipping skills-index injection`
      );
    } else if (normalizeEol(updated) !== normalizeEol(agentsMd)) {
      if (check) {
        drift.push('AGENTS.md: skills-index block out of date');
      } else {
        await fs.writeFile(agentsPath, updated);
        written.push('AGENTS.md');
      }
    }
  }

  // Orphans: adapters whose canonical skill no longer exists. Reported
  // in both modes; never auto-deleted (cleanup is a human decision).
  for (const name of await listAdapterNames(root)) {
    if (!canonicalNames.has(name)) {
      orphans.push(`adapter '${name}' has no canonical .agents/skills/${name}/SKILL.md`);
    }
  }

  return { written, drift, orphans, skipped };
}

function isMain() {
  if (!process.argv[1]) return false;
  return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
}

async function main() {
  const check = process.argv.includes('--check');
  const res = await syncAgents(REPO_ROOT, { check });

  for (const note of res.skipped) process.stdout.write(`· ${note}\n`);

  if (check) {
    for (const d of res.drift) process.stdout.write(`✗ drift: ${d}\n`);
    for (const o of res.orphans) process.stdout.write(`✗ orphan: ${o}\n`);
    if (res.drift.length || res.orphans.length) {
      process.stderr.write(
        `sync-agents --check failed: ${res.drift.length} drift, ${res.orphans.length} orphan(s). Run \`node scripts/sync-agents.mjs\` (and delete orphans by hand).\n`
      );
      process.exit(1);
    }
    process.stdout.write('✓ agents in sync (no drift, no orphans)\n');
    return;
  }

  for (const w of res.written) process.stdout.write(`✓ wrote ${w}\n`);
  if (res.orphans.length) {
    for (const o of res.orphans) process.stdout.write(`⚠ orphan: ${o}\n`);
    process.stdout.write('  (orphans are never auto-deleted — remove them by hand if intended)\n');
  }
  process.stdout.write(
    res.written.length ? `✓ sync-agents: ${res.written.length} file(s) updated\n` : '✓ sync-agents: everything up to date\n'
  );
}

if (isMain()) {
  main().catch((err) => {
    process.stderr.write(`sync-agents failed: ${err.message}\n`);
    process.exit(1);
  });
}
