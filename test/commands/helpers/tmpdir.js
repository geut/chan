import path from 'path';
import osTmpdir from 'os-tmpdir';
import uid2 from 'uid2';
import mkdirp from 'mkdirp';
import del from 'del';

export default function tmpdir() {
    const uniqueDir = path.join(osTmpdir(), uid2(20));

    return {
        create(subpath) {
            const resultPath = path.join(uniqueDir, subpath, uid2(6));
            mkdirp.sync(resultPath);
            return resultPath;
        },
        remove() {
            return del(uniqueDir);
        }
    };
}
