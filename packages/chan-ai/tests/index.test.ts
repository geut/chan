import { MockProvider } from '../src/providers/mock.js'

import { beforeAll, describe, expect, it, vi } from 'vitest'
import * as chanAI from '../src/index.js'
import { CATEGORIES, CommitAnalysisResponseSchema } from '../src/types.js'

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

describe('analyze unit test', () => {
  let analyzer
  let mockProvider: MockProvider
  let invokeSpy: ReturnType<typeof vi.spyOn>
  const getCommitsInfoTool = vi.fn().mockResolvedValue([
    `abc123
feat: update code
Body:
User (user@example.com)
2026-05-04T00:00:00+00:00
`,
  ])

  beforeAll(async () => {
    mockProvider = new MockProvider(mockResponse)
    invokeSpy = vi.spyOn(mockProvider, 'invoke')

    analyzer = chanAI.createAnalyzer({
      provider: mockProvider,
      model: 'mockModel',
      tools: [getCommitsInfoTool],
    })
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