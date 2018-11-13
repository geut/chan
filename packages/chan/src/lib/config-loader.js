import { default as osPath } from 'path';

const loadConfig = ({ config, path, stdout }) => {
  const configFileName = 'chan.config.js';
  let loadedConfig = {};

  // Override loaded with args (if defined)
  const override = (config = {}) => ({
    ...config,
    ...{
      path: path || config.path,
      stdout: stdout || config.stdout
    }
  });

  try {
    // First: try to load config file passed by args
    if (config) {
      loadedConfig = require(osPath.join(process.cwd(), config));
      return override(loadedConfig);
    }
  } catch (error) {
    throw new Error(
      `Config file ${osPath.join(process.cwd(), config)} not found.`
    );
  }

  try {
    // Try to load chan.config.js from current path
    const configFile = path.join(path, configFileName);
    loadedConfig = require(configFile);
    return override(loadedConfig);
  } catch (error) {
    return {};
  }
};

export default loadConfig;
