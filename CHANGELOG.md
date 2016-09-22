# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

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

[unreleased]: https://github.com/geut/chan/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/geut/chan/compare/v1.0.0...v1.1.0
