import { terminal, readChangelog } from './helpers';
import test from 'tape';

test('test "added" command. Precondition: CHANGELOG.md exists. Does not contain any new change. / Postcondition: A new change is added to the CHANGELOG.md', (t) => {
    t.plan(1);
    const ti = terminal('added', 'changelog_exists', ['super *cool feature*']);
    ti.onFinish((result) => {
        const expected = readChangelog('expected/added/changelog_exists').toString();
        t.deepEqual(result, expected, 'chan added a new change successfully.');
    });
});

test('test "added" command. Precondition: CHANGELOG.md already exists and contains changes added. / Postcondition: A new change is added to the CHANGELOG.md, previous changes are maintaned ok.', (t) => {
    t.plan(1);
    const ti = terminal('added', 'changelog_with_items', ['super *cool feature*']);
    ti.onFinish((result) => {
        const expected = readChangelog('expected/added/changelog_with_items').toString();
        t.deepEqual(result, expected, 'chan added a new change to an already populated CHANGELOG.md.');
    });
});