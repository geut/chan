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

- [ ] `createInspector({ provider: 'invalid', model: 'x' })` throws "Provider invalid is not supported"
- [ ] `createInspector` with a `MockProvider` returns a `CompletionResult<ProjectInspectionResponse>` that parses against the schema
- [ ] The system prompt is sent as the first message and contains the evidence-discipline and terse-style rules
- [ ] The user message contains the codebase snapshot verbatim
- [ ] Token usage is logged like the other factories
- [ ] `ProjectInspectionResponseSchema` and types are exported from the package root
- [ ] The old TODO comment in `index.ts` is replaced with a pointer to the Inspection flow
- [ ] Unit tests in `packages/chan-ai/tests/index.test.ts` mirror the analyze/augment blocks (MockProvider + invoke spy)
- [ ] `npm run lint` passes with oxlint
- [ ] `npm run check-types` passes with tsgo

## Blocked by

None — can start immediately (parallel with slices 10 and 11).
