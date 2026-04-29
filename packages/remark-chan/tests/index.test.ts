import { describe, expect, it } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { readSync } from 'to-vfile'
import { remarkToChan } from '../src/index.js'

describe('remark-chan', () => {
  it('parse mdast to chast', () => {
    const processor = unified().use(remarkParse).use(remarkToChan)

    const tree = processor.runSync(
      processor.parse(readSync(`${import.meta.dirname}/__files__/CHANGELOG.md`))
    )

    expect(tree).toMatchSnapshot()
  })
})
