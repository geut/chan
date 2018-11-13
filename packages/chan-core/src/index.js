import chanInit from './api/init';
import chanChange from './api/change';
import chanRelease from './api/release';
import { defaultConfig } from './config';

import { extendConfig, getGlobalConfig } from './lib/config-loader';

class ChanCore {
  config;

  constructor(config = defaultConfig) {
    this.config = extendConfig(config);
    const globalConfig = getGlobalConfig(this.config);

    this.init = (overwrite = this.config.init.overwrite) => {
      return chanInit(overwrite, globalConfig);
    };

    this.change = (type, msg, group = this.config.change.group) => {
      return chanChange(type, msg, group, globalConfig);
    };

    this.release = (
      version,
      gitCompare = this.config.release.gitCompare,
      groupChanges = this.config.release.groupChanges
    ) => {
      return chanRelease(version, gitCompare, groupChanges, globalConfig);
    };
  }
}

export default ChanCore;
