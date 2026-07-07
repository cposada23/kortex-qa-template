@AGENTS.md

The line above is a Claude Code import: it inlines AGENTS.md — the canonical
agent context — into this file at load time, so Claude reads the same rules
as every other agent. Skills live in `.claude/skills/` but are GENERATED
adapters — edit the canonical `.agents/skills/<name>/SKILL.md` instead and
run `node scripts/sync-agents.mjs` (the pre-commit hook enforces this).

## Model & quota policy (Claude Code only)

The corporate subscription is rate-limited. Make it last:

- **Session default: `sonnet`.** Switch with `/model`. Use `opusplan`
  (Opus plans, Sonnet executes) for heavy design days; plain `opus`
  only for genuinely hard analysis (root-cause, tricky test design).
  Switch back to `sonnet` when the hard part is done. Do not rely on
  Fable — not available on subscription plans (metered credits only
  since 2026-07-08).
- **Match the model to the skill**: mechanical work (session-note,
  session-start/end, handoffs, intakes, bug formatting) is fine on
  `sonnet`; analysis skills (ac-auditor, story-analyzer,
  test-case-design, test-case-reviewer, sut-map, week-one) are where
  a stronger model earns its cost.
- **Check org restrictions on day 1**: run `/model` and `/status` —
  Enterprise admins can restrict available models and effort levels.
- **Context economy**: prefer `resume-from-handoff` over replaying
  history; `/clear` between unrelated tasks; `/compact` before long
  sessions fill the window; don't re-paste large logs the chat
  already holds; let skills read only the files they list.
- **Quota exhausted?** Use the `external-consult` skill to hand a
  sanitized, self-contained prompt to another AI surface and bring
  the answer back. **Never paste alias-maps or raw session file text
  into external AIs — only the sanitized prompt block the skill
  outputs.**
- Note: skill frontmatter supports a `model:` pin (propagated by
  `sync-agents.mjs`), but pins only take effect with `context: fork`
  (skill runs as a subagent without chat history). Verified
  empirically 2026-07-07. Policy decision: no pins — model choice is
  manual via `/model`.
