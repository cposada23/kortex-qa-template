@AGENTS.md

The line above is a Claude Code import: it inlines AGENTS.md — the canonical
agent context — into this file at load time, so Claude reads the same rules
as every other agent. Skills live in `.claude/skills/` but are GENERATED
adapters — edit the canonical `.agents/skills/<name>/SKILL.md` instead and
run `node scripts/sync-agents.mjs` (the pre-commit hook enforces this).

## Model & quota policy (Claude Code only)

Corporate access is limited — either a rate-limited subscription or
an **API spend cap** (a hard monthly dollar budget; no reset until
next month). Day 1: run `/status` to see which one you have, and
`/model` to see which models the org allows.

**Which model for which work** — the criteria: does the result
persist or leave the repo? does it need inference or just execution?
does getting it wrong cost more than the model? In short: *haiku
executes, sonnet writes, opus thinks.*

| Model | Use for | Never for |
|---|---|---|
| `haiku` | session-note; throwaway questions; run-a-script-and-report; pure formatting of text that stays internal | Anything that persists in the brain or leaves the repo |
| `sonnet` (session default) | session-start, **session-end (always — it writes the day's memory)**, story-intake, chat-handoff, resume-from-handoff, external-consult, bug-report-formatter, retro/sprint intakes, test-case-design, question-generator, automation-sync, week-one | — |
| `opus` (surgical, one task then back) | ac-auditor / story-analyzer on a confusing or high-risk story; root-cause analysis; tricky automation design | Routine rituals, formatting, intakes |

Hard lines: **session-end never below sonnet** (a poor wrap = the
day's memory lost — the exact thing this brain exists to prevent);
**client-facing text (bugs, questions, reviews) never haiku**.
Switch models at TASK boundaries, not per turn — each switch
invalidates the prompt cache and the next turn pays full price.

**If you are on an API spend cap ($X/month):**

- **No warm-up turns.** "Hi, do you understand the project?" pays a
  full context load for zero value. Open with the task itself.
- **Watch `/cost`** at the end of each session for the first days —
  your real per-task cost beats any estimate, and it is your
  evidence when asking the admin for a higher cap.
- Sessions short and focused; `/clear` between tasks; resume via
  `resume-from-handoff` (reads a small file) instead of replaying
  chat. Batch related questions into one turn.
- When the cap runs out: ask the admin for a raise (with `/cost`
  numbers), or use `external-consult` toward an approved surface.
  Do NOT quietly switch to a personal account for client work.
- Auth gotcha: a stray `ANTHROPIC_API_KEY` in your shell silently
  overrides subscription login. `/status` is the source of truth;
  `env | grep ANTHROPIC` if billing looks wrong.
- Do not rely on Fable — not available on subscription plans
  (metered credits only since 2026-07-08), and 3× Opus pricing
  on API.
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
