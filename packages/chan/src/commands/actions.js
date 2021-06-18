import toVFile from 'to-vfile'
import { resolve } from 'path'

import { addChanges }from '@geut/chan-core'

import { createLogger } from '../logger.js'
import { write } from '../write.js'
import { openInEditor } from '../open-in-editor.js'


const actions = [
  { command: 'added', description: 'Added for new features' },
  { command: 'changed', description: 'Changed for changes in existing functionality' },
  { command: 'deprecated', description: 'Deprecated for soon-to-be removed features' },
  { command: 'removed', description: 'Removed for now removed features' },
  { command: 'fixed', description: 'Fixed for any bug fixes' },
  { command: 'security', description: 'Security in case of vulnerabilities' }
]

const builder =  {
  path: {
    alias: 'p',
    describe: 'Path of the CHANGELOG.md',
    type: 'string',
    default: '.'
  },
  g: {
    alias: 'group',
    describe: 'Prefix change with [<group>]. This allows to group changes on release time.',
    type: 'string'
  }
}


const createHandler = action => async ({ message, path, group, verbose, stdout }) => {
  const { report, success, info } = createLogger({ scope: action, verbose, stdout })

  try {
    const file = await toVFile.read(resolve(path, 'CHANGELOG.md'))
    if (!message) {
      message = await openInEditor()

      if (!message || message.length === 0) {
        return info('Nothing to change.')
      }
    }

    await addChanges(file, { changes: [{ action, group, value: message }] })

    await write({ file, stdout })

    report(file)
  } catch (err) {
    return report(err)
  }

  success('Added new changes on your changelog.')
}

export const actionCommands = [
  ...actions.map(({ command, description }) => ({
    command: `${command} [message]`,
    description,
    builder,
    handler: createHandler(command)
  }))
]
