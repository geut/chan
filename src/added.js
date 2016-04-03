'use strict';

/**
 * Added entry point
 */

const ADDED = '## Added';
const internals = {};

exports.use = function use ( options = {} ){
    internals.md = options.mdParser
}

exports.action = function action ( msg, cmd ){
    let result = internals.md.render( `${ADDED} ${msg}` );
    console.log( result )
    return result;
}
