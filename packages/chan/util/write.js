const toVFile = require('to-vfile');

module.exports = async function write({ file, stdout }) {
  if (stdout) {
    process.stdout.write(file.toString());
  } else {
    await toVFile.write(file);
  }
};
