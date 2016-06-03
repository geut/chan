import { prompt } from 'inquirer';

const initTemplate = `
# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
`;

export default function () {
    return {
        command: 'init',
        description: 'Creates a CHANGELOG.md if it does not exists. chan will work with this file.',
        action(parser) {

            if (parser.exists()) {
                prompt([
                    {
                        type: 'confirm',
                        name: 'overwriteChangelog',
                        message: 'A CHANGELOG.md exists, do you want to replace it?'
                    }
                ])
                .then( (answer) => {
                    if ( answer.overwriteChangelog ) {
                        parser.write(initTemplate);
                        parser.read();
                        parser.parse();
                    }
                });
            } else {
                parser.write(initTemplate);
                parser.read();
                parser.parse();
            }
        }
    };
}
