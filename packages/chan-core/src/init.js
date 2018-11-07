import parser from '@chan/chan-parser';
import { ChangelogAlreadyExistsError } from '@chan/chan-errors';
import writer from './lib/writer';

const template = `
# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
`;

const init = async ({ overwrite = false, folder = process.cwd() }) => {
  const parserInstance = parser(folder);

  if (parserInstance.exists() && !overwrite) {
    throw new ChangelogAlreadyExistsError({ folder });
  }

  const m = parserInstance.createMDAST;
  const write = writer({ parserInstance });
  parserInstance.root.children = m(template);
  write();
};

export default init;
