const { Signale } = require('signale');

function report({ logger, file, verbose }) {
  if (!file) {
    return;
  }

  if (file instanceof Error) {
    if (file.reason) {
      file.name = 'VFileError';
    }

    if (!verbose) {
      file.stack = null;
    }
    return logger.error(file);
  }

  file.messages.forEach(m => {
    if (m.fatal) {
      m.name = 'VFileError';
      if (!verbose) {
        m.stack = null;
      }
      logger.fatal(m);
    } else {
      logger.info({ message: m.message, suffix: `(${m.ruleId})` });
    }
  });
}

exports.createLogger = function createLogger({ scope, verbose }) {
  const logger = new Signale({ scope: ['chan', scope].filter(Boolean) });

  logger.report = file => report({ logger, file, verbose });

  return logger;
};
