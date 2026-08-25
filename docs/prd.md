## Problem Statement

The Chan monorepo has fractured tooling and broken package resolution. Two packages (`@geut/chast`, `@geut/git-url-parse`) were migrated to TypeScript using `tsgo`, but their `package.json` exports point to non-existent `.js` files, making them unimportable by downstream packages. The remaining four packages (`@geut/chan-stringify`, `@geut/remark-chan`, `@geut/chan-core`, `@geut/chan`) are still on JavaScript, Jest with `cross-env NODE_OPTIONS=--experimental-vm-modules`, and the `standard` linter. The Jest module resolver has been removed, leaving legacy tests completely broken. The `unified`/`remark` ecosystem versions are mismatched and outdated (v9), preventing a clean TypeScript migration.

Beyond the technical debt, in an AI-assisted development context, manually writing changelog entries has become a bottleneck. Developers and agents need a way to automatically synthesize rich, contextual changelog entries from Git evidence, while maintaining full human auditability and editability.

## Solution

A three-phase modernization that unifies tooling, migrates the entire codebase to TypeScript with modern test infrastructure, and introduces an optional AI augmentation layer.

**Phase 1 — Tooling Fix & Parser/Compiler Migration**: Fix the broken `package.json` exports for already-migrated TypeScript packages. Migrate `chan-stringify` and `remark-chan` to TypeScript + Vitest + oxlint. Upgrade the `unified`/`remark` ecosystem to v11 with a new `createPipeline` helper pattern.

**Phase 2 — Core & CLI Migration**: Migrate `chan-core` and `chan` to TypeScript + Vitest + oxlint, consuming the modernized parser/compiler layer.

**Phase 3 — AI Augmentation**: Introduce `@geut/chan-ai`, a new package that maintains an append-only knowledge base (`.chan/code.md`) by analyzing Git commits. When AI is enabled, `chan added` / `chan fixed` etc. can query this knowledge base to enrich changelog entries. When AI is not configured, Chan degrades gracefully to standard Git metadata with zero behavioral change.

## User Stories

1. As a developer, I want all packages to use TypeScript with strict types, so that the codebase is self-documenting and type-safe.
2. As a developer, I want all tests to run under Vitest, so that I don't need `cross-env` or `NODE_OPTIONS=--experimental-vm-modules`.
3. As a developer, I want all packages to use oxlint/oxfmt, so that linting is fast and consistent across the monorepo.
4. As a developer, I want the `unified`/`remark` ecosystem upgraded to v11, so that I have modern ESM and TypeScript support.
5. As a developer, I want `@geut/chast` and `@geut/git-url-parse` to actually resolve at runtime, so that downstream packages can import them without errors.
6. As a release manager, I want published packages to ship compiled JavaScript from `dist/` with type declarations, while local development resolves `.ts` source files directly.
7. As a developer, I want `chan added` to optionally use an LLM to synthesize rich changelog entries from Git evidence, so that my changelog captures intent, breaking changes, and security implications automatically.
8. As a developer without AI access, I want Chan to work identically to today using raw commit messages and Git metadata, so that AI augmentation is purely opt-in.
9. As an enterprise user, I want to bring my own model (local Ollama endpoint, custom API key), so that I control costs and privacy.
10. As a release manager, I want a `chan analyze` command that populates `.chan/code.md` with structured evidence from Git history, so that I can review and audit what the AI has synthesized before it reaches the changelog.
11. As a developer, I want an optional post-commit hook that automatically analyzes each commit and appends to `.chan/code.md`, so that the knowledge base stays current with minimal friction.
12. As a developer, I want `chan release` to reorganize `.chan/code.md` entries under the new release version, so that the knowledge base stays correlated with the changelog.
13. As an AI agent, I want a `SKILL.md` file describing Chan's architecture, AI configuration, and hook setup, so that I can interact with the codebase correctly.
14. As a developer, I want `.chan/code.md` to be human-readable and editable markdown, so that I can correct AI hallucinations or adjust descriptions without touching binary files or build steps.
15. As a maintainer, I want the migration executed in dependency order with verifiable per-package commits, so that each step is reviewable and bisectable.
16. As a developer, I want clear error messages when my `.chanrc` AI configuration is invalid (e.g., model/provider mismatch), so that I don't waste time debugging silent failures.
17. As a developer, I want `.chan/code.md` to be append-only and safe for concurrent writes, so that multiple agents or developers can commit without merge conflicts corrupting the knowledge base.

## Implementation Decisions

