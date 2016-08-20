import { defineGITCompare } from '../../../../src/parser/mtree/lib/git-url-compare';

export default {
    default: function gitUrlCompare(gitCompare) {
        return new Promise((resolve) => {
            if (gitCompare) {
                return resolve(gitCompare);
            }

            return resolve(defineGITCompare('git@github.com:geut/chan.git'));
        });
    },
    defineGITCompare
};
