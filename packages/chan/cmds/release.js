const { resolve } = require('path');
const toVFile = require('to-vfile');
const semver = require('semver');
const { create: createGhRelease } = require('ghreleases');

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
  const { report, success, info, warn } = createLogger({ scope: 'release', verbose, stdout });
  const version = semver.valid(userVersion);

  try {
    if (!version) {
      throw new Error('Version release is not valid.');
    }

    // check if we have permissions, if we dont, fail early
    if (ghrelease) {
      if (!process.env.GITHUB_TOKEN) {
        return report(new Error(`AUTH ERROR: ghrelease option is enabled but there is no GITHUB_TOKEN.`));
      }
      if (!process.env.GITHUB_USERNAME) {
        return report(new Error(`AUTH ERROR: ghrelease option is enabled but there is no GITHUB_USERNAME.`));
      }
      if (!process.env.GITHUB_REPO) {
        return report(new Error(`AUTH ERROR: ghrelease option is enabled but there is no GITHUB_REPO.`));
      }
      // NOTE(dk): GITHUB_ORG is optional
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

    // upload ghrelease. Add message to the user
    info('Uploading GitHub release...');

    const ghAuth = {
      token: process.env.GITHUB_TOKEN,
      user: process.env.GITHUB_USERNAME
    };

    const ghData = {
      tag_name: version,
      name: version,
      body: file.contents
    };

    await new Promise(resolve => {
      createGhRelease(ghAuth, process.env.GITHUB_ORG || '', process.env.GITHUB_REPO, ghData, err => {
        if (err) {
          warn(err);
          resolve();
        }

        info('GitHub release uploaded succesfully');
        resolve();
      });
    });

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
