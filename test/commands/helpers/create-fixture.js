import cpFile from 'cp-file';
import path from 'path';

export default function createFixture(tmp, commands, fixtureName, cp = true) {
    const pathname = Array.isArray(commands) ? fixtureName : path.join(commands.name, fixtureName);
    const fixture = tmp.create(pathname);
    if (cp) {
        cpFile.sync(path.normalize(`fixtures/${pathname}/CHANGELOG.md`), path.join(fixture, 'CHANGELOG.md'));
    }
    return fixture;
}
