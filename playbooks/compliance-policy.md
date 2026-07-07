---
title: "Compliance, org policy & platform philosophy"
type: playbook
language: en
tags: [compliance, credentials, policy, platform]
updated: 2026-07-06
status: active
---

# Compliance, Org Policy & Platform Philosophy

Full rationale behind the hard rules listed in `AGENTS.md`
§"Hard rules / Boundaries". Moved here from AGENTS.md in v2.0 (the
agent context file stays compact; this playbook keeps the depth).

## What this brain is — and is not

A **personal working memory** for one QA engineer on one client
engagement, opinionated around the QA daily loop: ticket → story →
AC audit → questions → scenarios → test cases → execution/automation
→ bugs → distilled knowledge.

The brain is **not**:

- a replacement for Jira, Xray, Zephyr, TestRail, or any
  test-management system — the tracker remains the **system of
  record** for the team; this brain is the owner's private workbench
- a shared team space — single user, single client, single laptop
- a public document — output destined for external eyes must read
  like the owner wrote it (see §"External communication rule")
- a multi-client store. One client, one instance, one local clone.
  Client data never moves between instances.
- a remote-synced repo. Local git only. No `origin`. ZIP snapshots
  to a private location are the backup channel.
- a general-purpose knowledge graph. QA-shaped, not Kortex-shaped.

## 1. Platform invariant: Windows-first, cross-platform always

The primary work environment historically is **Windows with
PowerShell**; the brain must also run identically on macOS and Linux.

