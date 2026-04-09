const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Required for three.js ES module exports (subpath resolution)
config.resolver.unstable_enablePackageExports = true;

// Force all three.js imports to resolve to the same instance.
// Without this, @react-three/fiber and direct `import * as THREE from 'three'`
// can load two separate copies, triggering the "Multiple instances" warning.
config.resolver.extraNodeModules = {
  three: path.resolve(__dirname, 'node_modules/three'),
};

module.exports = config;
