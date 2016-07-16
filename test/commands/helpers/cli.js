import createFixture from './create-fixture';
import readChangelog from './read-changelog';
import proxyquire from 'proxyquire';
import logStub from './stubs/log';

const cliInstance = proxyquire('../../../src/cli/index', { './lib/log': logStub });

function cli(tmp, commandName, fixtureName, userArgs = {}) {
    const fixture = createFixture(tmp, commandName, fixtureName, fixtureName !== 'empty');
    userArgs.path = fixture;
    userArgs.silence = true;
    let command;
    for (let value of cliInstance.commands()) {
        if (value.name === commandName) {
            command = value;
            break;
        }
    }

    if (!command) {
        throw new Error(`command: ${commandName} not found`);
    }

    return command
        .handler(userArgs)
        .then(() => {
            return readChangelog(fixture);
        });
}

export default cli;
