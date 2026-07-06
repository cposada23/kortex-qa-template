# .agents/ — Cross-AI policy zone

This folder declares **multi-AI portability** for the Kortex-QA
brain. The engineer's primary AI surface is **GitHub Copilot**, but
the brain works with Claude Code, Gemini, and Codex too — without
duplicating context across N config files.

## How it works

```
AGENTS.md (canonical, the one file every agent reads)
   ↑
   ├── .github/copilot-instructions.md   ← Copilot reads this; delegates back to AGENTS.md
   ├── CLAUDE.md                          ← Claude Code reads this; delegates back
   ├── GEMINI.md                          ← Gemini reads this; delegates back
   └── (Codex reads AGENTS.md directly)
```

Each per-agent file is a tiny wrapper pointing at `AGENTS.md`. No
symlinks (Windows-first policy — symlinks need `git config
core.symlinks=true` which isn't safe to assume on a client laptop).

## Files in this folder

- **[permissions.yml](permissions.yml)** — declares what each agent
  may write to. Documentation-only today; could be enforced via a
  pre-commit hook in the future (similar to mykortex's
  `validate-agent-permissions.mjs`).
- **`skills/`** — the canonical skill source (see below).
- **README.md** — this file.

## `skills/` — canonical skill source

`.agents/skills/<name>/SKILL.md` is the **single source of truth**
for every workflow skill. The format follows the Agent Skills open
standard:

```yaml
---
name: <skill-name>            # required — must match the folder name
description: <one sentence>   # required — what it does + when to use it
copilot_agent: ask            # optional — Copilot chat mode for the prompt
context_scope: repo           # optional — repo | file (default: repo)
---
```

`context_scope: repo` (the default) makes the generated Copilot
prompt carry a workspace-wide-context preamble; `file` skips it for
skills that operate on the currently open file only.

**The rule:**

1. Edit the canonical `SKILL.md` under `.agents/skills/<name>/`.
2. Run `node scripts/sync-agents.mjs` — it regenerates every
   adapter: `.github/prompts/*.prompt.md` (Copilot),
   `.claude/skills/*/SKILL.md` (Claude Code), the skills-index table
   in `AGENTS.md` (discovery shim for Gemini CLI and any agent
   without SKILL.md support), plus byte-copies of `.mcp.json` into
   `.vscode/mcp.json` and `.cursor/mcp.json`.
3. **Never edit the generated files** — they carry a
   `<!-- ... DO NOT EDIT ... -->` banner, and the pre-commit hook
   runs `node scripts/sync-agents.mjs --check`, which **blocks the
   commit on any drift or orphaned adapter**.

## Adding a new agent

When a new AI surface needs to read the brain:

1. Confirm the agent's convention for the entry-point file
   (`<NAME>.md` at repo root, `.github/<name>-instructions.md`,
   etc.).
2. Create a wrapper file with a single sentence pointing at
   `AGENTS.md`.
3. Add an entry under `agents:` in `permissions.yml` with the
   agent's role (`primary` / `secondary` / `tertiary`) and write
   scope.
4. If the agent has its own credential-deny convention (Gemini uses
   `.aiexclude`; others use frontmatter or settings), wire it.

## Adding agent-specific guidance

Most rules belong in `AGENTS.md` (every agent reads them). But if
a rule applies ONLY to one agent (e.g. "Copilot can use the
`/<name>` prompt invocation"), put it in that agent's wrapper file
(`.github/copilot-instructions.md` for Copilot) under a "Tweaks"
section. Keep the wrapper short — long agent-specific blocks
suggest the rule actually belongs in `AGENTS.md`.

## Why not just one config per agent?

Because the rules drift. If Copilot reads
`.github/copilot-instructions.md`, Claude reads `CLAUDE.md`, and
Gemini reads `GEMINI.md`, the same rule shows up three times. Three
copies drift. The engineer finds out by watching one agent break
something the others wouldn't.

The fix: one canonical file (`AGENTS.md`), N wrappers that delegate.
Same rule, one place to update.

## Related

- [../AGENTS.md](../AGENTS.md) — the canonical brain context.
- [../.github/copilot-instructions.md](../.github/copilot-instructions.md) — Copilot's entry wrapper (primary surface).
- [../CLAUDE.md](../CLAUDE.md), [../GEMINI.md](../GEMINI.md) — other wrappers.
- [../.aiexclude](../.aiexclude) — Gemini's credential deny list.
