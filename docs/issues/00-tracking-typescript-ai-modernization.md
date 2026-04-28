---
title: '[Tracking] TypeScript migration + AI augmentation'
slice: meta
type: Tracking
branch: agent-refactor
---

## Overview

This is the tracking issue for the Chan monorepo modernization and AI augmentation initiative. All work is based on the PRD in `docs/prd.md` and targets the `agent-refactor` branch.

## Slices

### Modernization Track (do first)

| Slice | Title | Type | Blocked by |
|-------|-------|------|------------|
| #1 | Fix existing TS package exports | AFK | — |
| #2 | Migrate chan-stringify to TypeScript | AFK | #1 |
| #3 | Migrate remark-chan to TypeScript | AFK | #1 |
| #4 | Migrate chan-core — pipeline + transformer | AFK | #2, #3 |
| #5 | Migrate chan CLI | AFK | #4 |

### AI Feature Track (start after modernization)

| Slice | Title | Type | Blocked by |
|-------|-------|------|------------|
| #6 | Create chan-ai package skeleton | AFK | — (parallel) |
| #7 | Commit analysis + knowledge base (code.md) | AFK | #5, #6 |
| #8 | Augmented changelog entries with AI correlation | HITL | #7 |
| #9 | Release query + agent documentation (SKILL.md) | AFK | #8 |

## Branch Strategy

All slices target the `agent-refactor` branch. When the modernization track is complete and tested, it will be merged to `main` by the maintainers.

## Key Decisions

- `CHANGELOG.md` remains the source of truth (no Protobuf, no event sourcing)
- `.chan/code.md` is the append-only AI knowledge base (human-readable markdown)
- All packages migrate to TypeScript + Vitest + oxlint + tsgo
- Unified ecosystem upgraded to v11
- AI is opt-in via `.chanrc` + env vars; graceful degradation without AI config
- Initial providers: OpenAI, Anthropic, Ollama, Opencode Zen
