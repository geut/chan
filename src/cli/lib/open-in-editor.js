import tempfile from 'tempfile';
import pify from 'pify';

const tmpFile = tempfile('.md');
const readFile = pify(require('fs').readFile);
const editor = pify(require('editor'));

export default function openInEditor({ group = null, silence = true }) {
    return editor(tmpFile)
        .then(() => {
            return readFile(tmpFile, 'utf8');
        })
        .then((data) => {
            if (data.length === 0) {
                throw new Error(`The file is empty '${tmpFile}'`);
            }

            if (group) {
                return `[${group}] ${data}`;
            }

            return data;
        })
        .catch((e) => {
            if (!silence) {
                throw e;
            }
        });
}
