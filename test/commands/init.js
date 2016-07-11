import test from 'ava';
import { terminal, readChangelog } from './helpers';
import tmpdir from './helpers/tmpdir';

let tmp;
test.before('initialized temp folder', () => {
    tmp = tmpdir();
});

test('test "init" command --> Precondition: CHANGELOG.md does not exists / Postcondition: command should create a new CHANGELOG.md file', (t) => {
    return Promise
        .all([terminal(tmp, 'init', 'empty'), readChangelog('expected/init')])
        .then((values) => {
            let [result, expected] = values;
            t.deepEqual(result, expected, 'CHANGELOG.md created correctly.');
        });
});

test('test "init" command --> Precondition: CHANGELOG.md exists / Postcondition: answer=yes | command should create a new CHANGELOG.md file. Prompt interaction (user) is mocked.', (t) => {
    return Promise
        .all([terminal(tmp, 'init', 'exists', ['-o']), readChangelog('expected/init')])
        .then((values) => {
            let [result, expected] = values;
            t.deepEqual(result, expected, 'CHANGELOG.md created correctly.');
        });
});

test('test "init" command --> Precondition: CHANGELOG.md exists / Postcondition: answer=no | command should not create a new CHANGELOG.md file.', (t) => {
    return Promise
        .all([terminal(tmp, 'init', 'exists'), readChangelog('fixtures/init/exists')])
        .then((values) => {
            let [result, expected] = values;
            t.deepEqual(result, expected, 'CHANGELOG.md was not created. Already exists.');
        });
});
