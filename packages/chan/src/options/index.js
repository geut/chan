const options = {
  config: {
    describe: 'Path to your JSON config file',
    type: 'string'
  },
  p: {
    alias: 'path',
    describe: 'Define the path of the CHANGELOG.md (cwd by default)',
    type: 'string',
    default: process.cwd()
  },
  silence: {
    describe: 'Disable the console messages',
    type: 'boolean'
  },
  stdout: {
    describe: 'Define the output as STDOUT',
    type: 'boolean'
  },
  u: {
    alias: 'use',
    describe: 'Extend chan with your own commands',
    default: [],
    type: 'array'
  }
};

export default cli => {
  for (const [name, option] of Object.entries(options)) {
    cli.option(name, option).global(name);
  }
};
