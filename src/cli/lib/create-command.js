import program from 'commander';
import parser from '../../parser';

export default function createCommand(def) {
    if (!def.command) throw new Error('Property `command` not found in the command definition.');
    if (!def.action) throw new Error('Property `action` not found in the command definition.');

    const userAction = def.action;

    def.action = (...args) => {
        const parserInstance = parser(program.path);
        userAction(parserInstance, ...args);
        if (program.stdout) {
            process.stdout.on('error', process.exit);
            process.stdout.write(parserInstance.stringify());
            return;
        }
        parserInstance.write();
    };

    let command = program.command(def.command);

    Object.keys(def).forEach((prop) => {
        if (prop === 'command' || !command[prop]) return;

        if (Array.isArray(def[prop])) {
            def[prop].forEach((args) => {
                command[prop](...args);
            });

            return;
        }

        command[prop](def[prop]);
    });

    return command;
}
