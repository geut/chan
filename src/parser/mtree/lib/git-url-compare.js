import gitconfig from 'gitconfiglocal';
import pify from 'pify';
import gitUrlParse from 'git-url-parse';

export function defineGITCompare(url) {
    let parseUrl = gitUrlParse(url);
    return `${parseUrl.toString('https')}/compare/<from>...<to>`;
}

export default function gitUrlCompare(gitCompare) {
    let request;
    if (gitCompare) {
        request = Promise.resolve({ fromUser: true, url: gitCompare });
    } else {
        request = pify(gitconfig)(process.cwd())
            .then(config => {
                const url = config.remote && config.remote.origin && config.remote.origin.url;

                return { fromUser: false, url };
            });
    }

    return request.then((urlObj) => {
        if (urlObj.fromUser) {
            return urlObj.url;
        }

        return defineGITCompare(urlObj.url);
    });
}
