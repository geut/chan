export default function () {
    return {
        command: 'added <msg>',
        describe: 'Writes your changelog indicating new stuff.',
        handler(parser, argv, write) {
            console.log('ADDED: ' + argv.msg);
        }
    };
}
