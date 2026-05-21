---
title: "Playbook — Team-local → global knowledge promotion"
type: playbook
status: active
language: en
tags: [playbook, knowledge, promotion, cross-team]
updated: 2026-05-21
---

# Playbook — Team-local → global knowledge promotion

How to decide what stays inside `teams/<slug>/` and what graduates
to the global `knowledge/` zone. Without this rule, teams become
silos and patterns get re-learned every engagement.

## The default rule

**Start team-local.** Anything you write the first time lands
inside the relevant team's folder
(`teams/<slug>/automation/playbooks/`,
`teams/<slug>/stories/<TICKET>/notes`, etc.).

**Promote when it helps a second context.** The moment a pattern
proves useful in:

- A second team within the same engagement, OR
- A second client engagement (post `client-rotation.md`),

— it earns a generic version in `knowledge/`.

**Stay team-local indefinitely if it's team-specific.** Don't force
promotion. A pattern tied to one team's SUT, tooling, or workflow
belongs in that team's folder forever.

## What's eligible for promotion

| Eligible | Not eligible |
|---|---|
| Test design heuristic that works across SUTs | A specific test for one feature |
| Playwright fixture pattern decoupled from SUT-specific selectors | A page object class for one SUT |
| AC audit cue ("ambiguous time zone semantics ⇒ ask which TZ defines the boundary") | A specific AC line you audited once |
| Communication pattern ("how to phrase a clarification question to get decisive answers") | A Teams DM to a specific dev |
| ISTQB-style heuristic you internalized | The official ISTQB syllabus copy-pasted |
| "Friday deploys produce more bugs than Monday deploys when X" | "Acme deployed on a Friday and broke checkout" |

## The promotion process

1. **Notice a pattern repeating.** Two retros in a row flag the
   same thing, or you find yourself writing the same observation in
   two teams' notes — that's the signal.
2. **Draft the generic version.** Use the template at
   [../templates/knowledge-page.md](../templates/knowledge-page.md).
   Strip:
   - Client / employer names
   - Internal product or SUT names
   - Internal URLs / hostnames / IPs
   - Jira ticket keys
   - Real test users / emails
   - Real data samples / screenshots
   - Domain facts narrow enough to identify the client
3. **Place it under `knowledge/`** — pick the subfolder:
   - `knowledge/istqb/` — concept clarifications, definitions you
     re-explained in your own words
   - `knowledge/playwright/` — automation patterns / gotchas
   - `knowledge/patterns/` — cross-cutting QA patterns (process,
     communication, deploy rhythm)
   - `knowledge/lessons-learned.md` — short lessons that don't
     warrant their own page yet
4. **Link both ways.** In the team-local source, add a "Related"
   pointer to the new `knowledge/` page. In the generic version,
   don't link back (keeps it portable).
5. **Update `knowledge/INDEX.md`** by running
   `node scripts/build-index.mjs`.

## Anti-patterns

### Anti-pattern 1: Premature promotion

Promoting a one-team observation as "generic" before you've seen
it twice. The result: `knowledge/` fills with patterns that don't
actually generalize. Fix: wait for the second occurrence.

### Anti-pattern 2: Stripping too aggressively

Removing so much context that the pattern becomes unrecognizable.
"In some testing scenarios you may want to consider boundaries" is
useless. Be specific in the description while keeping
identifiers generic. Concrete example:

> **Bad (too generic):** "Consider time zones."
>
> **Good (specific + generic):** "When a feature's behavior depends
> on a date or time boundary, the AC must explicitly state which
> time zone defines the boundary. Server UTC vs user-local vs
> account-configured all produce different test results. Add a
> boundary test for each plausible time zone the SUT supports."

### Anti-pattern 3: Letting client details leak

The single most expensive mistake: a client name, internal URL, or
proprietary workflow detail surviving into `knowledge/` and then
being read by an AI in the next engagement. Once leaked, it can't
be un-leaked. Always re-read the page after promoting, with
[client-rotation.md](client-rotation.md)'s sanitization checklist
in mind.

### Anti-pattern 4: Never promoting

The reverse of premature promotion. If every observation stays
team-local, the next engagement starts from zero. Schedule a
quarterly review: scan teams' `automation/playbooks/` and
`retros/`, ask "which of these would I tell my next-client self?"
Promote those.

## Reverse flow: from `knowledge/` back into a team

When you start a new team (or new engagement), the `knowledge/`
zone is reference material. Some pages will apply directly to the
new team's context — that's the point.

Don't COPY `knowledge/` content back into a team folder; LINK to
it. The team-level page can be a thin pointer:

```markdown
# Auth fixture pattern (this team)

This team uses the pattern documented in
[../../knowledge/playwright/auth-setup-patterns.md](../../knowledge/playwright/auth-setup-patterns.md),
adapted for our SUT as follows:

- Token endpoint: `/api/v1/auth/token` (vs generic `/auth/login`)
- ...
```

This keeps the generic version updatable in one place while letting
each team note its local adaptations.

## Quarterly review prompt

Run this once a quarter (or on every engagement transition). Open
a fresh Copilot Chat tab and ask:

> Read `teams/*/automation/playbooks/`,
> `teams/*/ceremonies/retrospectives/`, and recent
> JOURNAL entries. List patterns I've written about for more than
> one team (or that I'm likely to repeat in a different engagement).
> For each, suggest:
> 1. Where in `knowledge/` it belongs.
> 2. What to strip during sanitization.

Then promote the strongest 3 candidates. Don't try to promote
everything in one sitting.

## See also

- [../AGENTS.md](../AGENTS.md) §"Cross-team boundary"
- [../teams/README.md](../teams/README.md) §"Cross-team patterns"
- [client-rotation.md](client-rotation.md) — same sanitization rule applies at client transition
- [../templates/knowledge-page.md](../templates/knowledge-page.md)
