export default function () {
    return function added(program, root) {
        return program
            .command( 'added <msg>' )
            .description( 'Writes your changelog indicating new stuff.' )
            .action( (msg) => root.add(msg) );
    };
}
