#!/usr/bin/env node
// doctor.mjs — day-1 preflight for a fresh (usually corporate) machine.
//
// Prints a table of environment checks and ALWAYS exits 0, except when
// Node is older than 18 (the scripts themselves need modern Node).
// The goal is diagnosis before installation pain: corporate proxies
// with TLS interception are the single most likely day-1 blocker, so
// the network checks classify that case explicitly.
//
// Usage:
//   node scripts/doctor.mjs            # full check (incl. network probes)
//   node scripts/doctor.mjs --no-net   # skip network probes (tests/offline)

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commandExists, zipCapability } from './lib/platform.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const OK = '✓';
const WARN = '⚠';
const INFO = '·';

const rows = [];
function report(status, name, detail) {
  rows.push([status, name, detail]);
}

// ---- (a) Node version ----
function checkNode() {
  const major = Number(process.versions.node.split('.')[0]);
  if (major >= 20) {
    report(OK, 'node', `v${process.versions.node}`);
  } else if (major >= 18) {
    report(WARN, 'node', `v${process.versions.node} — works, but Playwright 1.61 deprecated Node 18; install Node 20+`);
  } else {
    report(WARN, 'node', `v${process.versions.node} — TOO OLD. The brain scripts need Node 18+, the automation stack Node 20+.`);
    return false;
  }
  return true;
}

// ---- (f)/(g) network probes ----
const TLS_INTERCEPT_CODES = new Set([
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'CERT_HAS_EXPIRED',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
]);

async function probe(url, timeoutMs = 4000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetch(url, { method: 'HEAD', signal: controller.signal });
    return { ok: true };
  } catch (err) {
    const code = err?.cause?.code ?? err?.code ?? (err.name === 'AbortError' ? 'TIMEOUT' : 'UNKNOWN');
    return { ok: false, code };
  } finally {
    clearTimeout(timer);
  }
}

async function checkNetwork() {
  const targets = ['https://registry.npmjs.org', 'https://playwright.dev'];
  const results = await Promise.all(targets.map((t) => probe(t)));
  const failures = results
    .map((r, i) => ({ ...r, url: targets[i] }))
    .filter((r) => !r.ok);

  if (failures.length === 0) {
    report(OK, 'network', 'registry.npmjs.org + playwright.dev reachable');
    return;
  }
  const tlsHit = failures.find((f) => TLS_INTERCEPT_CODES.has(f.code));
  if (tlsHit) {
    report(WARN, 'network', `TLS error ${tlsHit.code} reaching ${tlsHit.url} — LIKELY CORPORATE PROXY WITH TLS INTERCEPTION (Zscaler/Netskope). Before installing anything: export NODE_EXTRA_CA_CERTS=<corporate-root-ca.pem> and/or configure HTTP(S)_PROXY. Ask IT for the root CA bundle.`);
  } else {
    report(WARN, 'network', `no internet access (${failures.map((f) => `${f.url}: ${f.code}`).join('; ')}). The editor agent + AGENTS.md keep working offline; MCP servers, npx and Playwright browser-install do NOT until network is resolved with IT.`);
  }
}

function checkProxyEnv() {
  const vars = ['HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY', 'http_proxy', 'https_proxy', 'no_proxy'];
  const set = vars.filter((v) => process.env[v]);
  if (set.length === 0) {
    report(INFO, 'proxy env', 'no proxy variables set');
  } else {
    report(INFO, 'proxy env', set.map((v) => `${v}=${process.env[v]}`).join(' '));
  }
}

// ---- (d) agent surfaces ----
const AGENT_BINARIES = [
  ['claude', 'Claude Code CLI'],
  ['cursor', 'Cursor'],
  ['gemini', 'Gemini CLI'],
  ['code', 'VS Code (Copilot host)'],
  ['codex', 'Codex CLI'],
];

async function dirExists(rel) {
  try {
    const st = await fs.stat(path.join(REPO_ROOT, rel));
    return st.isDirectory();
  } catch {
    return false;
  }
}

