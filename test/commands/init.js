import test from 'ava';
import { cli, readChangelog } from './helpers';
import tmpdir from './helpers/tmpdir';

let tmp;
test.before('initialized temp folder', () => {
    tmp = tmpdir();
});

test('CHANGELOG.md does not exists => command should create a new CHANGELOG.md file', (t) => {
    return Promise
        .all([cli(tmp, { name: 'init' }, 'empty'), readChangelog('expected/init')])
        .then((values) => {
            let [result, expected] = values;
            t.deepEqual(result, expected, 'CHANGELOG.md created correctly.');
        });
});

test('CHANGELOG.md exists => answer=yes | command should create a new CHANGELOG.md file. Prompt interaction (user) is mocked.', (t) => {
    return Promise
        .all([cli(tmp, { name: 'init', args: { overwrite: true } }, 'exists'), readChangelog('expected/init')])
        .then((values) => {
            let [result, expected] = values;
            t.deepEqual(result, expected, 'CHANGELOG.md created correctly.');
        });
});

test('CHANGELOG.md exists => answer=no | command should not create a new CHANGELOG.md file.', (t) => {
    return Promise
        .all([cli(tmp, { name: 'init' }, 'exists'), readChangelog('fixtures/init/exists')])
        .then((values) => {
            let [result, expected] = values;
            t.deepEqual(result, expected, 'CHANGELOG.md was not created. Already exists.');
        });
});
