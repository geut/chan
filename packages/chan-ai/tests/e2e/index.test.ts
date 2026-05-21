import { describe, expect, it, beforeAll } from 'vitest'
import { analyze } from '../../src/index.js'
import { createTempGitRepo, type TempRepo } from './fixtures.js'

const describeOrSkip = process.env.OPENAI_API_KEY ? describe : describe.skip

describeOrSkip('analyze e2e', () => {
  let repo: TempRepo

  beforeAll(() => {
    repo = createTempGitRepo()
  })

  it('should analyze commits', async () => {
    const result = await analyze({
      commitShas: repo.commits,
      provider: 'openai',
      model: 'kimi-k2.6',
      cwd: repo.dir,
    })

    expect(result).toHaveLength(3)
    expect(result[0]).toHaveProperty('sha')
    expect(result[0].sha).toBe(repo.commits[0])
    expect(result[0]).toHaveProperty('analysis')
    expect(result[0].analysis).toBeDefined()
    expect(result[0]).toHaveProperty('author')
    expect(result[0]).toHaveProperty('date')
    expect(result[0]).toHaveProperty('category')

    expect(result[1]).toHaveProperty('sha')
    expect(result[1].sha).toBe(repo.commits[1])
    expect(result[1]).toHaveProperty('analysis')
    expect(result[1]).toHaveProperty('author')
    expect(result[1]).toHaveProperty('date')
    expect(result[1]).toHaveProperty('category')

    expect(result[2]).toHaveProperty('sha')
    expect(result[2].sha).toBe(repo.commits[2])
    expect(result[2]).toHaveProperty('analysis')
    expect(result[2]).toHaveProperty('author')
    expect(result[2]).toHaveProperty('date')
    expect(result[2]).toHaveProperty('category')
  })
})