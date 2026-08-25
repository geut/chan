---
title: Augmented changelog entries with AI correlation
slice: 8
type: HITL
branch: agent-refactor
---

## What to build

Wire the AI module into the existing `chan added`/`changed`/`deprecated`/`removed`/`fixed`/`security` commands, and add a new `chan --auto` mode that infers the `<action>` from commits. Correlate commits to `.chan/code.md` entries by SHA and record a `## Action <type>` marker linking them. When AI is not configured, the action commands behave identically to pre-AI Chan (no regression).

Register Ollama as a first-class named provider so the "4 initial providers" (OpenAI, Anthropic, Ollama, Opencode Zen) are explicit. Enhance `chan release <semver>` with AI to cross-check `code.md` for breaking changes against the passed semver.

A GitHub action is out of scope for this slice (follow-up issue) but the CLI modes must be designed so the action is a thin wrapper over the same commands.

## Design — working modes of chan

Two artifacts with different roles:

- `.chan/code.md` — committed, shared, append-only **knowledge base** of code changes (per-commit). Supports changelog enhancement and future querying of how a codebase evolved.
- `CHANGELOG.md` — consumer-facing, release-oriented, curated.

Two update paths for `code.md` (both documented in the README):

- **Local hook** — `chan hook install` → post-commit runs `chan analyze --auto` on every local commit. Keeps `code.md` current for the developer.
- **GitHub action** (follow-up issue) — runs on PR approval / merge to main, works with the PR's commits (1 if squashed, N if merge). Canonical shared update; the tool adapts to how the team merges.

### Command matrix

AI is considered enabled when `provider`, `model`, and an API key (env or config) are all present. There is no `--no-ai` toggle — if AI is configured, the action commands use it; if not, they behave as today.

| Command | AI | Behavior | Writes |
|---|---|---|---|
| `chan <action> 'msg'` | not configured | unchanged baseline (no regression) | `CHANGELOG.md` |
| `chan <action> 'msg'` | configured | augment message, classify, link `code.md` commits by SHA | `CHANGELOG.md` + `## Action` marker in `code.md` |
| `chan auto` | **required** | infer `<action>` + message from commits; default HEAD, accepts `--commits <sha,...>` | `CHANGELOG.md` + `## Action` marker |
| `chan auto 'msg'` | **required** | user supplies the message, AI infers only `<action>` | `CHANGELOG.md` + `## Action` marker |
| `chan analyze` | not configured | **no-op** (clear log message) | nothing |
| `chan analyze` | configured | analyze commits; default HEAD, `--gitSha <sha>` for a specific commit, `--commits <sha,...>` for several | `code.md` |
| `chan release <semver>` | not configured | unchanged | `CHANGELOG.md` |
| `chan release <semver>` | configured, no `--ci` | scan `code.md` since last release for breaking changes; **error** if semver doesn't reflect a breaking change (e.g. minor with a breaking → must be major) | — (errors) |
| `chan release <semver> --ci` | configured | same scan; instead of erroring, append a "possible breaking" note to the changelog | `CHANGELOG.md` |

`chan auto` is a **command** (not a `--auto` option) for better UX. `chan analyze --auto` is dropped (redundant); `chan analyze` with no `--gitSha`/`--commits` defaults to HEAD.

### Correlation

`chan auto` correlates the **given** commits (HEAD by default, or `--commits <sha,...>`) to `code.md` entries by SHA and links them in the `## Action` marker. No fuzzy "uncorrelated commits" heuristic — the GitHub action passes the PR commits explicitly, and the local default is simply HEAD. For plain `chan <action> 'msg'` + AI, the augmentation context defaults to the commits after the last `## Action` block in `code.md`, with `--commits` as an override.

### `## Action <type>` entry format

```markdown
## Action added

- **Date:** <iso>
- **Message:** <augmented or original>
- **Classification:** feature, breaking
- **Commits:** `0123456`, `fedcba0`
- **Group:** <optional>
```

### Category mapping (chan-ai ↔ keepachangelog)

`chan-ai` keeps its own, more precise category set in `CommitAnalysisResponse.category`: `Feature, Fix, Documentation, Refactor, Test, Chore, Style, Performance, Security`. Chan maps the AI category onto the keepachangelog verb used as `<action>` (`added`≈Feature, `changed`≈Changed/Refactor/Performance, `deprecated`≈Deprecated, `removed`≈Removed, `fixed`≈Fix, `security`≈Security). The original AI category is preserved in the `## Action` marker's `Classification` line so the precise taxonomy is not lost and can be expanded in the future.

### Ways to use chan (to be documented in the README)

- **Manual usage (the original way, unchanged)** — `chan <action> 'msg'` curates `CHANGELOG.md` by hand. Works without AI exactly as before.
- **chan + AI (the new way)** — chan becomes a subtle tool; manually noting changes is not needed. `.chan/code.md` plus the `chan hook install` post-commit hook build the codebase's release knowledge automatically. `chan auto` turns commits into a curated changelog entry, and `chan release <semver>` validates releases against that knowledge. The upcoming GitHub action (follow-up issue) runs `chan analyze` on merge and calls `chan auto` to keep the changelog automatically updated and valid.

## Acceptance criteria

