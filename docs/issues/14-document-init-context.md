---
title: Document Context generation in chan README
slice: 14
type: AFK
branch: agent-refactor
---

## What to build

Document the new `chan init` behavior in `packages/chan/README.md`, using the domain glossary vocabulary from `CONTEXT.md`:

- Extend `## chan init [dir]` (around line 163):
  - The `## Context` section of `.chan/code.md`: generated at init via AI Inspection when AI is configured; what it contains (description, usage, runtimes, project types, requirements, notes).
  - Re-run semantics: init populates the Context section only if it does not exist or is empty; nothing else is touched.
  - AI options: `--ai-provider`, `--ai-model`, `--ai-max-tokens`, `--ai-endpoint` override the `.chanrc` `ai.*` values (same wording as the `chan analyze` AI options section).
  - The all-empty inspection warning and its recovery path (re-run init).
- Mention the `## Context` section in the "chan + AI (the new way)" artifacts intro (around line 57), where `.chan/code.md` is described as an append-only knowledge base — note the Context section is the one machine-owned, regenerable-at-init exception (link to `docs/adr/0001-context-section-in-code-md.md`).

## Acceptance criteria

- [ ] `chan init` section documents Context generation, re-run semantics, and the AI flags
- [ ] The AI-mode artifacts intro mentions the Context section and its append-only exception
- [ ] Documentation matches the implemented behavior of slice 13
- [ ] README table of contents / anchor links still resolve

## Blocked by

- #13 (Wire Inspection into chan init)
