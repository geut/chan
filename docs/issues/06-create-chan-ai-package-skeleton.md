---
title: Create chan-ai package skeleton
slice: 6
type: AFK
branch: agent-refactor
---

## What to build

Create `packages/chan-ai/` as a new TypeScript package with Vitest + oxlint + tsgo. Define the provider abstraction interface and implement OpenAI as the reference provider. Implement `.chanrc` config parsing with validation that produces clear error messages on invalid provider/model combinations.

The package exports a `createEnricher(config)` factory that returns an `enrichFn` callback conforming to the agreed contract.

## Acceptance criteria

- [x] New `packages/chan-ai/` directory with TypeScript setup matching existing modernized packages
- [x] Provider abstraction interface defined (typed)
- [x] OpenAI provider implemented as reference
- [x] `.chanrc` AI config schema defined and validated (provider, model, optional endpoint)
- [x] Invalid configurations (unsupported model for provider, missing required fields) produce clear error messages
- [x] `createAnalyzer` factory returns callable `analyzeFn`
- [x] Mock-based tests verify provider contract without requiring real API keys
- [x] `npm run lint` passes with oxlint
- [x] `npm run check-types` passes with tsgo

## Notes

- The factory is named `createAnalyzer` (renamed from the original `createEnricher` per design decision) and returns a typed `analyzeFn`.
- `.chanrc` file discovery/loading is handled in `packages/chan/src/config.ts` (see that package and its respective tests), not in `chan-ai`. `chan-ai` owns only the `AIConfigSchema` for validating an already-loaded config object.
- Unsupported-model-for-provider validation is intentionally not wired into config time (it would require a network call to list models at startup, which is undesirable for local/offline providers). Provider-name validation is enforced in `createAnalyzer`.

## Blocked by

None — can be developed in parallel, but should not be integrated until modernization track is complete