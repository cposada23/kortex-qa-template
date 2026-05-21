# ceremonies/ — Meeting captures

Notes from team ceremonies. Each subtype has its own folder.

## Structure

```
ceremonies/
├── sprint-planning/<YYYY-MM-DD>.md     Sprint planning notes
├── daily-standups/<YYYY-MM-DD>.md      Daily standup notes (most days will not need a file)
├── reviews/<YYYY-MM-DD>.md             Sprint review / demo notes
└── retrospectives/<YYYY-MM-DD>.md      Retro notes
```

## When to write a daily-standup note

**Most days you won't.** Write one only when:

- A blocker was discussed that affects QA work.
- A decision was made (release pushed, scope changed).
- A new dependency surfaced.

Routine "I worked on X, will work on Y, no blockers" doesn't need
to be captured.

## When to write a retro note

Always. Even if the retro produced no big changes, the absence is
itself signal.

## Promotion to knowledge/

When a retro surfaces a recurring issue or a generalizable
lesson, distill it into `knowledge/patterns/<slug>.md` or
`knowledge/lessons-learned.md` after the meeting. The retro note
stays as the source; the `knowledge/` page is the portable
distillation (which means it must be sanitized of client-specific
details — see [../playbooks/client-rotation.md](../playbooks/client-rotation.md)).

## See also

- [../AGENTS.md](../AGENTS.md)
- [../team/ceremonies.md](../team/ceremonies.md) — cadence and
  ownership of each ceremony
