import { resolve } from 'node:path'
import boxen from 'boxen'
import { promises as fs } from 'node:fs'

import { initialize } from '@geut/chan-core'

import { createLogger } from '../logger.js'
import { read, write } from '../vfs.js'

export const command = 'init [dir]'
export const description = 'Initialize CHANGELOG.md file'

export const builder = {
  dir: {
    alias: ['p', 'path'],
    default: '.'
  },
  overwrite: {
    alias: 'o',
    describe: 'Overwrite the current CHANGELOG.md',
    type: 'boolean' as const,
    default: false
  }
}

interface InitArgs {
  dir: string
  overwrite: boolean
  verbose?: boolean
  stdout?: boolean
}

export async function handler ({ dir, overwrite, verbose, stdout }: InitArgs) {
  const { report, success, info } = createLogger({ scope: 'init', verbose, stdout })

  try {
    const file = await read(resolve(dir, 'CHANGELOG.md'))

    await initialize(file, { overwrite: overwrite || stdout })

    await write({ file, stdout })

    report(file)
  } catch (err) {
    return report(err as Error)
  }

  success('CHANGELOG.md created.')

  try {
    await fs.access(resolve(dir, 'package.json'))
    info('Update the npm script `version` in your package.json to release automatically:')
    console.log(boxen('chan release ${npm_package_version} && git add .', { padding: 1, float: 'center' })) // eslint-disable-line no-template-curly-in-string
  } catch {
    // ignore
  }
}
