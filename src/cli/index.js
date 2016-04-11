#!/usr/bin/env node

/**
 * Chan, the likeable changelog cli tool.
 *
 * By your friends at GEUT
 */
import program from 'commander';
import pkg from '../../package.json';
import createCommand from './lib/create-command';
import { init, added } from './commands';

const cli = {
    commands: [],
    use(commands = []) {
        commands
            .forEach((def) => {
                this.commands.push(
                    createCommand(def)
                );
            });
    },
    run() {
        program
            .parse(process.argv);
    }
};

program
    .version(pkg.version)
    .option('-p, --path <path>', 'Define the path of the CHANGELOG.md (cwd by default)')
    .description(`About: ${ pkg.description }`);

cli.use([
    init(),
    added()
]);

cli.run();
