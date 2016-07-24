import cpFile from 'cp-file';
import path from 'path';

export default function createFixture(tmp, commandName, fixtureName, cp = true) {
    const fixture = tmp.create(`${commandName}/${fixtureName}`);
    if (cp) {
        cpFile.sync(path.normalize(`fixtures/${commandName}/${fixtureName}/CHANGELOG.md`), path.join(fixture, 'CHANGELOG.md'));
    }
    return fixture;
}
