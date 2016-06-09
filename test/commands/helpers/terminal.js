import { spawn as processSpawn } from 'child_process';
import path from 'path';

const binLoc = path.normalize(`${__dirname}/../../../es5/cli/runner.js`);
let children = [];

function terminal(command, fixtureName, userArgs = []) {
    const fixture = path.normalize(`test/fixtures/${command}/${fixtureName}`);
    const args = [binLoc, command, '-s', '--path', fixture, ...userArgs];
    const child = processSpawn('node', args);
    const questions = require(`../../../es5/cli/commands/${command}`).questions || {};
    children.push(child);

    let _cbQuestion = () => {};
    let _cbFinish = () => {};
    const that = {
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
        _cbFinish(that.messages.length > 0 ? that.messages[that.messages.length - 1] : null);
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
