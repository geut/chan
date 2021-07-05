
import { resolve } from 'path'
import toVFile from 'to-vfile'
import semver from 'semver'

import { addRelease } from '@geut/chan-core'
import { gitUrlParse } from '@geut/git-url-parse'

import { createLogger, hasWarnings } from '../logger.js'
import { write } from '../write.js'
import { createGithubRelease } from './gh-release.js'

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
  'git-template': {
    describe: 'Define the template url to compare your releases: https://github.com/geut/chan/compare/[prev]...[next]',
    type: 'string'
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
  gitTemplate,
  gitUrl,
  gitBranch,
  allowYanked,
  allowPrerelease,
  mergePrerelease,
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
    let gitReleaseTemplate

    if (git) {
      gitParsed = await gitUrlParse({ url: gitUrl, cwd: resolve(path) }).catch(() => null)
    }

    if (git && !gitTemplate) {
      if (gitParsed) {
        gitReleaseTemplate = gitParsed.releaseTemplate
        gitTemplate = gitParsed.compareTemplate
        gitBranch = gitBranch || gitParsed.branch
      } else {
        file.message('Missing url to compare releases.')
      }
    }

    if (!gitBranch) {
      // default to
      gitBranch = 'HEAD'
    }

    await addRelease(file, {
      version,
      yanked,
      gitCompareTemplate: gitTemplate,
      gitReleaseTemplate,
      gitBranch,
      allowYanked,
      allowPrerelease,
      mergePrerelease
    })

    await write({ file, stdout })

    if (git && ghrelease) {
      if (!gitParsed) {
        file.message('Cannot create a Github Release without the git url. Use `--git-url` param.')
      }
      await createGithubRelease({ file, version, success, info, warn, error, gitParsed })
    }

    report(file)

    if (hasWarnings(file)) {
      return
    }
  } catch (err) {
    return report(err)
  }

  success(`New release created. ${version}`)
}
