export default function () {
    return {
        command: 'init',
        description: 'Init the document',
        action(parser) {
            parser.root.children[0].children[0].value = Date.now().toString();
        }
    };
}
