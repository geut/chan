import chalk from 'chalk';
import yargs from 'yargs';

export default function createLog() {
    const argv = yargs.parse(process.argv);
    function createPrint(color) {
        return function print(message) {
            if (!argv.stdout) {
                console.log(color(message));
            }
        };
    }

    const that = {
        success: createPrint(chalk.green),
        info: createPrint(chalk.blue),
        warning: createPrint(chalk.yellow),
        error: createPrint(chalk.red)
    };
    return that;
}
