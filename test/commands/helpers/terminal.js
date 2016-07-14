import { spawn as processSpawn } from 'child_process';
import cpFile from 'cp-file';
import path from 'path';
import fs from 'fs';

const binLoc = path.normalize(`${__dirname}/../../../es5/cli/runner.js`);

let children = [];

function terminal(tmp, command, fixtureName, userArgs = []) {
    const fixture = tmp.create(`${command}/${fixtureName}`);
    if (fixtureName !== 'empty') {
        cpFile.sync(path.normalize(`fixtures/${command}/${fixtureName}/CHANGELOG.md`), path.join(fixture, 'CHANGELOG.md'));
    }
    const args = [binLoc, command, '--path', fixture, ...userArgs];
    const child = processSpawn('node', args);
    children.push(child);

    return new Promise((resolve, reject) => {
        child.on('close', (code) => {
            if (code === 0) {
                fs.readFile(path.join(fixture, 'CHANGELOG.md'), 'utf8', (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            } else {
                reject('chan cli returning Code !== 0');
            }
        });
    });
}

terminal.clear = function clear() {
    children.forEach((child) => {
        child.kill();
    });
    children = [];
};

export default terminal;
