---
name: external-consult
description: 'Build a sanitized, self-contained prompt to hand a question to an external AI (quota exhausted or second opinion), then de-anonymize and integrate the answer when it comes back.'
copilot_agent: ask
---

# External consult

You are the bridge between this brain and an external AI surface
(another chat product, another subscription) that must NOT learn who
the client is or see any sensitive detail. Two modes, detected from
what the engineer gives you:

- **SEND** — the engineer states a question/task to consult externally.
- **RECEIVE** — the engineer pastes the external AI's answer back.

## Approved surfaces

Use this skill only with AI surfaces approved by the client/company
for work content. If the engineer has not confirmed the destination
surface is approved, ask before producing the outbound prompt.

## SEND mode

1. Pin down the ask: what exactly do we need from the external AI
   (a test-design idea, a tool question, a review of an approach).
   If it is unclear, ask the engineer one question, not five.
2. Build the outbound prompt. It must be **self-contained** (the
   external AI has no repo access) and **sanitized**:
   - Client name, product names, internal hostnames → neutral roles
     ("the client", "an insurance web app", "the QA environment").
   - People → roles ("the tech lead"), never names.
   - Ticket keys / TC ids → sequential aliases (STORY-A, TC-1).
   - URLs, env hosts, versions that fingerprint the client → drop or
     generalize.
   - Everything `chat-handoff` forbids (credentials, PII, verbatim
     client data) — forbidden here too. Full policy:
     compliance-policy §7.
   Include only the minimum context the ask needs.
3. Self-check before emitting: "could a stranger identify the client
   or reconstruct confidential detail from this text?" If yes, cut
   more.
4. Append to today's session file (the file `session-start` opened):

   ```markdown
   ## External consult HH:MM
   status: sent
   ask: <one line>
   alias-map:
   - STORY-A = <real key>
   - the client = <real name>
   prompt-sent:
   <the sanitized prompt, verbatim>
   ```

   The alias-map NEVER leaves this repo. Git here is local-only.
5. Run `node scripts/validate.mjs sessions --strict-pii` — the same
   blocking gate the session merge uses. Fix any finding in the
   consult block before going further.
6. Output the sanitized prompt in a single copy-paste block.
7. **CRITICAL:** below the block, print a bold warning telling the
   engineer to MANUALLY VERIFY that no real names, hostnames, ticket
   keys, or credentials slipped into the prompt before copying it.
   The model's own self-check is not a gate; the engineer's eyes are.

## RECEIVE mode

1. Read the latest `## External consult` block with `status: sent`
   from today's session file (or the most recent open session).
2. De-anonymize the pasted answer using the alias-map.
3. Integrate: apply it to the artifact the ask was about (story
   analysis, test case, question list). The external answer is a
   SIGNAL, not a verified fact — anything that lands in a test case
   or bug report still needs the normal verification (a source, a
   check against the SUT).
4. Update the block: `status: integrated` plus one line on where it
   landed.

## Hard rules

- The outbound prompt is the ONLY thing that leaves; the alias-map
  and the raw answer stay in the session file.
- The alias-map must never be copied into bug reports, handoffs for
  external parties, screenshots, support tickets, or prompts to
  another AI.
- Never send file contents wholesale — summarize to what the ask needs.
- If the engineer asks to include something the policy forbids, refuse
  and say which rule blocks it.
