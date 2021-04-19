const { resolve } = require('path');
const toVFile = require('to-vfile');
const semver = require('semver');
const open = require('open');

const { getMarkdownRelease } = require('@geut/chan-core');
const { createLogger } = require('../util/logger');

exports.command = 'show <semver>';

exports.desc = 'Shows release notes from CHANGELOG for a specific version.';

exports.builder = {
  semver: {
    type: 'string'
  },
  path: {
    alias: 'p',
    describe: 'Path of the CHANGELOG.md',
    type: 'string',
    default: '.'
  }
};

async function handler({ semver: userVersion, path, verbose, stdout }) {
  const { success, info, warn, error } = createLogger({ scope: 'view', verbose, stdout });

  const version = semver.valid(userVersion);

  if (!version) {
    error('Version release is not valid.');
    return;
  }

  const file = await toVFile.read(resolve(path, 'CHANGELOG.md'));

  const markdownRelease = getMarkdownRelease(file, { version });

  console.log(markdownRelease);
}

exports.handler = handler;
