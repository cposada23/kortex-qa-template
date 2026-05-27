# CLAUDE.md

This file is a wrapper. The canonical agent context for this
Kortex-QA brain lives in [AGENTS.md](AGENTS.md) — read it first
before doing anything in this repo.

Why this wrapper exists: Claude Code reads `CLAUDE.md` by convention,
while Copilot reads `.github/copilot-instructions.md` and other tools
read `AGENTS.md`. To keep one source of truth, all of them delegate
to `AGENTS.md`. We use plain files (not symlinks) because the brain
must work on Windows without `git config core.symlinks=true`.

For Claude-specific tweaks (if any are ever needed), they would go
below this line as a "Claude-specific addenda" section. Until then,
this file is purely a pointer.
