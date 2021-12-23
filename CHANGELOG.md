# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Fixed
- issue #64: "Cannot read property 'replace' of undefined" when running "chan release" with git-template set
- issue #65: GitHub Tag URL is just tag, not tags
- issue #66: Allow for non-zero exit code

## [3.2.2] - 2021-09-24
### Fixed
- reference correct octokit action for creating releases #67

## [3.2.1] - 2021-09-22
### Fixed
- Issue with `gitUrlParse` source result not matching the providers map. Related #64.

## [3.2.0] - 2021-09-01
### Added
- Add new config `--release-prefix` for addRelease and createGithubRelease

## [3.1.0] - 2021-07-07
### Added
- Compatibility with node v12.22.1
- Tests for commands in `@geut/chan` CLI

### Fixed
- Issue #60 related to `fs/promises` which is not implemented in node v12

## [3.0.3] - 2021-07-05
### Fixed
- First version was not being linked with the release url instead of compare url. #58
- Issue resolving `.git` when `--path` argument was passed.

## [3.0.2] - 2021-06-25
### Fixed
- Jest resolver not working with exports/module.

### Removed
- Removed main field from package.json files.

## [3.0.1] - 2021-06-23
### Fixed
- Issue with `@geut/git-url-parse` not finding `.git` directory automatically.

## [3.0.0] - 2021-06-22
### Changed
- Moved all packages to ESM mode.

### Removed
- Support for node < 12 for CLI.

## [2.3.0] - 2021-06-03
### Added
- New command show to display the CHANGELOG entries of a specific version

## [2.2.1] - 2020-05-11
### Fixed
- Fixed error messsages.

## [2.2.0] - 2020-04-23
### Added
- Support for direct GitHub Releases.

### Removed
- Browser option from release.

## [2.1.1] - 2019-07-22
### Fixed
- Duplicated actions with --merge-prereleases.

## [2.1.0] - 2019-07-20
### Fixed
- Issue doing a release with external git urls. #36

### Added
- New flag: --no-git.

## [2.0.0] - 2019-04-17
### Added
- Lerna and a new organization of packages.
  - chast: Unist compatible spec for changelogs and helpers to nodes creation.
  - remark-chan: Parser mdast to chast.
  - chan-stringify: Stringify chast to keepachangelog markdown.
  - chan-core: API and transforms to work with chast.
  - chan: The original CLI but we new shiny features and using the new core modules.
- Support for prereleases.
- Support for gh-releases.

### Removed
- Plugins system.

## [1.3.0] - 2018-10-29
### Added
- Added chan as default export to expose api (init, changes & release)
- New feature for grouping changes (#13) by @estebanprimost

### Changed
- Updated Changelog head wording according to [Keep a Changelog](http://keepachangelog.com/) v1.0.0
- Readme with better documentation for API and programmatic usage

## [1.3.0-0] - 2017-02-10

## [1.2.0] - 2016-09-24
### Changed
- changed yargs config in favor of a custom config function
  We made a function that create a configuration for the CLI where you can set global arguments, command arguments and define plugins using a config JSON file or the package.json.
  Yargs has a similar functionality but is not working as we want.

## [1.1.0] - 2016-09-21
### Added
- allow create empty releases (YANKED)

## 1.0.0 - 2016-08-28
### Added
- default commands: init, release, added, changed, deprecated, fixed, removed and security
- tests for each command handler
- MTREE structure to work with the markdown

### Changed
- readme file
- make commands cli as a map to avoid looping to found a command

### Fixed
- show help for each command

### Removed
- git-first-commit dependency

[Unreleased]: https://github.com/geut/chan/compare/v3.2.2...HEAD
[3.2.2]: https://github.com/geut/chan/compare/v3.2.1...v3.2.2
[3.2.1]: https://github.com/geut/chan/compare/v3.2.0...v3.2.1
[3.2.0]: https://github.com/geut/chan/compare/v3.1.0...v3.2.0
[3.1.0]: https://github.com/geut/chan/compare/v3.0.3...v3.1.0
[3.0.3]: https://github.com/geut/chan/compare/v3.0.2...v3.0.3
[3.0.2]: https://github.com/geut/chan/compare/v3.0.1...v3.0.2
[3.0.1]: https://github.com/geut/chan/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/geut/chan/compare/v2.3.0...v3.0.0
[2.3.0]: https://github.com/geut/chan/compare/v2.2.1...v2.3.0
[2.2.1]: https://github.com/geut/chan/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/geut/chan/compare/v2.1.1...v2.2.0
[2.1.1]: https://github.com/geut/chan/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/geut/chan/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/geut/chan/compare/v1.3.0...v2.0.0
[1.3.0]: https://github.com/geut/chan/compare/v1.3.0-0...v1.3.0
[1.3.0-0]: https://github.com/geut/chan/compare/v1.2.0...v1.3.0-0
[1.2.0]: https://github.com/geut/chan/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/geut/chan/compare/v1.0.0...v1.1.0
