import path from 'path';
import osTmpdir from 'os-tmpdir';
import uid2 from 'uid2';
import mkdirp from 'mkdirp';

export default function tmpdir() {
    const uniqueDir = path.join(osTmpdir(), uid2(20));

    return function createTpmDir(subpath) {
        const resultPath = path.join(uniqueDir, subpath);
        mkdirp.sync(resultPath);
        return resultPath;
    };
}
