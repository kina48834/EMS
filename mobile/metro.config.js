const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];
config.resolver.extraNodeModules = {
  '@ems/shared': path.resolve(workspaceRoot, 'shared'),
};

// Leaflet is web-only (.web.tsx); never bundle leaflet.css on native (Metro url() errors).
const { resolveRequest } = config.resolver;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform !== 'web' &&
    (moduleName === 'leaflet' || moduleName.startsWith('leaflet/'))
  ) {
    return { type: 'empty' };
  }
  if (resolveRequest) {
    return resolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
