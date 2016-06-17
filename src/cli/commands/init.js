const initTemplate = `
# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
`;

export const questions = {
    overwriteChangelog: {
        type: 'confirm',
        message: 'A CHANGELOG.md exists, do you want to replace it?'
    }
};

export default function () {
    return {
        command: 'init',
        describe: 'Creates a CHANGELOG.md if it does not exists. chan will work with this file.',
        handler(parser, argv, write) {
            const m = parser.createMDAST;
            if (parser.exists()) {
                return this.inquirer().prompt([
                    {
                        type: questions.overwriteChangelog.type,
                        name: 'overwriteChangelog',
                        message: questions.overwriteChangelog.message
                    }
                ])
                .then( (answer) => {
                    if ( answer.overwriteChangelog ) {
                        parser.root.children = m(initTemplate);
                        write();
                    }
                });
            }

            parser.root.children = m(initTemplate);
            return write();
        }
    };
}
