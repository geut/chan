import { registerOptions } from '../../lib/options';
import options from './options';

const description = `A Changelog CLI based on http://keepachangelog.com/`;
const demandCommandMsg =
  'Please, type a command to execute. Example:\n\n $ chan init';

export default yargs => {
  yargs
    .usage(description)
    .help('h')
    .alias({ h: 'help' })
    .showHelpOnFail(true)
    .demandCommand(1, demandCommandMsg);

  registerOptions(options)(yargs);
};
