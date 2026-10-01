# Chan

Chan is a changelog management tool (`@geut/chan`) with an optional AI layer that maintains a code knowledge base alongside the consumer-facing changelog.

## Language

### Artifacts

**Knowledge Base**:
The `.chan/code.md` file: an append-only, committed record of code changes (one entry per commit) plus an optional Context section. Supports changelog enhancement and future queries about how the codebase evolved.
_Avoid_: code.md file (when speaking conceptually), code base (reserved for the actual source tree)

**Changelog**:
The consumer-facing `CHANGELOG.md` curated by hand or by AI augmentation.
_Avoid_: knowledge base

**Context**:
The machine-owned `## Context` section at the top of the Knowledge Base: a terse, evidence-backed summary of the project (description, usage, runtimes, project types, requirements, notes), delimited by `chan:context` markers. Generated once at init by an Inspection and re-read as prompt context by later AI operations. The only part of the Knowledge Base exempt from the append-only rule.
_Avoid_: codebase context (that is the `AIConfig.context` option), project context

### Operations

**Inspection**:
The one-time AI operation that derives the Context from a Codebase Snapshot. Performed by the inspector (`createInspector` in chan-ai).
_Avoid_: analysis (reserved for commits), augmentation

**Analysis**:
The per-commit AI operation that produces a structured entry appended to the Knowledge Base.
_Avoid_: inspection

**Augmentation**:
The AI operation that turns one or more commits (plus Knowledge Base context) into a single changelog entry.

**Codebase Snapshot**:
The deterministic text gathered by chan (package.json, full README, top-level directory listing) that feeds an Inspection. Chan-ai never touches the filesystem to build it.
_Avoid_: inspection input, project description

### Invariants

**Append-only**:
The rule that existing Knowledge Base content is never rewritten; entries are only appended. The Context section is the sole exception.
