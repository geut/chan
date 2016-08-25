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
        yargs = userBuilder(yargs)
            .config()
            .pkgConf('chan', process.cwd());

        if (cli.commandsArgv && cli.commandsArgv[name]) {
            yargs.config(cli.commandsArgv[name]);
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

    cli.yargs().command(name, describe, builder, handler);

    return {
        name,
        describe,
        builder,
        handler
    };
}
