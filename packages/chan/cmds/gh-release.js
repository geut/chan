const { resolve } = require('path');
const toVFile = require('to-vfile');
const semver = require('semver');
const { create: createGhRelease } = require('ghreleases');
const ghauth = require('ghauth');
const { promisify } = require('util');

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

exports.handler = async function({ semver: userVersion, path, gitUrl, verbose, stdout }) {
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
};

async function createGithubRelease({ file, version, success, info, warn, error, gitParsed }) {
  if (!gitParsed) {
    warn('We cannot find the repository info for your github release.');
    return;
  }

  if (!gitParsed.source.includes('github')) {
    warn('GitHub Releases are only for github repositories.');
    return;
  }

  const authOptions = {
    configName: 'chan',

    scopes: ['repo'],

    note: 'Token for github releases using @geut/chan',

    userAgent: 'Chan'
  };

  let authData = { user: process.env.GITHUB_USER, token: process.env.GITHUB_TOKEN };

  try {
    const ghData = {
      tag_name: `v${version}`,
      name: `v${version}`,
      body: getMarkdownRelease(file, { version })
    };

    if (!authData.user || !authData.token) {
      authData = await promisify(ghauth)(authOptions);
    }

    info('Uploading GitHub release...');

    await promisify(createGhRelease)(authData, gitParsed.owner, gitParsed.name, ghData);

    success('GitHub release uploaded succesfully.');
  } catch (err) {
    error(err);
  }
}

exports.createGithubRelease = createGithubRelease;
