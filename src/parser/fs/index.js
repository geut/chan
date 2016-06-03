import fs from 'fs';

export function read(pathname) {
    try {
        return fs.readFileSync(pathname, 'utf8');
    } catch (e) {
        if (e.code === 'ENOENT') {
            return null;
        }
        throw e;
    }
}

export function write(pathname, contents) {
    fs.writeFileSync(pathname, contents);
}
