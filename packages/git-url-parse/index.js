const { promisify } = require('util');
const gitconfig = promisify(require('gitconfiglocal'));
const findUp = require('find-up');
const _gitUrlParse = require('git-url-parse');

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
};

module.exports = async function gitUrlParse({ url }) {
  let result;

  if (url) {
    result = _gitUrlParse(url);
  } else {
    const path = await findUp('.git');

    if (!path) {
      return null;
    }

    const info = await gitconfig(path);

    result = _gitUrlParse(info.remote.origin.url);
  }

  if (result.source.length === 0) {
    return null;
  }

  let { template, branch } = providers[Object.keys(providers).find(p => result.source.includes(p))];
  template = template.replace('[full_name]', result.full_name);

  result.template = template;
  result.branch = branch;

  return result;
};
