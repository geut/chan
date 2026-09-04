---
title: Commit analysis + knowledge base (code.md)
slice: 7
type: AFK
branch: agent-refactor
---

## What to build

Add `chan analyze` command to the CLI. Implement Git log reading, commit metadata extraction, and optional AI synthesis. Append results to `.chan/code.md` as an append-only markdown knowledge base.

Implement `chan hook install` command that sets `git config core.hooksPath .chan/hooks` and generates `.chan/hooks/post-commit` calling `chan analyze --auto` (fast path for HEAD only). Define the append-only `.chan/code.md` heading structure. Implement atomic file writes (temp + rename) for concurrent safety.

## Acceptance criteria

- [x] `chan analyze` command reads Git log and appends structured entries to `.chan/code.md`
- [x] Entry format: `## Commit <sha>` sections with metadata (author, files, date, tags, original message, AI analysis)
- [x] `chan hook install` creates `.chan/hooks/post-commit` and sets `core.hooksPath`
- [x] `.chan/` directory created by `chan init` if not present
- [x] Atomic writes: read → modify → write temp → `fs.rename`
- [x] `.chan/code.md` is human-readable and editable
- [x] Graceful degradation when AI not configured: store raw commit metadata without synthesis
- [x] Tests cover analyze command, hook installation, and append-only file structure
- [x] `npm run lint` passes with oxlint
- [x] `npm run check-types` passes with tsgo

## Notes

- New modules in `packages/chan/src`: `git.ts` (git log / metadata via `execFile` with arg arrays, no shell), `code-md.ts` (knowledge-base heading, `formatEntry`, append-only `appendEntries`, `initCodeMd`).
- Atomic writes use [`fast-write-atomic`](https://github.com/mcollina/fast-write-atomic) (temp file in same dir → `fs.rename`), wrapped in `appendEntries` (read → ensure heading → append → atomic write).
- `chan analyze` resolves commits via `--gitSha <sha>`, `--auto` (HEAD only), or the git log (`--limit`, default 50). AI config is read from `.chanrc` (`ai.{provider,model,maxTokens,endpoint}`) with CLI flags as overrides; when no provider+model is configured it stores raw commit metadata without synthesis.
- The core analyze logic is exported as `runAnalyze({ cwd, commitShas, ai? })` for direct testing; `ai.provider` accepts a `Provider` instance so tests use `MockProvider` (now re-exported from `@geut/chan-ai`).
- `chan hook <action>` supports both `install` and `uninstall`. Install writes an executable `.chan/hooks/post-commit` (`chan analyze --auto`) and runs `git config core.hooksPath .chan/hooks`.
- `chan init` now also calls `initCodeMd` to create `.chan/code.md` with the starter heading (never overwrites an existing knowledge base).
- `@geut/chan-ai` now re-exports its types (`CommitAnalysisResponse`, `AnalyzeFn`, etc.) and `MockProvider` so consumers don't need deep imports.
- Tests use real temp git repos (`tests/fixtures.ts`) run inside the cowork Docker container (git + correct native deps). New tests: `git.test.ts`, `code-md.test.ts`, `hook.test.ts`, plus extended `analyze.test.ts` (raw + MockProvider AI path) and `init.test.ts` (`.chan/` creation).

## Blocked by

- #5 (Migrate chan CLI)
- #6 (Create chan-ai package skeleton)
