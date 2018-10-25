import test from 'ava';
import { cli, readChangelog } from './helpers';
import tmpdir from './helpers/tmpdir';

let tmp;
test.before('initialized temp folder', () => {
    tmp = tmpdir();
});

const commands = [
    'added',
    'changed',
    'fixed',
    'deprecated',
    'removed',
    'security'
];

for (const command of commands) {
    test(`test "${command}" command => CHANGELOG.md exists. Does not contain any new change. => A new change is set as ${command} to the CHANGELOG.md`, (t) => {
        return Promise.all([cli(tmp, { name: command, args: { msg: 'super *cool feature*' } }, 'changelog_exists'), readChangelog(`expected/${command}/changelog_exists`)])
            .then((values) => {
                let [result, expected] = values;
                t.deepEqual(result, expected, `chan injected new change labeled as ${command} successfully.`);
            });
    });

    test(`test "${command}" command => CHANGELOG.md already exists and contains changes. => A new change is set as ${command} to the CHANGELOG.md, previous changes are maintaned ok.`, (t) => {
        return Promise.all([cli(tmp, { name: command, args: { msg: 'super *cool feature*' } }, 'changelog_with_items'), readChangelog(`expected/${command}/changelog_with_items`)])
            .then((values) => {
                let [result, expected] = values;
                t.deepEqual(result, expected, `chan injected a new change labeled as ${command} to an already populated CHANGELOG.md.`);
            });
    });
}


test('test 2 commands in a row => CHANGELOG.md already exists and contains changes. => CHANGELOG.md is fullfiled according the previous commands.', (t) => {
    const syncActions = cli(tmp, [
        { name: 'added', args: { msg: 'added 1' } },
        { name: 'added', args: { msg: 'added 2' } },
        { name: 'changed', args: { msg: 'changed 1' } },
        { name: 'changed', args: { msg: 'changed 2' } },
        { name: 'added', args: { msg: 'added 3' } },
        { name: 'fixed', args: { msg: 'super *cool fix*' } }
    ], 'multiple_commands');

    return Promise
        .all([
            syncActions,
            readChangelog('expected/multiple_commands')
        ])
        .then((values) => {
            let [result, expected] = values;
            t.deepEqual(result, expected, 'chan injected the new changes labeled as added and fixed successfully.');
        });
});

test('test --group option => Add new changes to the same group', t => {
    const groupedChanges = cli(tmp, [
        { name: 'added', args: { msg: 'added 1', group: 'group-1' } },
        { name: 'changed', args: { msg: 'changed 1', group: 'group-1' } }
    ], 'grouped/empty');

    return Promise.all([
        groupedChanges,
        readChangelog('expected/grouped/same-group')
    ]).then(values => {
        const [result, expected] = values;
        t.deepEqual(result, expected, 'chan injected the new grouped changes successfully.');
    });
}); 

test('test --group option => Add new changes to different groups', t => {
    const groupedChanges = cli(tmp, [
        { name: 'added', args: { msg: 'added 1', group: 'group-1' } },
        { name: 'changed', args: { msg: 'changed 2', group: 'group-2' } },
        { name: 'changed', args: { msg: 'changed 1', group: 'group-1' } },
        { name: 'added', args: { msg: 'added 2', group: 'group-2' } },
        { name: 'fixed', args: { msg: 'fixed 1', group: 'group-3' } }
    ], 'grouped/empty');

    return Promise.all([
        groupedChanges,
        readChangelog('expected/grouped/different-group')
    ]).then(values => {
        const [result, expected] = values;
        t.deepEqual(result, expected, 'chan injected the new grouped changes successfully.');
    });
});

test('test --group option => Add new changes with/without group', t => {
    const groupedChanges = cli(tmp, [
        { name: 'added', args: { msg: 'added 1', group: 'group-1' } },
        { name: 'changed', args: { msg: 'changed 2', group: 'group-2' } },
        { name: 'changed', args: { msg: 'changed 1', group: 'group-1' } },
        { name: 'added', args: { msg: 'added 2 to core' } },
        { name: 'fixed', args: { msg: 'fixed 1 to core' } }
    ], 'grouped/empty');

    return Promise.all([
        groupedChanges,
        readChangelog('expected/grouped/mixed-group-no-group')
    ]).then(values => {
        const [result, expected] = values;
        t.deepEqual(result, expected, 'chan injected the new grouped changes successfully.');
    });
});