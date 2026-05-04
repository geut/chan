import { describe, expect, it } from 'vitest'

import * as ghRelease from '../src/commands/gh-release.js'

describe('gh-release', () => {
  it('exports yarg command structure', () => {
    expect(ghRelease.command).toMatch(/gh-release/)
    expect(ghRelease.description).toBeDefined()

    expect(ghRelease.builder).toBeDefined()
    expect(ghRelease.builder).toHaveProperty('semver')
    expect(ghRelease.builder).toHaveProperty('path')
    expect(ghRelease.builder).toHaveProperty('git-url')

    expect(ghRelease.handler).toBeDefined()
  })
})
