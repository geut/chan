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
[Configuration](#configuration) |
[Plugins](#plugins) |
[API](#api) |
[- chan](#api.chan) |
[- cli](#api.cli) |
[- parser](#api.parser) |
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

#### available commands:

  - **init**               Creates a `CHANGELOG.md` if it does not exists. Chan will work with this file.
     - **-o, --overwrite**  overwrite the current CHANGELOG.md [boolean]
  - **added [msg]**       Writes your changelog indicating new stuff.
  - **fixed [msg]**       Writes your changelog indicating fixed stuff.
  - **changed [msg]**     Writes your changelog indicating updated stuff.
  - **security [msg]**    Writes your changelog indicating security upgrades.
  - **removed [msg]**     Writes your changelog indicating removed stuff.
  - **deprecated [msg]**  Writes your changelog indicating deprecated stuff.
  - **release \<semver\>**  Groups all your new features and marks a new release on your `CHANGELOG.md`.
       - **--git-compare**  Overwrite the git compare by default [string]

#### options:

  - **-p, --path**     Define the path of the CHANGELOG.md (cwd by default)   [string]
  - **--stdout**       Define the output as STDOUT                           [boolean]
  - **--silence**      Disable the console messages                          [boolean]
  - **-u, --use**      Extend chan with your own commands        [array] [default: []]
  - **--config**       Path to your JSON config file                          [string]
  - **-h, --help**     Show help                                             [boolean]
  - **-v, --version**  Show version number                                   [boolean]

> Notes:
> - [_OPTIONAL_]
> - <_REQUIRED_>

### <a name="configuration"></a> Configuration

You can use a `config JSON file` or your `package.json` to set a static configuration (global arguments, command arguments and plugins).

**config.json**
```json
{
    "global-argv": [
        "stdout": true
    ],
    "command-argv": [
        "init": {
           "overwrite": true
        }
    ]
}
```
```bash
$ chan --config=./config.json
```

**package.json**
```json
{
    "chan": {
        "global-argv": [
            "stdout": true
        ],
        "command-argv": [
            "init": {
               "overwrite": true
            }
        ]
    }
}
```

### <a name="plugins"></a> Plugins

You can extend `chan` quite easily by adding your own commands as plugins.

> chan-command-hello.js

```javascript
module.exports = function () {
    return {
        command: 'hello <name>',
        describe: 'A command that say hello',
        handler: function (parser, argv, write) {
            this.log().info('hello ' + argv.name);
        }
    }
}
```

You can consume local commands by using a local path (e.g.: ./chan-command-hello.js) or you can pick a name prefixed by **"chan-command-"** if the command is available on NPM.

New commands can be added by three different ways.

1. Using the argument `--use`:

```bash
$ chan hello 'geut' --use=chan-command-hello
$ hello geut
```

2. Using `--config` pointing to a json file:

**config.json**
```json
{
    "use": [
        "chan-command-hello"
    ]
}
```

```bash
$ chan hello 'geut' --config=./config.json
$ hello geut
```

3. Using the `package.json`:

**package.json**
```json
{
    "chan": {
        "use": [
            "chan-command-hello"
        ]
    }
}
```

```bash
$ chan hello 'geut'
$ hello geut
```

### <a name="api"></a> API

Chan is created above two excellent projects. 
We use [yargs](http://yargs.js.org/) for the CLI and [remark](http://remark.js.org/) to parse the `CHANGELOG.md`

```javascript

import chan, { cli, parser } from '@geut/chan';

```

####  <a name="api.chan"></a> chan

`chan` exposes the main api:

- `init({ overwrite = false,  cwd })`:  The init method will create a CHANGELOG.md file in `cwd` directory.
    - overwrite {Boolean}: True to overwrite an exisiting CHANGELOG file. Default to `false`.
    - cwd {String}: The directory to create the CHANGELOG. If not provided the `process.cwd()` is used.
- `change({ type, msg, cwd })`: Adds the message `msg` as part of the section `type`.
    - type {String}: One of the `chan.CHANGE_TYPE`
    - msg {String}: The message text to be added.
    - cwd {String}: The directory of CHANGELOG. If not provided the `process.cwd()` is used.
- `CHANGE_TYPE`
    - `ADDED`
    - `CHANGED`
    - `FIXED`
    - `SECURITY`
    - `DEPRECATED`
    - `REMOVED`
- `release({ version, cwd })`: Generates a new release section. Moves the current `Unrelasead` changes list to the provided version.
    - version {String}: The version number.
    - cwd {String}: The directory of CHANGELOG. If not provided the `process.cwd()` is used.

#### <a name="api.cli"></a> cli

`cli` retruns a command line interface instance.

- `run()`: Executes the cli.
- `yargs()`: Returns the `yargs` instance.

#### <a name="api.parser"></a> parser

The `parser` is a wrapper instance of an excellent project called [remark](https://github.com/wooorm/remark).

To instantiate a parser supply the working directory where the CHANGELOG file is located:

```javascript
import { parser } from '@geut/chan';

//....

const myParser = parser(cwd);

```
If `cwd` is not passed, the `process.cwd()` is used.

The parser instance exposes the following methods and properties:

- `remark`: The remark instance.
- `exists()`: Returns true if the CHANGELOG file exists.
- `write(content)`: Writes the content to the CHANGELOG file.
    - content {String}: If not supplied, the `remark.stringify` content.
- `findRelease(version)`: Returns the sub-tree corresponding to the provided version.
    - version {String}: Release version.
- `getMTREE()`: Returns the CHANGELOG representation. 

Internally, `chan` maintains its own CHANGELOG representation using a simple tree structure which looks like this:

```javascript
{
    releases: [{
        text: '## [Unreleased]',
        start: Number,
        len: Number,
        children: [{
            text: 'Added',
            children: [{
                text: 'some new feature'
            }, {
                text: 'other feature'
            }]
        }]
    }, {
        text: '## [0.3.0] - 2015-12-03',
        start: Number,
        len: Number,
        children: [Object]
    }],
    definitions: {
        start: Number,
        children: [{
            text: '[unreleased]: https://github.com/olivierlacan/keep-a-changelog/compare/v0.3.0...HEAD'
        }]
    }
}
```

## <a name="issues"></a> ISSUES

:bug: If you found an issue we encourage you to report it on [github](https://github.com/geut/chan/issues). Please specify your OS and the actions to reproduce it.

## <a name="contribute"></a> CONTRIBUTE

:busts_in_silhouette: Ideas and contributions to the project are welcome. You must follow this [guideline](https://github.com/geut/chan/blob/master/CONTRIBUTING.md).
___

A [**GEUT**](http://geutstudio.com/) project
