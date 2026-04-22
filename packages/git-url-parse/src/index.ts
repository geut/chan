import { findUpSync } from 'find-up'
import fs from 'node:fs'
// @ts-expect-error - parse-github-url is not typed
import parseGithubUrl from 'parse-github-url'
import { parse as parseIni } from 'ini'

const providers = {
  github: {
    releaseTemplate: 'https://github.com/[full_name]/releases/tag/[next]',
    compareTemplate: 'https://github.com/[full_name]/compare/[prev]...[next]',
    branch: 'HEAD'
  },
  bitbucket: {
    releaseTemplate: 'https://bitbucket.org/[full_name]/commits/tag/[next]',
    compareTemplate: 'https://bitbucket.org/[full_name]/branches/compare/[prev]%0D[next]#diff',
    branch: 'HEAD'
  },
  gitlab: {
    releaseTemplate: 'https://gitlab.com/[full_name]/-/tags/[next]',
    compareTemplate: 'https://gitlab.com/[full_name]/compare?from=[prev]&to=[next]',
    branch: 'HEAD'
  }
}

// patch .com version of providers
providers['github.com' as keyof typeof providers] = providers.github as typeof providers['github']
providers['gitlab.com' as keyof typeof providers] = providers.gitlab as typeof providers['gitlab']
providers['bitbucket.com' as keyof typeof providers] = providers.bitbucket as typeof providers['bitbucket']
providers['bitbucket.org' as keyof typeof providers] = providers.bitbucket as typeof providers['bitbucket']

interface GitUrlParseOptions {
  url?: string
  cwd?: string
}

interface GitUrl {
  protocol: string | null
  slashes: boolean | null
  auth: string | null
  host: string
  port: string | null
  hostname: string | null
  hash: string | null
  search: string | null
  query: string | null
  pathname: string
  path: string
  href: string
  filepath: string | null
  owner: string
  name: string
  repo: string
  branch: string
  repository: string | null
}

interface GeutGitUrlParse {
  releaseTemplate: string
  compareTemplate: string
}

type Result = GitUrl & GeutGitUrlParse

export async function gitUrlParse ({ url, cwd }: GitUrlParseOptions): Promise<Result | null> {
  let result

  if (url) {
    result = parseGithubUrl(url)
  } else {
    const path = findUpSync('.git', { type: 'directory', cwd: cwd || process.cwd() })

    if (!path) {
      return null
    }

    const info = parseIni(fs.readFileSync(path, 'utf8'))

    result = parseGithubUrl(info.remote.origin.url)
  }

  if (!result || !result.repo) {
    return null
  }

  const { releaseTemplate, compareTemplate, branch } = providers[result.host as keyof typeof providers]

  return Object.assign(
    result,
    {
      branch,
      releaseTemplate: releaseTemplate.replace('[full_name]', result.pathname),
      compareTemplate: compareTemplate.replace('[full_name]', result.pathname)
    }
  )
}
