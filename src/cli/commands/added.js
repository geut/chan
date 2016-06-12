function parseMsg( rawMsg ) {
    return `- ${rawMsg}`;
}

export default function () {
    return {
        command: 'added [msg]',
        describe: 'Writes your changelog indicating new stuff.',
        handler(parser, argv, write) {
            if ( !parser.exists() ) {
                // maybe throw an error... init is needed first
                return;
            }
            const msg = argv.msg;
            if (!msg) return;
            parser.added( parseMsg(msg) );
            return write();
        }
    };
}
