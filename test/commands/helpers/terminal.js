import { spawn as processSpawn } from 'child_process';
import tmpdir from './tmpdir';
import cpFile from 'cp-file';
import path from 'path';
import fs from 'fs';

const binLoc = path.normalize(`${__dirname}/../../../src/cli/runner.js`);
const createTmpDir = tmpdir();
let children = [];

function terminal(command, fixtureName, userArgs = []) {
    const fixture = createTmpDir(`${command}/${fixtureName}`);
    if (fixtureName !== 'empty') {
        cpFile.sync(path.normalize(`test/fixtures/${command}/${fixtureName}/CHANGELOG.md`), path.join(fixture, 'CHANGELOG.md'));
    }
    const args = ['-r', 'babel-register', binLoc, command, '--path', fixture, ...userArgs];
    const child = processSpawn('node', args);
    const questions = require(`../../../src/cli/commands/${command}`).questions || {};
    children.push(child);

    let _cbQuestion = () => {};
    let _cbFinish = () => {};
    const that = {
        fixture,
        child,
        messages: [],
        asked: [],
        onQuestion(cb = () => {}) {
            _cbQuestion = cb.bind(this);
        },
        onFinish(cb = () => {}) {
            _cbFinish = cb.bind(this);
        }
    };

    child.stdout.on('data', (data) => {
        const message = data.toString('utf8');
        if (message.length === 0) {
            return;
        }

        const found = Object.keys(questions).find((key) => {
            return that.asked.indexOf(key) === -1 && message.search(questions[key].message) !== -1;
        });

        if (found) {
            _cbQuestion(found, questions[found], (answer) => {
                child.stdin.write(answer + '\n');
            });
            that.asked.push(found);
        }

        that.messages.push(data.toString('utf8'));
    });

    child.on('close', () => {
        let data;
        try {
            data = fs.readFileSync(path.join(fixture, 'CHANGELOG.md'), 'utf8');
            _cbFinish(null, data);
        } catch (e) {
            _cbFinish(e, data);
        }
    });

    return that;
}

terminal.clear = function clear() {
    children.forEach((child) => {
        child.kill();
    });
    children = [];
};

export default terminal;
