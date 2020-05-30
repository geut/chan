const { Signale } = require('signale');

function report({ logger, file, verbose }) {
  if (!file) {
    return;
  }

  if (file instanceof Error) {
    if (file.reason) {
      // vfile error
      file.name = 'Error';
    }

    if (verbose) {
      return logger.error(file);
    }

    return logger.error(file.message);
  }

  file.messages.forEach(m => {
    if (m.fatal) {
      m.name = 'Error';
      if (verbose) {
        return logger.fatal(m);
      }
      logger.fatal(m.message);
    } else {
      logger[m.fatal === false ? 'warn' : 'info']({ message: m.message });
    }
  });
}

exports.hasWarnings = file => {
  if (!file) {
    return false;
  }

  return !!file.messages.find(m => m.fatal === false);
};

exports.createLogger = function createLogger({ scope, verbose, stdout }) {
  const logger = new Signale({
    stream: stdout ? process.stderr : process.stdout,
    scope: ['chan', scope].filter(Boolean)
  });

  logger.report = file => report({ logger, file, verbose });

  return logger;
};
