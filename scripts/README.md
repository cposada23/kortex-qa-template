# scripts/ — Node.js tooling

Zero-dependency Node.js `.mjs` scripts. No `package.json`, no
`npm install`. Each script runs as:

```bash
node scripts/<name>.mjs [args]
```

This guarantees portability across macOS / Linux / Windows
(Node is required anyway since Playwright depends on it).

## Available scripts

| Script | Purpose |
|---|---|
| [init.mjs](init.mjs) | One-shot post-clone setup |
| [new-story.mjs](new-story.mjs) | Scaffold a new story folder |
| [new-test-case.mjs](new-test-case.mjs) | Scaffold a library test case |
| [new-bug.mjs](new-bug.mjs) | Scaffold a bug file |
| [session-start.mjs](session-start.mjs) | AI-free morning summary |
| [build-index.mjs](build-index.mjs) | Regenerate INDEX.md files |
| [snapshot.mjs](snapshot.mjs) | ZIP the brain to versions/ |
| [validate.mjs](validate.mjs) | Frontmatter + integrity check |

## Auto-INDEX guarantee

The scaffold scripts (`new-story`, `new-test-case`, `new-bug`)
call `build-index.mjs` after creating files. This keeps INDEX.md
files (and therefore Copilot's `@workspace` retrieval) current
without manual steps.

## Design principles

- **Zero deps.** No `npm install` is acceptable. Node built-ins
  only (`fs`, `path`, `child_process`, `os`, `zlib`).
- **Self-contained.** Each script is one file. No shared utility
  modules in v1.0 (small duplication is fine; coupling is worse).
- **Fail loud.** Errors print to stderr and exit non-zero. No
  silent failures.
- **Idempotent where possible.** `build-index.mjs` and
  `validate.mjs` can be run repeatedly without side effects.
- **Read-only by default.** Only scripts named `new-*`, `init`,
  `snapshot`, and `build-index` write files. The rest are
  read-only.

## Running on Windows

All scripts work in:

- Windows Command Prompt: `node scripts\new-story.mjs ...`
- PowerShell: `node scripts\new-story.mjs ...`
- Git Bash / WSL: `node scripts/new-story.mjs ...`

Path separators in arguments are normalized internally.

## Hard rules for adding scripts

If you add a new script:

- It must work on Windows, macOS, Linux.
- No deps. (If a use case truly requires a dep, that's the time
  to discuss adding a `package.json` — but the bar is high.)
- Document it in this README.
- If it writes files, hook into `build-index.mjs` so INDEX stays
  fresh.
