const addedHeaderTemplate = `
### Added

`;

function parseMsg( rawMsg ) {
    return ` - ${rawMsg}`;
}

export default function () {
    return {
        command: '<added> [msg]',
        describe: 'Writes your changelog indicating new stuff.',
        handler(parser, argv, write) {
            if ( !parser.exists() ) {
                // maybe throw an error... init is needed first
                return;
            }

            const m = parser.createMDAST;
            const msg = argv.msg;

            if (!msg) return;

            //parser.addedHeader(m(addedHeaderTemplate));
            parser.added( m(parseMsg(msg)) );
            write();
        }
    };
}
