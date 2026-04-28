import { describe, expect, it } from 'vitest'
import { stringify } from '../src/index.js'
import { PREFACE } from './chast-parts.js'
import type { Node } from 'unist'
import { VFile } from 'vfile'

function createProcessor() {
  // Simple mock processor for testing the compiler directly
  const plugin = stringify
  const processor = {
    compiler: undefined as unknown,
    use(pluginFn: typeof stringify, opts?: Parameters<typeof stringify>[0]) {
      pluginFn.call(this, opts)
      return this
    },
    stringify(tree: Node, file?: VFile) {
      const compiler = this.compiler as (tree: Node, file: VFile) => string
      return compiler(tree, file ?? new VFile())
    },
  }
  processor.use(plugin)
  return processor
}

describe('chan-stringify', () => {
  it('compile initial chast to markdown', () => {
    const processor = createProcessor()
    const tree: Node = {
      type: 'root',
      children: [
        PREFACE,
        {
          type: 'release',
          identifier: 'unreleased',
          version: 'Unreleased',
          unreleased: true,
          children: [],
        },
      ],
    }
    expect(processor.stringify(tree)).toMatchSnapshot()
  })

  it('compile unreleased changes chast to markdown', () => {
    const processor = createProcessor()
    const tree: Node = {
      type: 'root',
      children: [
        PREFACE,
        {
          type: 'release',
          identifier: 'unreleased',
          version: 'Unreleased',
          unreleased: true,
          children: [],
        },
        {
          type: 'release',
          identifier: '0.0.2',
          version: '0.0.2',
          date: '2000-01-01',
          yanked: true,
          children: [],
        },
        {
          type: 'release',
          identifier: '0.0.1',
          version: '0.0.1',
          date: '2000-01-01',
          children: [],
        },
      ],
    }
    expect(processor.stringify(tree)).toMatchSnapshot()
  })
})
