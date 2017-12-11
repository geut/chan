# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Added chan as default export to expose api (init, changes & release)

### Changed
- Updated Changelog head wording according to [Keep a Changelog](http://keepachangelog.com/) v1.0.0
- Readme with better documentation for API and programmatic usage

## [1.3.0-0] - 2017-02-10 [YANKED]

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

[unreleased]: https://github.com/geut/chan/compare/v1.3.0-0...HEAD
[1.3.0-0]: https://github.com/geut/chan/compare/v1.2.0...v1.3.0-0
[1.2.0]: https://github.com/geut/chan/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/geut/chan/compare/v1.0.0...v1.1.0
