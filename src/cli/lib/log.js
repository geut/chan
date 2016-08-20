import chalk from 'chalk';

export default function createLog(argv) {
    function createPrint(color) {
        return function print(message) {
            if (!argv.stdout && !argv.silence) {
                console.log(`${chalk.bgCyan('Chan:')} ${color(message)}`);
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
