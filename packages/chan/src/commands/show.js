import { resolve } from 'path'
import toVFile from 'to-vfile'
import semver from 'semver'

import { getMarkdownRelease } from '@geut/chan-core'

import { createLogger } from '../logger.js'

export const command = 'show <semver>'
export const description = 'Show release notes from CHANGELOG for a given version.'

export const builder = {
  semver: {
    type: 'string'
  },
  path: {
    alias: 'p',
    describe: 'Path of the CHANGELOG.md',
    type: 'string',
    default: '.'
  }
}

export async function handler ({ semver: userVersion, path, verbose, stdout }) {
  const { error } = createLogger({ scope: 'view', verbose, stdout })

  const version = semver.valid(userVersion)

  if (!version) {
    error('Version release is not valid.')
    return
  }

  const file = await toVFile.read(resolve(path, 'CHANGELOG.md'))

  const markdownRelease = getMarkdownRelease(file, { version })

  console.log(markdownRelease)
}
