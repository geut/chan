export default {
  config: {
    alias: 'c',
    describe: 'Path to your config file',
    type: 'string',
    global: true
  },
  verbose: {
    describe: 'Show more info on error',
    type: 'boolean',
    global: true
  },
  path: {
    alias: 'p',
    describe: 'Path of the CHANGELOG.md',
    type: 'string',
    // default: process.cwd(),
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
    // default: false,
    global: true
  }
};
