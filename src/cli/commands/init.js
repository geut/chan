import { accessSync, writeFileSync, R_OK, W_OK } from 'fs';
import { join, resolve } from 'path';
import { prompt } from 'inquirer';

const initTemplate = `
# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
`;

function createFile( userPath, data ) {
    writeFileSync( userPath, data );
}

export default function () {
    return {
        command: 'init',
        description: 'Creates a CHANGELOG.md if it does not exists. chan will work with this file.',
        action(parser, userPath = process.cwd()) {

            let changelogExists = parser.exists();

            if (changelogExists) {
                prompt([
                    {
                        type: 'confirm',
                        name: 'overwriteChangelog',
                        message: 'A CHANGELOG.md exists, do you want to replace it?'
                    }
                ])
                .then( (answer) => {
                    if ( answer.overwriteChangelog ) {
                        createFile(parser.pathname, initTemplate);
                        parser.read();
                        parser.parse();
                    }
                });
            } else {
                createFile(parser.pathname, initTemplate);
                parser.read();
                parser.parse();
            }
        }
    };
}
