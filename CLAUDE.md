@AGENTS.md

The line above is a Claude Code import: it inlines AGENTS.md — the canonical
agent context — into this file at load time, so Claude reads the same rules
as every other agent. Skills live in `.claude/skills/` but are GENERATED
adapters — edit the canonical `.agents/skills/<name>/SKILL.md` instead and
run `node scripts/sync-agents.mjs` (the pre-commit hook enforces this).
