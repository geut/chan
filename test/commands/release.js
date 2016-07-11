import test from 'ava';
import { terminal, readChangelog } from './helpers';
import tmpdir from './helpers/tmpdir';

let tmp;
test.before('initialized temp folder', () => {
    tmp = tmpdir();
});

test('test "release" command. Precondition: CHANGELOG.md exists. Does not contain any new change. Unrelease section is empty. / Postcondition: CHANGELOG.md remains the same. Does not change.', (t) => {
    return Promise.all([terminal(tmp, 'release', 'unreleased_empty', ['1.0.0']), readChangelog('fixtures/release/unreleased_empty')])
        .then((values) => {
            let [result, expected] = values;
            t.deepEqual(result, expected, 'chan release does not modify CHANGELOG.md.');
        });
});

test('test "release" command. Precondition: CHANGELOG.md exists and contains new changes. / Postcondition: CHANGELOG.md populates the new version section with the unreleased content.', (t) => {
    return Promise.all([terminal(tmp, 'release', 'unreleased_changes', ['1.0.0']), readChangelog('expected/release/unreleased_changes')])
        .then((values) => {
            let [result, expected] = values;
            const today = new Date();
            expected = expected.replace('<currentDate>', `${today.getUTCFullYear()}-${today.getUTCMonth() + 1}-${today.getUTCDate()}`);
            t.deepEqual(result, expected, 'chan release adds a new version section to the CHANGELOG.md.');
        });
});

test('test "release" command. Precondition: CHANGELOG.md exists and contains new changes along with previous versions. / Postcondition: CHANGELOG.md creates a new version section with the unreleased content.', (t) => {
    return Promise.all([terminal(tmp, 'release', 'unreleased_previous_versions', ['1.0.1']), readChangelog('expected/release/unreleased_previous_versions')])
        .then((values) => {
            let [result, expected] = values;
            const today = new Date();
            expected = expected.replace('<currentDate>', `${today.getUTCFullYear()}-${today.getUTCMonth() + 1}-${today.getUTCDate()}`);
            t.deepEqual(result, expected, 'chan release adds a new version section to the CHANGELOG.md on top of previous versions.');
        });
});
