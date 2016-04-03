'use strict';

/**
 * Added entry point
 */

const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();

const ADDED = '## Added';

module.exports = function added ( msg, cmd ){
    let result = md.render( `${ADDED} ${msg}` );
    console.log( result )
    return result;
}
