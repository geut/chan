import { describe, expect, it } from 'vitest'
import { readSync } from 'to-vfile'

import { addChanges } from '../src/index.js'

describe('add-changes', () => {
  it('add new changes', async () => {
    const file = await addChanges(readSync(`${import.meta.dirname}/__files__/used.md`), {
      changes: [
        { action: 'Security', value: 'alguna cosa' },
        {
          action: 'Changed',
          value: 'vaaamos',
          group: 'package2',
        },
        {
          version: '0.0.1',
          action: 'Fixed',
          value: 'fixed algo viejo',
          group: 'package1',
        },
      ],
    })

    expect(file.toString()).toMatchSnapshot()
  })
})
