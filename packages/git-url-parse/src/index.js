import { promisify } from 'util'
import findUp from 'find-up'
import _gitUrlParse from 'git-url-parse'
import gitLocal from 'gitconfiglocal'

const gitconfig = promisify(gitLocal)

const providers = {
  github: {
    template: 'https://github.com/[full_name]/compare/[prev]...[next]',
    branch: 'HEAD'
  },
  bitbucket: {
    template: 'https://bitbucket.org/[full_name]/branches/compare/[prev]%0D[next]#diff',
    branch: 'HEAD'
  },
  gitlab: {
    template: 'https://gitlab.com/[full_name]/compare?from=[prev]&to=[next]',
    branch: 'master'
  }
}

export async function gitUrlParse ({ url }) {
  let result

  if (url) {
    result = _gitUrlParse(url)
  } else {
    const path = await findUp('.git')

    if (!path) {
      return null
    }

    const info = await gitconfig(path)

    result = _gitUrlParse(info.remote.origin.url)
  }

  if (result.source.length === 0) {
    return null
  }

  let { template, branch } = providers[Object.keys(providers).find(p => result.source.includes(p))]
  template = template.replace('[full_name]', result.full_name)

  result.template = template
  result.branch = branch

  return result
}
