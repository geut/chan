const assert = require('assert');
const { promisify } = require('util');
const gitconfig = promisify(require('gitconfiglocal'));
const findUp = require('find-up');
const GitUrlParse = require('git-url-parse');

const providers = {
  github: 'https://github.com/[user]/[repo]/compare/[prev]...[next]',
  bitbucket: 'https://bitbucket.org/[user]/[repo]/branches/compare/[prev]%0D[next]#diff',
  gitlab: 'https://gitlab.com/[user]/[repo]/compare?from=[prev]&to=[next]'
};

module.exports = async function gitCompareUrl({ provider, user, repo, prevTag, nextTag }) {
  assert(prevTag, 'prevTag is required.');
  assert(nextTag, 'nextTag is required.');

  let tpl, remote;

  if (provider && user && repo) {
    tpl = providers[provider];
  } else {
    const path = await findUp('.git');

    if (!path) {
      throw new Error('Git repository missing, we can not to generate the compare url.');
    }

    const info = await gitconfig(path);

    remote = GitUrlParse(info.remote.origin.url);

    tpl = providers[Object.keys(providers).find(p => remote.source.includes(p))];
  }

  if (!tpl) {
    return null;
  }

  return tpl
    .replace('[user]', user || remote.owner)
    .replace('[repo]', repo || remote.name)
    .replace('[prev]', prevTag)
    .replace('[next]', nextTag);
};
