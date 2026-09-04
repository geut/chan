import { describe, expect, it } from 'vitest'

import { actionCommands, runAction } from '../src/commands/actions.js'
import { MockProvider, type ActionAugmentationResponse } from '@geut/chan-ai'
import { appendEntries, codeMdPath, formatEntry } from '../src/code-md.js'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import type { CommitMetadata } from '../src/git.js'

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
})
