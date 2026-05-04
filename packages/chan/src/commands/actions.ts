import { read } from 'to-vfile'
import { resolve } from 'node:path'

import { addChanges } from '@geut/chan-core'

import { createLogger } from '../logger.js'
import { openInEditor } from '../open-in-editor.js'
import { write } from '../vfs.js'

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
}

interface ActionHandlerArgs {
  message?: string
  path: string
  group?: string
  verbose?: boolean
  stdout?: boolean
}

const actions: ActionDef[] = [
  { command: 'added', description: 'Added for new features' },
  { command: 'changed', description: 'Changed for changes in existing functionality' },
  { command: 'deprecated', description: 'Deprecated for soon-to-be removed features' },
  { command: 'removed', description: 'Removed for now removed features' },
  { command: 'fixed', description: 'Fixed for any bug fixes' },
  { command: 'security', description: 'Security in case of vulnerabilities' }
]

const builder: ActionBuilder = {
  path: {
    alias: 'p',
    describe: 'Path of the CHANGELOG.md',
    type: 'string',
    default: '.'
  },
  group: {
    alias: 'g',
    describe: 'Prefix change with [<group>]. This allows to group changes on release time.',
    type: 'string'
  }
}

const createHandler = (action: string) => async ({ message, path, group, verbose, stdout }: ActionHandlerArgs) => {
  const { report, success, info } = createLogger({ scope: action, verbose, stdout })

  try {
    const file = await read(resolve(path, 'CHANGELOG.md'))
    if (!message) {
      message = await openInEditor() ?? undefined

      if (!message || message.length === 0) {
        return info('Nothing to change.')
      }
    }

    await addChanges(file, { changes: [{ action, group, value: message }] })

    await write({ file, stdout })

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

export const actionCommands: ActionCommand[] = actions.map(({ command, description }) => ({
  command: `${command} [message]`,
  description,
  builder,
  handler: createHandler(command)
}))
