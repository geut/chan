function parseMsg( rawMsg ) {
    return `- ${rawMsg}`;
}

export default function () {
    return {
        command: 'security [msg]',
        describe: 'Writes your changelog indicating security upgrades.',
        handler(parser, argv, write) {
            if ( !parser.exists() ) {
                throw new Error('CHANGELOG.md does not exists. You can run: chan init in order to create a fresh new one.');
            }
            const msg = argv.msg;
            if (!msg) return;
            parser.change(parser.SEPARATORS.Security, parseMsg(msg));
            write();
        }
    };
}
