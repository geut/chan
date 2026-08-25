# Chan CLI

[![Build Status](https://travis-ci.org/geut/chan.svg?branch=master)](https://travis-ci.org/geut/chan)
[![npm version](https://badge.fury.io/js/%40geut%2Fchan.svg)](https://badge.fury.io/js/%40geut%2Fchan)

Chan is a likeable CLI tool used for writing and maintaining a CHANGELOG empowering the user to use a coloquial/friendly style.
See more here: [keepachangelog.com](http://keepachangelog.com/)

![chan](https://github.com/geut/chan/raw/main/assets/example.gif)

- [Getting started](#install)
- [Ways to use chan](#ways-to-use-chan)
- [Usage](#usage)
- Commands
  - [`chan init`](#command-init)
  - [`chan <action>`](#command-action)
  - [`chan auto`](#command-auto)
  - [`chan analyze`](#command-analyze)
  - [`chan hook`](#command-hook)
  - [`chan release`](#command-release)
  - [`chan gh-release`](#command-gh-release)
  - [`chan show`](#command-show)
- [Global options](#global-options)
  - [Configure with `package.json`](#config-package-json)
- [Issues](#issues)
- [Contribute](#contribute)

## <a name="install"></a> Getting started

Install:

```bash
$ npm install -g @geut/chan
```

## <a name="ways-to-use-chan"></a> Ways to use chan

Chan has two ways of being used. Both share the same `CHANGELOG.md` (consumer-facing, release-oriented) and the same commands.

### Manual usage (the original way, unchanged)

You curate `CHANGELOG.md` by hand using `chan <action> 'msg'` and `chan release <semver>`. This works exactly as it always has — no AI configuration required.

```bash
$ chan init
$ chan added "New feature in my API to print foo in the console."
$ chan release 0.0.1
```

If you never configure AI, chan behaves identically to pre-AI Chan.

### chan + AI (the new way)

With AI configured, chan becomes a subtle tool: manually noting changes is no longer needed. Two artifacts work together:

- **`CHANGELOG.md`** — the consumer-facing changelog you already know.
- **`.chan/code.md`** — an append-only, committed **knowledge base** of code changes (one entry per commit). It supports changelog enhancement and can be queried in the future to understand how the codebase evolved.

The post-commit hook keeps `.chan/code.md` up to date automatically:

```bash
$ chan hook install   # sets git core.hooksPath to .chan/hooks and installs a post-commit hook
```

After that, every local commit runs `chan analyze` and appends a structured entry to `.chan/code.md`. `.chan/code.md` is meant to be **committed and shared** with the team — it is the project's release knowledge.

Instead of hand-writing changelog entries, let AI infer them from commits:

```bash
$ chan auto                 # infer <action> + message from HEAD, update CHANGELOG.md and code.md
$ chan auto "Add foo API"   # you provide the message, AI infers the action
$ chan auto --commits abc123,def456   # work with specific commits (e.g. a PR's commits)
```

At release time, `chan release` cross-checks `.chan/code.md` for breaking changes against the semver you pass:

```bash
$ chan release 1.0.0        # errors locally if a breaking change is not reflected in the semver
$ chan release 1.5.0 --ci   # in CI: annotates the changelog with a "possible breaking" note instead of erroring
```

#### Configuring AI

AI is considered **enabled** when a `provider` and a `model` are configured (in `.chanrc` under `ai`, or via `--ai-provider`/`--ai-model` flags). The API key is resolved by the provider from the environment (e.g. `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENCODE_API_KEY`, `GOOGLE_API_KEY`). There is no `--no-ai` toggle — if AI is configured, the action commands use it; if not, they behave as today.

Example `.chanrc`:

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

Supported providers: `openai`, `anthropic`, `ollama` (local, `http://localhost:11434/v1`), `opencode` (Opencode Zen), plus `openrouter`, `groq`, `together`, `google`. Any other provider name falls back to OpenAI-compatible handling using the configured `endpoint` as `baseUrl` (useful for local servers and proxies).

#### GitHub action (planned)

A GitHub action is planned as a follow-up. It will run `chan analyze` when a PR is approved/merged to main, call `chan auto --commits <pr-commits>` to keep the changelog updated, and run `chan release <semver>` at release time. The action is a thin wrapper over the same CLI commands described here — the tool adapts to how your team merges (1 commit if squashed, N if merge).

#### Command matrix

| Command | AI | Behavior | Writes |
|---|---|---|---|
| `chan <action> 'msg'` | not configured | unchanged manual behavior | `CHANGELOG.md` |
| `chan <action> 'msg'` | configured | augment message, classify, link `code.md` commits by SHA | `CHANGELOG.md` + `## Action` marker in `code.md` |
| `chan auto [message]` | **required** | infer `<action>` (+ message if not given); default HEAD, `--commits <sha,...>` override | `CHANGELOG.md` + `## Action` marker |
| `chan analyze` | not configured | no-op (clear log) | nothing |
| `chan analyze` | configured | analyze commits; default HEAD, `--gitSha <sha>` / `--commits <sha,...>` for specific commits | `code.md` |
| `chan release <semver>` | not configured | unchanged | `CHANGELOG.md` |
| `chan release <semver>` | configured, no `--ci` | error on a breaking change not reflected in the semver | — (errors) |
| `chan release <semver> --ci` | configured | append a "possible breaking" note instead of erroring | `CHANGELOG.md` |

## <a name="usage"></a> Usage

Create a CHANGELOG.md file in your project root folder with:

```bash
$ chan init
```

To add entries to your CHANGELOG use the command that describes better your change (`added`, `changed`, `fixed`, etc)

```bash
$ chan added "New feature in my API to print foo in the console."
```

This command will modify your CHANGELOG creating a new entry called `added` under the `Unreleased` section.

> `chan` follows the [keepachangelog.com](http://keepachangelog.com/) format/style.

Release your changes:

```bash
$ chan release 0.0.1
```

And you will get something like:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## 0.0.1 - 2019-01-11

### Added

- New feature in my API to print foo in the console.

[Unreleased]: https://github.com/my-org/my-repo/compare/v0.0.1..HEAD
```

## <a name="command-init"></a>`chan init [dir]`

Creates a `CHANGELOG.md` if it does not exists. Chan will work with this file.

### Options

#### `[dir]` (`string`)

Allows you to run init in a specific directory: `chan init packages/package-one`.

#### `-o, --overwrite` (`boolean`)

Overwrite the current CHANGELOG.md

## <a name="command-action"></a>`chan <action> <msg>`

Create new entries with the `<msg>` in your changelog under the release: _Unreleased_

`<action>` could be:

- **added**
  Writes your changelog indicating new stuff.

- **fixed**
  Writes your changelog indicating fixed stuff.

- **changed**
  Writes your changelog indicating updated stuff.

- **security**
  Writes your changelog indicating security upgrades.

- **removed**
  Writes your changelog indicating removed stuff.

- **deprecated**
  Writes your changelog indicating deprecated stuff.

### Options

#### `-p, --path` (`string`)

Define the path of the CHANGELOG.md (cwd by default).

#### `-g, --group` (`string`)

Prefix change with provided group value.

Example:

```bash
chan added --group=packages/package-one 'New stuff added'
```

will add to you changelog unreleased changes:

```markdown
### Added

- packages/package-one
  - New stuff added.
```

> This could be a good option to work with a monorepo and root changelog.

## <a name="command-release"></a>`chan release <semver>`

Marks the unreleased changes as a new release in your changelog.

Keep a changelog defines that each release can have a compare preview url like: https://help.github.com/articles/comparing-commits-across-time/

By default, chan will try to generate it automatically from your `.git` local directory, but you can change this behaviour. Check the next options.

### Options

#### `<semver>` (`string`)

Valid semver version.

#### `-p, --path` (`string`)

Define the path of the CHANGELOG.md (cwd by default).

#### `--yanked` (`boolean`)

Marks the release as a [yanked](https://keepachangelog.com/en/1.0.0/#yanked) version.

#### `--git-url` (`string`)

You can provide the git url of your project so chan can tries to find the git provider to generate the url compare for your releases.

Example:
`https://github.com/geut/chan`
will generate releases with the url:
`https://github.com/geut/chan/compare/v0.0.1..HEAD`

> Also, this kind of configurations can be defined in the [package.json](#config-package-json).

#### `--git-template` (`string`)

If `--git-url` is not enough you can define the template url to compare your releases.

Example:
`https://otherhost.com/geut/chan/compare/[prev]...[next]`
will generate releases with the url:
`https://otherhost.com/geut/chan/compare/v0.0.1..HEAD`

#### `--git-branch` (`string`)

Defines which branch chan is going to use to compare the unreleased version.

Example:
`chan release 0.0.1 --git-branch master`
will generate releases with the url:
`https://github.com/geut/chan/compare/v0.0.1..master`

#### `--release-prefix` (`string`)

You can provide a custom release prefix fitting your project release process. (`v` by default).

Example:
`V`
will generate releases with the url:
`https://github.com/geut/chan/compare/V0.0.1..HEAD`

> Also, this kind of configurations can be defined in the [package.json](#config-package-json).

#### `--allow-yanked` (`boolean`)

Allow yanked releases. When this option is true and the release doesn't have new changes it will released as a yanked version.

#### `--allow-prerelease` (`boolean`)

Allow prerelease versions.

#### `--merge-prerelease` (`boolean`)

Merge the prerelease versions into the next stable version.

#### `--ghrelease` (`boolean`)

Creates a github release.

By default it opens the browser with the github release to edit and accept.

If you define the env [GITHUB_TOKEN](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line) it will publish the release directly, _best option for CI_.

#### `--ci` (`boolean`)

CI mode for the AI breaking-change guard. When AI is enabled and `chan release` detects a breaking change in `.chan/code.md` that the passed semver does not reflect (e.g. a `1.5.0` minor while a commit was flagged breaking), the default (local) behavior is to **error out** so you can bump to a breaking-appropriate version. With `--ci`, chan instead **annotates** the changelog with a "possible breaking" note and continues — useful in CI where you want the release to proceed with a warning.

## <a name="command-gh-release"></a>`chan gh-release <semver>`

Creates a github release.

### Options

#### `--git-url` (`string`)

Define the url of the repository project.

#### `--release-prefix` (`string`)

You can provide a custom release prefix fitting your project release process. (`v` by default).

Example:
`V`
will generate releases with the url:
`https://github.com/geut/chan/compare/V0.0.1..HEAD`

> Also, this kind of configurations can be defined in the [package.json](#config-package-json).

## <a name="command-show"></a>`chan show <semver>`

Shows the release notes for a specific version.

## <a name="command-analyze"></a>`chan analyze`

Analyzes commits and appends structured entries to the append-only `.chan/code.md` knowledge base.

- Requires AI to be configured. Without AI, `chan analyze` is a no-op (it logs a hint to configure AI).
- By default analyzes HEAD (this is the path used by the `chan hook install` post-commit hook).
- Use `--gitSha <sha>` for a specific commit, or `--commits <sha,sha,...>` for several.
- Use `--limit <n>` to analyze the last `n` commits from the log (default `1`).

### Options

#### `--gitSha <sha>` (`string`)

Analyze a specific commit.

#### `--commits <sha,sha,...>` (`string`)

Analyze a comma-separated list of commits.

#### `--limit <n>` (`number`, default `1`)

Max number of commits to read from the git log when no `--gitSha`/`--commits` is given.

#### AI options

`--ai-provider`, `--ai-model`, `--ai-max-tokens`, `--ai-endpoint` override the `.chanrc` `ai.*` values.

## <a name="command-auto"></a>`chan auto [message]`

Infers the `<action>` and the changelog entry from commits using AI, and updates both `CHANGELOG.md` and `.chan/code.md`. **Requires AI to be configured.**

- Without a `[message]`, AI infers both the action and the message from the commits.
- With a `[message]`, you provide the changelog line and AI infers only the action (and augments/classifies your message).
- Defaults to HEAD. Use `--commits <sha,sha,...>` to target specific commits (e.g. a PR's commits).

```bash
$ chan auto                      # infer action + message from HEAD
$ chan auto "Add foo API"        # you provide the message, AI infers the action
$ chan auto --commits abc123,def456
```

### Options

#### `[message]` (`string`)

Optional change message. If provided, AI infers only the action.

#### `--commits <sha,sha,...>` (`string`)

Comma-separated commit SHAs (defaults to HEAD).

#### `-p, --path` (`string`)

Path of the CHANGELOG.md (cwd by default).

#### `-g, --group` (`string`)

Prefix the change with `[<group>]`. Allows grouping changes at release time.

#### AI options

`--ai-provider`, `--ai-model`, `--ai-max-tokens`, `--ai-endpoint` override the `.chanrc` `ai.*` values.

## <a name="command-hook"></a>`chan hook <action>`

Installs or uninstalls chan's git hooks.

- `chan hook install` creates `.chan/hooks/post-commit` (which runs `chan analyze`) and sets `git config core.hooksPath .chan/hooks`. After this, every local commit appends an entry to `.chan/code.md`.
- `chan hook uninstall` removes the post-commit hook and unsets `core.hooksPath`.

### Options

#### `<action>` (`install` | `uninstall`, required)

#### `-p, --path` (`string`)

Path to the git repository (cwd by default).

## <a name="global-options"></a> Global options

### `--stdout` (`boolean`)

Define the output as STDOUT

### `--verbose` (`boolean`)

Show more info on error

### `--help` (`boolean`)

Show help

### `--version` (`boolean`)

Show version number

## <a name="config"></a> Configuration

You can configure the chan options using the `package.json` or a rc file (`.chanrc`, `.chanrc.json`):

.chanrc

```json
{
  "git-url": "https://github.com/geut/chan",
  "release-prefix": "v",
  "ai": {
    "provider": "AIPROVIDER",
    "model": "AIMODEL",
    "maxTokens": 5000,
    "endpoint": "https://api.openai.com/v1"
  }
}
```

package.json

```json
{
  "chan": {
    "git-url": "https://github.com/geut/chan",
    "release-prefix": "v",
    "ai": {
      "provider": "AIPROVIDER",
      "model": "AIMODEL"
    }
  }
}
```

## <a name="issues"></a> ISSUES

If you found an issue we encourage you to report it on [github](https://github.com/geut/chan/issues). Please specify your OS and the actions to reproduce it.

## <a name="contribute"></a> CONTRIBUTE

Ideas and contributions to the project are welcome. You must follow this [guideline](https://github.com/geut/chan/blob/master/CONTRIBUTING.md).

---

A [**GEUT**](http://geutstudio.com/) project