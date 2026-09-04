import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import * as hook from '../src/commands/hook.js'
import { handler } from '../src/commands/hook.js'
import { createTempGitRepo } from './fixtures.js'

function gitConfig(cwd: string, key: string): string | undefined {
  try {
    return execFileSync('git', ['config', key], { cwd, encoding: 'utf-8' }).trim()
  } catch {
    return undefined
  }
}

describe('hook command structure', () => {
  it('exports yarg command structure', () => {
    expect(hook.command).toBe('hook <action>')
    expect(hook.description).toBeDefined()
    expect(hook.builder).toHaveProperty('action')
    expect(hook.builder).toHaveProperty('path')
    expect(hook.handler).toBeDefined()
  })
})

describe('hook install', () => {
  it('creates .chan/hooks/post-commit and sets core.hooksPath', async () => {
    const repo = createTempGitRepo()

    await handler({ action: 'install', path: repo.dir })

    const postCommitPath = join(repo.dir, '.chan', 'hooks', 'post-commit')
    const content = await readFile(postCommitPath, 'utf8')
    expect(content).toContain('chan analyze --auto')
    expect(gitConfig(repo.dir, 'core.hooksPath')).toBe('.chan/hooks')
  })
})

describe('hook uninstall', () => {
  it('unsets core.hooksPath and removes the post-commit hook', async () => {
    const repo = createTempGitRepo()

    await handler({ action: 'install', path: repo.dir })
    expect(gitConfig(repo.dir, 'core.hooksPath')).toBe('.chan/hooks')

    await handler({ action: 'uninstall', path: repo.dir })

    expect(gitConfig(repo.dir, 'core.hooksPath')).toBeUndefined()
    await expect(
      readFile(join(repo.dir, '.chan', 'hooks', 'post-commit'), 'utf8')
    ).rejects.toThrow()
  })
})