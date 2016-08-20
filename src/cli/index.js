/**
 * Chan, the likeable changelog cli tool.
 *
 * By your friends at GEUT
 */

import yargs from 'yargs';
import pkg from '../../package.json';
import createCommand from './lib/create-command';
import loadUserCommands from './lib/load-user-commands';
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

const initArgv = yargs
    .usage(pkg.description)
    .version()
    .alias('v', 'version')
    .help('h')
    .alias('h', 'help')
    .option('p', {
        alias: 'path',
        describe: 'Define the path of the CHANGELOG.md (cwd by default)',
        type: 'string'
    })
    .option('stdout', {
        describe: 'Define the output as STDOUT',
        type: 'boolean'
    })
    .option('silence', {
        describe: 'Disable the console messages',
        type: 'boolean'
    })
    .option('git-compare', {
        describe: 'Overwrite the git compare by default',
        type: 'string'
    })
    .option('u', {
        alias: 'use',
        describe: 'Extend chan with your own commands',
        default: [],
        type: 'array'
    })
    .config()
    .pkgConf('chan', process.cwd())
    .global(['p', 'stdout', 'silence', 'git-compare', 'u', 'config'])
    .argv;

cli.commandsArgv = initArgv.commands ? initArgv.commands : {};

cli.use(loadUserCommands([
    init(),
    added(),
    fixed(),
    changed(),
    security(),
    removed(),
    deprecated(),
    release()
], initArgv.use));

export default cli;
