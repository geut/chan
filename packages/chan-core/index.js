const unified = require('unified');
const markdown = require('remark-parse');
const remarkToChan = require('@geut/remark-chan');
const stringify = require('@geut/chan-stringify');
const {
  initialize: transformerInitialize,
  addChanges: transformerAddChanges,
  addRelease: transformerAddRelease
} = require('./transformer');

const preset = (plugin, opts = {}) => [
  [markdown, remarkToChan, [plugin, opts], stringify],
  { settings: { position: false } }
];

exports.initialize = function initialize(from, opts, cb) {
  return unified()
    .use(...preset(transformerInitialize, opts))
    .process(from, cb);
};

exports.addChanges = function addChanges(from, opts, cb) {
  return unified()
    .use(...preset(transformerAddChanges, opts))
    .process(from, cb);
};

exports.addRelease = function addRelease(from, opts, cb) {
  return unified()
    .use(...preset(transformerAddRelease, opts))
    .process(from, cb);
};
