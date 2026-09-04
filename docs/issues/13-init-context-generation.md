---
title: Wire Inspection into chan init
slice: 13
type: AFK
branch: agent-refactor
---

## What to build

The vertical cut: `chan init` generates the `## Context` section of `.chan/code.md` via AI when AI is enabled. CHANGELOG.md creation remains the main goal and stays first and untouched.

In `packages/chan/src/commands/init.ts`:

- Add the AI override flags to `builder` (`--ai-provider`, `--ai-model`, `--ai-max-tokens`, `--ai-endpoint`), following the exact same pattern as `analyze`/`auto` (resolved via `resolveAiConfig` with `AiFlags`).
- After `initCodeMd`, run the Context generation flow when `resolveAiConfig` returns a config:
  1. `info('Inspecting codebase with AI to generate the Context section...')`
  2. `buildCodebaseSnapshot(dir)` (slice 11)
  3. `createInspector(...)` → invoke with the snapshot (slice 12)
  4. `writeContextSection(...)` (slice 10)
  5. `success('Context section generated in .chan/code.md.')`
- Failure handling:
  - AI not configured → info hint ("AI is not configured — set ai.provider and ai.model in .chanrc (or pass --ai-provider/--ai-model) to generate a Context section"), init continues, no failure.
  - AI call throws (bad key, network) → warning logged, init still succeeds (re-running init backfills later).
  - All-empty inspection response → write the empty Context section with markers, display a warning that it can be re-populated on a re-run.
- The final `package.json` tip block is unchanged.

Re-run semantics (per ADR-0001): `chan init` populates the Context section if it does not exist or is empty — nothing else is touched.

## Acceptance criteria

- [ ] `chan init` without AI config creates CHANGELOG.md + starter code.md with heading only, and logs the AI hint
- [ ] `chan init` with AI config generates and writes the Context section between `chan:context` markers
- [ ] CHANGELOG.md creation happens before any AI call and is unaffected by AI failures
- [ ] An AI failure logs a warning; init exits successfully with CHANGELOG.md + starter code.md created
- [ ] An all-empty inspection response writes the empty Context section with markers and logs a warning
- [ ] Re-running init on a repo with a populated Context does not touch it
- [ ] Re-running init on a repo with an empty Context refills it
- [ ] AI flags override `.chanrc` values (same precedence as `analyze`)
- [ ] Handler tests in `tests/init.test.ts` cover: no-AI path, AI happy path (MockProvider via flags), AI failure path, all-empty response, re-run no-op/refill
- [ ] `npm run lint` passes with oxlint
- [ ] `npm run check-types` passes with tsgo

## Blocked by

- #10 (Context section storage in the Knowledge Base)
- #11 (Codebase Snapshot builder)
- #12 (createInspector in chan-ai)
