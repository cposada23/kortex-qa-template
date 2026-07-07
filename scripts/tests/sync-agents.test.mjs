#!/usr/bin/env node
// sync-agents.test.mjs — verify the cross-agent adapter generator.
//
// Covers: Copilot prompt generation (banner + frontmatter + context
// preamble), Claude skill generation, copilot_agent: ask passthrough,
// context_scope: file opt-out, --check drift + orphan detection,
// idempotency, CRLF tolerance, and mcp.json copies.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { syncAgents, CONTEXT_PREAMBLE } =
  await import(path.join(__dirname, '..', 'sync-agents.mjs'));

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

const ALPHA_BODY = `# alpha

Run \`node scripts/validate.mjs\` before anything else.

## Steps

1. Do the thing.
2. Do the other thing.
`;

const BETA_BODY = `# beta

Answer questions about the currently open file only.
`;

async function buildFixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'sync-agents-'));

  // alpha: defaults (copilot_agent: agent, context_scope: repo),
  // description contains a colon → single-quoted.
  await fs.mkdir(path.join(root, '.agents', 'skills', 'alpha'), { recursive: true });
  await fs.writeFile(
    path.join(root, '.agents', 'skills', 'alpha', 'SKILL.md'),
    `---\nname: alpha\ndescription: 'Alpha workflow: scaffold and audit in one go.'\n---\n\n${ALPHA_BODY}`
  );

  // beta: copilot_agent: ask + context_scope: file
  await fs.mkdir(path.join(root, '.agents', 'skills', 'beta'), { recursive: true });
  await fs.writeFile(
    path.join(root, '.agents', 'skills', 'beta', 'SKILL.md'),
    `---\nname: beta\ndescription: Review the open file for issues.\ncopilot_agent: ask\ncontext_scope: file\n---\n\n${BETA_BODY}`
  );

  // gamma: model pin — must reach the Claude adapter only.
  await fs.mkdir(path.join(root, '.agents', 'skills', 'gamma'), { recursive: true });
  await fs.writeFile(
    path.join(root, '.agents', 'skills', 'gamma', 'SKILL.md'),
    `---\nname: gamma\ndescription: Append a quick note.\nmodel: haiku\n---\n\n# gamma\n\nAppend the note.\n`
  );

  // AGENTS.md with skills-index markers
  await fs.writeFile(
    path.join(root, 'AGENTS.md'),
    `# Test brain\n\nIntro prose.\n\n## Skills index\n\n<!-- skills-index:start -->\n<!-- skills-index:end -->\n\nOutro prose.\n`
  );

  return root;
}

