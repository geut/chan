import { configFileName, defaultConfig } from '../config';
import path from 'path';
import extend from 'extend';

const readConfigFile = () => {
  try {
    const configFile = path.join(process.cwd(), configFileName);
    const c = require(configFile);
    return c;
  } catch (error) {
    return {};
  }
};

export const extendConfig = (config = {}) => {
  const configFromFile = readConfigFile();
  return extend(true, {}, defaultConfig, configFromFile, config);
};

export const getGlobalConfig = config => ({
  path: config.path,
  stdout: config.stdout
});
