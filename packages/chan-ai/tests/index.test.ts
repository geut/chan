import { fakeModel } from 'langchain'

import { beforeAll, describe, expect, it, vi } from 'vitest'
import { createAnalyzer, getCommitsInfo } from '../src/index.js'
import { CATEGORIES, CommitAnalysisResponseSchema, type AnalyzeFn } from '../src/types.js'

const model = fakeModel().structuredResponse({
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
})

describe('analyze unit test', () => {
  let analyzer: AnalyzeFn

  beforeAll(async () => {
    analyzer = await createAnalyzer({
      provider: 'openai',
      model: 'gpt-4o',
      chatModel: model,
    })
  })
  it('should analyze commits', async () => {
    // spy on the getCommitsInfo tool
    const getCommitsInfoSpy = vi.spyOn(getCommitsInfo, 'invoke')
    getCommitsInfoSpy.mockResolvedValue([
      `
      abc123 !! Update: some code !! User !! 2026-05-04
      diff --git a/file.txt b/file.txt
      index 123456..789012 100644
      --- a/file.txt
      +++ b/file.txt
      @@ -1,5 +1,9 @@
      content
    `,
    ])

    const result = await analyzer({
      commitShas: ['abc123'],
      cwd: process.cwd(),
    })

    // validate the response with the schema
    expect(CommitAnalysisResponseSchema.parse(result[0].parsed)).toBeTruthy()

    expect(result[0].parsed.analysis).toBeDefined()
    expect(result[0].parsed.author).toBe('User')
    expect(result[0].parsed.date).toBe('2026-05-04')
    expect(CATEGORIES.includes(result[0].parsed.category)).toBe(true)
    expect(result[0].parsed.breakingChange).toBeTypeOf('boolean')
  })
})