- [x] `chan <action> 'msg'` with AI configured augments the description, classifies it, and links `code.md` commits by SHA
- [x] `chan auto` (command, not option) infers `<action>` + message from commits (HEAD default, `--commits <sha,...>` override); `chan auto 'msg'` supplies the message, AI infers only the action; requires AI with a clear error otherwise
- [x] New `## Action <type>` entry created in `code.md` linking commit SHAs, with the precise AI `Classification` preserved
- [x] AI-not-enabled: `chan <action> 'msg'` behavior identical to current Chan (no regression)
- [x] `chan analyze` without AI is a no-op (clear log); with AI defaults to HEAD, `--gitSha`/`--commits` for specific commits (no `--auto` option)
- [x] `chan release <semver>` with AI and no `--ci`: errors on a breaking change not reflected in semver; with `--ci`: appends a "possible breaking" note instead
- [x] Ollama registered as a first-class named provider (OpenAI, Anthropic, Ollama, Opencode Zen all explicit)
- [x] All 4 providers tested with mocks
- [x] Provider config validated at command invocation with clear error messages
- [x] README documents the two ways to use chan (manual unchanged; chan + AI with code.md + hook + planned GitHub action) and the command matrix
- [ ] End-to-end HITL validation: real commits → analyze → `chan auto`/`added` → release produces expected `CHANGELOG.md` and `code.md` *(pending manual run against real providers)*
- [x] `npm run lint` passes with oxlint
- [x] `npm run check-types` passes with tsgo

## Implementation notes

- **`@geut/chan-ai`**: new `createAugmenter(config)` → `augmentFn({ message?, commitShas, codeMdContext })` returning an `ActionAugmentationResponse` (`action` keepachangelog verb, `message`, `classification` precise chan-ai category[], `linkedShas`, `breakingChange`, `breakingDetails`, `confidence`). `ollama` registered in `DEFAULT_PROVIDERS` (`http://localhost:11434/v1`, dummy apiKey). Re-exports `createAugmenter`, `ActionAugmentationResponse`, `MockProvider`, `CHAN_ACTIONS`.
- **`packages/chan/src/categories.ts`**: `aiCategoryToAction` / `classificationToAction` map the precise chan-ai taxonomy onto the 6 keepachangelog verbs; the original category is preserved in the `## Action` `Classification` line.
- **`packages/chan/src/code-md.ts`**: `formatActionEntry` + `appendActionEntry` (atomic), `commitsSinceLastAction` (correlation: commits after the last `## Action` block), `codeMdContextForShas` (builds the augmenter prompt context), `scanBreakingChanges` (for `chan release`). `formatEntry` now writes `Breaking change: yes` + `Breaking confidence:` lines so the scan regex can find them.
- **`packages/chan/src/ai-config.ts`**: `resolveAiConfig(flags)` merges `.chanrc` `ai.*` with CLI flags; AI is enabled when provider + model resolve. `createAugmenterFromConfig` / `createAnalyzerFromConfig`.
- **`packages/chan/src/commands/auto.ts`**: new `chan auto [message]` command + exported `runAuto`. Requires AI (clear error otherwise). Writes `CHANGELOG.md` (via `addChanges`) and a `## Action` marker in `code.md`.
- **`packages/chan/src/commands/actions.ts`**: action commands now augment + classify + link commits when AI is configured (via extracted `runAction`); without AI, unchanged. Added `--commits` flag.
- **`packages/chan/src/commands/analyze.ts`**: dropped `--auto`; without AI → no-op; defaults to HEAD; added `--commits`.
- **`packages/chan/src/commands/release.ts`**: added `--ci` flag and the AI breaking-change guard (scans `code.md`; errors locally, annotates with `--ci`).
- **README**: new "Ways to use chan" section (manual vs chan + AI), command matrix, `chan auto` / `chan analyze` / `chan hook` command sections, `--ci` option, AI config example.
- **Tests (mock-based, run in the cowork Docker container)**: `categories.test.ts`, extended `code-md.test.ts` (action entries, correlation, breaking scan), `auto.test.ts` (`runAuto` via `MockProvider`), `actions.test.ts` (no-AI + AI `runAction`), `release.test.ts` (breaking guard: errors / `--ci` annotates / `x.0.0` proceeds), chan-ai `augment` mock tests, ollama registration test. 74 tests passing across the monorepo.
- The HITL e2e validation against real providers (Opencode Zen / OpenAI-direct / Anthropic-direct / Ollama) is left for the developer. The GitHub action is a follow-up issue.
- Host `node_modules` had wrong-platform native binaries (the cowork-mode problem); tests were run inside the `chan-ai-cowork` container where deps are correct.

## Human-in-the-loop

This slice requires manual validation of the commit correlation and AI augmentation in real-world usage. The developer should review:
- Whether commit-to-action correlation feels natural
- Whether AI augmentation quality is acceptable per provider (validated manually against Opencode Zen so far; OpenAI-direct, Anthropic-direct, and Ollama still untested)
- Whether the `.chan/code.md` structure is maintainable over time
- Whether the `chan release` breaking-change check triggers correctly on real releases

## Blocked by

- #7 (Commit analysis + knowledge base)

## Notes

After HITL validation, this slice may need iteration on:
- Correlation defaults (time window, file overlap, manual selection)
- Prompt templates per provider
- Classification taxonomy
- The GitHub action (follow-up issue) wrapping `chan analyze` + `chan --auto` + `chan release` for CI
