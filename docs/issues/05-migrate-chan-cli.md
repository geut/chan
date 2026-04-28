---
title: Migrate chan CLI
slice: 5
type: AFK
branch: agent-refactor
---

## What to build

Migrate `packages/chan/` (the CLI package) from JavaScript/Jest/standard to TypeScript/Vitest/oxlint. Migrate all command handlers (`init`, `added`/`changed`/`deprecated`/`removed`/`fixed`/`security`, `release`, `show`, `gh-release`), yargs setup, logger, vfs, config, and open-in-editor module.

## Acceptance criteria

- [ ] All `.js` source files converted to `.ts` with strict types
- [ ] `package.json` scripts use `vitest run`, `oxlint`, `tsgo --noEmit`, `tsgo --build`
- [ ] `package.json` exports point to `.ts` source (dev) with `publishConfig` overrides for `dist/`
- [ ] All CLI commands tested and passing
- [ ] Logger (`signale` wrapper) typed correctly, including `process.exitCode` side effects
- [ ] `config.js` typed with proper `.chanrc` schema
- [ ] `yargs` command registration typed
- [ ] `npm run lint` passes with oxlint
- [ ] `npm run check-types` passes with tsgo
- [ ] End-to-end smoke test: `chan init`, `chan added`, `chan release` produce correct output

## Blocked by

- #4 (Migrate chan-core — pipeline + transformer)
