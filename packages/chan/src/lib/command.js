/* eslint no-console: 0 */
import createChanApi from '@geut/chan-core';
import { fail, success } from './logger';
import createCommandSpinner from './command-spinner';
import loadConfig from './config-loader';

export const addCommand = (cli, command) => {
  const originalHandler = command.handler;

  const enhancedCommand = {
    ...command,
    handler: ({ verbose, ...argv }) => {
      let silence = Boolean(argv.silence || argv.stdout);

      const commandSpinner = createCommandSpinner(
        command,
        silence,
        Boolean(argv.stdout)
      );

      try {
        const chanConfig = loadConfig(argv);
        commandSpinner.stdout = Boolean(chanConfig.stdout);

        commandSpinner.start();

        const chanApi = createChanApi(chanConfig);

        const result = originalHandler(argv, chanApi);

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
