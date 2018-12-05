import ora from 'ora';
import chalk from 'chalk';

const withPrefix = msg => chalk.bgGreen.white.bold(' CHAN ') + ' ' + msg;

const CommandSpinner = {
  start() {
    if (this.silent) return;
    this.spinner.start();
  },

  stop() {
    this.spinner.stop();
  },

  fail() {
    if (this.silent) return;
    this.spinner.fail(withPrefix(this.command.fail));
  },

  succeed() {
    if (this.silent) return;
    this.spinner.succeed(withPrefix(this.command.command));
  }
};

function createCommandSpinner(command, silent = false, stdout = false) {
  return {
    silent,
    stdout,
    command,
    spinner: ora(withPrefix(command.runningMsg || command.command)),
    ...CommandSpinner
  };
}

export default createCommandSpinner;
