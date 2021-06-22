# remark-chan

A unified plugin to convert from mdast to [chast](https://github.com/geut/chan/tree/master/packages/chast)

## Note

Since v3.0 this plugin is ESM only. 

## Install

```sh
npm install @geut/remark-chan
```

## Use

```js
import unified from 'unified'
import markdown from 'remark-parse'
import { remarkToChan } from '@geut/remark-chan'

unified()
  .use(markdown)
  .use(remarkToChan)
  //.. more plugins
```

## API

### `origin.use(remarkToChan)`

Plugin to convert from mdast to chast.

