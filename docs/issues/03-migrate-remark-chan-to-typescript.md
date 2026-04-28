---
title: Migrate remark-chan to TypeScript
slice: 3
type: AFK
branch: agent-refactor
---

## What to build

Migrate `packages/remark-chan/` from JavaScript/Jest/standard to TypeScript/Vitest/oxlint. This is the markdown parser that converts mdast to chast.

Upgrade `unified` to v11, `unist-util-remove-position` to v4, `unist-util-select` to v4. Update all chast node type references for strict TypeScript. Regenerate snapshots under Vitest.

## Acceptance criteria

- [ ] All `.js` source files converted to `.ts` with strict types
- [ ] `package.json` scripts use `vitest run`, `oxlint`, `tsgo --noEmit`, `tsgo --build`
- [ ] `package.json` exports point to `.ts` source (dev) with `publishConfig` overrides for `dist/`
- [ ] Unified v11 API used throughout
- [ ] Snapshots regenerated and all tests pass
- [ ] Chast tree output matches existing structure (verified by snapshot diff review)
- [ ] `npm run lint` passes with oxlint
- [ ] `npm run check-types` passes with tsgo

## Blocked by

- #1 (Fix existing TS package exports)
