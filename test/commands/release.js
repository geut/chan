import test from 'tape';
import { terminal, readChangelog } from './helpers';

test('test "release" command. Precondition: CHANGELOG.md exists. Does not contain any new change. Unrelease section is empty. / Postcondition: CHANGELOG.md remains the same. Does not change.', (t) => {
    t.plan(1);
    const oldChangelog = readChangelog('fixtures/release/unreleased_empty').toString();
    const ti = terminal('release', 'unreleased_empty', ['1.0.0']);
    ti.onFinish((err, result) => {
        if (err) {
            t.fail(err);
            return;
        }
        t.deepEqual(result, oldChangelog, 'chan release does not modify CHANGELOG.md.');
    });
});

test('test "release" command. Precondition: CHANGELOG.md exists and contains new changes. / Postcondition: CHANGELOG.md populates the new version section with the unreleased content.', (t) => {
    t.plan(1);
    const ti = terminal('release', 'unreleased_changes', ['1.0.0']);
    ti.onFinish((err, result) => {
        if (err) {
            t.fail(err);
            return;
        }
        let expected = readChangelog('expected/release/unreleased_changes').toString();
        const today = new Date();
        expected = expected.replace('<currentDate>', `${today.getUTCFullYear()}-${today.getUTCMonth() + 1}-${today.getUTCDate()}`);
        t.deepEqual(result, expected, 'chan release adds a new version section to the CHANGELOG.md.');
    });
});

test('test "release" command. Precondition: CHANGELOG.md exists and contains new changes along with previous versions. / Postcondition: CHANGELOG.md creates a new version section with the unreleased content.', (t) => {
    t.plan(1);
    const ti = terminal('release', 'unreleased_previous_versions', ['1.0.1']);
    ti.onFinish((err, result) => {
        if (err) {
            t.fail(err);
            return;
        }
        let expected = readChangelog('expected/release/unreleased_previous_versions').toString();
        const today = new Date();
        expected = expected.replace('<currentDate>', `${today.getUTCFullYear()}-${today.getUTCMonth() + 1}-${today.getUTCDate()}`);
        t.deepEqual(result, expected, 'chan release adds a new version section to the CHANGELOG.md on top of previous versions.');
    });
});
