import { describe, expect, it } from 'vitest'
import { readSync } from 'to-vfile'

import { initialize } from '../src/index.js'

describe('initialize', () => {
  it('initialize changelog', async () => {
    const file = await initialize(readSync(`${import.meta.dirname}/__files__/empty.md`))
    expect(file.toString()).toMatchSnapshot()
  })
})
