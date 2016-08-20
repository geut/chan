import reqCwd from 'req-cwd';
import chalk from 'chalk';

export default function loadUserCommands(appCommands = [], userCommands = []) {
    userCommands.forEach((commandName) => {
        if (commandName.substr(0, 2) !== './' &&
            commandName.substr(0, 1) !== '/' &&
            commandName.indexOf('chan-command-') === -1) {
            commandName = `chan-command-${commandName}`;
        }

        try {
            let command = reqCwd(commandName);
            appCommands.push(command());
        } catch (e) {
            console.error(chalk.bgRed(`Command module "${commandName}" not found!`));
        }
    });

    return appCommands;
}
