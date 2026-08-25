import { read } from 'to-vfile'
import { resolve } from 'node:path'

import { addChanges } from '@geut/chan-core'

import { createLogger } from '../logger.js'
import { openInEditor } from '../open-in-editor.js'
import { write } from '../vfs.js'
import { getHeadSha } from '../git.js'
import {
  appendActionEntry,
  codeMdContextForShas,
  commitsSinceLastAction,
  formatActionEntry,
} from '../code-md.js'
import {
  resolveAiConfig,
  createAugmenterFromConfig,
} from '../ai-config.js'
import { isChanAction, type ChanAction } from '../categories.js'

interface ActionDef {
  command: string
  description: string
}

interface ActionBuilder {
  path: {
    alias: string
    describe: string
    type: 'string'
    default: string
  }
  group: {
    alias: string
    describe: string
    type: 'string'
  }
  commits: {
    describe: string
    type: 'string'
  }
}

interface ActionHandlerArgs {
  message?: string
  path: string
  group?: string
  commits?: string
  verbose?: boolean
  stdout?: boolean
}

const actions: ActionDef[] = [
  { command: 'added', description: 'Added for new features' },
  { command: 'changed', description: 'Changed for changes in existing functionality' },
  { command: 'deprecated', description: 'Deprecated for soon-to-be removed features' },
  { command: 'removed', description: 'Removed for now removed features' },
  { command: 'fixed', description: 'Fixed for any bug fixes' },
  { command: 'security', description: 'Security in case of vulnerabilities' },
]

const builder: ActionBuilder = {
  path: {
    alias: 'p',
    describe: 'Path of the CHANGELOG.md',
    type: 'string',
    default: '.',
  },
  group: {
    alias: 'g',
    describe: 'Prefix change with [<group>]. This allows to group changes on release time.',
    type: 'string',
  },
  commits: {
    describe:
      'Comma-separated commit SHAs to correlate with this change (AI mode). Defaults to HEAD, or commits in code.md since the last Action entry.',
    type: 'string',
  },
}

export interface RunActionOptions {
  cwd: string
  message: string
  commits?: string[]
  ai?: ReturnType<typeof resolveAiConfig>
}

export async function runAction({
  cwd,
  message,
  commits,
  ai,
}: RunActionOptions): Promise<{
  message: string
  classification: string[]
  linkedShas: string[]
  breakingChange: boolean
  breakingDetails: string
  usedAi: boolean
}> {
  if (!ai) {
    return {
      message,
      classification: [],
      linkedShas: [],
      breakingChange: false,
      breakingDetails: '',
      usedAi: false,
    }
  }

  let commitShas: string[]
  if (commits && commits.length > 0) {
    commitShas = commits
  } else {
    const sinceLast = await commitsSinceLastAction(cwd)
    commitShas = sinceLast.length > 0 ? sinceLast : [await getHeadSha(cwd)]
  }

  const augment = createAugmenterFromConfig(ai)
  const codeMdContext = await codeMdContextForShas(cwd, commitShas)
  const {
    parsed: {
      message: aiMessage,
      classification: aiClassification,
      linkedShas: aiLinkedShas,
      breakingChange: aiBreakingChange,
      breakingDetails: aiBreakingDetails,
    },
  } = await augment({ message, commitShas, codeMdContext })

  return {
    message: aiMessage,
    classification: aiClassification,
    linkedShas: aiLinkedShas,
    breakingChange: aiBreakingChange,
    breakingDetails: aiBreakingDetails,
    usedAi: true,
  }
}

const createHandler =
  (action: string) =>
  async ({ message, path, group, commits, verbose, stdout }: ActionHandlerArgs) => {
    const { report, success, info } = createLogger({
      scope: action,
      verbose,
      stdout,
    })

    const cwd = path
    const ai = resolveAiConfig()

    try {
      const file = await read(resolve(cwd, 'CHANGELOG.md'))
      if (!message) {
        message = (await openInEditor()) ?? undefined

        if (!message || message.length === 0) {
          return info('Nothing to change.')
        }
      }

      const commitList = commits
        ? commits.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : undefined

      const result = await runAction({
        cwd,
        message,
        commits: commitList,
        ai,
      })

      await addChanges(file, {
        changes: [{ action, group, value: result.message }],
      })

      await write({ file, stdout })

      if (result.usedAi) {
        const entry = formatActionEntry({
          action: action as ChanAction,
          date: new Date().toISOString(),
          message: result.message,
          classification: result.classification,
          commits: result.linkedShas,
          group,
          breakingChange: result.breakingChange,
          breakingDetails: result.breakingDetails,
        })
        await appendActionEntry({ cwd, entry })
      }

      report(file)
    } catch (err) {
      return report(err as Error)
    }

    success('Added new changes on your changelog.')
  }

export interface ActionCommand {
  command: string
  description: string
  builder: ActionBuilder
  handler: (args: ActionHandlerArgs) => Promise<void>
}

export const actionCommands: ActionCommand[] = actions.map(
  ({ command, description }) => ({
    command: `${command} [message]`,
    description,
    builder,
    handler: createHandler(command),
  })
)

export { isChanAction }
