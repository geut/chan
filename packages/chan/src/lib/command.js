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
        process.exit(1);
      }
    }
  };

  cli.command(enhancedCommand);
};

// const failHandler = command => {
//   return (msg, error) => {
//     console.log(msg);
//     command.spinner.fail(command.fail());
//     fail(msg || error, { noPrefix: true });
//     process.exit(1);
//   };

// return command.fail;
// };
