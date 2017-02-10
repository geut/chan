import release from '../../api/release';

export default function () {
    return {
        command: 'release <semver>',
        describe: 'Groups all your new features and marks a new release on your CHANGELOG.md.',
        builder(yargs) {
            return yargs.option('git-compare', {
                describe: 'Overwrite the git url compare by default.\n e.g.: https://bitbucket.org/project/compare/<from>..<to>',
                type: 'string'
            });
        },
        handler(parser, argv, write) {
            if ( !parser.exists() ) {
                this.log().error('CHANGELOG.md does not exists. You can run: chan init in order to create a fresh new one.');
                return null;
            }

            const version = argv.semver;

            if (parser.findRelease(version)) {
                this.log().warning(`The version [${version}] already exists.`);
                return null;
            }

            return release({ version, parserInstance: parser, write })
                .then(() => {
                    this.log().success(`Version ${version} released :)`);
                })
                .catch((e) => {
                    this.log().error(e.message);
                });
        }
    };
}
