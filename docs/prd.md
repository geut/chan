## Problem Statement

The current version of Chan is a manual CLI tool for maintaining CHANGELOG.md files. In the new development context where AI agents and humans collaborate to produce code at an unprecedented rate, manual entry of release notes becomes a bottleneck. Furthermore, the `CHANGELOG.md` file itself serves as the database, which is inefficient for programmatic querying and prone to merge conflicts when multiple agents or developers contribute concurrently. There is a need for a system that can automatically ingest, analyze, and store the intent and impact of code changes in a machine-readable, conflict-free format, serving as a "release memory layer" for AI-assisted software teams.

## Solution

Transform Chan into an AI-assisted, evidence-backed release memory layer. Instead of treating `CHANGELOG.md` as the source of truth, Chan will use an event-sourced architecture storing immutable units of knowledge (at the commit or PR level) in a highly efficient, strict-schema format (Protobuf). These units will capture structural metadata and, when AI is enabled (Bring Your Own Model - BYOM), the synthesized intent and business context of the changes, linking back to the Git SHA as hard evidence.

The approval workflow shifts from the unit level to the release level: Chan compiles these unreleased units into a Draft Release (Markdown + Frontmatter) for human review. Once approved, it is published to the final `CHANGELOG.md`, which becomes a purely compiled output artifact. The memory layer will be API-first, designed for seamless agent interaction (headless mode, JSON output, MCP/Tool schemas, and an embedded `SKILL.md`), degrading gracefully to standard Git metadata if no AI provider is configured.

## User Stories

1. As a developer, I want my commits/PRs to be automatically analyzed and stored as knowledge units, so that I don't have to manually write changelog entries.
2. As a release manager, I want to review a generated Draft Release in Markdown before it is finalized, so that I can correct AI hallucinations or adjust marketing language without altering the underlying evidence.
3. As a developer, I want Chan to store knowledge units as separate immutable files (e.g., Protobuf files per commit), so that I never encounter Git merge conflicts on the release memory database.
4. As an AI agent, I want to query the release memory using structured, machine-readable output (`--json`), so that I can reliably parse the history of the codebase.
5. As an AI agent, I want Chan to provide native Tool Schemas or MCP support, so that I can easily integrate with it without writing brittle CLI wrapper scripts.
6. As an enterprise user, I want to use my own local LLM (Ollama) or API keys (BYOM) for analysis, so that my code remains private and I control inference costs.
7. As a developer without AI access, I want Chan to still function by extracting standard Git metadata and commit messages, so that my team can adopt the tool regardless of their AI setup.
8. As a security agent, I want the knowledge units to contain rich structural metadata (files changed, symbols modified), so that I can perform deep analysis and cross-reference with the raw Git diffs when necessary.
9. As a developer, I want to query the database using natural language (e.g., "what broke the API recently?"), and have Chan's query engine use LLMs to interpret my question and the Protobuf evidence to provide an answer.
10. As a maintainer, I want Chan's core codebase to be migrated to TypeScript, so that it is more robust, self-documenting, and easier for both humans and agents to contribute to.
11. As an AI agent dropped into the codebase, I want to read a `SKILL.md` file about Chan, so that I instantly know how to interact with the new architecture correctly.

## Implementation Decisions

- **Architecture Shift**: Move from parsing `CHANGELOG.md` to using an event-sourced, append-only directory of immutable Protobuf units (`.chan/units/*.pb`). `CHANGELOG.md` becomes a compiled output artifact.
- **Data Payload**: Units will store a hard pointer (Git SHA), standard Git metadata, structural changes (modified symbols), and optional AI-synthesized intent/impact. Raw diffs remain in Git to prevent repository bloat.
- **AI Integration (BYOM)**: Implement a dedicated LLM invocation module. `@geut/chan-ingestor` will use it to summarize intent; `@geut/chan-query` will use it to interpret natural language queries against the evidence.
- **Graceful Degradation**: If no AI is configured, the system falls back to using raw commit messages and metadata.
- **Human Approval**: Introduced a "Draft Release" stage (Markdown + YAML frontmatter). Humans curate the draft, not the immutable evidence units.
- **Agent DX**: Build the CLI "API-first" with headless execution (`--non-interactive`), strict `--json` outputs, and MCP/Tool schema support.
- **New Modules**:
  - An AI orchestration module to handle LLM calls.
  - `@geut/chan-ingestor`: Creates units from Git refs.
  - `@geut/chan-query`: Reads/filters Protobuf units and answers queries.
  - `@geut/chan-release`: Manages the draft-to-publish workflow.
- **Deprecations**: The current `@geut/remark-chan` parser may be deprecated as we no longer parse Markdown back into AST.
- **Zero Step**: A TypeScript migration and tooling update for the original modules will precede the feature work.

## Testing Decisions

- Tests should focus on external behavior and interfaces, not internal implementation details.
- **Priority Modules for Testing**: The new `@geut/chan-ingestor` and `@geut/chan-query` modules must have rigorous isolation testing.
- The ingestor tests should verify that given a mock Git diff, the correct Protobuf schema is serialized (both with and without AI mock responses).
- The query tests should verify that it can efficiently load multiple Protobuf files and accurately filter them or pass them to the mock LLM for natural language interpretation.
- Prior art: Utilize Jest (and potentially the existing `jest-module-resolver.js` setup, adapted for TypeScript) to write snapshot tests for the generated units and releases.

## Out of Scope

- Building the proprietary Enterprise dashboard or hosted SaaS database service (this PRD focuses on the OSS core).
- Deep integration with external issue trackers like Jira or Linear (to be added in a later iteration).
- Replacing Git's version control (raw code changes stay in Git).

## Further Notes

- The append-only nature of the Protobuf schema must be strictly maintained to ensure backward compatibility as AI capabilities evolve.
- The inclusion of a `SKILL.md` (Agent Skills standard) is a key deliverable for Agent DX.