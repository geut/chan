const yargs = require('yargs');
const fs = require('fs');
const findUp = require('find-up');
const packageJSON = require('./package.json');
const commands = require('./cmds');

const configPath = findUp.sync(['.chanrc', '.chanrc.json']);
const config = configPath ? JSON.parse(fs.readFileSync(configPath)) : {};

commands.forEach(command => {
  yargs.command(command);
});

yargs
  .demandCommand()
  .config(config)
  .pkgConf('chan')
  .options({
    verbose: {
      describe: 'Show more info on error',
      type: 'boolean',
      global: true
    },
    stdout: {
      describe: 'Show the output to the stdout',
      type: 'boolean'
    }
  })
  .help()
  .version(packageJSON.version).argv;
