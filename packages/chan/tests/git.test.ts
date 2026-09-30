import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { getCommitLog, getCommitMetadata, getCommitsMetadata, getHeadSha } from '../src/git.js'
import { createTempGitRepo } from './fixtures.js'

function git(args: string[], cwd: string): string {
  return execFileSync('git', args, { cwd, encoding: 'utf-8', windowsHide: true }).trim()
}

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

  it('getCommitsMetadata preserves input order and duplicates', async () => {
    const repo = createTempGitRepo()
    const [first, , third] = repo.commits
    const metas = await getCommitsMetadata([third ?? '', first ?? '', third ?? ''], repo.dir)

    expect(metas.map(meta => meta.sha)).toEqual([third, first, third])
  })

  it('getCommitsMetadata accepts a short SHA', async () => {
    const repo = createTempGitRepo()
    const headSha = repo.commits[repo.commits.length - 1] ?? ''
    const [meta] = await getCommitsMetadata([headSha.slice(0, 7)], repo.dir)

    expect(meta?.sha).toBe(headSha)
    expect(meta?.files).toContain('index.ts')
  })

  it('getCommitsMetadata returns the combined file list of a merge commit', async () => {
    const repo = createTempGitRepo()
    const shared = join(repo.dir, 'shared.ts')
    writeFileSync(shared, 'one\n')
    git(['add', '.'], repo.dir)
    git(['commit', '-m', 'base shared'], repo.dir)
    git(['checkout', '-b', 'side'], repo.dir)
    writeFileSync(shared, 'side\n')
    git(['add', '.'], repo.dir)
    git(['commit', '-m', 'side shared'], repo.dir)
    git(['checkout', '-'], repo.dir)
    writeFileSync(shared, 'main\n')
    git(['add', '.'], repo.dir)
    git(['commit', '-m', 'main shared'], repo.dir)
    try {
      git(['merge', '--no-ff', 'side'], repo.dir)
    } catch {
      // The two sides edit the same line, so the merge stops on a conflict.
    }
    writeFileSync(shared, 'both\n')
    git(['add', '.'], repo.dir)
    git(['commit', '--no-edit'], repo.dir)
    const mergeSha = git(['rev-parse', 'HEAD'], repo.dir)

    const [meta] = await getCommitsMetadata([mergeSha], repo.dir)

    expect(meta?.sha).toBe(mergeSha)
    expect(meta?.files).toContain('shared.ts')
  })

  it('getCommitsMetadata returns no files for an empty commit', async () => {
    const repo = createTempGitRepo()
    git(['commit', '--allow-empty', '-m', 'empty'], repo.dir)
    const sha = git(['rev-parse', 'HEAD'], repo.dir)

    const [meta] = await getCommitsMetadata([sha], repo.dir)

    expect(meta?.sha).toBe(sha)
    expect(meta?.files).toEqual([])
    expect(meta?.message).toBe('empty')
  })

  it('getCommitsMetadata returns a non-ASCII path unescaped', async () => {
    const repo = createTempGitRepo()
    const fileName = 'café.ts'
    writeFileSync(join(repo.dir, fileName), 'export const n = 1\n')
    git(['add', '.'], repo.dir)
    git(['commit', '-m', 'feat: add cafe'], repo.dir)
    const sha = git(['rev-parse', 'HEAD'], repo.dir)

    const [meta] = await getCommitsMetadata([sha], repo.dir)

    expect(meta?.files).toContain(fileName)
    expect(meta?.files.join('\n')).not.toContain('\\')
  })

  it('getCommitsMetadata rejects a revision that looks like a git option', async () => {
    const repo = createTempGitRepo()
    await expect(getCommitsMetadata(['--output=/tmp/chan-not-written'], repo.dir)).rejects.toThrow()
  })
})
