import yargs from 'yargs';
import registerCommands from './commands';

registerCommands(yargs);

yargs.argv;

export default yargs;
