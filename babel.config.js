module.exports = function (api) {
  api.cache(true);
  return {
    // zustand's devtools code reads import.meta, which a classic (non-module) web bundle cannot parse.
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
  };
};
