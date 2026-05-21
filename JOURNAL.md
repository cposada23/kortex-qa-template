# Journal

Append-only session log. Each `/session-end` invocation appends a
block. Never edit history — if a past entry was wrong, append a
new entry that supersedes it.

Format per entry:

```
## YYYY-MM-DD HH:MM — <one-line summary>

STATE: <what's currently in flight>
DID: <what changed since last entry>
DECISIONS: <choices made>
BLOCKERS: <what's stuck and on whom>
NEXT: <what to do next session>
```

---

<!-- entries below -->
