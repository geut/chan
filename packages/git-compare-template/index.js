const { promisify } = require('util');
const gitconfig = promisify(require('gitconfiglocal'));
const findUp = require('find-up');
const GitUrlParse = require('git-url-parse');

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

module.exports = async function gitCompareTemplate({ url }) {
  let remote;

  if (url) {
    remote = GitUrlParse(url);
  } else {
    const path = await findUp('.git');

    if (!path) {
      throw new Error('Git repository missing, we can not to generate the compare url.');
    }

    const info = await gitconfig(path);

    remote = GitUrlParse(info.remote.origin.url);
  }

  let { template, branch } = providers[Object.keys(providers).find(p => remote.source.includes(p))];
  template = template.replace('[full_name]', remote.full_name);

  return { template, branch };
};
