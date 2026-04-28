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

- [ ] `chan analyze` command reads Git log and appends structured entries to `.chan/code.md`
- [ ] Entry format: `## Commit <sha>` sections with metadata (author, files, date, tags, original message, AI analysis)
- [ ] `chan hook install` creates `.chan/hooks/post-commit` and sets `core.hooksPath`
- [ ] `.chan/` directory created by `chan init` if not present
- [ ] Atomic writes: read → modify → write temp → `fs.rename`
- [ ] `.chan/code.md` is human-readable and editable
- [ ] Graceful degradation when AI not configured: store raw commit metadata without synthesis
- [ ] Tests cover analyze command, hook installation, and append-only file structure
- [ ] `npm run lint` passes with oxlint
- [ ] `npm run check-types` passes with tsgo

## Blocked by

- #5 (Migrate chan CLI)
- #6 (Create chan-ai package skeleton)
