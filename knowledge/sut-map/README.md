---
title: "SUT map — zone guide"
type: knowledge
status: active
language: en
tags: [sut-map, zone-guide, system-under-test]
updated: 2026-07-06
---

# knowledge/sut-map/ — System-under-test map

The living map of the client's system under test. This is the
brain's long-term memory of *what the system is* — modules, flows,
risks, test data, and domain vocabulary — so that month three
doesn't feel like week one.

## Structure

- **`00-overview.md`** — the system's top-level modules, **one line
  each**, every line with a source. The table of contents of the
  map. Created during week-one day 4.
- **One page per module** — `<module-slug>.md`, created from
  [../../templates/sut-module.md](../../templates/sut-module.md).
  Six sections: Purpose / Key flows / Risks / Test data / Open
  questions / Sources.
- **`glossary.md`** — client/domain terms as a table
  (`term | meaning | source`). Created on first use by the
  `/sut-map` skill.

## How it grows

- **Seeded** by the `/week-one` skill (day 4): overview + one page
  per module touched during onboarding.
- **Maintained** by the `/sut-map` skill: after a story intake, an
  exploration session, or any owner note that reveals a new module,
  flow, or term.

## The one rule: confirmed facts with sources only

Every statement in this zone carries a source — a person, a doc, or
a ticket, plus the date. Anything unconfirmed (an inference from AC
text, a hunch, an unverified AI answer) lives under the module
page's **Open questions** section until someone confirms it. A map
that mixes facts and guesses is worse than no map: you can't tell
which lines to trust.

## Portability exception

The rest of `knowledge/` is portable across clients and must carry
no client identifiers. **`sut-map/` is the deliberate exception**:
it describes *this* client's system, so it is client-specific by
nature. It stays with the client clone and is wiped at rotation
like any other client data — see
[../../playbooks/client-rotation.md](../../playbooks/client-rotation.md).
Generic lessons discovered while mapping (patterns, techniques)
still get promoted to `knowledge/patterns/` — sanitized, per
[../../playbooks/team-knowledge-promotion.md](../../playbooks/team-knowledge-promotion.md).

## See also

- [../../playbooks/week-one.md](../../playbooks/week-one.md) — day 4
  seeds this zone
- [../README.md](../README.md) — the knowledge zone at large
