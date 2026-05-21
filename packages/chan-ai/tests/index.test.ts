import { fakeModel } from 'langchain'

import { describe, expect, it, vi } from 'vitest'
import { analyze, getCommitsInfo, CATEGORIES } from '../src/index.js'

const model = fakeModel().structuredResponse({
  sha: 'abc123',
  analysis: 'This is a test response.',
  author: 'User',
  date: '2026-05-04',
  category: 'Feature',
  breakingChange: 'no',
  relatedCode: [''],
  relatedIssues: [''],
})

describe.skip('analyze unit test', () => {
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

    const result = await analyze({
      commitShas: ['abc123'],
      provider: 'openai',
      model: 'gpt-4o',
      chatModel: model,
      cwd: process.cwd(),
    })
    expect(result[0].analysis).toBeDefined()
    expect(result[0].author).toBe('User')
    expect(result[0].date).toBe('2026-05-04')
    expect(CATEGORIES.includes(result[0].category)).toBe(true)
    expect(result[0].breakingChange).toBe('no')
    expect(result[0].relatedCode).toBeDefined()
    expect(result[0].relatedIssues).toBeDefined()
  })
})