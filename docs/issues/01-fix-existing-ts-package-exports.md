---
title: Fix existing TS package exports
slice: 1
type: AFK
branch: agent-refactor
---

## What to build

Fix the broken `package.json` exports for `@geut/chast` and `@geut/git-url-parse` so they actually resolve in the monorepo. These packages were already migrated to TypeScript but their `module`/`exports` fields still point to non-existent `.js` files.

Update `module`, `exports`, `publishConfig` (with `dist/` overrides for publish), and `files` in both packages. Align vitest versions across packages.

## Acceptance criteria

- [x] `@geut/chast` exports point to `.ts` source for dev, `dist/` for publish
- [x] `@geut/git-url-parse` exports point to `.ts` source for dev, `dist/` for publish
- [x] Both packages pass `npm test` (vitest) and `npm run check-types` (tsgo)
- [x] Both packages pass `npm run lint` (oxlint)
- [x] Downstream packages (`chan-core`, `remark-chan`) can import `@geut/chast` without module resolution errors
- [x] Vitest versions are aligned across all packages

## Completed

All acceptance criteria verified on `agent-refactor` branch:

| Check | chast | git-url-parse |
|-------|-------|---------------|
| `npm test` | ✅ vitest v4.1.5 | ✅ vitest v4.1.5 |
| `npm run check-types` | ✅ tsgo --noEmit | ✅ tsgo --noEmit |
| `npm run lint` | ✅ 0 errors, 2 warnings | ✅ 0 errors, 0 warnings |
| `npm run build` | ✅ dist/src/*.js + .d.ts | ✅ dist/src/*.js + .d.ts |
| `npm pack --dry-run` | ✅ no tsbuildinfo | ✅ no tsbuildinfo |
| `tsx import()` | ✅ resolves | ✅ resolves |

## Blocked by

None — can start immediately

## Completed in

Commit range on `agent-refactor` branch.
