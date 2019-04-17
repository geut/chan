const { resolve } = require('path');
const toVFile = require('to-vfile');
const semver = require('semver');
const { createGithubRelease } = require('./gh-release');

const { addRelease } = require('@geut/chan-core');
const gitUrlParse = require('@geut/git-url-parse');

const { createLogger, hasWarnings } = require('../util/logger');
const write = require('../util/write');

exports.command = 'release <semver>';

exports.desc = 'Creates a new release on your CHANGELOG.md.';

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
  }
};

exports.handler = async function({
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
  verbose,
  stdout
}) {
  const { report, success, info, warn, error } = createLogger({ scope: 'release', verbose, stdout });
  const version = semver.valid(userVersion);

  try {
    if (!version) {
      throw new Error('Version release is not valid.');
    }

    const file = await toVFile.read(resolve(path, 'CHANGELOG.md'));

    const gitParsed = await gitUrlParse({ url: gitUrl });

    if (!gitTemplate) {
      if (gitParsed) {
        gitTemplate = gitParsed.template;
        gitBranch = gitBranch || gitParsed.branch;
      } else {
        file.message(`Missing url to compare releases.`);
      }
    }

    if (!gitBranch) {
      // default to
      gitBranch = 'HEAD';
    }

    await addRelease(file, {
      version,
      yanked,
      gitTemplate,
      gitBranch,
      allowYanked,
      allowPrerelease,
      mergePrerelease
    });

    await write({ file, stdout });

    if (ghrelease) {
      await createGithubRelease({ file, version, success, info, warn, error, gitParsed });
    }

    report(file);

    if (hasWarnings(file)) {
      return;
    }
  } catch (err) {
    return report(err);
  }

  success(`New release created. ${version}`);
};
