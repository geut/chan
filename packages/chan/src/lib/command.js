import ora from 'ora';
import { fail } from './logger';

export const addCommand = (cli, command) => {
  const originalHandler = command.handler;
  command.spinner = ora(command.command);

  const enhancedCommand = {
    ...command,
    handler: async ({ debug, ...argv }) => {
      command.spinner.start();

      try {
        const result = await originalHandler(argv);

        if (result instanceof Error) {
          throw result;
        }

        command.spinner.succeed(command.success);

        return result;
      } catch (error) {
        command.spinner.fail(command.fail);
        fail(error.message, { noPrefix: true });

        if (debug) {
          console.error(error);
        }

        process.exit(1);
      }
    }
  };

  cli.command(enhancedCommand);
};
