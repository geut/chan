import gitconfig from 'gitconfiglocal';
import pify from 'pify';
import gitUrlParse from 'git-url-parse';

export function defineGITCompare(url) {
  let parseUrl = gitUrlParse(url);
  return `${parseUrl.toString('https')}/compare/<from>...<to>`;
}

export default async function gitUrlCompare(gitCompare) {
  let config;
  if (gitCompare) {
    config = { fromUser: true, url: gitCompare };
  } else {
    const { remote } = await pify(gitconfig)(process.cwd());
    const url = remote && remote.origin && remote.origin.url;
    config = { fromUser: false, url };
  }

  return config.fromUser ? config.url : defineGITCompare(config.url);
}
