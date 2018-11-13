/* eslint no-console: 0 */
import ChanApi from '@chan/chan-core';
import { fail, success } from './logger';
import CommandSpinner from './command-spinner';
import loadConfig from './config-loader';

export const addCommand = (cli, command) => {
  const originalHandler = command.handler;

  const enhancedCommand = {
    ...command,
    handler: async ({ verbose, ...argv }) => {
      let silence = Boolean(argv.silence);

      const commandSpinner = new CommandSpinner(
        command,
        silence,
        Boolean(argv.stdout)
      );

      try {
        const chanConfig = loadConfig(argv);
        commandSpinner.stdout = Boolean(chanConfig.stdout);

        commandSpinner.start();

        const chanApi = new ChanApi(chanConfig);

        const result = await originalHandler(argv, chanApi);

        if (result instanceof Error) {
          throw result;
        }

        commandSpinner.succeed();
        !silence && success(command.success, { noPrefix: true });

        return result;
      } catch (error) {
        commandSpinner.fail(command.fail);
        !silence && fail(error.message, { noPrefix: true });

        if (verbose) {
          console.error(error);
        }

        process.exit(1);
      }
    }
  };

  cli.command(enhancedCommand);
};
