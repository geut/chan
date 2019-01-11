const yargs = require('yargs');
const packageJSON = require('./package.json');
const commands = require('./cmds');

commands.forEach(command => {
  yargs.command(command);
});

yargs
  .demandCommand()
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
