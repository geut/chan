import yargs from 'yargs';
import registerCommands from './commands';
import registerOptions from './options';

const description = `A Changelog CLI based on http://keepachangelog.com/`;

const cli = yargs
  .scriptName('')
  .usage(description)
  .help('h')
  .alias({ h: 'help' })
  .showHelpOnFail(true)
  .demandCommand(1);

// Global options
registerOptions(cli);

registerCommands(cli);

cli.argv;

export default cli;
