import test from 'ava';
import { cli, readChangelog } from './helpers';
import tmpdir from './helpers/tmpdir';
import now from '../../src/parser/mtree/lib/now';

let tmp;
test.before('initialized temp folder', () => {
    tmp = tmpdir();
});

test('CHANGELOG.md exists. Does not contain any new change. Unrelease section is empty. There is olders releases. => CHANGELOG.md create a [YANKED] release.', (t) => {
    return Promise.all([
        cli(tmp, { name: 'release', args: { semver: '1.0.0' } }, 'unreleased_yanked'),
        readChangelog('fixtures/release/unreleased_yanked')
    ])
        .then((values) => {
            let [result, expected] = values;
            t.deepEqual(result, expected, 'chan release a [YANKED] version.');
        });
});

test('CHANGELOG.md exists and contains new changes. => CHANGELOG.md populates the new version section with the unreleased content.', (t) => {
    return Promise.all([
        cli(tmp, { name: 'release', args: { semver: '1.0.0' } }, 'unreleased_changes'),
        readChangelog('expected/release/unreleased_changes')
    ])
        .then((values) => {
            let [result, expected] = values;
            expected = expected.replace('<currentDate>', now());
            t.deepEqual(result, expected, 'chan release adds a new version section to the CHANGELOG.md.');
        });
});

test('CHANGELOG.md exists and contains new changes along with previous versions. => CHANGELOG.md creates a new version section with the unreleased content.', (t) => {
    return Promise.all([
        cli(tmp, { name: 'release', args: { semver: '1.0.1' } }, 'unreleased_previous_versions'), readChangelog('expected/release/unreleased_previous_versions')
    ])
        .then((values) => {
            let [result, expected] = values;
            expected = expected.replace('<currentDate>', now());
            t.deepEqual(result, expected, 'chan release adds a new version section to the CHANGELOG.md on top of previous versions.');
        });
});

test('test --group-changes option => Groups changes by prefix (no core changes)', t => {
    return Promise.all([
        cli(tmp, { name: 'release', args: { semver: '1.0.0', groupChanges: true } }, '../grouped/unreleased_no_core'), 
        readChangelog('expected/grouped/released-no-core')
    ])
        .then((values) => {
            let [result, expected] = values;
            expected = expected.replace('<currentDate>', now());
            t.deepEqual(result, expected, 'chan release adds a new version section grouped by prefixes detected (no core changes).');
        });
}); 

test('test --group-changes option => Groups changes by prefix (with core changes)', t => {
    return Promise.all([
        cli(tmp, { name: 'release', args: { semver: '1.0.0', groupChanges: true } }, '../grouped/unreleased_with_core'), 
        readChangelog('expected/grouped/released-with-core')
    ])
        .then((values) => {
            let [result, expected] = values;
            expected = expected.replace('<currentDate>', now());
            t.deepEqual(result, expected, 'chan release adds a new version section grouped by prefixes detected (with core changes)');
        });
}); 
