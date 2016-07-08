import test from 'tape';
import { terminal, readChangelog } from './helpers';

test('test "init" command --> Precondition: CHANGELOG.md does not exists / Postcondition: command should create a new CHANGELOG.md file', (t) => {
    t.plan(1);
    const ti = terminal('init', 'empty');
    ti.onFinish((err, result) => {
        if (err) {
            t.fail(err);
            return;
        }
        const expected = readChangelog('expected/init').toString();
        t.deepEqual(result, expected, 'CHANGELOG.md created correctly.');
    });
});

test('test "init" command --> Precondition: CHANGELOG.md exists / Postcondition: answer=yes | command should create a new CHANGELOG.md file. Prompt interaction (user) is mocked.', (t) => {
    t.plan(1);
    const ti = terminal('init', 'exists', ['-o']);

    ti.onFinish((err, result) => {
        if (err) {
            t.fail(err);
            return;
        }
        const expected = readChangelog('expected/init').toString();
        t.deepEqual(result, expected, 'CHANGELOG.md created correctly.');
    });
});

test('test "init" command --> Precondition: CHANGELOG.md exists / Postcondition: answer=no | command should not create a new CHANGELOG.md file.', (t) => {
    t.plan(1);
    const oldChangelog = readChangelog('fixtures/init/exists').toString();
    const ti = terminal('init', 'exists');

    ti.onFinish((err, result) => {
        if (err) {
            t.fail(err);
            return;
        }
        t.equal(result, oldChangelog, 'CHANGELOG.md was not created. Already exists.');
    });
});
