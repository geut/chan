import { resolve } from 'path'
import toVFile from 'to-vfile'
import boxen from 'boxen'

import { access } from 'fs/promises'

import { initialize } from '@geut/chan-core'

import { createLogger } from '../logger.js'
import { write } from '../write.js'

export const command = 'init [dir]'
export const description = 'Initialize CHANGELOG.md file'

export const builder = {
  dir: {
    default: '.'
  },
  o: {
    alias: 'overwrite',
    describe: 'Overwrite the current CHANGELOG.md',
    type: 'boolean',
    default: false
  }
}

export async function handler ({ dir, overwrite, verbose, stdout }) {
  const { report, success, info } = createLogger({ scope: 'init', verbose, stdout })

  try {
    const file = await readFile(resolve(dir, 'CHANGELOG.md'))

    await initialize(file, { overwrite: overwrite || stdout })

    await write({ file, stdout })

    report(file)
  } catch (err) {
    return report(err)
  }

  success('CHANGELOG.md created.')

  try {
    await access(resolve(dir, 'package.json'))
    info('Update the npm script `version` in your package.json to release automatically:')
    console.log(boxen('chan release ${npm_package_version} && git add .', { padding: 1, float: 'center' })) // eslint-disable-line no-template-curly-in-string
  } catch (err) {
  }
}

async function readFile (path) {
  try {
    const file = await toVFile.read(path)
    return file
  } catch (err) {
    if (err.code === 'ENOENT') {
      return toVFile(path)
    } else {
      throw err
    }
  }
}
