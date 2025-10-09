const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Node.js polyfills
config.resolver.alias = {
  ...config.resolver.alias,
  buffer: 'buffer',
};

// Ensure buffer is included in the bundle
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;