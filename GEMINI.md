# GEMINI.md

This file is a wrapper. The canonical agent context for this
Kortex-QA brain lives in [AGENTS.md](AGENTS.md) — read it first
before doing anything in this repo.

Why this wrapper exists: Gemini reads `GEMINI.md` by convention,
while Copilot reads `.github/copilot-instructions.md` and other tools
read `AGENTS.md`. To keep one source of truth, all of them delegate
to `AGENTS.md`. We use plain files (not symlinks) because the brain
must work on Windows without `git config core.symlinks=true`.

For Gemini-specific tweaks (if any are ever needed), they would go
below this line as a "Gemini-specific addenda" section. Until then,
this file is purely a pointer.

**Note for Gemini Code Assist users:** the `.aiexclude` file in the
repo root blocks Gemini from reading credential files (`.env`,
`client-secrets/`, snapshot ZIPs, `.cache/`). Full policy:
AGENTS.md §"Hard rules" + `playbooks/compliance-policy.md` §7.

Workflows: read the Skills index in AGENTS.md; load the canonical
SKILL.md it points to before executing that workflow.
