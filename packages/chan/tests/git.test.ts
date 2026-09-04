import { describe, expect, it } from 'vitest'

import { getCommitLog, getCommitMetadata, getHeadSha } from '../src/git.js'
import { createTempGitRepo } from './fixtures.js'

describe('git', () => {
  it('getHeadSha returns the current HEAD sha', async () => {
    const repo = createTempGitRepo()
    const sha = await getHeadSha(repo.dir)
    expect(sha).toBe(repo.commits[repo.commits.length - 1])
    expect(sha).toMatch(/^[0-9a-f]{40}$/)
  })

  it('getCommitLog returns shas newest-first up to the limit', async () => {
    const repo = createTempGitRepo()
    const shas = await getCommitLog(repo.dir, { limit: 10 })
    expect(shas).toHaveLength(3)
    expect(shas[0]).toBe(repo.commits[2])
    expect(shas[2]).toBe(repo.commits[0])
  })

  it('getCommitMetadata extracts structured metadata and changed files', async () => {
    const repo = createTempGitRepo()
    const headSha = repo.commits[repo.commits.length - 1] ?? ''
    const meta = await getCommitMetadata(headSha, repo.dir)

    expect(meta.sha).toBe(headSha)
    expect(meta.shortSha).toBe(headSha.slice(0, 7))
    expect(meta.author).toBe('Chan Test User')
    expect(meta.authorEmail).toBe('test@test.com')
    expect(meta.date).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(meta.message).toContain('remove multiply function')
    expect(meta.files).toContain('index.ts')
  })
})