async function checkAgentSurfaces() {
  const found = AGENT_BINARIES.filter(([bin]) => commandExists(bin));
  for (const [bin, label] of AGENT_BINARIES) {
    const has = found.some(([b]) => b === bin);
    report(has ? OK : INFO, `agent: ${bin}`, has ? `${label} on PATH` : `${label} not found`);
  }
  const dirs = ['.github/prompts', '.claude/skills', '.agents/skills'];
  for (const d of dirs) {
    report((await dirExists(d)) ? OK : WARN, `dir: ${d}`, (await dirExists(d)) ? 'present' : 'missing — run node scripts/sync-agents.mjs');
  }
  return found.map(([bin]) => bin);
}

// ---- (e) brain.config.json ----
async function checkBrainConfig() {
  const p = path.join(REPO_ROOT, 'brain.config.json');
  let raw;
  try {
    raw = await fs.readFile(p, 'utf8');
  } catch {
    report(WARN, 'brain.config.json', 'missing — run node scripts/init.mjs <client>');
    return;
  }
  try {
    const cfg = JSON.parse(raw);
    const tbd = ['tms', 'tracker', 'ci'].filter((k) => cfg[k] === 'tbd');
    if (tbd.length === 0) {
      report(OK, 'brain.config.json', `client=${cfg.client} tms=${cfg.tms} tracker=${cfg.tracker} ci=${cfg.ci}`);
    } else {
      report(INFO, 'brain.config.json', `client=${cfg.client}; still tbd: ${tbd.join(', ')} (fill during week-one day 2)`);
    }
  } catch (err) {
    report(WARN, 'brain.config.json', `unparseable JSON: ${err.message}`);
  }
}

function suggestSurface(agentBins) {
  if (agentBins.includes('code')) return 'Copilot (VS Code detected)';
  if (agentBins.includes('claude')) return 'Claude Code';
  if (agentBins.includes('cursor')) return 'Cursor';
  if (agentBins.includes('codex')) return 'Codex CLI';
  if (agentBins.includes('gemini')) return 'Gemini CLI (skills via the AGENTS.md index)';
  return 'any editor + AGENTS.md (no agent CLI detected — the brain still works: open AGENTS.md, follow the Skills index by hand)';
}

async function main() {
  const noNet = process.argv.includes('--no-net');
  process.stdout.write('Kortex-QA doctor — day-1 preflight\n');
  process.stdout.write('==================================\n\n');

  const nodeOk = checkNode();

  report(commandExists('git') ? OK : WARN, 'git',
    commandExists('git') ? 'on PATH' : 'NOT FOUND — install git before anything else (required by session workflow)');

  const zip = zipCapability();
  report(zip.ok ? OK : WARN, 'zip capability',
    zip.ok ? `via ${zip.via}` : 'no zip/tar/PowerShell found — snapshot.mjs cannot produce backups');

  // (h) package managers
  report(commandExists('npm') ? OK : WARN, 'npm', commandExists('npm') ? 'on PATH' : 'not found — comes with Node; check the Node install');
  report(commandExists('pnpm') ? OK : WARN, 'pnpm',
    commandExists('pnpm') ? 'on PATH' : 'not found — needed by kortex-test framework. Install: npm install -g pnpm (or corepack enable)');

  const agentBins = await checkAgentSurfaces();
  await checkBrainConfig();

  if (noNet) {
    report(INFO, 'network', 'skipped (--no-net)');
  } else {
    await checkNetwork();
  }
  checkProxyEnv();

  // Render
  process.stdout.write('\n');
  for (const [status, name, detail] of rows) {
    process.stdout.write(`  ${status} ${name.padEnd(22)} ${detail}\n`);
  }
  process.stdout.write(`\nSuggested surface: ${suggestSurface(agentBins)}\n`);

  if (!nodeOk) process.exit(1);
}

main().catch((err) => {
  process.stderr.write(`doctor failed: ${err.message}\n`);
  process.exit(1);
});
