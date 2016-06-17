import { EOL } from 'os';
import { terminal, answers, readChangelog } from './helpers';
import test from 'tape';

test('test "init" command --> Precondition: CHANGELOG.md does not exists / Postcondition: command should create a new CHANGELOG.md file', (t) => {
    t.plan(1);
    const ti = terminal('init', 'empty');
    ti.onFinish((result) => {
        const expected = readChangelog('expected/init').toString();
        t.deepEqual(result, expected, 'CHANGELOG.md created correctly.');
    });
});

test('test "init" command --> Precondition: CHANGELOG.md exists / Postcondition: answer=yes | command should create a new CHANGELOG.md file. Prompt interaction (user) is mocked.', (t) => {
    t.plan(1);
    const ti = terminal('init', 'exists');
    ti.onQuestion((key, question, answer) => {
        answer(answers.confirmation.yes);
    });

    ti.onFinish((result) => {
        const expected = readChangelog('expected/init').toString();
        t.deepEqual(result, expected, 'CHANGELOG.md created correctly.');
    });
});

test('test "init" command --> Precondition: CHANGELOG.md exists / Postcondition: answer=no | command should not create a new CHANGELOG.md file.', (t) => {
    t.plan(1);
    const ti = terminal('init', 'exists');
    ti.onQuestion((key, question, answer) => {
        answer(answers.confirmation.no);
    });

    ti.onFinish((result) => {
        t.equal(result, EOL, 'CHANGELOG.md was not created. Already exists.');
    });
});
