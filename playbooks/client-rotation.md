---
title: "Playbook — Client rotation"
type: playbook
status: active
language: en
tags: [playbook, compliance, client-rotation, off-boarding]
updated: 2026-05-20
---

# Playbook — Client rotation

**Compliance-critical.** When an engagement ends, follow this
playbook to wipe client data from the laptop while preserving
the generic lessons learned that may help you on the next client.

If skipped or done sloppily, client data leaks across engagements.
Don't skip it.

## When

- The engagement is ending (contract end, client switch, personal
  off-boarding).
- You're about to clone the template for a new client.
- Annual hygiene — even if the engagement continues, periodically
  re-verify the `knowledge/` portability rule.

## Phase 1 — Final snapshot of the closing engagement

Before wiping anything:

1. Run `node scripts/snapshot.mjs`.
2. Move the resulting ZIP from `versions/` to a long-term
   storage location **per the client's data retention policy**.
   Acceptable destinations:
   - The client's IT-managed backup channel (preferred).
   - Your personal Teams archive — only if the client allows it.
   - A locked, encrypted offline drive if explicitly required.

If the client's policy doesn't allow personal retention of any
client artifacts, skip this phase and proceed to Phase 2. The
in-laptop git history will be wiped.

## Phase 2 — Distill `knowledge/` for portability

`knowledge/` is the **only zone designed to travel.** Before you
copy it anywhere, audit each file:

### Portability sanitization checklist

For each `.md` file under `knowledge/`, verify NONE of the
following appear:

- [ ] Client name or employer name
- [ ] Internal product or codebase names
- [ ] Internal URLs (hostnames, IPs, domain names that aren't
  public)
- [ ] Screenshots, log excerpts, real data samples
- [ ] Credentials of any kind (even "leaked once, since
  rotated")
- [ ] Jira ticket keys or board names
- [ ] Proprietary workflow details that could identify the
  engagement
- [ ] Domain facts narrow enough to identify the client (e.g.
  "the largest customer segment is X" — even without naming the
  company, this is identifiable)

**If a file fails any of these:** rewrite generically. If you
can't rewrite confidently, delete it. Don't trust "anonymized"
material at scale — the next reviewer (you, in 6 months) won't
remember the context that made it "safe."

### Specific things to keep generic

- `knowledge/istqb/*` — ISTQB notes are inherently generic. Just
  verify no client examples crept in.
- `knowledge/playwright/*` — patterns may have used client
  selectors as illustrative examples. Strip them.
- `knowledge/patterns/*` — most likely to leak. Each pattern
  must read like "in any e-commerce / CRM / SaaS / banking
  context", not "at <client>".
- `knowledge/lessons-learned.md` — review every entry. Delete
  client-specific ones.

## Phase 3 — Export `knowledge/` (if going to next client)

The sanitized `knowledge/` is the only thing that travels:

```bash
# Create a clean export folder somewhere outside this repo
mkdir -p ~/qa-portable-knowledge-$(date +%Y-%m-%d)
cp -r knowledge/ ~/qa-portable-knowledge-$(date +%Y-%m-%d)/
# Final manual audit of the copy:
ls -la ~/qa-portable-knowledge-$(date +%Y-%m-%d)/knowledge/
# Read everything one more time. If anything looks even slightly
# client-revealing, delete it.
```

This export folder is what you import into the next client's
Kortex-QA clone during onboarding.

## Phase 4 — Wipe the local clone

After the ZIP is safely stored and `knowledge/` is exported:

```bash
# From the parent directory of the clone:
cd ~/work
rm -rf kortex-qa-<client-slug>
```

Confirm with `ls`. Also wipe:

- The corresponding `.code-workspace` file if it lived outside
  the folder.
- Any `versions/*.zip` files lingering elsewhere.
- VS Code workspace state for that folder (`File → Open Recent`
  history, then `File → Clear Recently Opened`).
- The OS trash (`Empty Trash` on macOS, similar on
  Windows/Linux).
- Any cached IDE state in `~/.vscode/` or similar that referenced
  the path.

For Mac users using Spotlight: `mdfind kind:folder kortex-qa` to
confirm no stale references exist.

## Phase 5 — Onboarding the next client (if applicable)

When cloning the template for the new engagement:

```bash
cp -r kortex-qa-template ~/work/kortex-qa-<new-client>
cd ~/work/kortex-qa-<new-client>
node scripts/init.mjs <new-client>
```

Then import the sanitized `knowledge/`:

```bash
cp -r ~/qa-portable-knowledge-<date>/knowledge/* knowledge/
```

Final commit on the new clone:

```bash
git add . && git commit -m "init: kortex-qa for <new-client>, imported portable knowledge from <previous>"
```

Then delete the export folder:

```bash
rm -rf ~/qa-portable-knowledge-<date>
```

## What if I'm not changing clients but want to clean up?

Run only Phase 1 + a partial Phase 2:

- Snapshot for safety.
- Audit `knowledge/` for any client-specific content that crept
  in, and either generalize or delete it.

This is good annual hygiene.

## Hard rules

1. **Never carry client `stories/`, `bugs/`, `team/`,
   `environments/`, `ceremonies/`, or `reviews/` to the next
   client.** Even sanitized.
2. **Never blanket-anonymize.** Sanitization is per-file,
   manual, and conservative. If unsure, delete.
3. **The ZIP in step 1 must go where the client allows.** Some
   clients prohibit any external storage of artifacts. Respect
   that.
4. **Don't merge client knowledge into the template repo
   itself.** This playbook is about *instances* of the template,
   not the template repo.
5. **Off-laptop wipe.** If the laptop belongs to the client (and
   they want it back), follow their off-boarding checklist on top
   of this one. This playbook protects *your* data hygiene; the
   client's policy protects *theirs*.

## Why this playbook exists

The biggest risk of a personal QA brain is leaking the previous
client's information into the next engagement's chat history or
files. Once it's leaked, it's gone — no taking it back. This
playbook is the friction that prevents it.

The cost of running this playbook fully is ~30 minutes per
client rotation. The cost of skipping it is potentially career-
ending. Run the playbook.
