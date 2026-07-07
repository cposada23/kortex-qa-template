---
title: "Playbook — Week one at a new client"
type: playbook
status: active
language: en
tags: [playbook, onboarding, week-one, client, sut-map]
updated: 2026-07-06
---

# Playbook — Week one at a new client

The first five days at a new client decide whether this brain
becomes the place you think in — or a folder of empty templates you
abandon by week three. This playbook is the narrative behind the
`/week-one` skill: why each day is themed the way it is, what
"good" looks like at the end of each day, and how to survive the
corporate realities (access queues, absent documentation, people
who answer in fragments).

## Relationship to /week-one

The `/week-one` skill (canonical:
`.agents/skills/week-one/SKILL.md`) is the executable version —
invoke it any day of the week and it resumes from the brain's real
state. This playbook is the reference: read it once before day 1,
re-read a section when a day goes sideways. The skill decides *what
to do next*; this document explains *why it's ordered this way*.

Prerequisite: the brain is already bootstrapped
([client-bootstrap.md](client-bootstrap.md) — clone, `init.mjs`,
first team scaffolded). Week one starts where bootstrap ends.

## The shape of the week

```
Day 1  Access & people      Request everything NOW; capture who's who.
Day 2  Tool inventory       Tracker, TMS, CI, how the app runs locally.
Day 3  Environments & data  URLs, test users, magic filter strings.
Day 4  SUT map seeding      00-overview + one page per touched module.
Day 5  First real work      A real story through /story-intake + exit check.
```

The ordering is dependency-driven, not arbitrary: you can't
inventory tools you have no access to (1 → 2), you can't document
environments you can't reach (2 → 3), you can't map a system you've
never run (3 → 4), and real work without any of the above means
re-asking the same questions in week two (4 → 5).

"Day" means "theme", not "calendar day". Access approvals alone can
stretch day 1 across half the week — that's normal, and it's why
the skill is reentrant: it re-reads the brain's actual state on
every invocation and resumes at the first incomplete theme.

## Day 1 — Access & people

**Why first:** every access request enters someone else's queue.
A request filed on day 1 is granted by day 3; a request filed on
day 3 stalls you into week two. Fire all requests before doing
anything else.

**The checklist:** SUT repo(s), tracker, TMS, environments + VPN,
CI, team chat channel, ceremonies calendar. For each: who approves
it, when you asked, current status.

**People:** fill `teams/<slug>/members.md` from your intro calls —
name, role, and (most valuable) *what you ping them for*. Fill
`teams/<slug>/ceremonies-info.md` from the calendar invites.

**What good looks like:** every access request is *filed* (not
necessarily granted) with an owner recorded; members.md has real
names; the pending requests live in `TODO.md` with names attached.

**Corporate tips:**

- Ask your onboarding buddy "who approved *your* access?" — the
  official process doc is usually stale; the person who did it last
  month knows the real path.
- Request VPN + environments together; they're often separate
  tickets with separate approvers and the second one is forgotten.
- In the intro meeting, ask each person "what should I ping you
  for?" — it fills members.md verbatim and people enjoy answering it.

## Day 2 — Tool inventory

**Why:** four small answers — tracker, TMS, CI, how the app runs
locally — silently shape every later workflow (story intake,
traceability, automation sync). Leaving them as `tbd` means every
skill that reads `brain.config.json` runs half-blind.

**The interview:** literally four questions to your tech lead or
QA peer. Ten minutes. Write answers into `shared/tool-inventory.md`
with a source per row, then update `brain.config.json` directly
(`tms`, `tracker`, `ci` — controlled vocab is in the file and in
AGENTS.md §Config).

**What good looks like:** no critical `tbd` left; the "how to run
locally" section contains actual commands someone confirmed, not
your guess. `none` is a valid, honest answer — "the client has no
TMS" is inventory, not a gap.

**Corporate tip:** "how does the app run locally?" often has no
written answer anywhere. Pair with a dev for 30 minutes and
transcribe what they actually type — that transcript is frequently
the first local-setup doc the client has ever had.

## Day 3 — Environments & data

**Why:** environments and test data are where onboarding time
silently disappears — every "which URL is staging?" or "which user
has admin?" question costs a Teams round-trip. Day 3 converts those
round-trips into files.

**The work:** fill `shared/environments/*.md` (URLs, deploy quirks,
caveats), `shared/users.md` (persona matrix — **never passwords**;
point at the client's vault), `shared/filters.md` (the magic
strings that find specific scenarios in the SUT's data).

**What good looks like:** you can open the QA env, log in with a
documented persona, and find a known test record — using only what's
written in `shared/`.

**Corporate tips:**

- Test data conventions are usually oral tradition ("use any order
  starting with TEST-"). Write down whatever fragments you hear in
  `filters.md` immediately — they're the hardest thing to recover
  later.
- If a team has its own env or users, don't fork the shared file —
  use the override convention (`teams/<slug>/<same-filename>`).

## Day 4 — SUT map seeding

**Why:** the SUT map (`knowledge/sut-map/` — see its
[README](../knowledge/sut-map/README.md)) is your long-term memory
of the system. Seeded in week one, it compounds with every story;
skipped, it never happens, and month three still feels like week
one.

**The work:** create `00-overview.md` — the system's top-level
modules, one line each, each line sourced. Then one page per module
you actually touched, from `templates/sut-module.md`, filling only
the six sections you can confirm (Purpose / Key flows / Risks /
Test data / Open questions / Sources).

**What good looks like:** a skeletal but *honest* map — three
half-filled module pages with real sources beat ten speculative
ones. Unknowns sit under "Open questions", visibly.

**Corporate tip:** the fastest source is asking a dev "can you
sketch me the system's big blocks in 10 minutes?" — a whiteboard
photo plus their name and the date is a perfectly good Source for
the whole overview.

After week one, the map grows through the `/sut-map` skill — every
story or exploration session that reveals a new module, flow, or
term feeds it. Day 4 is the seed, not the ceiling.

## Day 5 — First real work + exit check

**Why:** the setup is only proven by real work. Taking one real
story through `/story-intake` on day 5 stress-tests everything the
week built — and produces your first visible deliverable (AC
questions for the dev/PO) inside week one, which matters for how
the team perceives you.

**The exit check:** flip `week_one_done: true` in
`brain.config.json` ONLY if all three hold —

1. `shared/tool-inventory.md` has no critical `tbd`;
2. ≥ 1 environment file is filled with real data;
3. `knowledge/sut-map/` has the overview + ≥ 1 module page.

Failing a criterion is information, not failure — the flag stays
`false`, the gap goes to `TODO.md`, and `validate.mjs` will keep
nagging (by design) if the flag is flipped while `tbd`s remain.

**What good looks like:** one story scaffolded with a first-pass AC
audit sent, the flag flipped honestly, and the brain already answering
questions you'd otherwise re-ask a human.

## Hard rules (same as the skill)

- **Never invent client data.** Every fact carries a source —
  person, doc, or ticket, plus a date. Unconfirmed → "Open
  questions".
- **No credentials in tracked files.** Secrets live in `.env`
  (gitignored); tracked files record which user/tool to use and
  where the secret lives.

## See also

- [client-bootstrap.md](client-bootstrap.md) — the step before this
- [day-in-the-life.md](day-in-the-life.md) — the daily loop that
  takes over from day 5 onward
- [../knowledge/sut-map/README.md](../knowledge/sut-map/README.md) —
  the SUT map zone this week seeds
- [team-onboarding.md](team-onboarding.md) — adding a second team
  later
