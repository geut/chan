import getFirstCommit from 'get-first-commit';
import pify from 'pify';

export default function firstCommit() {
    return pify(getFirstCommit)(process.cwd()).then((result) => {
        return result.commit;
    });
}
