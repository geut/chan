const vReport = require('vfile-reporter');
const VMessage = require('vfile-message');

module.exports = function report({ file, argv, err }) {
  if (err) {
    const message = new VMessage(err);
    message.fatal = true;
    file.messages = [message];
  }

  if (!argv.verbose) {
    file.messages = file.messages.map(m => {
      if (m.fatal) {
        m.stack = null;
      }
      return m;
    });
  }

  console.log(vReport(file, { quiet: true }));
};
