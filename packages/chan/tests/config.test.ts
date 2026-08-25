import path from 'node:path'
import process from 'node:process'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { vol } from 'memfs'

const chanrcPath = path.join(process.cwd(), '.chanrc')

vi.mock('node:fs')
vi.mock('node:fs/promises')
vi.mock('find-up', () => ({
  findUpSync: vi.fn(() => chanrcPath),
}))

import { loadConfig, type Config } from '../src/config.js'

describe('general config checks', () => {
  beforeEach(() => {
    vol.reset()
  })

  it('can read .chanrc file with minimal options', () => {
    const payload: Config = {
      gitUrl: 'https://github.com/owner/repo.git',
      releasePrefix: 'v',
      ai: {
        provider: 'openai',
        model: 'gpt-4.1',
        maxTokens: 1000,
        endpoint: 'https://api.openai.com/v1',
      },
    }
    vol.fromJSON({ [chanrcPath]: JSON.stringify(payload) })

    const config: Config = loadConfig()
    expect(config).toBeDefined()
    expect(config).toHaveProperty('gitUrl')
    expect(config).toHaveProperty('releasePrefix')
    expect(config).toHaveProperty('ai')
    expect(config.ai).toHaveProperty('provider')
    expect(config.ai).toHaveProperty('model')
    expect(config.ai).toHaveProperty('maxTokens')
    expect(config.ai).toHaveProperty('endpoint')

    expect(config.gitUrl).toBe('https://github.com/owner/repo.git')
    expect(config.releasePrefix).toBe('v')
    expect(config.ai?.provider).toBe('openai')
    expect(config.ai?.model).toBe('gpt-4.1')
    expect(config.ai?.maxTokens).toBe(1000)
    expect(config.ai?.endpoint).toBe('https://api.openai.com/v1')
  })

  it('can read .chanrc file with all options', () => {
    const payload: Config = {
      gitUrl: new URL('https://github.com/owner/repo.git'),
      gitCompareTemplate: 'https://github.com/owner/repo/compare/[prev]...[next]',
      gitReleaseTemplate: 'https://github.com/owner/repo/releases/tag/[next]',
      gitBranch: 'main',
      allowYanked: true,
      allowPrerelease: true,
      mergePrerelease: true,
      path: 'CHANGELOG.md',
      ghRelease: true,
      releasePrefix: 'v',
      ai: {
        provider: 'openai',
        model: 'gpt-4.1',
        maxTokens: 1000,
        endpoint: 'https://api.openai.com/v1',
      },
    }
    vol.fromJSON({ [chanrcPath]: JSON.stringify(payload) })

    const config: Config = loadConfig()
    expect(config).toBeDefined()
    expect(config).toHaveProperty('gitUrl')
    expect(config).toHaveProperty('releasePrefix')
    expect(config).toHaveProperty('gitCompareTemplate')
    expect(config).toHaveProperty('gitReleaseTemplate')
    expect(config).toHaveProperty('gitBranch')
    expect(config).toHaveProperty('allowYanked')
    expect(config).toHaveProperty('allowPrerelease')
    expect(config).toHaveProperty('mergePrerelease')
    expect(config).toHaveProperty('path')
    expect(config).toHaveProperty('ghRelease')
    expect(config).toHaveProperty('ai')
    expect(config.ai).toHaveProperty('provider')
    expect(config.ai).toHaveProperty('model')
    expect(config.ai).toHaveProperty('maxTokens')
    expect(config.ai).toHaveProperty('endpoint')
  })

  it('should throw with an invalid config option', () => {
    const payload: Config = {
      gitUrl: new URL('https://github.com/owner/repo.git'),
      releasePrefix: 1,
    }
    vol.fromJSON({ [chanrcPath]: JSON.stringify(payload) })

    expect(() => loadConfig()).toThrow(
      'Invalid config: [releasePrefix] - Invalid input: expected string, received number'
    )
  })
})