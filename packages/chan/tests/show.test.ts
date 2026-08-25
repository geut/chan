import { describe, expect, it } from 'vitest'

import * as show from '../src/commands/show.js'

describe('show', () => {
  it('exports yarg command structure', () => {
    expect(show.command).toMatch(/show/)
    expect(show.description).toBeDefined()

    expect(show.builder).toBeDefined()
    expect(show.builder).toHaveProperty('semver')
    expect(show.builder).toHaveProperty('path')

    expect(show.handler).toBeDefined()
  })
})
