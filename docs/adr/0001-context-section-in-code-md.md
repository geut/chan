# Context section in code.md is machine-owned and exempt from append-only

The Knowledge Base (`.chan/code.md`) is append-only, but it carries one machine-owned section: `## Context`, delimited by `chan:context:start`/`chan:context:end` markers, generated once at `chan init` via an AI Inspection. `chan init` inserts or refills this section when it is missing or empty, and never touches it otherwise — existing Knowledge Base content is never rewritten. Markers make the section unambiguously parseable for later re-reading as prompt context for the analyzer/augmenter (follow-up work). Filesystem gathering (package.json, full README, top-level directory listing) lives in `chan`; chan-ai only prompts over the resulting Codebase Snapshot — the per-commit `tools` mechanism was deliberately not reused for inspection.

## Considered Options

- Strict append-only (never touch an existing file): rejected — users configuring AI after init would have no path to a Context without losing Knowledge Base history.
- Fully regenerable Context (e.g. `--refresh-context`): deferred as a cheap follow-up; insert-if-missing/empty covers the init use case.
