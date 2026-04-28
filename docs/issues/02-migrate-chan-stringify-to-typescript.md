---
title: Migrate chan-stringify to TypeScript
slice: 2
type: AFK
branch: agent-refactor
---

## What to build

Migrate `packages/chan-stringify/` from JavaScript/Jest/standard to TypeScript/Vitest/oxlint. This is the leafiest package (no internal Chan dependencies), making it the ideal pilot for the unified v11 migration.

Upgrade `unified` to v11, `unist-builder` to v4, `unist-util-remove-position` to v4, `mdast-util-to-markdown` to latest compatible. Replace `this.Compiler` pattern with the modern unified v11 plugin signature. Regenerate snapshots under Vitest.

## Acceptance criteria

- [ ] All `.js` source files converted to `.ts` with strict types
- [ ] `package.json` scripts use `vitest run`, `oxlint`, `tsgo --noEmit`, `tsgo --build`
- [ ] `package.json` exports point to `.ts` source (dev) with `publishConfig` overrides for `dist/`
- [ ] Unified v11 API used throughout (no `this.Compiler`, no array-of-tuples preset pattern)
- [ ] Snapshots regenerated and all tests pass
- [ ] Markdown output matches existing Keep a Changelog format (verified by snapshot diff review)
- [ ] `npm run lint` passes with oxlint
- [ ] `npm run check-types` passes with tsgo

## Blocked by

- #1 (Fix existing TS package exports)
