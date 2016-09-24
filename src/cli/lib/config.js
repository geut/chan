import pkgConf from 'pkg-conf';
import loadJsonFile from 'load-json-file';

export default function createConfig(argv = {}) {
    let config = {};
    if (argv.use) {
        config.use = argv.use;
    }

    if (argv.config) {
        try {
            config = Object.assign(config, loadJsonFile.sync(argv.config));
        } catch (e) {
            throw new Error(`JSON config file not found: ${argv.config}`);
        }
    }

    config = Object.assign(config, pkgConf.sync('chan'));
    return config;
}
