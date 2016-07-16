import { spawn as processSpawn } from 'child_process';
import createFixture from './create-fixture';
import path from 'path';
import fs from 'fs';

const binLoc = path.normalize(`${__dirname}/../../../es5/bin/cmd.js`);

let children = [];

function cmd(tmp, commandName, fixtureName, userArgs = []) {
    const fixture = createFixture(tmp, commandName, fixtureName, fixtureName !== 'empty');
    const args = [binLoc, commandName, '--path', fixture, ...userArgs];
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

cmd.clear = function clear() {
    children.forEach((child) => {
        child.kill();
    });
    children = [];
};

export default cmd;
