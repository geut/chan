const { promisify } = require('util');
const tempfile = require('tempfile');
const editor = require('editor');

const readFile = promisify(require('fs').readFile);

const openEditor = tmpFile =>
  new Promise((resolve, reject) => {
    editor(tmpFile, code => {
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  });

module.exports = async function openInEditor() {
  try {
    const tmpFile = tempfile('.md');
    await openEditor(tmpFile);
    const data = await readFile(tmpFile, 'utf8');
    return data;
  } catch (err) {
    return null;
  }
};
