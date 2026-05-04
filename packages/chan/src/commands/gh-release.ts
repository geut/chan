import { resolve } from 'node:path'
import { read } from 'to-vfile'
import semver from 'semver'
import newGithubReleaseUrl from 'new-github-release-url'
import open from 'open'
import { getOctokit } from '@actions/github'

import { gitUrlParse } from '@geut/git-url-parse'
import { getMarkdownRelease } from '@geut/chan-core'

import { createLogger } from '../logger.js'
import type { Signale } from 'signale'

export const command = 'gh-release <semver>'

export const description = 'Upload a github release based on CHANGELOG.md.'

export const builder = {
  semver: {
    type: 'string' as const
  },
  path: {
    alias: 'p',
    describe: 'Path of the CHANGELOG.md',
    type: 'string' as const,
    default: '.'
  },
  'git-url': {
    describe: 'Define the url of the repository project.',
    type: 'string' as const
  },
  'release-prefix': {
    describe: 'Define the release prefix to be used.',
    type: 'string' as const,
    default: 'v'
  }
}

interface GhReleaseArgs {
  semver: string
  path: string
  gitUrl?: string
  releasePrefix: string
  verbose?: boolean
  stdout?: boolean
}

export async function handler ({ semver: userVersion, path, gitUrl, releasePrefix, verbose, stdout }: GhReleaseArgs) {
  const { success, info, warn, error } = createLogger({ scope: 'gh-release', verbose, stdout })

  const version = semver.valid(userVersion)

  if (!version) {
    error('Version release is not valid.')
    return
  }

  const gitParsed = await gitUrlParse({ url: gitUrl }) as GitParsed | null

  const file = await read(resolve(path, 'CHANGELOG.md'))

  getMarkdownRelease(file, { version })

  await createGithubRelease({ file, version, success, info, _warn: warn, error, gitParsed, releasePrefix })
}

export interface GitParsed {
  source: string
  owner: string
  name: string
  branch: string
  releaseTemplate: string
  compareTemplate: string
}

interface CreateGithubReleaseOptions {
  file: Awaited<ReturnType<typeof read>>
  version: string
  success: Signale['success']
  info: Signale['info']
  _warn: Signale['warn']
  error: Signale['error']
  gitParsed: GitParsed | null
  releasePrefix: string
}

export async function createGithubRelease ({ file, version, success, info, _warn, error, gitParsed, releasePrefix }: CreateGithubReleaseOptions) {
  if (!gitParsed) {
    error('We cannot find the repository info for your github release.')
    return
  }

  if (!gitParsed.source.includes('github')) {
    error('GitHub Releases are only for github repositories.')
    return
  }

  try {
    info('Uploading GitHub release...')

    const data = {
      user: gitParsed.owner,
      repo: gitParsed.name,
      tag: `${releasePrefix}${version}`,
      title: `${releasePrefix}${version}`,
      body: getMarkdownRelease(file, { version }),
      isPrerelease: Boolean(semver.prerelease(version))
    }

    if (process.env.GITHUB_TOKEN) {
      const github = getOctokit(process.env.GITHUB_TOKEN)

      await github.rest.repos.createRelease({
        owner: data.user,
        repo: data.repo,
        tag_name: data.tag,
        name: data.title,
        body: data.body,
        prerelease: data.isPrerelease
      })
    } else {
      await open(newGithubReleaseUrl(data), { wait: true })
    }

    success('GitHub release created.')
  } catch (err) {
    error(err)
  }
}