async function main() {
  process.stdout.write('sync-agents.test.mjs\n');
  process.stdout.write('====================\n\n');

  // ---- write mode ----
  {
    const root = await buildFixture();
    const res = await syncAgents(root);

    // (a) Copilot prompt: banner + frontmatter agent: agent
    const alphaPrompt = await fs.readFile(
      path.join(root, '.github', 'prompts', 'alpha.prompt.md'), 'utf8');
    assert(alphaPrompt.includes('agent: agent'), '(a) alpha prompt has agent: agent frontmatter');
    assert(alphaPrompt.includes("description: 'Alpha workflow: scaffold and audit in one go.'"),
      '(a) alpha prompt carries the description');
    assert(alphaPrompt.includes('generated from .agents/skills/alpha/SKILL.md — DO NOT EDIT'),
      '(a) alpha prompt has the DO NOT EDIT banner');
    const fmEnd = alphaPrompt.indexOf('---', 4);
    const bodyStart = alphaPrompt.slice(fmEnd);
    assert(bodyStart.indexOf('generated from') < bodyStart.indexOf('# alpha'),
      '(a) banner is the first body line, before the canonical content');
    assert(alphaPrompt.includes('## Steps') && alphaPrompt.includes('2. Do the other thing.'),
      '(a) canonical body copied intact');

    // (h) context preamble: alpha (repo default) has it, beta (file) does not
    assert(alphaPrompt.includes(CONTEXT_PREAMBLE),
      '(h) context_scope repo (default) → prompt starts with context preamble');
    const betaPrompt = await fs.readFile(
      path.join(root, '.github', 'prompts', 'beta.prompt.md'), 'utf8');
    assert(!betaPrompt.includes(CONTEXT_PREAMBLE),
      '(h) context_scope: file → no context preamble');

    // (b) copilot_agent: ask respected
    assert(betaPrompt.includes('agent: ask'), '(b) beta prompt has agent: ask');

    // (c) Claude skill: only name + description in frontmatter
    const alphaClaude = await fs.readFile(
      path.join(root, '.claude', 'skills', 'alpha', 'SKILL.md'), 'utf8');
    assert(alphaClaude.includes('name: alpha'), '(c) claude skill has name');
    assert(alphaClaude.includes('description:'), '(c) claude skill has description');
    assert(!alphaClaude.includes('copilot_agent') && !alphaClaude.includes('context_scope'),
      '(c) claude skill drops copilot_agent/context_scope');
    assert(alphaClaude.includes('DO NOT EDIT'), '(c) claude skill has banner');
    assert(alphaClaude.includes('## Steps'), '(c) claude skill body intact');

    // skills-index injected into AGENTS.md
    const agentsMd = await fs.readFile(path.join(root, 'AGENTS.md'), 'utf8');
    assert(agentsMd.includes('| alpha |') && agentsMd.includes('| beta |'),
      'AGENTS.md skills-index has one row per skill');
    assert(agentsMd.includes('.agents/skills/alpha/SKILL.md'),
      'AGENTS.md skills-index rows point at canonical paths');
    assert(agentsMd.includes('Intro prose.') && agentsMd.includes('Outro prose.'),
      'AGENTS.md content outside markers untouched');

    // (g) model pin: Claude adapter carries it; Copilot prompt does not
    const gammaClaude = await fs.readFile(
      path.join(root, '.claude', 'skills', 'gamma', 'SKILL.md'), 'utf8');
    assert(gammaClaude.includes('\nmodel: haiku\n'), '(g) claude skill carries model pin');
    const gammaPrompt = await fs.readFile(
      path.join(root, '.github', 'prompts', 'gamma.prompt.md'), 'utf8');
    assert(!gammaPrompt.includes('model:'), '(g) copilot prompt has NO model field');
    assert(!alphaClaude.includes('model:'), '(g) skill without model pin emits no model line');

    // (g) unknown model value must throw
    await fs.writeFile(
      path.join(root, '.agents', 'skills', 'gamma', 'SKILL.md'),
      `---\nname: gamma\ndescription: Append a quick note.\nmodel: gpt-9\n---\n\n# gamma\n`
    );
    let threw = false;
    try { await syncAgents(root); } catch { threw = true; }
    assert(threw, '(g) unknown model value throws');
    // restore valid gamma so later sections stay green
    await fs.writeFile(
      path.join(root, '.agents', 'skills', 'gamma', 'SKILL.md'),
      `---\nname: gamma\ndescription: Append a quick note.\nmodel: haiku\n---\n\n# gamma\n\nAppend the note.\n`
    );
    await syncAgents(root);

    // .mcp.json absent → skipped without throwing
    assert(res.skipped.some((s) => s.includes('.mcp.json')),
      'missing .mcp.json → skip note, no throw');

    // (f) idempotency: second write run reports zero changes
    const res2 = await syncAgents(root);
    assert(res2.written.length === 0, '(f) second run writes nothing');

    // check mode on a clean tree → no drift, no orphans
    const chk = await syncAgents(root, { check: true });
    assert(chk.drift.length === 0 && chk.orphans.length === 0,
      'check on clean tree → no drift, no orphans');

    // (d) hand-edit an adapter → check reports drift
    await fs.appendFile(
      path.join(root, '.github', 'prompts', 'alpha.prompt.md'), '\nrogue edit\n');
    const chkDrift = await syncAgents(root, { check: true });
    assert(chkDrift.drift.some((d) => d.includes('alpha.prompt.md')),
      '(d) hand-edited adapter → drift detected');

    // (e) orphan adapter (no canonical) → check reports orphan
    await syncAgents(root); // heal drift first
    await fs.mkdir(path.join(root, '.claude', 'skills', 'ghost'), { recursive: true });
    await fs.writeFile(
      path.join(root, '.claude', 'skills', 'ghost', 'SKILL.md'),
      '---\nname: ghost\n---\n\n# ghost\n');
    await fs.writeFile(
      path.join(root, '.github', 'prompts', 'ghost.prompt.md'),
      '---\nagent: agent\n---\n\n# ghost\n');
    const chkOrphan = await syncAgents(root, { check: true });
    assert(chkOrphan.orphans.some((o) => o.includes('ghost')),
      '(e) adapter without canonical → orphan detected');
  }

  // ---- (g) CRLF tolerance ----
  {
    const root = await buildFixture();
    await syncAgents(root);
    // Rewrite the canonical with CRLF line endings — same content.
    const canonPath = path.join(root, '.agents', 'skills', 'alpha', 'SKILL.md');
    const canon = await fs.readFile(canonPath, 'utf8');
    await fs.writeFile(canonPath, canon.replace(/\n/g, '\r\n'));
    const chk = await syncAgents(root, { check: true });
    assert(chk.drift.length === 0,
      '(g) CRLF canonical vs LF adapters → no false drift');
  }

  // ---- mcp.json copies (Task 1.5) ----
  {
    const root = await buildFixture();
    await fs.writeFile(
      path.join(root, '.mcp.json'),
      '{\n  "mcpServers": {\n    "playwright": { "command": "npx", "args": ["-y", "@playwright/mcp@latest"] }\n  }\n}\n');
    await syncAgents(root);
    const src = await fs.readFile(path.join(root, '.mcp.json'), 'utf8');
    const vscode = await fs.readFile(path.join(root, '.vscode', 'mcp.json'), 'utf8');
    const cursor = await fs.readFile(path.join(root, '.cursor', 'mcp.json'), 'utf8');
    assert(vscode === src, '.vscode/mcp.json is byte-identical to .mcp.json');
    assert(cursor === src, '.cursor/mcp.json is byte-identical to .mcp.json');

    // drift in a copy is caught by --check
    await fs.writeFile(path.join(root, '.vscode', 'mcp.json'), '{}\n');
    const chk = await syncAgents(root, { check: true });
    assert(chk.drift.some((d) => d.includes('.vscode')),
      'edited .vscode/mcp.json copy → drift detected');
  }

  process.stdout.write(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
  process.stdout.write('✓ all sync-agents tests passed\n');
}

main().catch((err) => {
  process.stderr.write(`sync-agents.test.mjs crashed: ${err.stack}\n`);
  process.exit(1);
});
