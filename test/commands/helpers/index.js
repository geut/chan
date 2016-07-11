import path from 'path';
import fs from 'fs';

export { default as terminal } from './terminal';
export { default as tmpdir } from './tmpdir';

export function readChangelog(name) {
    const pathname = path.normalize(`${name}/CHANGELOG.md`);
    return new Promise((resolve, reject) => {
        fs.readFile(pathname, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}