- **Path separators:** normalize internally — Node's `path.join()` /
  `path.sep` always; never hardcode `/` or `\` in script logic.
- **Shells:** inline shell snippets in docs or scripts must be
  PowerShell-safe (quoting, env-var syntax). Bash equivalents are
  documented alongside when relevant.
- **No symlinks anywhere** — Windows corporate checkouts can't rely
  on `core.symlinks=true`. Every mirror file is a generated plain
  file with a DO NOT EDIT banner.

If a script or doc adds a Windows-only or Unix-only step, mark it
explicitly with the alternative for the other platform.

## 2. Local-only Git (no push, offline-first)

This brain runs as **local Git only** on the client-issued machine.
There is no remote origin. `git push` is not used and is not
supported by the workflow.

- Git is the within-laptop history / undo buffer.
- ZIPs under `versions/` are the cross-laptop / disaster-recovery
  channel (see [version-snapshot.md](version-snapshot.md)).
- A push command is a sign someone wired a remote by mistake.
  Remove the remote, don't push.
- `main` should represent only consolidated end-of-session states;
  daily work happens on `session/*` branches.

## 3. Local credentials & environment variables

Because the brain never leaves the laptop, the owner **may store
real test credentials in local env files** (`.env`, `.env.local`,
`client-secrets/*.env`) for daily SUT testing and Playwright runs.

- **OK:** real usernames, passwords, API tokens, base URLs in a
  local `.env` read via `process.env.*`.
- **NOT OK:** real credentials inside tracked `.md` files. Those
  stay placeholders or roles-only. Git history is forever — even
  without a remote, a leaked cred in a tracked file requires
  history rewriting to remove.
- **Gitignored, snapshot-INCLUDED.** Credential files MUST be in
  `.gitignore` but are intentionally **kept inside** the ZIP
  snapshots written by `node scripts/snapshot.mjs`. Rationale: the
  snapshot ZIP is personal cross-laptop recovery (the owner DMs it
  to themselves, never shares it). On a laptop swap, the ZIP
  restores the working brain *with* creds intact.
- **Snapshot ZIPs are never shared.** Hard rule. If a ZIP must be
  handed to anyone, extract to a staging copy, delete every
  `.env`/`.secrets`/`client-secrets/` file, and zip the staging
  copy fresh. The original ZIP stays private.
- **AI agents do NOT read these files.** See §7 — the load-bearing
  protection layer for cred files.

## 4. Single-client by design

One Kortex-QA clone serves **one client engagement** at a time. No
`clients/` sub-folder, no multi-tenancy. Rotation between clients
means **wipe and re-clone**, not switch-context — client data
isolation is easier when the filesystem itself enforces "one client
per folder". Full off-boarding ritual:
[client-rotation.md](client-rotation.md). Within a client,
multi-team is fully supported via `teams/active-team.txt`.

## 5. Hard content rules

- **No client identifiers in `knowledge/`.** That zone is the only
  one designed to travel across clients. Promotion requires the
  sanitization checklist in
  [team-knowledge-promotion.md](team-knowledge-promotion.md).
- **No credentials in tracked `.md` files.** Keep them in `.env`.
- **`validate.mjs` runs automatically at commit time** via the
  pre-commit hook (`node scripts/install-hooks.mjs`). Bypass with
  `git commit --no-verify` (sparingly).
- **Also run `node scripts/validate.mjs` manually before
  snapshotting** — the hook covers commits, not the moment of
  `node scripts/snapshot.mjs`.

## 6. Org policy pre-flight (before first commit on a new client)

Confirm with the client (or your direct manager) that the following
are permitted on the client-issued machine (adaptation table in
`README.md` §"Org policy fit"):

1. The AI coding agent(s) you plan to use on client artifacts (per
   each vendor's data policy).
2. Local Git on the client-issued machine.
3. Local ZIP backups in the user profile / archive channel.
4. Node.js 20+ installed (Playwright 1.61 dropped Node 18; the
   brain scripts are zero-dep ESM modules).

`node scripts/doctor.mjs` automates the machine-side half of this
checklist (Node/git/zip/agent surfaces/network). The questions above
are the human-side half.

## 7. AI agents must NOT read credential files

The §3 policy allows real credentials in local `.env`-style files.
The remaining concern is **AI assistants accidentally ingesting
them** — once a credential lands in an AI context window, it may be
logged, used to train a future model, or surfaced later. This rule
keeps that surface at zero.

**AI agents MUST NOT read, open, paste, summarize, or otherwise
process the contents of any file matching:**

- `.env`, `.env.local`, `.env.*`
- `.secrets`
- `client-secrets/**`
- `versions/*.zip`, `versions/*.tar.gz` (snapshots may contain the above)
- `.cache/**` (may include prior agent transcripts)

**Even if the owner asks:**

- "Show me what's in `.env`" → reply "I can't read credential files
  per the AGENTS.md rule. Open it yourself in the editor."
- "Help me debug why `process.env.QA_USER` is undefined" → fine,
  but don't `cat .env`. Ask the owner to verify their `.env` has
  `QA_USER=...` without disclosing the value.
- "Append `NEW_TOKEN=xyz` to `.env`" → fine *only* if the owner
  pasted the literal token text. Never invent or read existing values.

**Enforcement layers:** `.aiexclude` (Gemini convention), the
never-read list in `AGENTS.md` (all agents read it),
`.github/copilot-instructions.md` (Copilot reinforcement). If a
model violates this rule, the file goes in the "rotate this
credential immediately" bucket.

## 8. External communication rule

Files under `stories/**/questions.md`, `bugs/**/*.md`, and
`reviews/**/*.md` are destined to be pasted into the tracker, chat,
or documents the team reads. **They must read as if the owner wrote
them himself.**

- Never reference this brain, the AI assistant, the audit process,
  or any AI scaffolding.
- Output reads in first person, as the owner's voice.
- Tone is senior QA engineer addressing the development team.

Enforced as a positive output spec inside each relevant skill,
backed by `.github/instructions/external-comms.instructions.md`,
and (v2.0+) by the forbidden-phrases check in
`node scripts/validate.mjs`.

## 9. Per-session log (sessions/)

Session continuity lives in a **committed per-session log file**:
`sessions/<session-id>.md`, keyed by session branch (branch
`session/20260604-0930-flaky` → file
`sessions/20260604-0930-flaky.md`), not by date — that's what makes
it survive a forgot-to-close session and a midnight-crossing session.

**Why committed (not gitignored):** a gitignored root handoff file
is invisible to every AI surface that didn't write it. The committed
log is discoverable by every agent and rides along inside snapshot
ZIPs automatically.

**File shape.** Frontmatter `type: session`, `status: open | closed`,
`branch: session/<id>`. Body accumulates timestamped blocks:
`## Handoff HH:MM` (full transfer schema), `## Note HH:MM`
(lightweight checkpoint), `## Bridge-out HH:MM` (end-of-day wrap,
flips `status: closed`).

**Lifecycle:** `node scripts/session-branch-start.mjs` creates
branch + log atomically; `node scripts/session-start.mjs` surfaces
every `status: open` session; `node scripts/session-branch-finish.mjs`
validates (including the blocking strict-PII secret gate:
`node scripts/validate.mjs sessions --strict-pii`) before commit,
merge `--no-ff` to `main`, and branch delete. On failure the branch
is preserved. Local-only; never pushes.

**Redaction rule (load-bearing):** every block written into a
session log is committed history — re-read and strip credentials/PII
before writing, per §7. The strict-PII gate enforces it a second
time at merge.

Details of the daily rhythm: [session-start.md](session-start.md) +
[session-end.md](session-end.md).
