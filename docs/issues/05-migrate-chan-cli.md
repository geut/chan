---
title: Migrate chan CLI
slice: 5
type: AFK
branch: agent-refactor
---

## What to build

Migrate `packages/chan/` (the CLI package) from JavaScript/Jest/standard to TypeScript/Vitest/oxlint. Migrate all command handlers (`init`, `added`/`changed`/`deprecated`/`removed`/`fixed`/`security`, `release`, `show`, `gh-release`), yargs setup, logger, vfs, config, and open-in-editor module.

## Acceptance criteria

- [x] All `.js` source files converted to `.ts` with strict types
- [x] `package.json` scripts use `vitest run`, `oxlint`, `tsgo --noEmit`, `tsgo --build`
- [x] `package.json` exports point to `.ts` source (dev) with `publishConfig` overrides for `dist/`
- [x] All CLI commands tested and passing
- [x] Logger (`signale` wrapper) typed correctly, including `process.exitCode` side effects
- [x] `config.js` typed with proper `.chanrc` schema
- [x] `yargs` command registration typed
- [x] `npm run lint` passes with oxlint
- [x] `npm run check-types` passes with tsgo
- [x] End-to-end smoke test: `chan init`, `chan added`, `chan release` produce correct output

## Blocked by

- #4 (Migrate chan-core — pipeline + transformer)
