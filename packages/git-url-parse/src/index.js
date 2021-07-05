import { promisify } from 'util'
import findUp from 'find-up'
import _gitUrlParse from 'git-url-parse'
import gitLocal from 'gitconfiglocal'

const gitconfig = promisify(gitLocal)

const providers = {
  github: {
    releaseTemplate: 'https://github.com/[full_name]/releases/tags/[next]',
    compareTemplate: 'https://github.com/[full_name]/compare/[prev]...[next]',
    branch: 'HEAD'
  },
  bitbucket: {
    releaseTemplate: 'https://github.com/[full_name]/commits/tag/[next]',
    compareTemplate: 'https://bitbucket.org/[full_name]/branches/compare/[prev]%0D[next]#diff',
    branch: 'HEAD'
  },
  gitlab: {
    releaseTemplate: 'https://github.com/[full_name]/-/tags/[next]',

    compareTemplate: 'https://gitlab.com/[full_name]/compare?from=[prev]&to=[next]',
    branch: 'main'
  }
}

export async function gitUrlParse ({ url, cwd }) {
  let result

  if (url) {
    result = _gitUrlParse(url)
  } else {
    const path = findUp.sync('.git', { type: 'directory', cwd: cwd || process.cwd() })

    if (!path) {
      return null
    }

    const info = await gitconfig(path)

    result = _gitUrlParse(info.remote.origin.url)
  }

  if (result.source.length === 0) {
    return null
  }

  const { releaseTemplate, compareTemplate, branch } = providers[Object.keys(providers).find(p => result.source.includes(p))]

  return Object.assign(
    result,
    {
      branch,
      releaseTemplate: releaseTemplate.replace('[full_name]', result.full_name),
      compareTemplate: compareTemplate.replace('[full_name]', result.full_name)
    }
  )
}
