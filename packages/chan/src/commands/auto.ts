import { resolve } from 'node:path'
import { read } from 'to-vfile'

import { addChanges } from '@geut/chan-core'

import { createLogger } from '../logger.js'
import { write } from '../vfs.js'
import { getHeadSha } from '../git.js'
import {
  appendActionEntry,
  codeMdContextForShas,
  formatActionEntry,
} from '../code-md.js'
import {
  resolveAiConfig,
  createAugmenterFromConfig,
} from '../ai-config.js'
import { isChanAction, type ChanAction } from '../categories.js'

export const command = 'auto [message]'
export const description =
  'Infer the <action> and changelog entry from commits using AI. Requires AI to be configured.'

export const builder = {
  message: {
    describe: 'Optional change message. If provided, AI infers only the action.',
    type: 'string',
  },
  commits: {
    describe: 'Comma-separated list of commit SHAs (defaults to HEAD)',
    type: 'string',
  },
  path: {
    alias: 'p',
    describe: 'Path of the CHANGELOG.md',
    type: 'string',
    default: '.',
  },
  group: {
    alias: 'g',
    describe: 'Prefix change with [<group>]. Allows grouping changes at release time.',
    type: 'string',
  },
  aiProvider: {
    describe: 'AI provider (overrides .chanrc ai.provider)',
    type: 'string',
  },
  aiModel: {
    describe: 'AI model (overrides .chanrc ai.model)',
    type: 'string',
  },
  aiMaxTokens: {
    describe: 'Maximum tokens for the AI model (overrides .chanrc ai.maxTokens)',
    type: 'number',
  },
  aiEndpoint: {
    describe: 'AI endpoint / baseUrl (overrides .chanrc ai.endpoint)',
    type: 'string',
  },
  verbose: {
    alias: 'v',
    describe: 'Verbose output',
    type: 'boolean',
    default: false,
  },
  stdout: {
    describe: 'Print the resulting changelog change to stdout instead of writing',
    type: 'boolean',
    default: false,
  },
}

interface AutoArgs {
  message?: string
  commits?: string
  path: string
  group?: string
  aiProvider?: string
  aiModel?: string
  aiMaxTokens?: number
  aiEndpoint?: string
  verbose?: boolean
  stdout?: boolean
}

export interface RunAutoOptions {
  cwd: string
  message?: string
  commitShas: string[]
  ai: ReturnType<typeof resolveAiConfig> extends infer T ? NonNullable<T> : never
}

export async function runAuto({
  cwd,
  message,
  commitShas,
  ai,
}: RunAutoOptions): Promise<{ action: ChanAction; augmentedMessage: string; classification: string[]; linkedShas: string[]; breakingChange: boolean; breakingDetails: string }> {
  const augment = createAugmenterFromConfig(ai)

  const codeMdContext = await codeMdContextForShas(cwd, commitShas)

  const { parsed } = await augment({ message, commitShas, codeMdContext })

  const action: ChanAction = isChanAction(parsed.action)
    ? parsed.action
    : 'changed'

  return {
    action,
    augmentedMessage: parsed.message,
    classification: parsed.classification,
    linkedShas: parsed.linkedShas,
    breakingChange: parsed.breakingChange,
    breakingDetails: parsed.breakingDetails,
  }
}

export async function handler(args: AutoArgs) {
  const {
    message,
    commits,
    path,
    group,
    aiProvider,
    aiModel,
    aiMaxTokens,
    aiEndpoint,
    verbose,
    stdout,
  } = args

  const cwd = path
  const { report, success, info, error } = createLogger({
    scope: 'auto',
    verbose,
    stdout,
  })

  const ai = resolveAiConfig({ aiProvider, aiModel, aiMaxTokens, aiEndpoint })

  if (!ai) {
    error(
      '`chan auto` requires AI to be configured. Set ai.provider and ai.model in .chanrc (or pass --ai-provider/--ai-model).'
    )
    return
  }

  let commitShas: string[]
  if (commits) {
    commitShas = commits
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
  } else {
    commitShas = [await getHeadSha(cwd)]
  }

  if (commitShas.length === 0) {
    info('No commits to augment.')
    return
  }

  try {
    const result = await runAuto({ cwd, message, commitShas, ai })

    const file = await read(resolve(cwd, 'CHANGELOG.md'))
    await addChanges(file, {
      changes: [
        { action: result.action, group, value: result.augmentedMessage },
      ],
    })
    await write({ file, stdout })

    // Record the `## Action` marker in .chan/code.md so future correlation
    // knows these commits have been released into the changelog.
    const entry = formatActionEntry({
      action: result.action,
      date: new Date().toISOString(),
      message: result.augmentedMessage,
      classification: result.classification,
      commits: result.linkedShas.length > 0 ? result.linkedShas : commitShas,
      group,
      breakingChange: result.breakingChange,
      breakingDetails: result.breakingDetails,
    })
    await appendActionEntry({ cwd, entry })

    report(file)
    success(
      `Added ${result.action} change to CHANGELOG.md and recorded Action entry in .chan/code.md.`
    )
  } catch (err) {
    report(err as Error)
  }
}
