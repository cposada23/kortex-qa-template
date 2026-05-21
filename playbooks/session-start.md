---
title: "Playbook — Session start"
type: playbook
status: active
language: en
tags: [playbook, ceremony, daily]
updated: 2026-05-20
---

# Playbook — Session start

The morning ritual. Runs in ~3 minutes when the brain is healthy,
~10 minutes when it isn't (most of which is triaging stale items).

## When

First thing after opening VS Code, before checking Jira, Teams, or
email. The point is to enter the day with a clear picture of
where you left off — not to react to whatever just landed in the
inbox.

## Steps

1. **Open the workspace.** `<client-slug>-qa.code-workspace` —
   loads brain + SUT + automation repos.
2. **Invoke `/session-start` in Copilot Chat.** Output is a
   one-screen summary: today's focus, active stories, blockers,
   inbox count, stale items, suggested first action.
3. **Cross-check what Copilot surfaced** against:
   - Jira board — has anyone moved a ticket since last EOD?
   - Teams DMs — overnight messages from devs answering your
     questions?
   - The SUT repo — has anyone merged something that affects a
     story you're testing?
4. **Decide the first 25 minutes** (one pomodoro): pick the
   single highest-leverage task. Often the suggested action from
   `/session-start` is right; sometimes external signals override.
5. **Promote any unprocessed inbox items** that are urgent. The
   rest wait until `/session-end`.

## What to do if `/session-start` flags stale items

A story `in-progress` with no JOURNAL mention in 3+ days is a
**signal**, not noise. Three common reasons:

- **You forgot about it** — pick it up, write a JOURNAL entry
  acknowledging you've returned to it.
- **It's blocked but not marked blocked** — move it to `blocked`
  status, note who you're waiting on.
- **It's actually done** — close it. Run the close ritual:
  - Update `status: closed`
  - Update `bugs_found:`, `test_cases_count:`
  - Add a closing JOURNAL entry

## What to do if Copilot can't read state

Three causes:

1. **`INDEX.md` is stale.** Run `node scripts/build-index.mjs`
   manually. (Scaffold scripts auto-run this, but manual file
   moves don't.)
2. **A story file has malformed frontmatter.** Run
   `node scripts/validate.mjs` to find it.
3. **Copilot didn't load the `.github/copilot-instructions.md`
   yet.** Restart Copilot Chat or check VS Code's Copilot status.

## Hard rules

- Don't open Jira before this ritual. Jira is an interrupt
  generator; the brain is a context restorer. Order matters.
- If the day's actual first action is "go to a meeting", set the
  suggested first action *after* the meeting. The ritual still
  runs.
- If `/session-start` outputs are systematically wrong (e.g.
  always missing recent stories), that's a prompt bug — open
  `.github/prompts/session-start.prompt.md` and refine.

## Why this ritual exists

The previous QA brain (a chat thread) required re-pasting context
each morning. That cost 10+ minutes per day and degraded as the
context grew. `/session-start` reads structured files, so the
cost is constant regardless of brain size.

The journal entry from yesterday's `/session-end` is the single
most valuable input. If yesterday's wrap was sloppy, today's
start suffers. Treat them as a pair.
