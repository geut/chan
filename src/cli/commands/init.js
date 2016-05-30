export default function () {
    return {
        command: 'init',
        describe: 'Init the document',
        handler(parser, argv, writer) {
            console.log('init command!!');
        }
    };
}
