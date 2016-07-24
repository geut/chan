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
            _log = createLog(yargs.argv);
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
        const commands = this.commands();
        const findCommand = () => {
            let found = false;
            for (let value of commands) {
                found = value.name === argv._[0];
                if (found) {
                    break;
                }
            }
            return found;
        };

        const showHelp = argv._.length === 0 && !argv.h ||
                         argv._.length > 0 && !findCommand();
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
    .option('stdout', {
        describe: 'Define the output as STDOUT',
        default: false
    })
    .option('silence', {
        describe: 'Disable the console messages',
        default: false
    })
    .help('help')
    .global(['p', 'stdout', 'silence']);

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
