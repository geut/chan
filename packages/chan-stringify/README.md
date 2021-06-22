# chan-stringify

Plugin to compile [chast](https://github.com/geut/chan/tree/master/packages/chast) to a keepachangelog markdown.

## Note

Since v3.0 this plugin is ESM only.

## Install

```sh
npm install @geut/chan-stringify
```

## Use

```js
import unified from 'unified'
import markdown from 'remark-parse'
import { remarkToChan } from '@geut/remark-chan'
import { stringify } from '@geut/chan-stringify'

unified()
  .use(markdown)
  .use(remarkToChan)
  //.. more plugins
  .use(stringify)
```

## API

### `origin.use(stringify[, destination][, options])`
