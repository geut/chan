const { resolve } = require('path');
const toVFile = require('to-vfile');

const { addRelease } = require('@geut/chan-core');
const gitCompareTemplate = require('@geut/git-compare-template');

const { createLogger } = require('../util/logger');
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
  }
};

exports.handler = async function({ semver, path, yanked, gitTemplate, gitUrl, gitBranch, verbose, stdout }) {
  const { report, success } = createLogger({ scope: 'release', verbose, stdout });

  try {
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

    await addRelease(file, { version: semver, yanked, gitTemplate, gitBranch });

    await write({ file, stdout });

    report(file);
  } catch (err) {
    return report(err);
  }

  success(`New release created: v${semver}`);
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
