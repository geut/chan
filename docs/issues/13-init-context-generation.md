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

- [x] `chan init` without AI config creates CHANGELOG.md + starter code.md with heading only, and logs the AI hint
- [x] `chan init` with AI config generates and writes the Context section between `chan:context` markers
- [x] CHANGELOG.md creation happens before any AI call and is unaffected by AI failures
- [x] An AI failure logs a warning; init exits successfully with CHANGELOG.md + starter code.md created
- [x] An all-empty inspection response writes the empty Context section with markers and logs a warning
- [x] Re-running init on a repo with a populated Context does not touch it
- [x] Re-running init on a repo with an empty Context refills it
- [x] AI flags override `.chanrc` values (same precedence as `analyze`)
- [x] Handler tests in `tests/init.test.ts` cover: no-AI path, AI happy path (MockProvider via flags), AI failure path, all-empty response, re-run no-op/refill
- [x] `npm run lint` passes with oxlint
- [x] `npm run check-types` passes with tsgo

## Notes

- The Context flow lives in the exported seam `runInitContext({ cwd, ai, logger })` (`packages/chan/src/commands/init.ts`), mirroring `runAnalyze`: string flags cannot carry a `Provider` instance, so tests inject `new MockProvider(response)` through the `ai` option (`AiResolvedConfig.provider` is `string | Provider`). The handler calls the seam verbatim with `resolveAiConfig({ aiProvider, aiModel, aiMaxTokens, aiEndpoint })` — flag precedence over `.chanrc` is inherited unchanged from `resolveAiConfig`, and the four `builder` entries are byte-identical to `analyze.builder` (asserted with `toEqual`).
- "MockProvider via flags" in the criteria resolves to this established seam idiom (same as analyze/auto tests); AI-path assertions live on the seam, not the handler, to stay hermetic against `loadConfig`'s `findUpSync` from `process.cwd()`. The no-AI path is covered at the real handler with a stdout spy.
- Cost guard before any AI call: the flow reads `.chan/code.md` and short-circuits when a populated Context exists (`hasContextSection && !isContextEmpty`). `writeContextSection` would no-op anyway, but only after paying for the inspection; the skipped call is asserted via `vi.spyOn(MockProvider.prototype, 'invoke')`.
- All-empty detection is done in-memory on `result.parsed` (every field `''`/`[]`): the empty marker section is still written (the re-runnable state per ADR-0001) and a `warn` tells the user a re-run of `chan init` can populate it.
- AI failures are caught inside the seam and logged as `warn('Context generation failed: <message>')` — `logger.error`/`fatal` set `process.exitCode = 1` and are never used on the AI path, so init always exits successfully. CHANGELOG.md and the starter code.md are already on disk before the flow runs (handler order: initialize/write/report → `initCodeMd` → `runInitContext` → package.json tip).
- `createInspectorFromConfig(ai)` was added to `packages/chan/src/ai-config.ts` as the third one-line analogue of `createAugmenterFromConfig`/`createAnalyzerFromConfig`.
- Slice 14 (`document-init-context`) documents this flow for users; until then the flag descriptions in `--help` are the only user-facing docs.

## Blocked by

- #10 (Context section storage in the Knowledge Base)
- #11 (Codebase Snapshot builder)
- #12 (createInspector in chan-ai)
