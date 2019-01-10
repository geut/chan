const { resolve } = require('path');
const toVFile = require('to-vfile');
const { createLogger } = require('../util/logger');

const { initialize } = require('@geut/chan-core');

exports.command = 'init [dir]';

exports.desc = 'Creates a CHANGELOG.md if it does not exists. Chan will work with this file.';

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

exports.handler = async function({ dir, overwrite, verbose }) {
  const { report, success } = createLogger({ scope: 'init', verbose });

  try {
    const file = await readFile(resolve(dir, 'CHANGELOG.md'));
    await initialize(file, { overwrite: overwrite });
    await toVFile.write(file);
    report(file);
  } catch (err) {
    return report(err);
  }

  success('CHANGELOG.md created.');
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
