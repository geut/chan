const { resolve } = require('path');
const { promisify } = require('util');
const toVFile = require('to-vfile');
const boxen = require('boxen');
const access = promisify(require('fs').access);

const { initialize } = require('@geut/chan-core');

const { createLogger } = require('../util/logger');
const write = require('../util/write');

exports.command = 'init [dir]';

exports.desc = 'Creates a CHANGELOG.md if it does not exists';

exports.builder = {
  dir: {
    default: '.'
  },
  o: {
    alias: 'overwrite',
    describe: 'Overwrite the current CHANGELOG.md',
    type: 'boolean',
    default: false
  }
};

exports.handler = async function({ dir, overwrite, verbose, stdout }) {
  const { report, success, info } = createLogger({ scope: 'init', verbose, stdout });

  try {
    const file = await readFile(resolve(dir, 'CHANGELOG.md'));

    await initialize(file, { overwrite: overwrite || stdout });

    await write({ file, stdout });

    report(file);
  } catch (err) {
    return report(err);
  }

  success('CHANGELOG.md created.');

  try {
    await access(resolve(dir, 'package.json'));
    info('Update the npm script `version` in your package.json to release automatically:');
    console.log(boxen('chan release ${npm_package_version} && git add .', { padding: 1, float: 'center' }));
  } catch (err) {
    return;
  }
};

async function readFile(path) {
  try {
    const file = await toVFile.read(path);
    return file;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return toVFile(path);
    } else {
      throw err;
    }
  }
}
