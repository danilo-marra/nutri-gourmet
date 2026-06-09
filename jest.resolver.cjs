// Custom resolver: when a .js module is not found, try without extension
// so Jest's moduleFileExtensions can find the .ts counterpart.
// This supports incremental TypeScript migration where infra/ files are .ts
// but importers still reference them with explicit .js extensions.
module.exports = (moduleName, options) => {
  try {
    return options.defaultResolver(moduleName, options);
  } catch (e) {
    if (moduleName.endsWith(".js")) {
      return options.defaultResolver(moduleName.slice(0, -3), options);
    }
    throw e;
  }
};
