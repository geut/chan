const { resolve } = require('path');
const toVFile = require('to-vfile');
const semver = require('semver');
const newGithubReleaseUrl = require('new-github-release-url');
const open = require('open');
const { GitHub } = require('@actions/github');

const gitUrlParse = require('@geut/git-url-parse');

const { getMarkdownRelease } = require('@geut/chan-core');
const { createLogger } = require('../util/logger');

exports.command = 'gh-release <semver>';

exports.desc = 'Uploads a github release based on your CHANGELOG.';

exports.builder = {
  semver: {
    type: 'string'
  },
  path: {
    alias: 'p',
    describe: 'Path of the CHANGELOG.md',
    type: 'string',
    default: '.'
  },
  'git-url': {
    describe: 'Define the url of the repository project.',
    type: 'string'
  }
};

async function handler({ semver: userVersion, path, gitUrl, verbose, stdout }) {
  const { success, info, warn, error } = createLogger({ scope: 'gh-release', verbose, stdout });

  const version = semver.valid(userVersion);

  if (!version) {
    error('Version release is not valid.');
    return;
  }

  const gitParsed = await gitUrlParse({ url: gitUrl });

  const file = await toVFile.read(resolve(path, 'CHANGELOG.md'));

  getMarkdownRelease(file, { version });

  await createGithubRelease({ file, version, success, info, warn, error, gitParsed });
}

async function createGithubRelease({ file, version, success, info, warn, error, gitParsed }) {
  if (!gitParsed) {
    warn('We cannot find the repository info for your github release.');
    return;
  }

  if (!gitParsed.source.includes('github')) {
    warn('GitHub Releases are only for github repositories.');
    return;
  }

  try {
    info('Uploading GitHub release...');

    const data = {
      user: gitParsed.owner,
      repo: gitParsed.name,
      tag: `v${version}`,
      title: `v${version}`,
      body: getMarkdownRelease(file, { version }),
      isPrerelease: Boolean(semver.prerelease(version))
    };

    if (process.env.GITHUB_TOKEN) {
      const github = new GitHub(process.env.GITHUB_TOKEN);

      await github.repos.createRelease({
        owner: data.user,
        repo: data.repo,
        tag_name: data.tag,
        name: data.title,
        body: data.body,
        prerelease: data.isPrerelease
      });
    } else {
      await open(newGithubReleaseUrl(data), { wait: true });
    }

    success('GitHub release created.');
  } catch (err) {
    error(err);
  }
}

exports.handler = handler;
exports.createGithubRelease = createGithubRelease;
