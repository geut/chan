---
title: Context section storage in the Knowledge Base
slice: 10
type: AFK
branch: agent-refactor
---

## What to build

Implement the machine-owned `## Context` section in `.chan/code.md` per ADR-0001 (`docs/adr/0001-context-section-in-code-md.md`): a delimited block between `<!-- chan:context:start -->` / `<!-- chan:context:end -->` markers that `chan init` can generate once via AI Inspection and later operations can re-read as prompt context.

Add to `packages/chan/src/code-md.ts`:

- `CONTEXT_START_MARKER` / `CONTEXT_END_MARKER` constants.
- `formatContextSection(ctx: ProjectInspectionResponse): string` — pure renderer of the `## Context` block between markers (`- **Description:**`, `- **Usage:**`, `- **Runtimes:**`, `- **Project types:**`, `- **Requirements:**`, `- **Notes:**`).
- `hasContextSection(content)` / `isContextEmpty(content)` helpers.
- `writeContextSection({ cwd, context })` — the ADR-0001 semantics: creates the file with the starter heading if missing; inserts the section right after the heading (before the first `## Commit`/`## Action` entry) when markers are absent or the section is empty; no-op when a populated Context exists; never rewrites existing Knowledge Base entries.
- `readContextSection(cwd)` — pure reader returning the text between markers (consumed by the follow-up analyzer/augmenter context wiring; built here because it is the same marker logic).

`initCodeMd` stays as-is (heading only) — the Context write is a separate step in the init flow.

## Acceptance criteria

- [x] `formatContextSection` renders all six fields between the `chan:context` markers, with array fields rendered as comma-separated values
- [x] `writeContextSection` on a fresh repo creates `.chan/code.md` with heading + Context section
- [x] `writeContextSection` on an existing Knowledge Base without markers inserts the section after the heading and leaves existing entries untouched
- [x] `writeContextSection` on a Knowledge Base with a populated Context is a no-op
- [x] `writeContextSection` on a Knowledge Base with an empty Context section refills it
- [x] `readContextSection` returns the text between markers (empty string when absent)
- [x] `appendEntries` still appends at the end without disturbing the Context section
- [x] `commitsSinceLastAction` and `scanBreakingChanges` are unaffected by the Context section
- [x] Unit tests in `tests/code-md.test.ts` cover all cases above
- [x] `npm run lint` passes with oxlint
- [x] `npm run check-types` passes with tsgo

## Notes

- The context shape is defined locally as `CodeBaseContext` in `code-md.ts` (structurally identical to chan-ai's future `ProjectInspectionResponse`, slice 12) so slices 10–12 stay parallel. When slice 12 lands, the import can switch to `@geut/chan-ai`.
- "Empty" is defined textually: a section counts as empty when no field line (`- **Label:** value`) carries a non-whitespace value. This covers both markers-only bodies and sections stored from an all-empty Inspection response.
- Insertion position when markers are absent: right before the first `## ` entry (Commit/Action) via `/^## /m` search, falling back to appending at the end. This avoids relying on the heading's exact trailing newlines.

## Blocked by

None — can start immediately.
