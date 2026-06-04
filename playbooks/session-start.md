---
title: "Playbook — Session start"
type: playbook
status: active
language: en
tags: [playbook, ceremony, daily]
updated: 2026-06-04
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
2. **Invoke `/session-start` in Copilot Chat.** This is the trigger
   for everything below. If you are on `main`, the prompt runs
   `node scripts/session-branch-start.mjs`, which **atomically**
   creates the `session/YYYYMMDD-HHMM` branch *and* its per-session
   log file `sessions/<id>.md` (status `open`) in one step. The
   prompt then **verifies you actually landed on a `session/*`
   branch and HARD-STOPS loudly if not** — so you never run a full
   day on `main` thinking you were isolated. If you are already on a
   `session/*` branch, it reuses that branch and ensures the log
   file exists.
3. **Pop the last session if one is still open.** `/session-start`
   scans `sessions/*.md` for any file with `status: open` and
   surfaces it (this is the new "previous session not closed"
   detection — see [Open session detected](#what-to-do-if-an-earlier-session-is-still-open)
   below). For each open session it offers **close it** (you'll run
   `/session-end` on it) or **continue it**. Then it reads
   yesterday's `JOURNAL.md` entry and the open session's last block.
4. **Read the summary.** Output is a one-screen picture: today's
   focus, active stories, blockers, inbox count, stale items,
   suggested first action. Everything but creating the branch+file
   is read-only.
5. **Cross-check what Copilot surfaced** against:
   - Jira board — has anyone moved a ticket since last EOD?
   - Teams DMs — overnight messages from devs answering your
     questions?
   - The SUT repo — has anyone merged something that affects a
     story you're testing?
6. **Decide the first 25 minutes** (one pomodoro): pick the
   single highest-leverage task. Often the suggested action from
   `/session-start` is right; sometimes external signals override.
7. **Promote any unprocessed inbox items** that are urgent. The
   rest wait until `/session-end`.

## What to do if an earlier session is still open

If yesterday ended without `/session-end` (laptop died, day got
cut short, you forgot), the session log file from that day still
has `status: open` in its frontmatter. `/session-start` detects
this by scanning `sessions/*.md` — there is no special "did you
forget?" file to look for, because the per-session log **is** the
detection mechanism. It surfaces every open session, sorted by id
(stable, immune to file-modification-time quirks).

For each open session, decide:

- **Close it** — run `/session-end` against it. The autonomous
  wrap infers the missing fields from that session's log blocks +
  git history, appends the JOURNAL entry, and consolidates the
  branch. (Then start today's session fresh.)
- **Continue it** — if it's literally the same thread of work and
  you're picking it right back up, stay on that `session/*` branch
  and keep going. Today's `/session-end` will close it.

Either way the truth is preserved: the open-session file holds the
last Handoff / Note block you wrote, so nothing is lost.

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
- Don't do session work directly on `main`. `main` is the
  consolidated end-of-session state; day work happens on
  `session/*`.
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

The per-session log (`sessions/<id>.md`) is the second input: it
holds the granular Handoff / Note / Bridge-out blocks for that
session, is committed on the session branch and merged to `main`,
and is therefore visible to every AI surface — no gitignored
ephemeral state, no "where did my handoff go?" Use `/session-note`
during the day to drop a lightweight checkpoint into it whenever
you want to record where you are.
