import { describe, expect, it, beforeAll } from 'vitest'
import { createAnalyzer } from '../../src/index.js'
import { CommitAnalysisResponseSchema, type AnalyzeFn } from '../../src/types.js'

import { createTempGitRepo, type TempRepo } from './fixtures.js'

const describeOrSkip = process.env.OPENAI_API_KEY ? describe : describe.skip

describeOrSkip('analyze e2e', () => {
  let repo: TempRepo
  let analyzer: ReturnType<typeof createAnalyzer>

  beforeAll(async () => {
    repo = createTempGitRepo()
    const context = `This is a module exports math functions`
    analyzer = createAnalyzer({
      provider: 'opencode',
      model: 'gemini-3.5-flash',
      baseUrl: 'https://opencode.ai/zen/v1',
      includeRaw: true,
    })
  })

  it('should analyze commits', async () => {
    const result = await analyzer({
      commitShas: repo.commits,
      cwd: repo.dir,
    })

    expect(result).toHaveLength(3)
    expect(CommitAnalysisResponseSchema.parse(result[0].parsed)).toBeTruthy()
    expect(result[0].parsed.sha).toBe(repo.commits[0])
    expect(result[0].parsed.analysis).toBeDefined()
    expect(result[0].parsed.breakingChange).toBe(false)

    expect(CommitAnalysisResponseSchema.parse(result[1].parsed)).toBeTruthy()

    expect(result[1].parsed.sha).toBe(repo.commits[1])
    expect(result[1].parsed.analysis).toBeDefined()
    expect(result[1].parsed.breakingChange).toBe(false)

    expect(CommitAnalysisResponseSchema.parse(result[2].parsed)).toBeTruthy()
    expect(result[2].parsed.sha).toBe(repo.commits[2])
    expect(result[2].parsed.analysis).toBeDefined()
    console.log({ result: result[2].parsed })
    if (result[2].parsed.breakingConfidence <= 0.3) {
      expect(result[2].parsed.breakingChange).toBe(false)
    }
    if (result[2].parsed.breakingConfidence >= 0.8) {
      expect(result[2].parsed.breakingChange).toBe(true)
    }
  })
})