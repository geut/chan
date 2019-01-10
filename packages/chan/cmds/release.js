const { resolve } = require('path');
const toVFile = require('to-vfile');

const { addRelease, getLastVersionRelease } = require('@geut/chan-core');
const gitCompareUrl = require('@geut/git-compare-url');

const { createLogger } = require('../util/logger');

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
  'git-compare': {
    describe: 'Overwrite the git url compare by default.\n e.g.: https://bitbucket.org/project/compare/<from>..<to>',
    type: 'string'
  },
  yanked: {
    describe: 'Define the release as yanked.',
    type: 'boolean'
  }
};

exports.handler = async function({ semver, path, yanked, verbose, gitCompare }) {
  const { report, success } = createLogger({ scope: 'release', verbose });

  try {
    const file = await toVFile.read(resolve(path, 'CHANGELOG.md'));

    let url = await getReleaseUrl(file, { gitCompare, semver });
    await addRelease(file, { version: semver, url, yanked });

    await toVFile.write(file);
    report(file);
  } catch (err) {
    report(err);
  }

  success(`New release created: v${semver}`);
};

async function getReleaseUrl(file, { gitCompare, semver }) {
  try {
    const lastVersion = await getLastVersionRelease(file);

    if (!lastVersion) {
      return null;
    }

    let url;
    if (gitCompare) {
      url = gitCompare.replace('[prev]', `v${lastVersion}`).replace('[next]', `v${semver}`);
    } else {
      url = await gitCompareUrl({ prevTag: `v${lastVersion}`, nextTag: `v${semver}` });
    }

    return url;
  } catch (err) {
    file.message(err.message);
    return null;
  }
}
