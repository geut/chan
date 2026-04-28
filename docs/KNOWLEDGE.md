# Chan Codebase Analysis

## Project Overview

**Chan** is a CLI tool and library ecosystem for writing and maintaining CHANGELOG.md files following the [Keep a Changelog](https://keepachangelog.com/) format. It provides a command-line interface for adding changes, creating releases, and managing changelog files in a structured way.

- **Repository**: https://github.com/geut/chan
- **License**: ISC
- **Author**: GEUT (contact@geutstudio.com)
- **Current Version**: 3.2.6–3.2.9 (packages), 3.2.8 (monorepo root)

## Architecture

### Monorepo Structure

The project uses a monorepo structure managed by:
- **npm Workspaces**: For package management (migrated from Yarn Workspaces)
- **Lerna**: Removed — publishing and versioning are no longer managed by Lerna

### Technology Stack

- **Language**: JavaScript (ES Modules, `"type": "module"`)
- **Runtime**: Node.js (>=12.22.1 || >=14.13.0)
- **Core Dependencies**:
  - `unified` - Unified interface for processing text
  - `remark-parse` - Markdown parser
  - `yargs` - CLI argument parsing
  - `semver` - Semantic versioning
  - `unist-util-select` - Tree selection utilities
  - `vfile` - Virtual file format for text processing

## Package Structure

The codebase is organized into 6 packages under `/packages/`:

### 1. `@geut/chan` (CLI Package)
**Location**: `packages/chan/`
**Purpose**: End-user command-line interface

**Key Files**:
- `bin/chan.js` - CLI entry point using yargs
- `src/commands/index.js` - Command registry
- `src/commands/init.js` - Initialize CHANGELOG.md
- `src/commands/actions.js` - Add changes (added, changed, fixed, etc.)
- `src/commands/release.js` - Create releases
- `src/commands/gh-release.js` - GitHub release integration
- `src/commands/show.js` - Show release notes
- `src/config.js` - Configuration loader (reads `.chanrc` or `.chanrc.json`)
- `src/logger.js` - Logging utilities using signale
- `src/vfs.js` - Virtual file system helpers
- `src/open-in-editor.js` - Interactive editor support

**Commands**:
- `chan init [dir]` - Initialize CHANGELOG.md
- `chan added [message]` - Add "Added" change
- `chan changed [message]` - Add "Changed" change
- `chan deprecated [message]` - Add "Deprecated" change
- `chan removed [message]` - Add "Removed" change
- `chan fixed [message]` - Add "Fixed" change
- `chan security [message]` - Add "Security" change
- `chan release <semver>` - Create a release
- `chan gh-release <semver>` - Upload GitHub release
- `chan show <semver>` - Show release notes

### 2. `@geut/chan-core` (Core API)
**Location**: `packages/chan-core/`
**Purpose**: Core transformation API and changelog processing

**Key Files**:
- `src/index.js` - Main API exports (`initialize`, `addChanges`, `addRelease`, `getMarkdownRelease`)
- `src/transformer.js` - AST transformation logic

**Pipeline Architecture**:
```
Markdown → remark-parse → remark-chan (mdast → chast) → 
transformer → chan-stringify (chast → markdown) → Output
```

**API Functions**:
- `initialize(from, opts)` - Create initial changelog
- `addChanges(from, opts)` - Add changes to unreleased section
- `addRelease(from, opts)` - Create a new release version
- `getMarkdownRelease(from, { version })` - Extract specific release as markdown

### 3. `@geut/chast` (AST Specification)
**Location**: `packages/chast/`
**Purpose**: Custom AST (Abstract Syntax Tree) specification for changelogs

**Key Files**:
- `src/index.ts` - Node constructors (migrated to TypeScript)
- `src/actions.ts` - Valid action types enum (migrated to TypeScript)

**Node Types**:
- `root` - Root container
- `preface` - Keep a Changelog header/preface
- `release` - Version release block
- `action` - Change category (Added, Changed, Fixed, etc.)
- `group` - Grouped changes
- `change` - Individual change entry

**Valid Actions**: Added, Changed, Deprecated, Removed, Fixed, Security

### 4. `@geut/remark-chan` (Parser)
**Location**: `packages/remark-chan/`
**Purpose**: Parse markdown (mdast) into chast format

**Key Files**:
- `src/index.js` - `remarkToChan()` plugin

**Functionality**:
- Parses Keep a Changelog formatted markdown
- Extracts preface, releases, actions, groups, and changes
- Handles link references for version comparisons
- Supports yanked releases
- Supports unreleased sections

### 5. `@geut/chan-stringify` (Compiler)
**Location**: `packages/chan-stringify/`
**Purpose**: Compile chast back to Keep a Changelog markdown

**Key Files**:
- `src/index.js` - Stringify plugin

**Functionality**:
- Compiles chast tree to markdown
- Generates version headings with links
- Formats action categories
- Handles yanked release markers
- Generates reference definitions for URLs

### 6. `@geut/git-url-parse` (Git Integration)
**Location**: `packages/git-url-parse/`
**Purpose**: Parse git URLs and generate compare/release templates

**Key Files**:
- `src/index.ts` - URL parsing and template generation (migrated to TypeScript)

**Supported Providers**:
- GitHub
- GitLab
- Bitbucket

**Functionality**:
- Reads git config from `.git` directory
- Generates compare URLs (e.g., `/compare/v1.0.0...v2.0.0`)
- Generates release URLs

## Data Flow

### Adding a Change

```
User runs: chan added "New feature"
  ↓
chan CLI parses arguments
  ↓
Reads CHANGELOG.md into vfile
  ↓
Calls addChanges() from chan-core
  ↓
Pipeline:
  1. remark-parse → mdast
  2. remark-chan → chast
  3. transformer adds change to unreleased release
  4. chan-stringify → markdown
  ↓
Write back to CHANGELOG.md
```

### Creating a Release

```
User runs: chan release 1.0.0
  ↓
CLI validates semver
  ↓
Git URL parsing (optional, for compare links)
  ↓
Calls addRelease() from chan-core
  ↓
Transformer:
  - Validates version
  - Moves unreleased changes to new release
  - Creates new unreleased section
  - Generates compare URLs
  - Handles prereleases/yanked releases
  ↓
Stringify and write
```

## Testing Strategy

### Test Framework
- **Vitest**: Primary test runner at the root and for modernized packages (`chast`, `git-url-parse`)
- **Jest** with ESM support (`NODE_OPTIONS=--experimental-vm-modules`): Still used in legacy packages (`chan`, `chan-core`, `chan-stringify`, `remark-chan`)
- ~~**Custom resolver**: `jest-module-resolver.js`~~ — removed

### Test Coverage by Package

| Package | Tests | Coverage |
|---------|-------|----------|
| `@geut/chan` | ✅ | Unit tests for command structure |
| `@geut/chan-core` | ✅ | Snapshot tests for releases, changes, initialization |
| `@geut/remark-chan` | ✅ | Snapshot tests for parsing |
| `@geut/chan-stringify` | ✅ | Snapshot tests for compilation |
| `@geut/chast` | ❌ | No tests (lint only) |
| `@geut/git-url-parse` | ✅ | Vitest tests (added during TS migration) |

### Test Files

**chan package**:
- `tests/actions.test.js` - Command structure validation
- `tests/init.test.js` - Initialize command tests
- `tests/release.test.js` - Release command tests
- `tests/show.test.js` - Show command tests
- `tests/gh-release.test.js` - GitHub release tests

**chan-core package**:
- `tests/initialize.test.js` - Initialization logic
- `tests/add-changes.test.js` - Adding changes
- `tests/release.test.js` - Release creation
- `tests/get-markdown-release.test.js` - Markdown extraction

**remark-chan package**:
- `tests/index.test.js` - Parsing tests

**chan-stringify package**:
- `test/index.test.js` - Compilation tests

**chast package**:
- `tests/index.test.ts` - TypeScript node constructor tests

**git-url-parse package**:
- `tests/index.test.ts` - TypeScript URL parsing tests

## CI/CD

**GitHub Actions**: `.github/workflows/node-ci.yml`
- Runs on: push/PR to `main` branch
- Node versions: 12.x, 14.x, 16.x
- OS matrix: Ubuntu, macOS, Windows
- Steps: checkout → setup-node → ~~yarn install → yarn test~~
- **Note**: CI workflow is currently outdated — it still references `yarn` commands while the repo has migrated to `npm` and `vitest`

## Dependencies and Version Management

### Package Versions
Packages are mostly versioned in sync:
- `@geut/chan`: **3.2.9**
- `@geut/chan-core`: **3.2.7**
- `@geut/chan-stringify`: **3.2.7**
- `@geut/chast`: **3.2.6**
- `@geut/remark-chan`: **3.2.6**
- `@geut/git-url-parse`: **3.2.6**

### Inter-Package Dependencies
```
chan → chan-core, git-url-parse
chan-core → chast, remark-chan, chan-stringify
remark-chan → chast
chan-stringify → (no internal deps)
git-url-parse → (no internal deps)
```

### Dependency Updates (Recent)
- `@geut/chast`: upgraded `unist-builder` to `^4.0.0`, `semver` to `^7.7.4`
- `@geut/git-url-parse`: rewritten — now uses `find-up` ^8.0.0, `ini` ^1.3.8, `parse-github-url` ^1.0.4 (removed `git-url-parse` and `gitconfiglocal`)
- `@geut/chan-stringify`: still on older `unist-util-remove-position` ^1.1.2 (potential compatibility issue with other packages on v4.x)

### External Dependencies

**Core Processing**:
- `unified` ^9.2.1 - Text processing framework
- `remark-parse` ^9.0.0 - Markdown parser
- `mdast-util-to-markdown` ^0.6.5 - Markdown serializer
- `unist-builder` ^4.0.0 / ^3.0.0 / ^1.0.3 - AST node builder (mixed versions across packages)
- `unist-util-select` ^4.0.0 / ^2.0.0 - Tree selection
- `unist-util-remove-position` ^4.0.0 / ^1.1.2 - Position removal

**CLI**:
- `yargs` ^17.0.1 - Argument parsing
- `signale` ^1.4.0 - Logging
- `boxen` ^5.0.1 - Terminal boxes
- `open` ^8.2.0 - Open URLs
- `to-vfile` ^6.1.0 - File I/O
- `find-up` ^5.0.0 / ^8.0.0 - File finding (mixed versions)
- `editor` ^1.0.0 - External editor support
- `tempfile` ^4.0.0 - Temp file creation

**Utilities**:
- `semver` ^7.7.4 / ^7.3.5 - Version parsing/comparison
- `parse-github-url` ^1.0.4 - Git URL parsing
- `ini` ^1.3.8 - Git config reading
- `new-github-release-url` ^1.0.0 - GitHub release URLs

**GitHub Integration**:
- `@actions/github` ^5.0.0 - GitHub API client

## Key Observations and Potential Issues

### Strengths
1. **Clean Architecture**: Well-separated concerns with distinct packages
2. **AST-based Processing**: Using unified/remark provides robust markdown handling
3. **ESM-first**: Modern JavaScript module system
4. **Comprehensive CLI**: Good UX with interactive editor support
5. **Git Integration**: Automatic URL generation for major providers

### Recent Modernization Efforts

#### 1. Migration from Yarn + Lerna to npm
- Removed `lerna.json` and `yarn.lock`
- Added `package-lock.json`
- Root `package.json` now defines npm workspaces (`"workspaces": { "packages": ["packages/*"] }`)

#### 2. Partial Migration to TypeScript
- `packages/chast/` and `packages/git-url-parse/` converted to TypeScript (`.ts` sources)
- Introduced `tsgo` (`@typescript/native-preview`) for fast type-checking and compilation
- Root `tsconfig.json` uses project references for each package
- Type definitions exported from `chast` (e.g., `ReleaseNode`, `PrefaceNode`, `Actions`)

#### 3. Testing & Linting Overhaul (Partial)
- Root test runner changed from Jest to **Vitest**
- Modernized packages (`chast`, `git-url-parse`) use `vitest run`
- Legacy packages (`chan`, `chan-core`, `chan-stringify`, `remark-chan`) still on Jest
- Root linter changed from Standard to **oxlint**
- Modernized packages use `oxlint` / `oxfmt`
- Legacy packages still use `standard`
- Added `.oxlintrc.json` and `.oxfmtrc.json` configuration files

### Areas for Improvement

#### 1. Dependency Version Conflicts
`chan-stringify/package.json` has mixed versions of unist utilities:
```json
"unist-util-remove-position": "^1.1.2",
```
Other packages use v4.x, which could cause compatibility issues.

#### 2. Error Handling
- Some async errors are silently caught (e.g., `openInEditor`)
- Logger modifies `process.exitCode` directly which may have side effects

#### 3. Git Config Reading
- Synchronous file operations in `gitUrlParse` could block
- Error handling returns `null` which may not distinguish between different failure modes

#### 4. Legacy ES5 Folder
- `es5/` directory exists with older transpiled code
- Appears to be legacy/unused but still in repo

#### 5. CI/CD Out of Sync
- `.github/workflows/node-ci.yml` still uses `yarn` and tests against Node 12.x/14.x/16.x
- Needs updating to `npm ci`, modern Node versions, and current test commands

#### 6. Incomplete Tooling Migration
- Only 2 of 6 packages migrated to TypeScript + Vitest + oxlint
- Mixed tooling increases maintenance overhead

### Code Patterns

#### Assertion-Based Validation
Heavy use of `assert` module for runtime validation in chast:
```javascript
assert(identifier, 'The `identifier` of the release is required.')
assert(Object.values(actions).includes(name), 'The `name` prop to create an action is not valid.')
```

#### VFile Pattern
Uses vfile extensively for handling text with metadata:
```javascript
const file = await toVFile.read(path)
await addChanges(file, { changes: [...] })
await toVFile.write(file)
```

#### Unified Plugin Pattern
All transformations follow unified ecosystem patterns:
```javascript
export function remarkToChan () {
  return tree => {
    // Transform and return new tree
  }
}
```

## File Structure Summary

```
/Users/deka/Projects/geut/chan/
├── package.json                    # Root package, npm workspaces config
├── package-lock.json               # npm lockfile
├── tsconfig.json                   # TypeScript project references
├── .oxlintrc.json                  # oxlint configuration
├── .oxfmtrc.json                   # oxfmt configuration
├── .github/workflows/node-ci.yml   # GitHub Actions CI (outdated — still uses yarn)
├── .travis.yml                     # Travis CI (legacy)
├── README.md                       # Project documentation
├── CHANGELOG.md                    # Project changelog
├── CONTRIBUTING.md                 # Contribution guidelines
├── LICENSE                         # ISC license
├── assets/
│   └── example.gif                 # Demo asset
├── docs/                           # Documentation (this file)
├── es5/                            # Legacy transpiled code
│   ├── index.js
│   ├── api/
│   └── parser/
├── node_modules/                   # Dependencies
└── packages/
    ├── chan/                       # CLI tool
    │   ├── bin/chan.js
    │   ├── src/
    │   │   ├── commands/
    │   │   ├── config.js
    │   │   ├── logger.js
    │   │   ├── vfs.js
    │   │   └── open-in-editor.js
    │   └── tests/
    ├── chan-core/                  # Core API
    │   ├── src/
    │   │   ├── index.js
    │   │   └── transformer.js
    │   └── tests/
    ├── chast/                      # AST spec (TypeScript)
    │   ├── src/
    │   │   ├── index.ts
    │   │   └── actions.ts
    │   └── node_modules/
    ├── remark-chan/                # Parser
    │   ├── src/index.js
    │   └── tests/
    ├── chan-stringify/             # Compiler
    │   ├── src/index.js
    │   └── test/
    └── git-url-parse/              # Git integration (TypeScript)
        └── src/index.ts
```

## Build and Development

### Available Scripts

**Root level**:
- `npm test` - Run Vitest across the monorepo
- `npm run posttest` - Runs lint after tests
- `npm run lint` - Run oxlint (root-level)
- `npm run lint:fix` - Fix linting issues with oxlint
- `npm run check-types` - Type-check all packages via `tsgo --noEmit`

**Package level** (modernized packages: `chast`, `git-url-parse`):
- `npm test` - Run Vitest tests
- `npm run lint` - Run oxlint
- `npm run fmt` - Run oxfmt
- `npm run check-types` - Type-check via tsgo
- `npm run build` - Build via tsgo

**Package level** (legacy packages: `chan`, `chan-core`, `chan-stringify`, `remark-chan`):
- `npm test` - Run Jest tests with ESM support
- `npm run lint` - Run Standard linter

### Installation

Global installation:
```bash
npm install -g @geut/chan
```

Usage:
```bash
chan init
chan added "New feature description"
chan release 1.0.0
```

---

*Generated by AI analysis of the Chan codebase*
