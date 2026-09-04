import { MockProvider } from '../src/providers/mock.js'
import { createTempGitRepo } from './e2e/fixtures.js'

import { beforeAll, describe, expect, it, vi } from 'vitest'
import * as chanAI from '../src/index.js'
import { CATEGORIES, CommitAnalysisResponseSchema, ActionAugmentationResponseSchema, CHAN_ACTIONS } from '../src/types.js'

const mockResponse = {
  sha: 'abc123',
  analysis: 'This is a test response.',
  author: 'User',
  authorEmail: 'user@example.com',
  coauthors: ['user2', 'user3'],
  date: '2026-05-04',
  category: 'Feature',
  breakingChange: false,
  breakingDetails: '',
  breakingConfidence: 0.95,
  packagesAffected: ['package1', 'package2'],
  relatedCode: [''],
  relatedIssues: [''],
}

describe('getCommitInfo unit test', () => {
  it('should get the commit info', async () => {
    const { commits, dir } = createTempGitRepo()
    const [sha, _] = commits

    const info = await chanAI.getCommitInfo({
      commitSha: sha,
      cwd: dir,
    })
    // format: %h, %s, Body:%b, %an (%ae), %aI, %p, then diff (-U0)
    const lines = info.split('\n')

    expect(lines[0]).toBe(sha.slice(0, 7))
    expect(lines[1]).toBe('add function to add two numbers')
    expect(lines[2]).toBe('Body:')
    expect(lines[3]).toBe('Chan Test User (test@test.com)')
    expect(lines[4]).toMatch(/^\d{4}-\d{2}-\d{2}T/) // ISO date (%aI)
    expect(info).toContain('diff --git a/index.ts b/index.ts')
    expect(info).toContain('+export const add = (a: number, b: number) => a + b')
  })

  it('should throw for an unknown commit', async () => {
    const repo = createTempGitRepo()
    await expect(
      chanAI.getCommitInfo({
        commitSha: 'deadbeef',
        cwd: repo.dir,
      })
    ).rejects.toThrow()
  })
})

describe('analyze unit test', () => {
  let analyzer: Function
  let mockProvider: MockProvider
  let invokeSpy: ReturnType<typeof vi.spyOn>
  const getCommitsInfoTool = vi.fn().mockResolvedValue(
    `abc123
feat: update code
Body:
User (user@example.com)
2026-05-04T00:00:00+00:00
`
  )

  beforeAll(async () => {
    mockProvider = new MockProvider(mockResponse)
    invokeSpy = vi.spyOn(mockProvider, 'invoke')

    analyzer = chanAI.createAnalyzer({
      provider: mockProvider,
      model: 'mockModel',
      tools: [getCommitsInfoTool],
    })
  })

  it('should throw an error if the provider is not supported', () => {
    expect(() => {
      chanAI.createAnalyzer({
        provider: 'invalidProvider',
        model: 'mockModel',
      })
    }).toThrow('Provider invalidProvider is not supported')
  })

  it('should analyze commits', async () => {
    const result = await analyzer({
      commitShas: ['abc123'],
      cwd: process.cwd(),
    })

    expect(getCommitsInfoTool).toHaveBeenCalledWith({ commitSha: 'abc123', cwd: process.cwd() })
    expect(invokeSpy).toHaveBeenCalledTimes(1)

    // validate the response with the schema
    expect(CommitAnalysisResponseSchema.parse(result[0].parsed)).toBeTruthy()

    expect(result[0].parsed.analysis).toBeDefined()
    expect(result[0].parsed.author).toBe('User')
    expect(result[0].parsed.date).toBe('2026-05-04')
    expect(CATEGORIES.includes(result[0].parsed.category)).toBe(true)
    expect(result[0].parsed.breakingChange).toBeTypeOf('boolean')
  })
})

describe('augment unit test', () => {
  const mockAugmentResponse = {
    action: 'added',
    message: 'Add multiply function to the math module',
    classification: ['Feature'],
    linkedShas: ['abc123', 'def456'],
    breakingChange: false,
    breakingDetails: '',
    confidence: 0.9
  }

  it('createAugmenter throws for an unsupported provider', () => {
    expect(() =>
      chanAI.createAugmenter({
        provider: 'invalidProvider',
        model: 'mockModel'
      })
    ).toThrow('Provider invalidProvider is not supported')
  })

  it('augments commits into a keepachangelog entry, preserving the precise classification', async () => {
    const mockProvider = new MockProvider(mockAugmentResponse)
    const invokeSpy = vi.spyOn(mockProvider, 'invoke')

    const augment = chanAI.createAugmenter({
      provider: mockProvider,
      model: 'mockModel'
    })

    const result = await augment({
      commitShas: ['abc123', 'def456'],
      codeMdContext: '## Commit abc123\n- **Analysis:** adds multiply'
    })

    expect(invokeSpy).toHaveBeenCalledTimes(1)
    expect(ActionAugmentationResponseSchema.parse(result.parsed)).toBeTruthy()
    expect(CHAN_ACTIONS.includes(result.parsed.action)).toBe(true)
    expect(result.parsed.message).toBe('Add multiply function to the math module')
    expect(result.parsed.classification).toEqual(['Feature'])
    expect(result.parsed.linkedShas).toEqual(['abc123', 'def456'])
    expect(result.parsed.breakingChange).toBe(false)
  })

  it('augments without a user message (infers it)', async () => {
    const mockProvider = new MockProvider(mockAugmentResponse)
    const augment = chanAI.createAugmenter({ provider: mockProvider, model: 'mockModel' })

    const result = await augment({
      commitShas: ['abc123']
    })

    expect(result.parsed.message).toBeDefined()
    expect(result.parsed.action).toBe('added')
  })
})

describe('ollama provider registration', () => {
  it('is a known first-class provider', () => {
    // createProvider would not throw for ollama because it is registered.
    const augment = chanAI.createAugmenter({
      provider: 'ollama',
      model: 'llama3.1'
    })
    expect(typeof augment).toBe('function')
  })
})