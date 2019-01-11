# chan

[![Build Status](https://travis-ci.org/geut/chan.svg?branch=master)](https://travis-ci.org/geut/chan)
[![npm version](https://badge.fury.io/js/%40geut%2Fchan.svg)](https://badge.fury.io/js/%40geut%2Fchan)

Chan is a likeable CLI tool used for writing and maintaining a CHANGELOG empowering the user to use a coloquial/friendly style.
See more here: [keepachangelog.com](http://keepachangelog.com/)

![chan](https://cloud.githubusercontent.com/assets/819446/20307361/dad71d52-ab1d-11e6-83d7-bed3629308c1.gif)
____

## Table of contents
Sections |
--- |
[Getting started](#install) |
[Usage](#usage) |
[CLI](#cli) |
[Issues](#issues) |
[Contribute](#contribute) |

## <a name="install"></a> Getting started

Install:

```bash
$ npm install -g @geut/chan
```

## <a name="usage"></a> Usage

### <a name="cli"></a> CLI

Create a CHANGELOG.md file in your project root folder with:

```bash
$ chan init
```
To add entries to your CHANGELOG use the command that describes better your change (`added`, `changed`, `fixed`, etc)

```bash
$ chan added "Added `foo` in API to print foo in the console."
```
This command will modify your CHANGELOG creating a new entry called `added` under the `Unreleased` section.

> `chan` follows the [keepachangelog.com](http://keepachangelog.com/) format/style.

#### Using your own editor

In case you want to use an editor you can just omit the message parameter:

```bash
$ chan added # this will open your $EDITOR
```

#### Available commands:

  - **init**
    Creates a `CHANGELOG.md` if it does not exists. Chan will work with this file.

  - **added [msg]**
    Writes your changelog indicating new stuff.

  - **fixed [msg]**
    Writes your changelog indicating fixed stuff.

  - **changed [msg]**
    Writes your changelog indicating updated stuff.

  - **security [msg]**
    Writes your changelog indicating security upgrades.

  - **removed [msg]**
    Writes your changelog indicating removed stuff.

  - **deprecated [msg]**
    Writes your changelog indicating deprecated stuff.

  - **release \<semver\>**
    Marks a new release on your `CHANGELOG.md`.


#### Options
Global options to `chan` command:

  - **--stdout** (`boolean`)

    Define the output as STDOUT

  - **--verbose** (`boolean`)

    Show more info on error

  - **-h, --help** (`boolean`)

    Show help

  - **-v, --version** (`boolean`)

    Show version number

##### Init options

  - **-o, --overwrite**  (`boolean`)

    Overwrite the current CHANGELOG.md


##### Change options
Following options applies to `added`, `fixed`, `changed`, `security`, `removed` and `deprecated` commands:

  - **-p, --path** (`string`)

    Define the path of the CHANGELOG.md (cwd by default)

  - **-g, --group** (`string`)

    Prefix change with provided group value

    Example:
    ```bash
    chan added --group=chan/sub-repo 'New stuff added'
    ```
    will add
    ```markdown
    - chan/sub-repo
      - New stuff added.
    ```
    to your changelog unreleased changes.


##### Release options
  - **-p, --path** (`string`)

    Define the path of the CHANGELOG.md (cwd by default)

  - **--git-compare** (string)

    Overwrite the git compare by default

> Notes:
> - [_OPTIONAL_]
> - <_REQUIRED_>

## <a name="issues"></a> ISSUES

:bug: If you found an issue we encourage you to report it on [github](https://github.com/geut/chan/issues). Please specify your OS and the actions to reproduce it.

## <a name="contribute"></a> CONTRIBUTE

:busts_in_silhouette: Ideas and contributions to the project are welcome. You must follow this [guideline](https://github.com/geut/chan/blob/master/CONTRIBUTING.md).
___

A [**GEUT**](http://geutstudio.com/) project
