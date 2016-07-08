import path from 'path';
import fs from 'fs';

export { default as terminal } from './terminal';
export { default as tmpdir } from './tmpdir';

export function readChangelog(name) {
    const pathname = path.normalize(`test/${name}/CHANGELOG.md`);
    return fs.readFileSync(pathname);
}

export const answers = {
    confirmation: {
        yes: 'y',
        no: 'n'
    }
};
