import createFixture from './create-fixture';
import readChangelog from './read-changelog';
import proxyquire from 'proxyquire';
import logStub from './stubs/log';
import gitUrlCompareStub from './stubs/git-url-compare';

const mtree = proxyquire('../../../src/parser/mtree', {
    './lib/git-url-compare': gitUrlCompareStub
});

const parser = proxyquire('../../../src/parser', {
    './mtree': mtree
});

const createCommand = proxyquire('../../../src/cli/lib/create-command', {
    '../../parser': parser
});

const cliInstance = proxyquire('../../../src/cli', {
    './lib/log': logStub,
    './lib/create-command': createCommand
});

function cli(tmp, commands, fixtureName) {
    const fixture = createFixture(tmp, commands, fixtureName, fixtureName !== 'empty');

    const execute = [].concat(commands).reduce((exec, command) => {
        let value = cliInstance.commands()[command.name];
        if (value) {
            if (command.args === undefined) {
                command.args = {};
            }
            command.args.path = fixture;
            command.args.silence = true;

            return exec.then(() => {
                return value.handler(command.args);
            });

        }

        return exec.then(() => Promise.reject());
    }, Promise.resolve());

    return execute
        .then(() => {
            return readChangelog(fixture);
        });
}

export default cli;
