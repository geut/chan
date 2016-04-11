export default function () {
    return {
        command: 'added <msg>',
        description: 'Writes your changelog indicating new stuff.',
        action(parser, msg) {
            /**
             * podes modificar el changelog usando parser.root y recorriendo
             * los nodos y cambiando su "value". Despues automaticamente se
             * va guardar la nueva version del changelog.
             *
             * OJO con probarlo con el changelog del proyecto chan, tendriamos
             * que arrancar a hacer tests.
             */
            console.log('ADDED: ' + msg);
        }
    };
}
