'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

// import parser from '../parser';
// import writer from '../cli/lib/writer';
const template = `
# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
`;

const init = async ({
  overwrite = false,
  path = process.cwd()
}) => {
  const parserInstance = parser(path);
  const write = writer({
    parserInstance
  });
  const m = parserInstance.createMDAST;

  if (parserInstance.exists() && !overwrite) {
    throw new Error('Init CHANGELOG.md: canceled.');
  }

  parserInstance.root.children = m(template);
  write();
};

// export default {

exports.init = init;
