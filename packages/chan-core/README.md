# chan-core

API to work with chast

## Note

Since v3.0 this module is ESM only.

## Install

```sh
npm install @geut/chan-core
```

## Use

```js
import toVFile from 'to-vfile'
import { initialize, addChanges, addRelease, getMarkdownRelease } from '@geut/chan-core'

const file = toVFile.readSync('CHANGELOG.md')

await initialize(file)

await addChanges(file, {
  changes: [
    { action: 'Security', value: 'alguna cosa' },
    {
      action: 'Changed',
      value: 'vaaamos',
      group: 'package2'
    },
    {
      version: '0.0.1',
      action: 'Fixed',
      value: 'fixed algo viejo',
      group: 'package1'
    }
  ]
})

await addRelease(file,   {
  version: '0.0.2',
  gitTemplate: 'https://github.com/geut/chan/compare/[prev]...[next]',
  gitBranch: 'HEAD',
  mergePrerelease: true
})

await getMarkdownRelease(file, { version: '0.0.1' })

```
## API

### `initialize (from, { overwrite })`
#### `from` {vfile}
####  `overwrite` {Boolean} 
true to overwrite if file already exists. Default to `false`

### `addChanges (from, { changes })`
#### `from` {vfile}
#### `changes` {Array}
chast representation for a set of changes.

### `addRelease (from, { version, date, yanked, gitTemplate, gitBranch, allowYanked, allowPrerelease, mergePrerelease })`
#### `from` {vfile}

### `getMarkdownRelease (from, { version })`
#### `from` {vfile}
#### `version` {String}
The version to extract from file.