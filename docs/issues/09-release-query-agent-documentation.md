---
title: Release query + agent documentation (SKILL.md)
slice: 9
type: AFK
branch: agent-refactor
---

## What to build

Add `chan query` command that reads `.chan/code.md` and generates marketing/social content (e.g., "create marketing content from the latest release"). The query engine uses the AI module to interpret natural language questions against the evidence in `code.md`.

Wire `chan release` to reorganize `.chan/code.md` entries: when a release is created, group uncorrelated action entries under a new `## Release <version>` section in `code.md`.

Write `SKILL.md` documenting Chan's architecture, AI configuration, hook setup, and `.chan/code.md` structure for agent DX.

## Acceptance criteria

- [ ] `chan query 'create marketing content from the latest release'` outputs generated content
- [ ] Query engine reads `code.md`, filters by release/version, passes evidence to AI module
- [ ] `chan release <version>` creates `## Release <version>` section in `code.md` grouping prior action entries
- [ ] `SKILL.md` covers: architecture overview, `.chanrc` AI config, hook installation, `code.md` structure, available commands
- [ ] `SKILL.md` is AI-navigable (clear headings, concrete examples)
- [ ] Tests cover query command and release reorganization
- [ ] `npm run lint` passes with oxlint
- [ ] `npm run check-types` passes with tsgo

## Blocked by

- #8 (Augmented changelog entries)
