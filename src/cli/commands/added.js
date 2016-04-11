export default function () {
    return {
        command: 'added <msg>',
        description: 'Writes your changelog indicating new stuff.',
        action(parser, msg) {
            console.log('ADDED: ' + msg);
        }
    };
}
