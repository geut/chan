import { terminal, answers, readChangelog } from './helpers';
import test from 'tape';

test('test "init" command --> Precondition: CHANGELOG.md does not exists / Postcondition: command should create a new CHANGELOG.md file in the path: /tmp/chan_test', (t) => {
    t.plan(1);
    const ti = terminal('init', 'empty');
    ti.onFinish((message) => {
        const expected = readChangelog('expected/init').toString();
        t.equal(expected, message);
    });
});

test('test "init" command --> Precondition: CHANGELOG.md exists / Postcondition: answer=yes | command should create a new CHANGELOG.md file in the path: /tmp/chan_test. Prompt interaction (user) is mocked.', (t) => {
    t.plan(1);
    const ti = terminal('init', 'exists');
    ti.onQuestion((key, question, answer) => {
        answer(answers.confirmation.yes);
    });

    ti.onFinish((message) => {
        const expected = readChangelog('expected/init').toString();
        t.equal(expected, message);
    });
});

test('test "init" command --> Precondition: CHANGELOG.md exists / Postcondition: answer=no | command shouldn\'t create a new CHANGELOG.md file.', (t) => {
    t.plan(1);
    const ti = terminal('init', 'exists');
    ti.onQuestion((key, question, answer) => {
        answer(answers.confirmation.yes);
    });

    ti.onFinish((message) => {
        const expected = readChangelog('expected/init').toString();
        t.equal(expected, message);
    });
});