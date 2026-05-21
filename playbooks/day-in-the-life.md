---
title: "Playbook — Day in the life (end-to-end narrative)"
type: playbook
status: active
language: en
tags: [playbook, day-in-the-life, end-to-end, narrative]
updated: 2026-05-21
---

# Playbook — Day in the life

This is the **single document** that walks you through a realistic
QA day from laptop-open to laptop-close. Read it once when you
onboard. Re-read the **15-minute happy path** below any morning
you're rusty.

The narrative assumes a single active team. The
[Cross-team day](#cross-team-day) section at the bottom covers what
changes when you have two teams active at once.

---

## How this coexists with Jira / TestRail / your real tools

Before the narrative, important framing: **Kortex-QA is not a
replacement for Jira, Xray, Zephyr, TestRail, or your existing
test management tooling.** Your team's primary system of record
stays where it is. This brain is the local layer on top.

What lives where:

| Concept | Primary system of record | Lives in Kortex-QA |
|---|---|---|
| Story / ticket status | Jira (or Linear, Azure DevOps) | A folder per story with notes, AC audit, execution log, local bug pointers — but Jira owns the open/in-progress/done state |
| Test cases (formal) | TestRail / Xray / Zephyr if your team uses one | The local `test-cases/library/` is for **reusable cases you maintain across stories**, especially the ones you write, audit, automate, or revise often |
| Bug status / triage | Jira | Each bug has a local `.md` with rich repro context. Jira owns lifecycle; the local file is the engineer's working scratch + Jira-paste source |
| Ceremonies (decisions) | Your team's wiki / Confluence | The local capture is for **your own recall** + future-team-onboarding — not a shared meeting minutes system |
| Automation code | The automation repo | The brain only documents *meta* about it (patterns, decisions) |

The wedge:

> Kortex-QA reduces the daily cost of **context switching** between
> what Jira shows and what's in your head — AC audits with
> Teams-ready output, story-local working notes that survive across
> sessions, ceremony decisions captured next to the work they
> affect, and AI prompts grounded in the file structure rather
> than re-pasted context.

If your team already lives entirely in Jira + Confluence + a chat
thread, treat this template as an **artifact backbone**: the place
where the design, the reasoning, and the cross-engagement lessons
accumulate. The official statuses stay where they always were.

---

## 15-minute happy path (read this every morning until it's muscle memory)

Six commands. Twelve actions. Six closing keystrokes. If you do
nothing else, do these.

```
9:00   Open <client-slug>-qa.code-workspace in VS Code
9:01   Verify active team:
           cat teams/active-team.txt
       (or: node scripts/switch-team.mjs --list)
9:02   /session-start   in Copilot Chat
       → reads active team(s), shows in-progress stories, blockers, today's NEXT
9:05   Skim Teams overnight messages — promote anything urgent into the
       active team's inbox or a story's notes:
           teams/<active>/inbox/INBOX.md   (append a dated bullet)
           teams/<active>/stories/<TICKET>/story.md   ## Notes section
9:10   Pick ONE story for the first pomodoro. Open its folder.
9:15   Start work — depending on what the story needs:
           AC unclear        → /ac-auditor    (audit + Teams-ready questions)
           Non-AC ambiguity  → /question-generator  (design doc, Slack thread, verbal recap)
           Scenarios needed  → /story-analyzer (suggested test cases)
           Design test cases → /test-case-design  (one per scenario)
           Review peer TCs   → /test-case-reviewer (rubric pass + paste-ready comments)
           Manual → Playwright → /automation-from-test-case (skeleton with selector TODOs)
           Execution time    → manually update execution-log.md as you go
           Bug found         → /bug-report-formatter (Jira-ready paste)

[work blocks all day]

17:30  /session-end  in Copilot Chat
       → appends JOURNAL, updates TODO, suggests commit
17:35  Review the JOURNAL diff. Fix anything off.
17:40  git add . && git commit -m "session: $(date +%F) — <one-liner>"
17:45  node scripts/snapshot.mjs
       → produces versions/kortex-qa-<client>-v<X.Y.Z>-<YYYYMMDD-HHMM>.zip
17:50  Drag the ZIP into your Teams self-DM (your only backup channel —
       Git stays local).
18:00  Close laptop.
```

That's it. Everything else in this document is detail for when the
happy path breaks.

---

## Full day narrative

The user persona: a QA automation engineer on team **Six
Pro-Tagema** at "Client Acme." The brain is at
`~/work/kortex-qa-acme/` with `teams/active-team.txt` containing
`seis-pro-tagema` as the only line.

The day has: one ceremony at 10am, a 1:1 at 11am, AC clarifications
to send, test cases to design, test cases to execute, a bug to
report, two test cases to automate, and an env issue to escalate.

### 8:55 — Laptop wake

- Open VS Code.
- Workspace: `acme-qa.code-workspace`. Three folder roots appear in
  the sidebar:
  - **Kortex-QA (brain)** — this folder
  - **SUT** — the system-under-test repo
  - **Automation** — the Playwright automation repo
- Copilot loads `.github/copilot-instructions.md` → which points at
  the root `AGENTS.md` → which describes the team-centric layout.

### 9:00 — `/session-start`

You invoke `/session-start` in Copilot Chat. Output (paraphrased):

```
Scope: seis-pro-tagema

In progress:
  - TEAM-1234 — Search filter empty input  (ac_audit_status: done, 0 bugs)
  - TEAM-1240 — Cart abandonment email     (status: blocked on dev, since 2 days ago)

Stale (no JOURNAL mention 3+ days):
  - TEAM-1100 — Returns flow refactor

Inbox: 1 unprocessed item (from 2026-05-20)
TODO: 3 open

Last journal entry — 2026-05-20 18:14:
  STATE: TEAM-1234 ready for execution; AC questions sent to Mariana for TEAM-1241
  NEXT: Execute TEAM-1234, then start TEAM-1241 once Mariana replies

Suggested first action: open teams/seis-pro-tagema/stories/TEAM-1234-search-filter-empty-input/
  and start execution. Smoke test the QA env first (it was flaky yesterday).
```

### 9:05 — Inbox triage

Open `teams/seis-pro-tagema/inbox/INBOX.md`. The one unprocessed
item from yesterday says:

> 2026-05-20 — Mariana mentioned in standup that the new auth provider
> may affect TEAM-1234's login fixture. Confirm with her tomorrow.

You promote it into the relevant story:
- Append a bullet to
  `teams/seis-pro-tagema/stories/TEAM-1234-search-filter-empty-input/story.md`
  under `## Notes`: "2026-05-21: Check new auth fixture with Mariana
  before execution."
- Delete the inbox line.

You also notice an overnight Teams DM from Mariana (the dev for
TEAM-1241) answering yesterday's AC questions. You append her
answers to `teams/seis-pro-tagema/stories/TEAM-1241-.../ac-audit.md`
under `## Update 2026-05-21` and flip `story.md` `status: blocked
→ in-progress`.

### 9:15 — First pomodoro: smoke test the QA env

Per the journal's suggestion, the QA env was flaky yesterday. From
the **Automation** workspace root, run the smoke suite:

```
( cd ../<automation-repo> && pnpm playwright test tests/smoke --reporter=list )
```

5 of 5 smoke tests pass. The env is healthy. Note it in
`teams/seis-pro-tagema/environments/qa.md` under a brief
"Recent verifications" section if you want a written trail.

### 10:00 — Daily standup

You join the standup. It's the kind that most days you wouldn't
write a note about — but today's standup decides to push the release
by one day because of a frontend regression. That's a decision
worth capturing.

Open `teams/seis-pro-tagema/ceremonies/daily-standups/2026-05-21.md` (or
create it). One-paragraph note:

```
Release pushed to 2026-05-23 due to frontend regression on the
checkout flow. Mariana taking it. QA impact: smoke + regression
suites need a re-run on 2026-05-23 morning before signoff.
```

Update `TODO.md` at the root with: `Re-run smoke + regression on
2026-05-23 morning (release shifted)`.

### 10:15 — Execute TEAM-1234 test cases

Open
`teams/seis-pro-tagema/stories/TEAM-1234-search-filter-empty-input/`.

Read `story.md`. Read the
`test-cases/tc-team-1234-01-filter-by-date-range.md`. The story has
5 test cases (TC-TEAM-1234-01 through 05).

Open `execution-log.md`. Append a new run block:

```
## Run 2026-05-21 10:15 — qa

Env: qa
User: qa+qa+admin@acme.client.internal
Build / commit: 2026-05-21.1
Result: in-progress
```

For each test case, execute it manually (Playwright UI assertions
are still pending automation per the team's decision). As you go:

- TC-01 (happy path): pass — log result.
- TC-02 (start = end date): pass.
- TC-03 (end before start): pass — UI prevents submission with the
  expected message.
- TC-04 (empty state CTA): **fail**. The "Clear filter" button only
  resets the end date.
- TC-05 (filter persists across refresh): pass.

### 10:45 — Bug found, format the report

You found a defect. Invoke `/bug-report-formatter` in Copilot Chat.
Paste your raw observation:

> Clear filter CTA on empty state only resets end date, leaves
> start date populated. Affects AC #5 of TEAM-1234.

The prompt produces:
- A new file at `teams/seis-pro-tagema/bugs/BUG-007-empty-state-clear-cta-partial-reset.md`
- A paste block separated by `═══` lines.

You paste the paste block into Jira → file the bug → Jira gives you
the issue key TEAM-9023. Edit the bug file's frontmatter to set
`jira_key: TEAM-9023`.

Back in `execution-log.md`, the bug row updates automatically (or
you edit it):

```
TC-TEAM-1234-04 | fail | see BUG-007 (Jira: TEAM-9023)
```

You also update `story.md` frontmatter: `bugs_found: 1`.

### 11:00 — 1:1 with backend dev about TEAM-1240

TEAM-1240 is blocked on the dev. You have a 30-min 1:1 to unstick.
During the call, the dev clarifies that the abandonment email's
trigger condition depends on a config flag you didn't know about.

Open `teams/seis-pro-tagema/stories/TEAM-1240-cart-abandonment-email/story.md`.
Add to `## Notes`:

```
2026-05-21 (1:1 with dev):
- Trigger condition gated by config flag CART_EMAIL_V2 in admin panel.
- Flag is ON in dev, OFF in QA. Need ops to enable for QA testing.
- Once enabled, test trigger fires at 30 min after cart inactivity
  (configurable per env via CART_EMAIL_INACTIVITY_MINUTES).
```

Append a TODO at root: "Ping ops to enable CART_EMAIL_V2 in QA."

Status: unblock the story. Change `status: blocked → in-progress`
on `story.md`, note the dependency on ops in
`environments/qa.md`'s "Caveats" section.

### 11:30 — AC audit for TEAM-1241 (next sprint)

Mariana replied. You also need to look ahead at TEAM-1241 before
sprint planning. Open
`teams/seis-pro-tagema/stories/TEAM-1241-.../ac-audit.md`.

Invoke `/ac-auditor` (the audit ran yesterday, but the AC just got
updated based on Mariana's reply — re-audit). It produces:

- A new "## Audit 2026-05-21" section.
- Findings reduced from 6 to 2 (most were resolved by Mariana's
  answers).
- 2 follow-up questions for the PO about edge cases.

You copy the questions section verbatim into Teams DM to the PO.
The phrasing reads like you wrote it. No mention of the audit or
the AI.

### 12:30 — Lunch

Park work cleanly. Don't leave half-typed sentences in any file.
Save everything. Walk away.

### 13:30 — Test case design for TEAM-1240

Now that TEAM-1240 is unblocked, brainstorm scenarios. Open the
story, invoke `/story-analyzer`. Output (paraphrased):

```
Happy path: 4 scenarios
Edge cases: 3 scenarios
Negative paths: 5 scenarios
Integration: 2 scenarios (auth + payments interactions)
Regression candidates: 1 (BUG-005 from last quarter — abandoned
  carts older than 30d triggered duplicates)

Recommended v1 set: H1, H2, E1, N1, N2, I1, R1 — 7 test cases.
```

You agree with the set. Invoke `/test-case-design` for each
scenario. The prompt produces files under
`teams/seis-pro-tagema/stories/TEAM-1240-.../test-cases/`.

After all 7 are drafted, set `story.md` `status: design-done`,
`test_cases_count: 7`. Hand off to peer review (your teammate
Daniel) by tagging him in Jira on the test-case-review subtask.

### 15:00 — Automate 2 test cases for TEAM-1234

Two of TEAM-1234's test cases (TC-01 and TC-05) are
automation-suitable per the
`teams/seis-pro-tagema/automation/playbooks/playwright-page-object.md`
guidance.

Switch workspace focus to the **Automation** repo root (still in
the same VS Code window). Create the spec files following the
team's Page Object pattern:

- `tests/search/filter-by-date-range.spec.ts`
- `tests/search/filter-persists-across-refresh.spec.ts`

Wire them up to existing fixtures, run locally against qa env,
both pass.

Back in the brain, update the test cases' frontmatter:

- `automation_status: manual → automated`
- `automation_path: "../../../automation-repo/tests/search/..."`

Commit the automation repo separately (different repo, different
commit). The brain just records *that* they're automated and
*where* they live.

### 16:30 — Env issue surfaces

Mid-afternoon you notice the QA env is intermittently 500-ing on
the auth endpoint. Two consecutive Playwright runs failed on the
`auth` fixture. You suspect deploy.

- Quick triage: hit the endpoint manually with curl → 500.
- Open `teams/seis-pro-tagema/environments/qa.md`, append a brief
  "Recent issues" note: "2026-05-21 ~16:30: auth endpoint intermittent
  500. Suspect deploy mid-day. Pinged DevOps."
- Send Teams DM to DevOps (in your voice, first person):
  > Hey, the QA `/auth/login` endpoint is throwing intermittent
  > 500s since around 4pm. Two Playwright runs failed on the auth
  > fixture. Was there a deploy between 3-4pm? If yes, can you
  > check the logs?
- Do NOT mention the brain, AI, or audit in the message.

DevOps replies they pushed a hotfix at 4:10pm; they'll roll back.
Update `environments/qa.md` note with: "DevOps rolled back at
16:45. Re-running affected suites at 17:00."

### 17:00 — Re-run affected automation

Re-run the auth-touching automation. All green. Update
`execution-log.md` of any in-progress story execution that was
affected.

### 17:30 — `/session-end`

Invoke `/session-end`. It asks:

- "One-line summary of what you got done today?"
  → "Executed TEAM-1234 (1 bug found), unblocked TEAM-1240, designed 7 test cases for it, audited TEAM-1241, automated 2 cases, handled QA env hiccup."
- "Anything decided? Anything blocked?"
  → "Release pushed to 2026-05-23. CART_EMAIL_V2 flag needs ops in QA."
- "Very next thing for tomorrow?"
  → "Wait for Daniel's review on TEAM-1240. Then start TEAM-1241 once PO answers the 2 audit follow-ups."

It appends to `JOURNAL.md`:

```
## 2026-05-21 17:32 — productive day across 3 stories + env incident

STATE: TEAM-1234 execution done (1 bug filed). TEAM-1240 design-done,
       awaiting Daniel's review. TEAM-1241 audit redone (2 questions to PO).
DID:   Executed TEAM-1234 (TC 01-05); filed BUG-007/TEAM-9023.
       Designed 7 test cases for TEAM-1240 after dev unblocked.
       Re-audited TEAM-1241 after Mariana's answers; 2 new questions for PO.
       Automated TC-TEAM-1234-01 and TC-TEAM-1234-05.
       Handled QA env hiccup (DevOps rolled back hotfix at 16:45).
DECISIONS: Release moved to 2026-05-23.
BLOCKERS: TEAM-1240 awaiting Daniel's review. TEAM-1241 awaiting PO.
NEXT: Resume on Daniel's review or PO's reply, whichever arrives first.
```

It updates `TODO.md` (close completed items, add new ones), and
prints a suggested commit message.

### 17:40 — Review, commit, snapshot

Review the JOURNAL diff. Everything looks right. Commit:

```
git add . && git commit -m "session: 2026-05-21 — TEAM-1234 done, TEAM-1240 design-done, env hiccup"
```

Then snapshot:

```
node scripts/snapshot.mjs
```

Output: `versions/kortex-qa-acme-v1.1.0-20260521-1745.zip` (1.4 MB). <!-- pii-ok -->
(The date+time in the filename triggers the validator's
"long-digit-sequence" rule by accident — the literal comment
suppresses that one line.)

Drag the ZIP into your Teams self-DM. Tomorrow if your laptop dies,
you can restore from the latest ZIP.

### 18:00 — Done

Close laptop. Tomorrow morning, `/session-start` will pick up
exactly where you left off.

---

## Cross-team day

Some days you work across two teams. Suppose you're 50/50 on
`seis-pro-tagema` and `pod-8` this sprint.

### Setup once at the start of the rotation period

```bash
node scripts/new-team.mjs pod-8                  # if not already created
node scripts/switch-team.mjs pod-8 --add         # mark as also-active
node scripts/switch-team.mjs --list              # confirm: 2 active
```

`teams/active-team.txt` now contains:

```
seis-pro-tagema
pod-8
```

### `/session-start` shows both teams

The prompt's output now has two `━━━ TEAM: <slug> ━━━` sections —
one per active team — followed by the global TODO + JOURNAL block.
You see in-progress stories for both teams.

### Scaffolds default to the primary

`node scripts/new-story.mjs TEAM-1300 my-story` lands in
`teams/seis-pro-tagema/stories/...` (primary).

For pod-8 work, you pass the flag explicitly:

```
node scripts/new-story.mjs POD8-22 my-story --team pod-8
```

Same for `/story-intake` in Copilot Chat — the prompt accepts the
team as part of its input.

### Cross-team observations

If you notice a pattern that affects both teams (e.g. "QA env on
both projects sits behind the same shared auth provider; outage in
one outages the other"), capture it in BOTH teams' inboxes — or
promote it once to `knowledge/patterns/` for portability. See
[team-knowledge-promotion.md](team-knowledge-promotion.md).

### Switching primary

If pod-8 becomes your primary mid-sprint:

```
node scripts/switch-team.mjs pod-8
```

It moves pod-8 to line 1 (primary) while keeping `seis-pro-tagema`
on line 2 (also active).

### Dropping a team

When you're done with pod-8:

```
node scripts/switch-team.mjs pod-8 --remove
```

It comes out of `active-team.txt`. The folder
`teams/pod-8/` stays — to fully wipe, see
[client-rotation.md](client-rotation.md) (the same principles apply
for a team off-boarding, not just a whole client).

---

## When the day breaks the happy path

### Someone interrupts you mid-task

- **Save first.** Any open file, save it. Even an empty draft of a
  test case.
- **Note the parking spot.** Add a line to the relevant file's
  `## Notes` section: "2026-05-21 14:32 — paused mid-execution of
  TC-04, resume by re-opening the date-range filter."
- **Handle the interruption.**
- **Resume from the note.** Don't trust memory.

### Copilot says something wrong or unhelpful

- It happens. Edit the output manually. The prompt is a starting
  point, not gospel.
- If the same prompt gives bad output twice in a row, refine the
  prompt file (e.g. `.github/prompts/ac-auditor.prompt.md`) — add
  a clarification or example. Commit it as
  "prompt: tighten ac-auditor on <thing>".

### You forgot to `/session-end` yesterday

- Today's `/session-start` will be slightly off (no fresh NEXT).
- Improvise: read `git log -1 --stat` to see what was touched.
  Skim the latest changed files. Manually piece together "what
  was I doing."
- At today's EOD, do `/session-end` honestly. The JOURNAL has a gap
  — that's fine; don't fabricate yesterday's entry.

### A ceremony runs over and eats a work block

- Skip the optional captures. Don't write a ceremony note unless
  decisions were made.
- Adjust the day's plan: pick the highest-value remaining task,
  drop the rest to tomorrow.
- At `/session-end`, the NEXT line acknowledges what slipped.

### You're not sure where something belongs

Default to: in the active team's `inbox/`. End-of-day triage
promotes it to its real home.

---

## Days that aren't typical

The full-day narrative above is a **design + execution** day —
the most common shape, but not the only one. Five variations show
up regularly. Each one has its own prompt + playbook combo.

### Peer review day

The team's workflow assigned you the "test-case-review" subtask of
a story owned by another QA. Instead of designing, you're auditing
their work.

Flow:

1. Open the test cases under
   `teams/<active>/stories/<TICKET-KEY>-<slug>/test-cases/`.
2. Invoke `/test-case-reviewer` — it loads the TCs, runs the
   five-dimension rubric (coverage / clarity / redundancy /
   automation feasibility / schema compliance), writes findings to
   `teams/<active>/reviews/<TICKET-KEY>.md`, and drafts the
   "Comments to deliver" section in your voice.
3. Set the review's `review_outcome:` to `approved` /
   `changes-requested` / `rejected`.
4. Copy "Comments to deliver" into the Jira ticket as a comment
   (or send to the author in Teams).

Calibration tip: after 5–10 reviews, the rubric's hot spots start
to repeat. Promote those into a `knowledge/patterns/peer-review-*`
page. Detail: [test-case-peer-review.md](test-case-peer-review.md).

### Automation day

You promised the dev team Playwright coverage for 3 TCs by sprint
end. Today's the day. The TCs are `automation_status: auto-soon`
in their frontmatter.

Flow:

1. For each TC, invoke `/automation-from-test-case` with the TC
   path. Output: a `.spec.ts` skeleton matching this team's
   automation patterns (page object or API client fixture, per
   `teams/<active>/automation/playbooks/`).
2. Copy the skeleton into the automation repo at the path the
   prompt suggested.
3. Resolve the `TODO: selector` comments — that's the part only a
   human with SUT access can do.
4. Run the test locally. Iterate until green.
5. Update the TC's frontmatter: `automation_status: automated`,
   `automation_path: tests/.../<file>.spec.ts`. Add a
   `## Automation` H2 to the TC noting the commit SHA where it
   landed.

Cadence question (same sprint? next sprint? batched AUTO-NN
stories?): [automation-flow.md](automation-flow.md).

### Sprint planning day

The team's running sprint planning. You're capturing your slice of
the meeting for future reference (and to feed `/session-start`
tomorrow).

Flow:

1. During the meeting, jot rough notes — tickets committed,
   estimates, who owns what, any concerns raised.
2. After the meeting, paste the notes into Copilot Chat and
   invoke `/sprint-planning-intake`. It writes
   `teams/<active>/ceremonies/sprint-planning/YYYY-MM-DD.md` with
   the sprint identity, the stories committed, your QA workload,
   up-front concerns, and standard action items (scaffold story
   folders, run `/ac-auditor` on each).
3. Run `node scripts/new-story.mjs <ticket> <slug>` for each
   assigned design ticket.
4. (Optional) Invoke `/story-intake` on each to chain the AC
   audit.

The ceremony note is internal — never pasted into Jira or Teams.
It's your private record of the meeting.

### Retro day

End of sprint. The team's running a retrospective. Same shape as
planning intake, with one extra responsibility: recurrence
detection.

Flow:

1. During the retro, capture went-well / went-poorly / decisions
   in rough notes.
2. After, paste into Copilot Chat and invoke `/retro-intake`. It
   writes
   `teams/<active>/ceremonies/retrospectives/YYYY-MM-DD.md`
   matching the team's retro format, separates team action items
   from personal QA action items, surfaces promotable patterns.
3. **Check the recurrence flag** — the prompt compares against the
   previous retro file. If an item is recurring, the prompt warns
   you. Use the warning to reframe the action item before it lands
   in next sprint's queue.
4. Promote any pattern flagged for `knowledge/patterns/` —
   sanitize + write per
   [team-knowledge-promotion.md](team-knowledge-promotion.md).

### Design-doc-heavy day (or pre-AC clarification)

The dev team dropped a design doc, a Figma description, or a Slack
thread that you need to question — but it's not yet acceptance
criteria. `/ac-auditor` is the wrong tool (it expects AC).
`/question-generator` is the right one.

Flow:

1. Paste the source (design doc paragraph, Slack thread, your
   verbal recall of a call) into Copilot Chat.
2. Invoke `/question-generator`. Specify audience (dev / PO /
   tech-lead) + channel (Teams / Jira) + tone (peer / up-to-PO /
   cross-team) if it matters; otherwise the prompt asks once.
3. Output: paste-ready numbered list in the right tone for the
   target audience. No file written.
4. Copy into Teams or Jira and send.

When the AC eventually lands as a story, switch to `/ac-auditor`.
The question-generator output and the AC audit are two different
artifacts.

---

## Why this playbook exists

The previous QA brain (a chat thread re-loaded daily) didn't have
a clear narrative for *how to use it during a real day*. So the
brain got used for big moments (story intake, AC audit) but not
the in-between (1:1 notes, env hiccups, ceremony decisions). Those
in-between moments are where most context loss happens.

This playbook closes that gap. The 15-minute happy path is the
absolute minimum. The full narrative is the reference for when the
day gets non-trivial.

## See also

- [session-start.md](session-start.md) — deep dive on the morning ritual
- [session-end.md](session-end.md) — deep dive on the evening ritual
- [story-intake.md](story-intake.md) — when a new Jira ticket arrives
- [ac-audit.md](ac-audit.md) — wraparound for `/ac-auditor`
- [test-case-design.md](test-case-design.md) — coverage strategy and authoring
- [test-case-peer-review.md](test-case-peer-review.md) — peer review days
- [automation-flow.md](automation-flow.md) — automation days + cadence decisions
- [version-snapshot.md](version-snapshot.md) — ZIP cadence + restore
- [team-onboarding.md](team-onboarding.md) — scaffold a new team
- [team-knowledge-promotion.md](team-knowledge-promotion.md) — cross-team lessons
- [client-rotation.md](client-rotation.md) — engagement off-boarding
