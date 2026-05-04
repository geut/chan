import { resolve } from 'node:path'
import { read } from 'to-vfile'
import semver from 'semver'

import { addRelease } from '@geut/chan-core'
import { gitUrlParse } from '@geut/git-url-parse'

import { createLogger, hasWarnings } from '../logger.js'
import { createGithubRelease, type GitParsed } from './gh-release.js'
import { write } from '../vfs.js'

export const command = 'release <semver>'
export const description = 'Create a new release on your CHANGELOG.md.'

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
  yanked: {
    describe: 'Define the release as yanked',
    type: 'boolean' as const
  },
  'git-release-template': {
    describe: 'Define the template url for your releases (e.g. https://github.com/geut/chan/releases/tag/[next])',
    type: 'string' as const
  },
  'git-compare-template': {
    describe: 'Define the template url to compare your releases (e.g. https://github.com/geut/chan/compare/[prev]...[next])',
    type: 'string' as const,
    alias: 'git-template'
  },
  'git-url': {
    describe: 'Define the url of the repository project',
    type: 'string' as const
  },
  'git-branch': {
    describe: 'Define the branch which chan uses to compare the unreleased version',
    type: 'string' as const
  },
  'allow-yanked': {
    describe: 'Allow yanked releases',
    type: 'boolean' as const,
    default: false
  },
  'allow-prerelease': {
    describe: 'Allow prerelease versions',
    type: 'boolean' as const,
    default: false
  },
  'merge-prerelease': {
    describe: 'Merge the prerelease versions into the next stable version',
    type: 'boolean' as const,
    default: false
  },
  'release-prefix': {
    describe: 'Define the release prefix to be used',
    type: 'string' as const,
    default: 'v'
  },
  ghrelease: {
    describe: 'Uploads a github release based on your CHANGELOG',
    type: 'boolean' as const,
    default: false
  },
  git: {
    describe: 'Build a changelog with git support.',
    type: 'boolean' as const,
    default: true
  }
}

interface ReleaseArgs {
  semver: string
  path: string
  yanked?: boolean
  gitReleaseTemplate?: string
  gitCompareTemplate?: string
  gitUrl?: string
  gitBranch?: string
  allowYanked: boolean
  allowPrerelease: boolean
  mergePrerelease: boolean
  releasePrefix: string
  ghrelease: boolean
  git: boolean
  verbose?: boolean
  stdout?: boolean
}

export async function handler ({
  semver: userVersion,
  path,
  yanked,
  gitReleaseTemplate,
  gitCompareTemplate,
  gitUrl,
  gitBranch,
  allowYanked,
  allowPrerelease,
  mergePrerelease,
  releasePrefix,
  ghrelease,
  git,
  verbose,
  stdout
}: ReleaseArgs) {
  const { report, success, info, warn, error } = createLogger({ scope: 'release', verbose, stdout })
  const version = semver.valid(userVersion)

  try {
    if (!version) {
      error('Version release is not valid.')
      return
    }

    const file = await read(resolve(path, 'CHANGELOG.md'))

    let gitParsed: GitParsed | null = null

    if (git) {
      gitParsed = await gitUrlParse({ url: gitUrl, cwd: resolve(path) }).catch(() => null) as GitParsed | null

      gitReleaseTemplate = gitReleaseTemplate || gitParsed?.releaseTemplate
      gitCompareTemplate = gitCompareTemplate || gitParsed?.compareTemplate
      gitBranch = gitBranch || gitParsed?.branch || 'HEAD'

      if (gitReleaseTemplate && !gitCompareTemplate) {
        error('Missing --git-compare-template')
        return
      }

      if (!gitReleaseTemplate && gitCompareTemplate) {
        error('Missing --git-release-template')
        return
      }
    }

    await addRelease(file, {
      version,
      yanked,
      gitCompareTemplate,
      gitReleaseTemplate,
      gitBranch,
      allowYanked,
      allowPrerelease,
      mergePrerelease,
      releasePrefix
    })

    if (file.data.aborted) {
      report(file)
      return
    }

    await write({ file, stdout })

    if (git && ghrelease) {
      if (!gitParsed) {
        file.message('Cannot create a Github Release without the git url. Use `--git-url` param.')
      }
      await createGithubRelease({ file, version, success, info, _warn: warn, error, gitParsed, releasePrefix })
    }

    report(file)

    if (hasWarnings(file)) {
      return
    }

    success(`New release created. ${version}`)
  } catch (err) {
    report(err as Error)
  }
}
