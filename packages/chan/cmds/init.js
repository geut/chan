const { resolve } = require('path');
const toVFile = require('to-vfile');
const report = require('../util/report');

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

exports.handler = async function(argv) {
  let file = toVFile();

  try {
    file = await readFile(resolve(argv.dir, 'CHANGELOG.md'));
    await initialize(file, { overwrite: argv.overwrite });
    await toVFile.write(file);
    file.info('Changelog created.');
    report({ file, argv });
  } catch (err) {
    report({ file, argv, err });
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
