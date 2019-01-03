/*eslint no-console: "off"*/

import chalk from 'chalk';

export const successSymbol = '✔';
export const failSymbol = '✖';

const prefix = text => {
  return ` ${text} `;
};

export const log = console.log;

export const success = (msg, options = { noPrefix: false }) => {
  log(
    chalk.greenBright(
      ['\n', !options.noPrefix ? prefix(successSymbol) : ' ', msg, ' '].join('')
    )
  );
};

export const fail = (msg, options = { noPrefix: false }) => {
  log(
    chalk.bgRedBright.white(
      ['\n', !options.noPrefix ? prefix(failSymbol) : ' ', msg, ' '].join('')
    )
  );
};
