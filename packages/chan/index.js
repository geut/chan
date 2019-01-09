const yargs = require('yargs');
const packageJSON = require('./package.json');
const commands = require('./cmds');

commands.forEach(command => {
  yargs.command(command);
});

yargs
  .options({
    verbose: {
      describe: 'Show more info on error',
      type: 'boolean',
      global: true
    }
  })
  .help()
  .version(packageJSON.version).argv;
