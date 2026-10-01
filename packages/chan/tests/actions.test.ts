import { describe, expect, it, vi, afterEach } from 'vitest'

import { actionCommands, runAction } from '../src/commands/actions.js'
import { MockProvider, type ActionAugmentationResponse } from '@geut/chan-ai'
import { appendEntries, codeMdPath, formatEntry } from '../src/code-md.js'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import type { CommitMetadata } from '../src/git.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('actions', () => {
  it('exports yarg command structure', () => {
    actionCommands.forEach(action => {
      expect(action.command).toBeDefined()
      expect(action.description).toBeDefined()

      expect(action.builder).toBeDefined()
      expect(action.builder).toHaveProperty('path')
      expect(action.builder).toHaveProperty('group')
      expect(action.builder).toHaveProperty('commits')

      expect(action.handler).toBeDefined()
    })
  })
})

describe('runAction (no AI)', () => {
  it('returns the original message unchanged and signals no AI use', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'chan-action-'))
    const result = await runAction({
      cwd,
      message: 'Add a thing',
    })
    expect(result.usedAi).toBe(false)
    expect(result.message).toBe('Add a thing')
    expect(result.classification).toEqual([])
  })
})

describe('runAction (AI via MockProvider)', () => {
  const mockAugment: ActionAugmentationResponse = {
    action: 'added',
    message: 'Add a thing (augmented)',
    classification: ['Feature'],
    linkedShas: ['0123456'],
    breakingChange: false,
    breakingDetails: '',
    confidence: 0.9,
  }

  it('augments the message and links commits when AI is configured', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'chan-action-ai-'))
    // Seed .chan/code.md with a commit entry so correlation has something to find.
    const meta: CommitMetadata = {
      sha: '0123456789abcdef0123456789abcdef01234567',
      shortSha: '0123456',
      author: 'T',
      authorEmail: 't@t.com',
      date: '2026-07-20T12:00:00+00:00',
      message: 'feat: add thing',
      files: ['a.ts'],
    }
    await appendEntries({ cwd, entries: [formatEntry({ meta })] })

    const result = await runAction({
      cwd,
      message: 'add a thing',
      ai: {
        provider: new MockProvider({ ...mockAugment, linkedShas: ['0123456'] }),
        model: 'mockModel',
      },
    })

    expect(result.usedAi).toBe(true)
    expect(result.message).toBe('Add a thing (augmented)')
    expect(result.classification).toEqual(['Feature'])
    expect(result.linkedShas).toEqual(['0123456'])

    // No code.md action entry is written by runAction itself (the handler does that).
    const content = await readFile(codeMdPath(cwd), 'utf8')
    expect(content).not.toContain('## Action')
  })

  it('does not treat a bookkeeping HEAD commit as evidence', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'chan-action-bookkeeping-'))
    execFileSync('git', ['init'], { cwd })
    execFileSync('git', ['config', 'commit.gpgsign', 'false'], { cwd })
    execFileSync('git', ['config', 'user.email', 't@t.com'], { cwd })
    execFileSync('git', ['config', 'user.name', 'T'], { cwd })
    writeFileSync(join(cwd, 'a.ts'), 'export const x = 1\n')
    execFileSync('git', ['add', '.'], { cwd })
    execFileSync('git', ['commit', '-m', 'feat: add x'], { cwd })
    writeFileSync(join(cwd, 'CHANGELOG.md'), '# Changelog\n\n## Unreleased\n')
    execFileSync('git', ['add', 'CHANGELOG.md'], { cwd })
    execFileSync('git', ['commit', '-m', 'docs: changelog'], { cwd })
    const headSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim()

    const invokeSpy = vi.spyOn(MockProvider.prototype, 'invoke')
    const result = await runAction({
      cwd,
      message: 'add a thing',
      ai: {
        provider: new MockProvider(mockAugment),
        model: 'mockModel',
      },
    })

    expect(result.usedAi).toBe(true)
    expect(result.message).toBe('Add a thing (augmented)')
    const messages = invokeSpy.mock.calls[0]?.[0]
    const user = messages?.find(message => message.role === 'user')
    expect(user?.content).not.toContain(headSha)
    expect(user?.content).toContain('Commit SHAs covered: \n')
  })
})
