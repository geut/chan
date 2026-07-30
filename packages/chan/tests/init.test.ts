import { stat } from 'node:fs/promises'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import * as init from '../src/commands/init.js'
import { handler } from '../src/commands/init.js'

describe('init', () => {
  it('exports yarg command structure', () => {
    expect(init.command).toMatch(/init/)
    expect(init.description).toBeDefined()

    expect(init.builder).toBeDefined()
    expect(init.builder).toHaveProperty('dir')
    expect(init.builder).toHaveProperty('overwrite')

    expect(init.handler).toBeDefined()
  })

  it('creates the .chan/ directory and starter code.md', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'chan-init-'))
    await handler({ dir, overwrite: false })

    const codeMdStat = await stat(join(dir, '.chan', 'code.md'))
    expect(codeMdStat.isFile()).toBe(true)
  })
})
