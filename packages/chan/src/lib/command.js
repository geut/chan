import ora from 'ora';
import { fail, log } from './logger';

export const addCommand = (cli, command) => {
  const originalHandler = command.handler;
  log();
  command.spinner = ora(command.command);

  const enhancedCommand = {
    ...command,
    handler: async argv => {
      command.spinner.start();

      const result = await originalHandler(argv);

      if (result instanceof Error) {
        throw result;
      }

      command.spinner.succeed(command.success(command));

      return result;
    }
  };

  cli.command(enhancedCommand).fail(failHandler(command));
};

const failHandler = command => {
  const commandFail = command.fail(command);
  if (typeof commandFail === 'string') {
    return (msg, error) => {
      command.spinner.fail(commandFail);
      fail(msg || error, { noPrefix: true });
      process.exit(1);
    };
  }

  return command.fail;
};
