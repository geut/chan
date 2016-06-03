import test from 'tape';
import proxyquire from 'tape';
import cli from '../../src/cli';
// import tempfile from 'tempfile';

// const stubs = {
//   'inquirer': {
//     prompt: new Prompt(this.fixture, this.rl),
//     '@global': true
//   }
// };

const originalArgv = process.argv;

test('test "init" command', (t) => {
    t.plan(1);
    process.argv.push( 'chan', '--path', '/tmp/chan_test/', 'init' );
    cli.run();
    t.pass('example');
});
