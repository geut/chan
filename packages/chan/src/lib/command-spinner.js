import ora from 'ora';
import chalk from 'chalk';

const withPrefix = msg => chalk.bgGreen.white.bold(' CHAN ') + ' ' + msg;

class CommandSpinner {
  constructor(command, silent = false, stdout = false) {
    this.silent = silent;
    this.stdout = stdout;
    this.command = command;
    this.spinner = ora(
      withPrefix(this.command.runningMsg || this.command.command)
    );
  }

  start() {
    if (this.silent) return;
    this.spinner.start();
  }

  stop() {
    this.spinner.stop();
  }

  fail() {
    if (this.silent) return;
    this.spinner.fail(withPrefix(this.command.fail));
  }

  succeed() {
    if (this.silent) return;
    this.spinner.succeed(withPrefix(this.command.command));
  }
}

export default CommandSpinner;
