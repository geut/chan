import { describe, expect, it } from 'vitest'

import * as init from '../src/commands/init.js'

describe('init', () => {
  it('exports yarg command structure', () => {
    expect(init.command).toMatch(/init/)
    expect(init.description).toBeDefined()

    expect(init.builder).toBeDefined()
    expect(init.builder).toHaveProperty('dir')
    expect(init.builder).toHaveProperty('overwrite')

    expect(init.handler).toBeDefined()
  })
})
