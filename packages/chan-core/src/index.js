import chanInit from './api/init';
import chanChange from './api/change';
import chanRelease from './api/release';
import { defaultConfig } from './config';

import { extendConfig, getGlobalConfig } from './lib/config-loader';

function createChanCore(config = defaultConfig) {
  const coreConfig = extendConfig(config);

  const globalConfig = getGlobalConfig(coreConfig);

  return {
    init(overwrite = coreConfig.init.overwrite) {
      return chanInit(overwrite, globalConfig);
    },

    change(type, msg, group = coreConfig.change.group) {
      return chanChange(type, msg, group, globalConfig);
    },

    release(
      version,
      gitCompare = coreConfig.release.gitCompare,
      groupChanges = coreConfig.release.groupChanges
    ) {
      return chanRelease(version, gitCompare, groupChanges, globalConfig);
    }
  };
}

export default createChanCore;
