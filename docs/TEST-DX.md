# Testing chan's developer experience

This guide walks you through manually testing chan's DX on a throwaway (or real) project. It covers both the original **manual** flow and the new **chan + AI** flow (`chan auto`, `chan analyze`, the post-commit hook, and the `chan release` breaking-change guard).

The fastest path is to test **inside the cowork Docker container**, where the native dependencies are already installed correctly. The exact same steps work on your host after reinstalling host deps for your platform (`rm -rf node_modules && npm install`).

## 0. Make `chan` available on PATH

Inside the container, `chan` is linked globally so it resolves to the live TypeScript source (edits to `packages/chan/src/*.ts` are picked up instantly — no rebuild):

```bash
docker compose exec chan-ai sh -c 'cd /workspace/packages/chan && npm link'
chan --version   # → 3.2.x
chan --help
```

On your host instead: `cd packages/chan && npm link` (after reinstalling host deps for macOS).

## 1. Create a throwaway project

```bash
docker compose exec chan-ai sh
mkdir -p /tmp/chan-dx && cd /tmp/chan-dx
git init && git config user.email you@test.com && git config user.name You
git config commit.gpgsign false
```

## 2. Configure AI

Create `.chanrc` in the project root. Opencode Zen is the provider most validated so far:

```json
{
  "ai": {
    "provider": "opencode",
    "model": "kimi-k2.6",
    "maxTokens": 1000,
    "endpoint": "https://opencode.ai/zen/v1"
  }
}
```

Export the key:

```bash
export OPENCODE_API_KEY=sk-...
```

To try other providers later, swap the `ai` block:

- `openai` + `OPENAI_API_KEY` (model e.g. `gpt-4o-mini`)
- `anthropic` + `ANTHROPIC_API_KEY` (model e.g. `claude-sonnet-4`)
- `ollama` — no key; requires `ollama serve` running on `localhost:11434` (model e.g. `llama3.1`)
- `openrouter` / `groq` / `together` / `google` are also registered

AI is considered **enabled** when `provider` + `model` resolve (from `.chanrc` or `--ai-provider`/`--ai-model`). There is no `--no-ai` toggle; remove `ai` from `.chanrc` to test the manual baseline.

## 3. Initialize + install the hook

```bash
chan init
chan hook install          # sets git core.hooksPath to .chan/hooks; installs post-commit
git add . && git commit -m "chore: init project"
```

Inspect `.chan/code.md` — you should see a `## Commit <sha>` entry with AI analysis. **This is the core DX moment: committing automatically builds the knowledge base.** `.chan/code.md` is meant to be committed and shared — `git add .chan/` to see how it feels as a shared artifact.

## 4. Do real work and feel the AI flow

Make a few commits with conventional-ish messages:

```bash
echo 'export const add = (a,b) => a+b' > math.js && git add . && git commit -m "feat: add math.add"
echo 'export const sub = (a,b) => a-b' >> math.js && git add . && git commit -m "feat: add sub"
# a breaking one:
echo 'export const add = (a,b,c) => a+b+c' > math.js && git add . && git commit -m "feat!: add requires third arg"
```

Each commit appends to `.chan/code.md` automatically via the post-commit hook.

## 5. `chan auto` — the headline feature

```bash
chan auto                         # infer action + message from HEAD
chan auto --commits <sha>,<sha>   # cover a range (simulates a PR's commits)
chan auto "rewrite add signature" # you give the message, AI infers only the action
```

Check **both** `CHANGELOG.md` (new entry under `### Added` / `### Changed`) **and** `.chan/code.md` (a `## Action <type>` marker linking the SHAs, with the precise AI `Classification` preserved). This is where you judge whether the inferred action + message feel natural.

## 6. `chan <action> 'msg'` with AI (augmented manual mode)

```bash
chan added "support for three-arg add"
```

With AI on, the message gets augmented/classified and a `## Action` marker is written. Compare with the manual baseline (see step 8).

## 7. `chan release` breaking-change guard

```bash
chan release 1.5.0          # should ERROR: a breaking commit exists but 1.5.0 isn't x.0.0
chan release 2.0.0          # should proceed (breaking-appropriate)
chan release 1.5.0 --ci     # should annotate instead of erroring (CI mode)
```

## 8. Compare with the manual flow (no-regression check)

Remove `ai` from `.chanrc` (or `unset OPENCODE_API_KEY` and use a provider without a key) and repeat:

- `chan added "..."` → unchanged manual behavior, writes only `CHANGELOG.md`
- `chan analyze` → no-op with a hint to configure AI
- `chan auto` → clear error: "`chan auto` requires AI to be configured"

This verifies the no-regression path and the clear AI-required errors.

## What to judge (the actual DX questions)

- Does the post-commit hook feel snappy or slow? (Each commit now makes an LLM call — latency matters.)
- Does `.chan/code.md` stay readable after 10–20 commits, or does it get noisy?
- Does `chan auto` infer the right `<action>` and a message you'd accept without editing?
- Does the breaking-change guard fire on the right things and stay quiet on non-breaking work?
- Does `chan auto --commits <prs-commits>` produce one sensible entry from multiple commits (the squash vs merge question)?
- Do you ever feel the urge to bypass AI? That tells you where the manual escape hatch matters.

## Tips

- **Iterating on chan itself while testing:** edits to `packages/chan/src/*.ts` are live immediately (tsx runs the TS source, and the workspace is bind-mounted into the container). No rebuild needed.
- **Test on a real project:** `cd` into that project, `npm link @geut/chan` (already linked globally in the container), add `.chanrc`, `chan hook install`, and work normally for an afternoon. That's the truest DX test.
- **`.chan/code.md` is meant to be committed** — add it to git in your test project to see how it feels as a shared artifact.
- **Provider coverage:** Opencode Zen is the most validated. OpenAI-direct, Anthropic-direct, and Ollama are still untested end-to-end — trying them is part of the HITL validation for issue 08.

## After the test

Anything rough you find becomes a follow-up issue (correlation tuning, prompt tweaks, the GitHub action). The one unchecked acceptance criterion on issue 08 is the HITL e2e validation: real commits → `chan analyze` → `chan auto`/`chan added` → `chan release` producing expected `CHANGELOG.md` and `code.md`. Once you've run that flow on a real provider, mark it done.
