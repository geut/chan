# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2020-06-22
### Changed
- Moved all packages to ESM mode.

### Removed
- Support for node < 12 for CLI.

## [2.3.0] - 2020-06-03
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

[Unreleased]: https://github.com/geut/chan/compare/v3.0.0...HEAD
[3.0.0]: https://github.com/geut/chan/compare/v2.2.1...v3.0.0
[2.2.1]: https://github.com/geut/chan/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/geut/chan/compare/v2.1.1...v2.2.0
[2.1.1]: https://github.com/geut/chan/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/geut/chan/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/geut/chan/compare/v1.3.0...v2.0.0
[1.3.0]: https://github.com/geut/chan/compare/v1.3.0-0...v1.3.0
[1.3.0-0]: https://github.com/geut/chan/compare/v1.2.0...v1.3.0-0
[1.2.0]: https://github.com/geut/chan/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/geut/chan/compare/v1.0.0...v1.1.0
