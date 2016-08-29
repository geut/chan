/**
 * Chan, the likeable changelog cli tool.
 *
 * By your friends at GEUT
 */

import yargs from 'yargs';
import pkg from '../../package.json';
import createCommand from './lib/create-command';
import loadUserCommands from './lib/load-user-commands';
import openInEditor from './lib/open-in-editor';
import createLog from './lib/log';
import { init, added, release, fixed, changed, deprecated, removed, security } from './commands';

const _commands = {};
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
    openInEditor() {
        return openInEditor();
    },
    commands() {
        return _commands;
    },
    use(commands = []) {
        commands
            .forEach((def) => {
                const cmd = createCommand(this, def);
                _commands[cmd.name] = cmd;
            });
    },
    loadCommands() {
        let argv = yargs.argv;

        this.commandsArgv = argv.commands ? argv.commands : {};

        this.use(loadUserCommands([
            init(),
            added(),
            fixed(),
            changed(),
            security(),
            removed(),
            deprecated(),
            release()
        ], argv.use));
    },
    run() {
        this.loadCommands();

        const argv = yargs.help('h').alias('h', 'help').showHelpOnFail().argv;

        const commands = this.commands();

        const findCommand = () =>  !!commands[argv._[0]];

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
    .global(['p', 'stdout', 'silence', 'git-compare', 'u', 'config']);

export default cli;
