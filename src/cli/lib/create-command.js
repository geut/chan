import parser from '../../parser';


export default function createCommand(cli, userDef = {}) {
    const {
        command,
        handler: userHandler,
        describe,
        builder: userBuilder = (yargs) => yargs
    } = userDef;

    if (!command) throw new Error('Property `command` not found in the command definition.');
    if (!userHandler) throw new Error('Property `handler` not found in the command definition.');
    if (!describe) throw new Error('Property `describe` not found in the command definition.');

    const name = command.split(' ')[0].trim();
    if (name.length === 0) {
        throw new Error('Property `name` must be defined.');
    }

    const builder = (yargs) => {
        yargs = userBuilder(yargs);

        if (cli.config('global-argv')) {
            yargs.config(cli.config('global-argv'));
        }

        if (cli.config('command-argv') && cli.config('command-argv')[name]) {
            yargs.config(cli.config('command-argv')[name]);
        }

        return yargs;
    };

    const handler = (argv) => {
        const parserInstance = parser(argv.path);
        parserInstance.gitCompare = argv.gitCompare;
        const result = userHandler.call(
            cli,
            parserInstance,
            argv,
            () => {
                return new Promise((resolve) => {
                    const data = parserInstance.stringify();
                    // write callback function
                    if (argv.stdout) {
                        process.stdout.write(data);
                    } else {
                        parserInstance.write(data);
                    }
                    resolve(data);
                });
            }
        );

        if (!result || typeof result.then !== 'function') {
            return Promise.resolve();
        }

        return result;
    };

    cli.yargs().command(command, describe, builder, handler);

    return {
        name,
        describe,
        builder,
        handler
    };
}
