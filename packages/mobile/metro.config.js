const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Workspace packages using TypeScript Node16 module resolution write explicit
// .js extensions in source imports (e.g. `from './types/common.js'`).
// Metro processes the TypeScript source directly and can't find the .js files
// (the actual files are .ts). This resolver strips .js and lets Metro apply
// its own extension resolution, which finds the .ts files correctly.
const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('.') && moduleName.endsWith('.js')) {
    try {
      return context.resolveRequest(
        context,
        moduleName.slice(0, -3), // strip .js → Metro resolves .ts/.tsx/.js
        platform,
      );
    } catch {
      // .ts doesn't exist at this path — fall through to default
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
