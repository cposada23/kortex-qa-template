---
name: sut-map
description: Update the SUT map from a story, exploration session, or owner notes; only confirmed facts, each with a source.
---

# SUT map

You maintain `knowledge/sut-map/` — the living map of the system
under test: `00-overview.md` (top-level modules, one line each),
one page per module, and a glossary of client/domain terms.

## Input

The engineer gives you context in one of three shapes:

- **A story** — a folder under `teams/<slug>/stories/<KEY>-<slug>/`
  (story.md, ac-audit.md, execution-log.md).
- **An exploration session** — session notes, an execution log, or
  a walkthrough recap.
- **Prose from the owner** — "the payments module talks to a legacy
  SOAP service", pasted or spoken.

Plus, implicitly, the current `knowledge/sut-map/` contents.

## Process

1. **Extract candidate facts** from the context: modules and
   sub-flows, integrations, risks, useful test data, and new terms.
   For each fact, identify its source — a person, doc, or ticket,
   plus the date. A fact whose source you can't name is a question,
   not a fact.
2. **Update the relevant module page(s)** under
   `knowledge/sut-map/<module-slug>.md`:
   - Page exists → extend the matching sections (Purpose / Key
     flows / Risks / Test data / Open questions / Sources). Append;
     don't rewrite confirmed content.
   - Page missing → create it from `templates/sut-module.md`, fill
     only what the context confirms, park the rest under "Open
     questions".
3. **Update `00-overview.md`** if the module list changed — add the
   new module as a one-liner with its source. Create the overview
   first (same one-line format, `type: knowledge` frontmatter) if
   it doesn't exist yet.
4. **Update the glossary** — add new terms to
   `knowledge/sut-map/glossary.md` as table rows:
   `| term | meaning | source |`. If the file doesn't exist, create
   it with that table and `type: knowledge`, `status: active`
   frontmatter.
5. **Report** in chat: pages created/extended, overview lines
   added, terms added, and any facts you deliberately parked as
   open questions (with what confirmation they need).

## Hard rules

- **Only confirmed facts, each with a Source.** Inference from AC
  text, an assumption, or an unverified AI answer goes under "Open
  questions" — never into Purpose / Key flows / Risks as fact.
- **Never delete or contradict silently.** If new context
  contradicts an existing line, keep both and flag the conflict
  under Open questions for the engineer to resolve.
- **No credentials, no real customer data** — test-data pointers
  reference `shared/users.md` / `shared/filters.md`, not secrets.
- `knowledge/sut-map/` is client-specific by design (the documented
  exception inside `knowledge/`) — it stays with the client clone
  and is wiped at rotation; never promote its contents verbatim to
  the portable knowledge zones.
