const addedHeaderTemplate = `
Added

`;

/*const addedMessageTemplate = `
    - ${msg = msg || ''}
`;
*/
export default function () {
    return {
        command: 'added <msg>',
        describe: 'Writes your changelog indicating new stuff.',
        handler(parser, argv, write) {
            if ( !parser.exists() ) {
                // maybe throw an error... init is needed first
                return;
            }

            const msg = argv;
            console.log(msg)
            console.log(parser.root)
        }
    };
}
