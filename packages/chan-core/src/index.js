import unified from 'unified'
import markdown from 'remark-parse'
import { select } from 'unist-util-select'

import { remarkToChan } from '@geut/remark-chan'
import { stringify } from '@geut/chan-stringify'

import {
  initialize as transformerInitialize,
  addChanges as transformerAddChanges,
  addRelease as transformerAddRelease
} from './transformer.js'

const preset = (plugin, opts = {}) => [
  [markdown, remarkToChan, [plugin, opts], stringify]]

export async function initialize (from, opts) {
  return unified()
    .use(...preset(transformerInitialize, opts))
    .process(from)
}

export function addChanges (from, opts) {
  return unified()
    .use(...preset(transformerAddChanges, opts))
    .process(from)
}

export async function addRelease (from, opts, cb) {
  return unified()
    .use(...preset(transformerAddRelease, opts))
    .process(from, cb)
}

export function getMarkdownRelease (from, { version }) {
  const processor = unified()
    .use(markdown)
    .use(remarkToChan)
    .use(stringify, { withPreface: false })

  const chanTree = processor.runSync(processor.parse(from))
  const release = select(`release[identifier=${version}]`, chanTree)
  return processor.stringify({ type: 'root', children: [release] }, from)
}
