export default {
  config: {
    describe: 'Path to your JSON config file',
    type: 'string',
    global: true
  },
  p: {
    alias: 'path',
    describe: 'Define the path of the CHANGELOG.md (cwd by default)',
    type: 'string',
    default: process.cwd(),
    global: true
  },
  silence: {
    describe: 'Disable the console messages',
    type: 'boolean',
    global: true
  },
  stdout: {
    describe: 'Define the output as STDOUT',
    type: 'boolean',
    global: true
  },
  u: {
    alias: 'use',
    describe: 'Extend chan with your own commands',
    default: [],
    type: 'array',
    global: true
  }
};
