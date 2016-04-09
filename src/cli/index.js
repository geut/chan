#!/usr/bin/env node
/**
 * Chan, the likeable changelog cli tool.
 *
 * By your friends at GEUT
 */
import pkg from '../../package.json';
import program from 'commander';
import parser from '../parser';
import { added } from './commands';

const root = parser();

const cli = {
    commands: [],
    parser() {
        return parser;
    },
    program() {
        return program;
    },
    use(commands = []) {
        commands
            .forEach((command) => {
                this.commands.push(
                    command(program, root)
                );
            });
    },
    init() {
        program
            .parse( process.argv );

        if ( !program.args.length ) program.help();
    }
};

cli.use([
    added()
]);

program
    .version( pkg.version )
    .description( `About: ${ pkg.description }` );
