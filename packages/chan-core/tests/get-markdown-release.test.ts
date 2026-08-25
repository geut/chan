import { describe, expect, it } from 'vitest'
import { readSync } from 'to-vfile'

import { getMarkdownRelease } from '../src/index.js'

describe('get-markdown-release', () => {
  it('get markdown release', async () => {
    const release = getMarkdownRelease(readSync(`${import.meta.dirname}/__files__/used.md`), {
      version: '0.0.4',
    })

    expect(release).toMatchSnapshot()
  })
})
