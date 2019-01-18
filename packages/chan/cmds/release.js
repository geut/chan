const { resolve } = require('path');
const toVFile = require('to-vfile');
const semver = require('semver');

const { addRelease } = require('@geut/chan-core');
const gitCompareTemplate = require('@geut/git-compare-template');

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
  verbose,
  stdout
}) {
  const { report, success } = createLogger({ scope: 'release', verbose, stdout });
  const version = semver.valid(userVersion);

  try {
    if (!version) {
      throw new Error('Version release is not valid.');
    }

    const file = await toVFile.read(resolve(path, 'CHANGELOG.md'));

    if (!gitTemplate) {
      const compare = await getTemplate({ file, url: gitUrl });
      if (compare) {
        gitTemplate = compare.template;
        gitBranch = gitBranch || compare.branch;
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

    report(file);

    if (hasWarnings(file)) {
      return;
    }
  } catch (err) {
    return report(err);
  }

  success(`New release created. ${version}`);
};

async function getTemplate({ file, url }) {
  try {
    const template = await gitCompareTemplate({ file, url });

    if (!template) {
      throw new Error('template null');
    }

    return template;
  } catch (err) {
    file.message(`Missing url to compare releases.`);
    return null;
  }
}