- **Architecture**: `CHANGELOG.md` remains the source of truth. No Protobuf, no event sourcing, no `.chan/units/` directory. The knowledge base is `.chan/code.md`, a human-readable, append-only markdown file.
- **Package entry points**: During local development, `package.json` `exports`/`module` points to `.ts` source files. A `build` step (`tsgo --build`) produces `dist/` artifacts before publish. `publishConfig` contains overrides that swap `exports`/`module` to `dist/` paths during `npm publish`, ensuring published packages ship compiled JS + declarations.
- **Import extension convention**: Standard TypeScript ESM convention — `.ts` source files use `.js` extensions in `import` statements. `tsgo --build` rewrites these to `.js` in the `dist/` output.
- **Migration sequence**: Dependency order — `chan-stringify` (leaf, no internal deps) → `remark-chan` (depends on `chast`) → `chan-core` (depends on `remark-chan`, `chan-stringify`, `chast`) → `chan` (depends on `chan-core`, `git-url-parse`).
- **Unified v11 upgrade**: Upgrade `unified` to v11, `remark-parse` to latest, `unist-builder` to v4 everywhere, `unist-util-remove-position` and `unist-util-select` to v4 everywhere, `mdast-util-to-markdown` to latest.
- **Pipeline pattern**: Replace the v9 `preset` array-of-tuples pattern with a `createPipeline(plugin, opts)` helper function that chains `.use()` calls explicitly. This is typed as returning a `Processor`.
- **Snapshot convention**: Keep `__snapshots__` folders during migration using Vitest's `resolveSnapshotPath` config per package. Drop `dirname-filename-esm` and `cross-env`.
- **TypeScript config**: Replicate the existing `tsconfig.json` pattern: `target: es2023`, `module: NodeNext`, `composite: true`, `strict: true`, `declaration: true`, `sourceMap: true`.
- **AI module**: New `@geut/chan-ai` package encapsulating LLM client abstraction, prompt templates, response parsing, and caching. It exports a factory `createEnricher(config)` that returns an `enrichFn` callback.
- **AI configuration**: `.chanrc` stores provider and model selection (e.g., `openai`, `gpt-4o`). API keys and secrets are read exclusively from environment variables (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.). Invalid configurations (e.g., unsupported model for a provider) produce clear error messages at invocation time.
- **AI knowledge base (`code.md`)**: Located at `.chan/code.md`. Append-only markdown with rigid heading structure. Each entry is either a `## Commit <sha>` section (populated by hook or `chan analyze`) or an `## Action <type> <timestamp>` section (populated by `chan added`/`fixed`/etc.). Entries include metadata (author, files, tags) and AI-synthesized analysis.
- **Correlation strategy**: When `chan added 'msg'` runs, it queries `.chan/code.md` for the most recent commit entries that are not yet correlated with an action. It creates a new action entry linking those SHAs. When `chan release <version>` runs, it reorganizes `code.md` by creating a release section that groups the previously uncorrelated action entries.
- **Hook installation**: `chan hook install` sets `git config core.hooksPath .chan/hooks` and generates `.chan/hooks/post-commit`, which calls `chan analyze --auto` (analyzes HEAD commit only, fast path). The hook script and `.chan/` directory are tracked in Git. Documentation provides manual setup instructions for CI contexts.
- **Providers (initial)**: OpenAI, Ollama (local endpoint), Anthropic, Opencode Zen. Each provider has a typed configuration interface and implements a common client contract.
- **Graceful degradation**: If no AI configuration exists (no `.chanrc` ai block, no env vars), `chan` commands behave identically to the pre-AI version. The `@geut/chan-ai` package is not loaded.
- **Phase execution**: Three-phase migration. Phase 1 = chast/git-url-parse export fixes + `chan-stringify` + `remark-chan` migration. Phase 2 = `chan-core` + `chan` migration. Phase 3 = `@geut/chan-ai` + `code.md` + hook support.

## Testing Decisions

- Tests must focus on external behavior and interfaces, not internal implementation details.
- **Snapshot migration**: Existing Jest snapshots will be regenerated under Vitest format. Keep `__snapshots__` folder convention via `vitest.config.ts` per package.
- **Priority packages for rigorous testing**: `chan-core` (pipeline orchestration) and `chan` (CLI commands) need the most coverage since they coordinate the other packages and handle user input.
- **Prior art**: `chast` and `git-url-parse` already use Vitest successfully — follow their patterns for test structure and configuration.
- **New AI module tests**: Mock the LLM client to verify that `createEnricher` returns a callable `enrichFn`, that `chan analyze` correctly appends to `.chan/code.md`, and that `chan added` correlates commits when AI is enabled and skips entirely when AI is not configured.
- **Integration tests for Phase 1**: After `chan-stringify` and `remark-chan` migration, verify that a full round-trip (markdown → chast → markdown) produces the same Keep a Changelog output as before. This validates the unified v11 migration.
- **Error handling tests**: Verify that invalid AI configurations (unsupported provider/model combinations, missing API keys) produce clear, actionable error messages rather than silent failures or generic stack traces.

## Out of Scope

- Protobuf or event-sourced architecture (rejected from original PRD).
- Hosted SaaS or enterprise dashboard.
- Deep integration with Jira, Linear, or other issue trackers.
- Replacing Git's version control (raw code changes stay in Git).
- Migrating snapshot files out of `__snapshots__` folders (deferred to post-migration cleanup).
- AI providers beyond the initial four (OpenAI, Ollama, Anthropic, Opencode Zen).
- Semantic commit parsing (e.g., Conventional Commits) as a standalone feature — only the AI-synthesized analysis is in scope.

## Further Notes

- The append-only nature of `.chan/code.md` must be strictly maintained to ensure safe concurrent writes and clean merge resolution. `chan` writes atomically (read → modify → write to temp → fs.rename) where possible.
- `.chan/code.md` should be marked with `merge=union` in `.gitattributes` to reduce Git merge conflicts.
- After all packages are migrated, consider a root-level `vitest.workspace.ts` to run all tests in a single command.
- The `tsgo` compiler is the primary build tool. If `tsgo` is unavailable on a given platform, `tsc --build` serves as the fallback for CI compatibility.
- The `@geut/chan-ai` package should expose a minimal, stable public API surface. The internal prompt templates, provider-specific request/response formats, and caching logic are implementation details subject to change.
- `.chan/` directory initialization should be part of `chan init` — creating the directory, a starter `.chanrc`, and optionally offering to install the post-commit hook.
