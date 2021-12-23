
import { resolve } from 'path'
import toVFile from 'to-vfile'
import semver from 'semver'

import { addRelease } from '@geut/chan-core'
import { gitUrlParse } from '@geut/git-url-parse'

import { createLogger, hasWarnings } from '../logger.js'
import { createGithubRelease } from './gh-release.js'
import { write } from '../vfs.js'

export const command = 'release <semver>'
export const description = 'Create a new release on your CHANGELOG.md.'

export const builder = {
  semver: {
    type: 'string'
  },
  path: {
    alias: 'p',
    describe: 'Path of the CHANGELOG.md',
    type: 'string',
    default: '.'
  },
  yanked: {
    describe: 'Define the release as yanked',
    type: 'boolean'
  },
  'git-release-template': {
    describe: 'Define the template url for your releases (e.g. https://github.com/geut/chan/releases/tag/[next])',
    type: 'string'
  },
  'git-compare-template': {
    describe: 'Define the template url to compare your releases (e.g. https://github.com/geut/chan/compare/[prev]...[next])',
    type: 'string',
    alias: 'git-template'
  },
  'git-url': {
    describe: 'Define the url of the repository project',
    type: 'string'
  },
  'git-branch': {
    describe: 'Define the branch which chan uses to compare the unreleased version',
    type: 'string'
  },
  'allow-yanked': {
    describe: 'Allow yanked releases',
    type: 'boolean',
    default: false
  },
  'allow-prerelease': {
    describe: 'Allow prerelease versions',
    type: 'boolean',
    default: false
  },
  'merge-prerelease': {
    describe: 'Merge the prerelease versions into the next stable version',
    type: 'boolean',
    default: false
  },
  'release-prefix': {
    describe: 'Define the release prefix to be used',
    type: 'string',
    default: 'v'
  },
  ghrelease: {
    describe: 'Uploads a github release based on your CHANGELOG',
    type: 'boolean',
    default: false
  },
  git: {
    describe: 'Build a changelog with git support.',
    type: 'boolean',
    default: true
  }
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
}) {
  const { report, success, info, warn, error } = createLogger({ scope: 'release', verbose, stdout })
  const version = semver.valid(userVersion)

  try {
    if (!version) {
      error('Version release is not valid.')
      return
    }

    const file = await toVFile.read(resolve(path, 'CHANGELOG.md'))

    let gitParsed = null

    if (git) {
      gitParsed = await gitUrlParse({ url: gitUrl, cwd: resolve(path) }).catch(() => null)

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

    if (file.data.aborted) return report(file)

    await write({ file, stdout })

    if (git && ghrelease) {
      if (!gitParsed) {
        file.message('Cannot create a Github Release without the git url. Use `--git-url` param.')
      }
      await createGithubRelease({ file, version, success, info, warn, error, gitParsed, releasePrefix })
    }

    report(file)

    if (hasWarnings(file)) {
      return
    }

    success(`New release created. ${version}`)
  } catch (err) {
    report(err)
  }
}
