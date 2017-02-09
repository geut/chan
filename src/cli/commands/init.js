// const initTemplate = `
// # Change Log
// All notable changes to this project will be documented in this file.

// The format is based on [Keep a Changelog](http://keepachangelog.com/)
// and this project adheres to [Semantic Versioning](http://semver.org/).

// ## [Unreleased]
// `;

import init from '../../api/init';

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
            const { overwrite } = argv;
            init({ overwrite, parserInstance: parser, write })
                .then(() => {
                    this.log().success('Init CHANGELOG.md: succeeded.');
                }).catch(() => {
                    this.log().info('Init CHANGELOG.md: canceled.');
                });
        }
    };
}
