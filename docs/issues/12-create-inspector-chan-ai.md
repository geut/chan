---
title: createInspector in chan-ai
slice: 12
type: AFK
branch: agent-refactor
---

## What to build

Add the Inspection operation to `@geut/chan-ai`: the AI call that derives the Context section's content from a Codebase Snapshot. This resolves the existing TODO in `packages/chan-ai/src/index.ts` ("provide codebase context -- this should be generated once and stored perhaps at the beginning of the code.md file") — replace that comment with a pointer to `createInspector` and the `## Context` section.

In `packages/chan-ai/src/types.ts`:

- `ProjectInspectionResponseSchema`: `description` (string), `usage` (string), `runtimes` (string[] — e.g. node, browser, cli, ci), `projectTypes` (string[] — e.g. module, application, cli tool, monorepo), `requirements` (string[] — e.g. "Node >= 20", "git"), `notes` (string[] — anything else useful for analyzing future commits).
- `InspectArgsSchema`: `{ codebaseSnapshot: string }` — deliberately no `cwd`: chan-ai never touches the filesystem for inspection (the per-commit `tools` mechanism is not reused).
- `InspectFn` type; export schema and types from the package root, mirroring the analyze/augment pattern.

In `packages/chan-ai/src/index.ts`:

- `INSPECT_SYSTEM_PROMPT` following house prompt style (role → what you receive → field-by-field guidance → JSON requirement), with two hard rules:
  - **Evidence discipline**: base every field on evidence in the snapshot; if a field cannot be determined, use an empty string/empty array rather than guessing.
  - **Terse telegraphic style**: no marketing language, no full sentences where a phrase suffices — the output is re-read as prompt context by future AI operations, so fluff is recurring token cost.
- `export function createInspector(config: AIConfig): InspectFn` — same provider-resolution boilerplate as `createAugmenter` (string provider via `createProvider`, or injected `Provider` instance; no tools mechanism).

## Acceptance criteria

- [x] `createInspector({ provider: 'invalid', model: 'x' })` throws "Provider invalid is not supported"
- [x] `createInspector` with a `MockProvider` returns a `CompletionResult<ProjectInspectionResponse>` that parses against the schema
- [x] The system prompt is sent as the first message and contains the evidence-discipline and terse-style rules
- [x] The user message contains the codebase snapshot verbatim
- [x] Token usage is logged like the other factories
- [x] `ProjectInspectionResponseSchema` and types are exported from the package root
- [x] The old TODO comment in `index.ts` is replaced with a pointer to the Inspection flow
- [x] Unit tests in `packages/chan-ai/tests/index.test.ts` mirror the analyze/augment blocks (MockProvider + invoke spy)
- [x] `npm run lint` passes with oxlint
- [x] `npm run check-types` passes with tsgo

## Notes

- `createInspector` mirrors `createAugmenter` line-for-line: `AIConfigSchema.parse(config)` → unknown string providers throw `` `Provider ${provider} is not supported` `` → `createProvider(provider, { model, baseUrl, maxTokens })` or the injected `Provider` instance; single `modelProvider.invoke(messages, ProjectInspectionResponseSchema)` call, no tools mechanism.
- `InspectArgs` is deliberately `{ codebaseSnapshot: string }` only — no `cwd`, no filesystem access in chan-ai. Chan builds the snapshot via `buildCodebaseSnapshot(cwd)` (slice 11, `packages/chan/src/codebase-snapshot.ts`) and passes the string verbatim; the user message wraps it with a single imperative line, snapshot unmodified.
- The two hard rules live in `INSPECT_SYSTEM_PROMPT` as explicit `## Hard rules` bullets — evidence discipline (empty string/array over guessing) and terse telegraphic style (output is stored once and re-read as prompt context, so fluff is recurring token cost). The unit test asserts both rule headings reach the provider in the system message.
- `ProjectInspectionResponseSchema` matches the chan-side Context contract field-for-field (verified against `packages/chan/src/code-md.ts` in review): `description`, `usage`, `runtimes`, `projectTypes`, `requirements`, `notes`. Empty values are valid by design (all-empty response parses and is covered by a dedicated test).
- Token usage is logged as a single call: `Inspect token usage: <total> (input: <input>, output: <output>)` — same pattern as the augmenter, unlike the analyzer's aggregated `getTokenUsage`.
- The stale TODO and commented-out `contextSchema` stub after `SYSTEM_PROMPT` in `index.ts` were replaced with a pointer to the Inspection flow and the `## Context` section of `.chan/code.md`.
- Slice 13 (`init-context-generation`) wires this into `commands/init.ts`: build snapshot → `createInspector` → write the `## Context` section. Until then `createInspector` is exported but not called from the CLI.

## Blocked by

None — can start immediately (parallel with slices 10 and 11).
