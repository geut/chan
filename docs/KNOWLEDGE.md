# Chan Codebase Analysis

## Project Overview

**Chan** is a CLI tool and library ecosystem for writing and maintaining CHANGELOG.md files following the [Keep a Changelog](https://keepachangelog.com/) format. It provides a command-line interface for adding changes, creating releases, and managing changelog files in a structured way.

- **Repository**: https://github.com/geut/chan
- **License**: ISC
- **Author**: GEUT (contact@geutstudio.com)
- **Current Version**: 3.2.6 (packages), 2.0.0 (monorepo root)

## Architecture

### Monorepo Structure

The project uses a monorepo structure managed by:
- **Yarn Workspaces**: For package management
- **Lerna**: For publishing and versioning

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
- `src/index.js` - Node constructors
- `src/actions.js` - Valid action types enum

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
- `src/index.js` - URL parsing and template generation

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
- **Jest** with ESM support (`NODE_OPTIONS=--experimental-vm-modules`)
- **Custom resolver**: `jest-module-resolver.js` for workspace package resolution

### Test Coverage by Package

| Package | Tests | Coverage |
|---------|-------|----------|
| `@geut/chan` | ✅ | Unit tests for command structure |
| `@geut/chan-core` | ✅ | Snapshot tests for releases, changes, initialization |
| `@geut/remark-chan` | ✅ | Snapshot tests for parsing |
| `@geut/chan-stringify` | ✅ | Snapshot tests for compilation |
| `@geut/chast` | ❌ | No tests (lint only) |
| `@geut/git-url-parse` | ❌ | No tests (lint only) |

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

## CI/CD

**GitHub Actions**: `.github/workflows/node-ci.yml`
- Runs on: push/PR to `main` branch
- Node versions: 12.x, 14.x, 16.x
- OS matrix: Ubuntu, macOS, Windows
- Steps: checkout → setup-node → yarn install → yarn test

## Dependencies and Version Management

### Package Versions
All packages are versioned in sync: **3.2.6**

### Inter-Package Dependencies
```
chan → chan-core, git-url-parse
chan-core → chast, remark-chan, chan-stringify
remark-chan → chast
chan-stringify → (no internal deps)
git-url-parse → (no internal deps)
```

### External Dependencies

**Core Processing**:
- `unified` ^9.2.1 - Text processing framework
- `remark-parse` ^9.0.0 - Markdown parser
- `mdast-util-to-markdown` ^0.6.5 - Markdown serializer
- `unist-builder` ^3.0.0 - AST node builder
- `unist-util-select` ^4.0.0 - Tree selection
- `unist-util-remove-position` ^4.0.0 - Position removal

**CLI**:
- `yargs` ^17.0.1 - Argument parsing
- `signale` ^1.4.0 - Logging
- `boxen` ^5.0.1 - Terminal boxes
- `open` ^8.2.0 - Open URLs
- `to-vfile` ^6.1.0 - File I/O
- `find-up` ^5.0.0 - File finding
- `editor` ^1.0.0 - External editor support
- `tempfile` ^4.0.0 - Temp file creation

**Utilities**:
- `semver` ^7.3.5 - Version parsing/comparison
- `git-url-parse` ^11.1.2 - Git URL parsing
- `gitconfiglocal` ^2.0.2 - Git config reading
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

### Areas for Improvement

#### 1. Test Coverage Gaps
- `@geut/chast` has no tests
- `@geut/git-url-parse` has no tests
- These packages are critical but untested

#### 2. Dependency Version Conflicts
`chan-stringify/package.json` has mixed versions of unist utilities:
```json
"unist-util-remove-position": "^1.1.2",
"unist-util-select": "^2.0.0",
```
Other packages use v4.x, which could cause compatibility issues.

#### 3. Error Handling
- Some async errors are silently caught (e.g., `openInEditor`)
- Logger modifies `process.exitCode` directly which may have side effects

#### 4. Git Config Reading
- Synchronous file operations in `gitUrlParse` could block
- Error handling returns `null` which may not distinguish between different failure modes

#### 5. Legacy ES5 Folder
- `es5/` directory exists with older transpiled code
- Appears to be legacy/unused but still in repo

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
├── package.json                    # Root package, workspaces config
├── lerna.json                      # Lerna configuration
├── yarn.lock                       # Yarn lockfile
├── jest-module-resolver.js         # Jest ESM resolver
├── .github/workflows/node-ci.yml   # GitHub Actions CI
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
    ├── chast/                      # AST spec
    │   ├── src/
    │   │   ├── index.js
    │   │   └── actions.js
    │   └── node_modules/
    ├── remark-chan/                # Parser
    │   ├── src/index.js
    │   └── tests/
    ├── chan-stringify/             # Compiler
    │   ├── src/index.js
    │   └── test/
    └── git-url-parse/              # Git integration
        └── src/index.js
```

## Build and Development

### Available Scripts

**Root level**:
- `npm run bootstrap` - Clean and bootstrap packages
- `npm test` - Run all package tests
- `npm run lint` - Lint all packages
- `npm run lint:fix` - Fix linting issues

**Package level** (each package):
- `npm test` - Run Jest tests
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
