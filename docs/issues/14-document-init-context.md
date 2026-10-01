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

- [x] `chan init` section documents Context generation, re-run semantics, and the AI flags
- [x] The AI-mode artifacts intro mentions the Context section and its append-only exception
- [x] Documentation matches the implemented behavior of slice 13
- [x] README table of contents / anchor links still resolve

## Notes

- Work landed on branch `PROJ-14` off `dp/new-ai-module` @ `50c216e` (slice 13, `7e89f6c`, present); the frontmatter `branch: agent-refactor` was stale and was not used.
- Single product-file change (`packages/chan/README.md`, +13/−2) in the two targeted regions: the `chan init` section gained bullets for Context generation (Codebase Snapshot → Inspection → marker-delimited `## Context` write, contents list), the no-AI hint path, re-run semantics (populate only when missing/empty, no AI call otherwise, nothing else in the Knowledge Base is touched), AI-failure/all-empty degradation with the "re-run `chan init`" recovery, plus a `#### AI options` subsection whose single line is byte-identical to the `chan analyze`/`chan auto` wording. The artifacts intro gained one sentence naming `## Context` the machine-owned, regenerable-at-init exception to append-only.
- The ADR link uses the repo-relative path `../../docs/adr/0001-context-section-in-code-md.md` (first relative doc link in this README); GitHub rendering is the canonical target, npm rendering of relative links is best-effort.
- Pre-existing anchor break fixed minimally as required by the last criterion: the TOC and three in-prose links targeted `#config-package-json` with no matching `<a name>`; the Configuration heading now carries both `name="config"` and `name="config-package-json"`. No unrelated rewording.
- Verification (no automated prose test exists): behavior-match read of the new prose line-by-line against `runInitContext`/builder in `packages/chan/src/commands/init.ts` and `formatContextSection`/markers in `packages/chan/src/code-md.ts`; grep-based extraction diff of all `](#...)` links against all `<a name="...">` anchors (empty diff, all 15 targets resolve); `npm run lint` (oxlint, 0 warnings/0 errors) and `npm run check-types` (tsgo, clean). E2E not applicable — docs-only change.
- Deferred, intentionally undocumented here (follow-up slices): `--refresh-context` and any Context re-reading by analyze/augment.

## Blocked by

- #13 (Wire Inspection into chan init)
