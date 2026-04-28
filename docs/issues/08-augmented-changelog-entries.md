---
title: Augmented changelog entries with AI correlation
slice: 8
type: HITL
branch: agent-refactor
---

## What to build

Wire the AI module into the existing `chan added`/`changed`/`deprecated`/`removed`/`fixed`/`security` commands. When AI is enabled, correlate the user's change description with uncorrelated commit entries in `.chan/code.md` (most recent commits not yet linked to an action). Use the AI module to classify and augment the description (feature/breaking/security/performance). When AI is not configured, behavior is identical to pre-AI Chan.

Implement all 4 initial providers: OpenAI, Anthropic, Ollama (local), Opencode Zen.

## Acceptance criteria

- [ ] `chan added 'msg'` (and other action commands) query `.chan/code.md` for uncorrelated commits
- [ ] New `## Action <type>` entry created in `code.md` linking commit SHAs
- [ ] AI-enabled: description augmented with classification (feature, breaking, security, performance)
- [ ] AI-not-enabled: behavior identical to current Chan (no regression)
- [ ] All 4 providers implemented and tested with mocks
- [ ] Provider config validated at command invocation with clear error messages
- [ ] End-to-end HITL validation: real commits → analyze → added → release produces expected `CHANGELOG.md` and `code.md`

## Human-in-the-loop

This slice requires manual validation of the commit correlation heuristics in real-world usage. The developer should review:
- Whether commit-to-action correlation feels natural
- Whether AI augmentation quality is acceptable per provider
- Whether the `.chan/code.md` structure is maintainable over time

## Blocked by

- #7 (Commit analysis + knowledge base)

## Notes

After HITL validation, this slice may need iteration on:
- Correlation algorithm (time window, file overlap, manual selection)
- Prompt templates per provider
- Classification taxonomy
