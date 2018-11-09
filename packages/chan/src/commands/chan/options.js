export default {
  config: {
    describe: 'Path to your JSON config file',
    type: 'string',
    global: true
  },
  debug: {
    describe: 'Run in debug mode',
    type: 'boolean',
    global: true
  },
  p: {
    alias: 'path',
    describe: 'Path of the CHANGELOG.md',
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
    describe: 'Set the output as STDOUT',
    type: 'boolean',
    global: true
  }
  // u: {
  //   alias: 'use',
  //   describe: 'Extend chan with your own commands',
  //   default: [],
  //   type: 'array',
  //   global: true
  // }
};
