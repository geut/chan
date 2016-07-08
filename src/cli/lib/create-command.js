import parser from '../../parser';

export default function createCommand(cli, def) {
    if (!def.command) throw new Error('Property `command` not found in the command definition.');
    if (!def.handler) throw new Error('Property `handler` not found in the command definition.');
    if (!def.describe) throw new Error('Property `describe` not found in the command definition.');

    def.name = def.command.split(' ')[0].trim();
    if (def.name.length === 0) {
        throw new Error('Property `name` can\'t be defined.');
    }
    def.builder = def.builder || {};

    const userHandler = def.handler;

    def.handler = (argv) => {
        const parserInstance = parser(argv.path);
        return userHandler.call(
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
    };

    cli.yargs().command(def);

    return def;
}
