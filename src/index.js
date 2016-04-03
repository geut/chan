#!/usr/bin/env node
/**
 * Chan, the likeable changelog cli tool.
 *
 * By your friends at GEUT
 */

const program = require( 'commander' );
const pkg = require( '../package.json' );
const chan = require( './chan' );

program
    .version( pkg.version )
    .description( `About: ${ pkg.description }` )

program
    .command( 'added <msg>' )
    .description( 'Writes your changelog indicating new stuff.' )
    .action( chan.added )

// se entiende la idea...
// program
//     .command( 'added <msg>' )
//     .description( 'Writes your changelog indicating new stuff.' )
//     .action( chan.add )

program
    .parse( process.argv );

if ( !program.args.length ) program.help();
