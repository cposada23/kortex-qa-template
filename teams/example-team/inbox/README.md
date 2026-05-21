# inbox/ — Capture zone

Friction-free dump. When something occurs during the day that
might be useful but doesn't yet belong in a story or knowledge
page, drop it here.

Examples:

- "noticed the search bar swallows trailing whitespace — could be
  a test case"
- "dev mentioned tomorrow's release is delayed"
- "thought of a regression scenario for billing"
- "this Playwright pattern works but I need to think about why"

## File naming

Three options, all valid:

1. **Per-day capture** — `YYYY-MM-DD.md` (free-form notes for one
   day). Best for ad-hoc dailies.
2. **One topic per file** — `<slug>.md`. Best for one specific
   thought you want to keep separate.
3. **Roll-up file** — `INBOX.md` (singular, lives here as the
   catch-all).

## What happens to inbox items

`/session-end` surfaces items in the inbox. The owner triages by
either:

- **Promoting** to a story (`stories/<TICKET>/...`), test case
  library, bug, or knowledge page.
- **Deleting** if it turned out to be noise.
- **Leaving** if it's still maturing — but >7 days old items get
  flagged.

The inbox should not become a graveyard. End-of-week, anything
older than 7 days gets a decision: promote or delete.

## Schema

Inbox files are **schema-light**. Minimal frontmatter:

```yaml
---
type: inbox
language: en
tags: [...]
updated: YYYY-MM-DD
---
```

That's it. No `status`, no `title` required. The body is
free-form prose.

## See also

- [../AGENTS.md](../AGENTS.md)
- [INBOX.md](INBOX.md) — the catch-all roll-up file
