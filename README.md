# chan 

[![Build Status](https://travis-ci.org/geut/chan.svg?branch=master)](https://travis-ci.org/geut/chan)
[![npm version](https://badge.fury.io/js/%40geut%2Fchan.svg)](https://badge.fury.io/js/%40geut%2Fchan)

Chan is a likeable CLI tool used for writing and maintaining a CHANGELOG empowering the user to use a coloquial/friendly style.
See more here: [keepachangelog.com](http://keepachangelog.com/)

____

## Table of contents
Sections |
--- |
[Getting started](#install) |
[Usage](#usage) |
[CLI](#cli) |
[API](#api) |
[Plugins](#plugins) |
[Parser](#parser) |
[Issues](#issues) |
[Contribute](#contribute) |

## <a name="install"></a> Getting started

Install:

```bash
$ npm install -g @geut/chan
```

## <a name="usage"></a> Usage

### <a name="cli"></a> CLI

You want to create a CHANGELOG.md :

```bash
$ chan init
```
Cool, now you can start to work. I.e.: _add/fix/etc_.

Let's say you add something important to your project:
```bash
$ chan added [MSG]
```
This will modify your changelog. Creating a new entry called `added`.

Then, you fix something and think it is important to no:
```bash
$ chan fixed [MSG]
```
Now your CHANGELOG.md will contain a `fixed` entry. These entries follow the **keepachangelog** format/style.

Or maybe you made a big change in your project and you want to write a better and longer description of your change, in that case you can execute a **change** command without the `msg` argument and `chan` will open your favorite editor in that case.
E.g.:
```bash
$ chan added # this will open your $EDITOR
```

And so on... You get the idea. :wink:

 
The following are the available commands and options for `chan`:

#### commands:

  - **init**               Creates a `CHANGELOG.md` if it does not exists. Chan will work with this file.
    - Arguments:
       **-o, --overwrite**  overwrite the current CHANGELOG.md [boolean]
  - **added [msg]**       Writes your changelog indicating new stuff.
  - **fixed [msg]**       Writes your changelog indicating fixed stuff.
  - **changed [msg]**     Writes your changelog indicating updated stuff.
  - **security [msg]**    Writes your changelog indicating security upgrades.
  - **removed [msg]**     Writes your changelog indicating removed stuff.
  - **deprecated [msg]**  Writes your changelog indicating deprecated stuff.
  - **release \<semver\>**  Groups all your new features and marks a new release on your `CHANGELOG.md`.

#### options:

  - **-p, --path**     Define the path of the CHANGELOG.md (cwd by default)   [string]
  - **--stdout**       Define the output as STDOUT                           [boolean]
  - **--silence**      Disable the console messages                          [boolean]
  - **--git-compare**  Overwrite the git compare by default                   [string]
  - **-u, --use**      Extend chan with your own commands        [array] [default: []]
  - **--config**       Path to JSON config file
  - **-h, --help**     Show help                                             [boolean]
  - **-v, --version**  Show version number                                   [boolean]

Note:
- [_OPTIONAL_]
- <_REQUIRED_>


### <a name="api"></a> Programmatic Usage
Chan is created above two excellent projects. We use [yargs](http://yargs.js.org/) for the CLI and [remark](http://remark.js.org/) to parse the `CHANGELOG.md`

```javascript
import { cli, parser } from '@geut/chan';

cli.yargs(); // yargs instance

/**
 * commands loaded, this method return [] until
 * you execute run() or loadCommands()
 */
cli.commands();


cli.run(); // start the command line

/**
 * (dir = process.cwd()) => parserObject
 */
const parserInstance = parser(); // create a parser instance

```

### <a name="plugins"></a> Plugins

You can extend `chan` quite easily by adding your own commands as plugins.

chan-command-hello:
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

### <a name="parser"></a> Parser

The parser is a wrapper instance of an excellent project called [remark](https://github.com/wooorm/remark).

Internally, `chan` maintains its own CHANGELOG representation using a simple tree structure which looks like this:

```javascript
{
    releases: [{
        text: '## [Unreleased]',
        start: Number,
        len: Number,
        nodes: [{
            text: 'Added',
            nodes: [{
                text: 'some new feature'
            }, {
                text: 'other feature'
            }]
        }]
    }, {
        text: '## [0.3.0] - 2015-12-03',
        start: Number,
        len: Number,
        nodes: [Object]
    }],
    definitions: {
        start: Number,
        nodes: [{
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
