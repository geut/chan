const initTemplate = `
# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
`;

export default function () {
    return {
        command: 'init',
        describe: 'Creates a CHANGELOG.md if it does not exists. chan will work with this file.',
        builder(yargs) {
            return yargs.option('o', {
                alias: 'overwrite',
                describe: 'overwrite the current CHANGELOG.md',
                type: 'boolean'
            });
        },
        handler(parser, argv, write) {
            const m = parser.createMDAST;
            if (parser.exists() && !argv.overwrite) {
                this.log().info('Init CHANGELOG.md: canceled.');
            } else {
                parser.root.children = m(initTemplate);
                write().then(() => {
                    this.log().success('Init CHANGELOG.md: succeeded.');
                });
            }
        }
    };
}
