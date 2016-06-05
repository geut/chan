import fs from 'fs';
import * as child from 'child_process';
import path from 'path';
import test from 'tape';
import bddStdin from 'bdd-stdin';
import { stdin } from 'mock-stdin';

const binLoc = path.normalize(`${__dirname}/../../es5/cli/runner.js`);
const expectedFile = fs.readFileSync(`${__dirname}/../fixtures/init-empty.md`);

// helper
const getStats = function getStats() {
    let stats = false;
    try {
        stats = fs.statSync( '/tmp/chan_test/CHANGELOG.md' );
    } catch (e) {
        stats = false;
    }
    return stats;
};

test('test "init" command --> Precondition: CHANGELOG.md does not exists / Postcondition: command should create a new CHANGELOG.md file in the path: /tmp/chan_test', (t) => {
    t.plan(2);
    const args = [binLoc];
    args.push('--path', '/tmp/chan_test/', 'init' );
    child.spawn(binLoc, args);
    let resultTmp = '';
    setTimeout( () => {
        t.doesNotThrow( () => {
            resultTmp = fs.readFileSync('/tmp/chan_test/CHANGELOG.md');
        }, true, 'CHANGELOG.md successfully created.');

        t.deepEqual(resultTmp.toString(), expectedFile.toString(), 'CHANGELOG.md content created correctly');
    }, 1000 );

});


test('test "init" command --> Precondition: CHANGELOG.md exists / Postcondition: command should create a new CHANGELOG.md file in the path: /tmp/chan_test. Prompt interaction (user) is mocked.', (t) => {
    t.plan(5);

    // First check previous file exists and its mtime
    const originalStats = getStats();
    t.equal(typeof originalStats, 'object', 'CHANGELOG.md already exists, stats data obtained OK');

    // Then run the init command.
    const args = [binLoc];
    // user answer to overwrite previous changelog
    stdin().send('y');
    stdin().send(null);
    args.push('--path', '/tmp/chan_test/', 'init' );
    child.spawn(binLoc, args);
    let resultTmp = '';
    setTimeout( () => {
        t.doesNotThrow( () => {
            resultTmp = fs.readFileSync('/tmp/chan_test/CHANGELOG.md');
        }, true, 'CHANGELOG.md successfully created.');

        const finalStats = getStats();
        t.equal(typeof finalStats, 'object', 'CHANGELOG.md already exists, stats data obtained OK');
        t.notEqual(originalStats.mtime, finalStats.mtime, 'Modification times should be different');
        t.deepEqual(resultTmp.toString(), expectedFile.toString(), 'CHANGELOG.md content created correctly');
}, 1000 );
});
