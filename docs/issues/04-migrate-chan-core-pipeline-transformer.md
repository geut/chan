---
title: Migrate chan-core — pipeline + transformer
slice: 4
type: AFK
branch: agent-refactor
---

## What to build

Migrate `packages/chan-core/` from JavaScript/Jest/standard to TypeScript/Vitest/oxlint. This is the orchestration layer that ties the parser, transformer, and compiler together.

Replace the `unified` v9 `preset` array-of-tuples pattern with a typed `createPipeline(plugin, opts)` helper function that chains `.use()` calls explicitly for v11. Upgrade all `unist-*` dependencies to v4.

## Acceptance criteria

- [x] All `.js` source files converted to `.ts` with strict types
- [x] `package.json` scripts use `vitest run`, `oxlint`, `tsgo --noEmit`, `tsgo --build`
- [x] `package.json` exports point to `.ts` source (dev) with `publishConfig` overrides for `dist/`
- [x] `createPipeline(plugin, opts)` helper replaces v9 preset pattern, properly typed as `Processor<..., string>`
- [x] All core functions work: `initialize`, `addChanges`, `addRelease`, `getMarkdownRelease`
- [x] Snapshots regenerated and all tests pass (initialize, add-changes, release, get-markdown-release)
- [x] `npm run lint` passes with oxlint
- [x] `npm run check-types` passes with tsgo

## Blocked by

- #2 (Migrate chan-stringify to TypeScript)
- #3 (Migrate remark-chan to TypeScript)
