/**
 * Chan, the likeable changelog cli tool.
 *
 * By your friends at GEUT
 */
import yargs from 'yargs';
import pkg from '../../package.json';
import createCommand from './lib/create-command';
import createLog from './lib/log';
import { init, added, release, fixed, changed, deprecated, removed, security } from './commands';

const _commands = [];
let _log;
const cli = {
    yargs() {
        return yargs;
    },
    log() {
        if (!_log) {
            _log = createLog();
        }
        return _log;
    },
    commands() {
        return _commands;
    },
    use(commands = []) {
        commands
            .forEach((def) => {
                _commands.push(
                    createCommand(this, def)
                );
            });
    },
    run() {
        const argv = yargs.argv;
        const showHelp = argv._.length === 0 && !argv.h ||
                         argv._.length > 0 && !this.commands().find((value) => value.name === argv._[0]);
        if (showHelp) {
            yargs.showHelp();
            return;
        }
    }
};

yargs
    .usage(pkg.description)
    .version()
    .alias('v', 'version')
    .help('h')
    .alias('h', 'help')
    .option('p', {
        alias: 'path',
        describe: 'Define the path of the CHANGELOG.md (cwd by default)'
    })
    .option('s', {
        alias: 'stdout',
        describe: 'Define the output as STDOUT',
        default: false
    })
    .help('help')
    .global(['p', 's']);

cli.use([
    init(),
    added(),
    fixed(),
    changed(),
    security(),
    removed(),
    deprecated(),
    release()
]);

export default cli;
