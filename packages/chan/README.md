# Chan CLI

[![Build Status](https://travis-ci.org/geut/chan.svg?branch=master)](https://travis-ci.org/geut/chan)
[![npm version](https://badge.fury.io/js/%40geut%2Fchan.svg)](https://badge.fury.io/js/%40geut%2Fchan)

Chan is a likeable CLI tool used for writing and maintaining a CHANGELOG empowering the user to use a coloquial/friendly style.
See more here: [keepachangelog.com](http://keepachangelog.com/)

- [Getting started](#install)
- [Usage](#usage)
- Commands
  - [`chan init`](#command-init)
  - [`chan <action>`](#command-action)
  - [`chan release`](#command-release)
- [Global options](#global-options)
  - [Configure with `package.json`](#config-package-json)
- [Issues](#issues)
- [Contribute](#contribute)

## <a name="install"></a> Getting started

Install:

```bash
$ npm install -g @geut/chan
```

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

Create new entries with the `<msg>` in your changelog under the release: *Unreleased*

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

|> Note: this could be a good option to work with a monorepo and root changelog.

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

|> Note: Also, this kind of configurations can be defined in the [package.json](#config-package-json).

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

## <a name="global-options"></a> Global options

### `--stdout` (`boolean`)

Define the output as STDOUT

### `--verbose` (`boolean`)

Show more info on error

### `--help` (`boolean`)

Show help

### `--version` (`boolean`)

Show version number

### <a name="config-package-json"></a> Configure chan

You can configure the chan options using your package.json:

```json
{
  "chan": {
    "git-url": "https://github.com/geut/chan"
  }
}
```

## <a name="issues"></a> ISSUES

:bug: If you found an issue we encourage you to report it on [github](https://github.com/geut/chan/issues). Please specify your OS and the actions to reproduce it.

## <a name="contribute"></a> CONTRIBUTE

:busts_in_silhouette: Ideas and contributions to the project are welcome. You must follow this [guideline](https://github.com/geut/chan/blob/master/CONTRIBUTING.md).
___

A [**GEUT**](http://geutstudio.com/) project
