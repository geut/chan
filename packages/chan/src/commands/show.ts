import { resolve } from 'node:path'
import { read } from 'to-vfile'
import semver from 'semver'

import { getMarkdownRelease } from '@geut/chan-core'

import { createLogger } from '../logger.js'

export const command = 'show <semver>'
export const description = 'Show release notes from CHANGELOG for a given version.'

export const builder = {
  semver: {
    type: 'string' as const
  },
  path: {
    alias: 'p',
    describe: 'Path of the CHANGELOG.md',
    type: 'string' as const,
    default: '.'
  }
}

interface ShowArgs {
  semver: string
  path: string
  verbose?: boolean
  stdout?: boolean
}

export async function handler ({ semver: userVersion, path, verbose, stdout }: ShowArgs) {
  const { error } = createLogger({ scope: 'view', verbose, stdout })

  const version = semver.valid(userVersion)

  if (!version) {
    error('Version release is not valid.')
    return
  }

  const file = await read(resolve(path, 'CHANGELOG.md'))

  const markdownRelease = getMarkdownRelease(file, { version })

  console.log(markdownRelease)
}
