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

- [ ] New `packages/chan-ai/` directory with TypeScript setup matching existing modernized packages
- [ ] Provider abstraction interface defined (typed)
- [ ] OpenAI provider implemented as reference
- [ ] `.chanrc` AI config schema defined and validated (provider, model, optional endpoint)
- [ ] Invalid configurations (unsupported model for provider, missing required fields) produce clear error messages
- [ ] `createEnricher` factory returns callable `enrichFn`
- [ ] Mock-based tests verify provider contract without requiring real API keys
- [ ] `npm run lint` passes with oxlint
- [ ] `npm run check-types` passes with tsgo

## Blocked by

None — can be developed in parallel, but should not be integrated until modernization track is complete
