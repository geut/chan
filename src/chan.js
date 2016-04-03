'use strict';
/**
 * Chan core entry point
 *
 */

const MarkdownIt = require('markdown-it');
const added = require( './added' );
const md = new MarkdownIt();

added.use( {
    mdParser: md
} )

module.exports = {
    added: added.action
}
