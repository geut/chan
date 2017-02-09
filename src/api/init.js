import parser from '../parser';
import writer from '../cli/lib/writer';


const initTemplate = `
# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
`;

const init = ({ overwrite = false, cwd, parserInstance = parser(cwd), write = writer({ parserInstance }) }) => {
    return new Promise(() => {
        const m = parserInstance.createMDAST;

        if (parserInstance.exists() && !overwrite) {
            throw new Error('Init CHANGELOG.md: canceled.');
        }

        parserInstance.root.children = m(initTemplate);
        return write();
    });

};

export default init;
