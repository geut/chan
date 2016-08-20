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
    test(`test "${command}" command. Precondition: CHANGELOG.md exists. Does not contain any new change. / Postcondition: A new change is set as ${command} to the CHANGELOG.md`, (t) => {
        return Promise.all([cli(tmp, { name: command, args: { msg: 'super *cool feature*' } }, 'changelog_exists'), readChangelog(`expected/${command}/changelog_exists`)])
            .then((values) => {
                let [result, expected] = values;
                t.deepEqual(result, expected, `chan injected new change labeled as ${command} successfully.`);
            });
    });

    test(`test "${command}" command. Precondition: CHANGELOG.md already exists and contains changes. / Postcondition: A new change is set as ${command} to the CHANGELOG.md, previous changes are maintaned ok.`, (t) => {
        return Promise.all([cli(tmp, { name: command, args: { msg: 'super *cool feature*' } }, 'changelog_with_items'), readChangelog(`expected/${command}/changelog_with_items`)])
            .then((values) => {
                let [result, expected] = values;
                t.deepEqual(result, expected, `chan injected a new change labeled as ${command} to an already populated CHANGELOG.md.`);
            });
    });

    test(`test "${command}" command. Precondition: CHANGELOG.md already exists but there is no user input. / Postcondition: CHANGELOG.md remains the same.`, (t) => {
        return Promise.all([cli(tmp, { name: command }, 'changelog_exists'), readChangelog(`fixtures/${command}/changelog_exists`)])
            .then((values) => {
                let [result, expected] = values;
                t.deepEqual(result, expected, 'chan does not modify CHANGELOG.md.');
            });
    });
}


test('test 2 commands in a row. Precondition: CHANGELOG.md already exists and contains changes. / Postcondition: CHANGELOG.md is fullfiled according the previous commands.', (t) => {
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
