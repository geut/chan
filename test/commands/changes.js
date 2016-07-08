import test from 'tape';
import { terminal, readChangelog } from './helpers';

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
        t.plan(1);
        const ti = terminal(`${command}`, 'changelog_exists', ['super *cool feature*']);
        ti.onFinish((err, result) => {
            if (err) {
                t.fail(err);
                return;
            }
            const expected = readChangelog(`expected/${command}/changelog_exists`).toString();
            t.deepEqual(result, expected, `chan injected new change labeled as ${command} successfully.`);
        });
    });

    test(`test "${command}" command. Precondition: CHANGELOG.md already exists and contains changes. / Postcondition: A new change is set as ${command} to the CHANGELOG.md, previous changes are maintaned ok.`, (t) => {
        t.plan(1);
        const ti = terminal(`${command}`, 'changelog_with_items', ['super *cool feature*']);
        ti.onFinish((err, result) => {
            if (err) {
                t.fail(err);
                return;
            }
            const expected = readChangelog(`expected/${command}/changelog_with_items`).toString();
            t.deepEqual(result, expected, `chan injected a new change labeled as ${command} to an already populated CHANGELOG.md.`);
        });
    });

    test(`test "${command}" command. Precondition: CHANGELOG.md already exists but there is no user input. / Postcondition: CHANGELOG.md remains the same.`, (t) => {
        t.plan(1);
        const oldChangelog = readChangelog(`fixtures/${command}/changelog_exists`).toString();
        const ti = terminal(`${command}`, 'changelog_exists');
        ti.onFinish((err, result) => {
            if (err) {
                t.fail(err);
                return;
            }
            t.deepEqual(result, oldChangelog, 'chan does not modify CHANGELOG.md.');
        });
    });
}
